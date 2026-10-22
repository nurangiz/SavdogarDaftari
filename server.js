const http = require('http');
const fs = require('fs');
const path = require('path');
const { startTelegramBots, readDatabase, saveDatabase, findCustomer, notifyAdminNewCustomer } = require('./bots/telegram');

const PORT = process.env.PORT || 3030;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const reqPath = urlParts[0];

  // -------------------------------------------------------------
  // API ROUTING
  // -------------------------------------------------------------
  if (reqPath === '/api/data' && req.method === 'GET') {
    const data = readDatabase();
    return sendJson(res, 200, data);
  }

  if (reqPath === '/api/sync' && req.method === 'POST') {
    try {
      const incoming = await parseBody(req);
      if (incoming && Array.isArray(incoming.customers)) {
        const current = readDatabase();
        const map = new Map();

        // 1. Keep existing customers
        (current.customers || []).forEach(c => {
          const key = String(c.id5 || c.id || '');
          if (key) map.set(key, c);
        });

        // 2. Merge incoming customers
        incoming.customers.forEach(c => {
          const key = String(c.id5 || c.id || '');
          if (key) {
            if (!map.has(key)) {
              map.set(key, c);
            } else {
              const existing = map.get(key);
              const exCount = (existing.transactions || []).length;
              const inCount = (c.transactions || []).length;
              if (inCount >= exCount) {
                map.set(key, c);
              }
            }
          }
        });

        current.customers = Array.from(map.values());
        if (incoming.merchant) current.merchant = { ...current.merchant, ...incoming.merchant };
        saveDatabase(current);
        return sendJson(res, 200, { ok: true, count: current.customers.length });
      }
      return sendJson(res, 400, { ok: false, error: 'Invalid payload' });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  if (reqPath === '/api/customer' && req.method === 'POST') {
    try {
      const incomingCust = await parseBody(req);
      if (!incomingCust || !incomingCust.name) {
        return sendJson(res, 400, { ok: false, error: 'Customer name is required' });
      }

      const db = readDatabase();
      const id5 = String(incomingCust.id5 || Math.floor(10000 + Math.random() * 90000)).trim();

      let customer = db.customers.find(c => c.id5 === id5 || c.id === incomingCust.id);
      if (customer) {
        Object.assign(customer, incomingCust, { id5 });
      } else {
        customer = {
          id: incomingCust.id || ('cust_' + Date.now()),
          id5: id5,
          name: incomingCust.name.trim(),
          phone: (incomingCust.phone || '').trim(),
          note: (incomingCust.note || '').trim(),
          photo: incomingCust.photo || '',
          createdAt: incomingCust.createdAt || new Date().toISOString(),
          transactions: incomingCust.transactions || []
        };
        db.customers.unshift(customer);
      }

      saveDatabase(db);
      console.log(`[API] Customer saved: ${customer.name} (#${customer.id5})`);

      // Alert merchant on Telegram Bot 2
      notifyAdminNewCustomer(customer).catch(err => console.error('[BOT 2] Alert error:', err));

      return sendJson(res, 200, { ok: true, customer });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  if (reqPath === '/api/transaction' && req.method === 'POST') {
    try {
      const { customerId, customerId5, type, amount, description, isPaid } = await parseBody(req);
      const db = readDatabase();
      const customer = db.customers.find(c => c.id === customerId || c.id5 === customerId5);
      if (!customer) {
        return sendJson(res, 404, { ok: false, error: 'Mijoz topilmadi' });
      }

      const tx = {
        id: 'tx_' + Date.now(),
        type: type, // 'DEBT' or 'PAYMENT'
        amount: Math.abs(Number(amount)),
        description: (description || (type === 'DEBT' ? 'Nasiya' : "To'lov")).trim(),
        isPaid: Boolean(isPaid),
        date: new Date().toISOString()
      };

      if (!customer.transactions) customer.transactions = [];
      customer.transactions.unshift(tx);
      saveDatabase(db);

      return sendJson(res, 200, { ok: true, transaction: tx, customer });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  if (reqPath.startsWith('/api/customer/') && req.method === 'GET') {
    const rawQuery = reqPath.replace('/api/customer/', '').trim();
    const data = readDatabase();
    const customer = findCustomer(data, decodeURIComponent(rawQuery));
    if (customer) {
      return sendJson(res, 200, { ok: true, customer });
    }
    return sendJson(res, 404, { ok: false, error: 'Mijoz topilmadi' });
  }

  if (reqPath === '/api/messages' && req.method === 'GET') {
    const data = readDatabase();
    return sendJson(res, 200, { ok: true, messages: data.messages || [] });
  }

  // -------------------------------------------------------------
  // STATIC FILE SERVING
  // -------------------------------------------------------------
  let filePath = path.join(__dirname, reqPath === '/' ? '/index.html' : reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Topilmadi');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Savdogar Daftari serveri ishga tushdi:`);
  console.log(`👉 Web Ilova:   http://localhost:${PORT}`);
  console.log(`👉 Mijoz Boti:  @qarzingnikor_bot`);
  console.log(`👉 Do'kondor:   @xabarqarz_bot (ID: 7290313985)`);
  console.log(`======================================================\n`);

  // Start Telegram Bots polling
  startTelegramBots();
});
