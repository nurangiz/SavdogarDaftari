/**
 * SAVDOGAR DAFTARI — Dual Telegram Bot Manager
 * 
 * Bot 1: Customer Bot (@qarzingnikor_bot)
 * Token: 8609669365:AAHqUP5TQp6_Oo6FT76vO0GxCPKF1PKgjXE
 * Function: Customer enters ID (5-digit, prefix, name or phone), checks debt, sends message to merchant.
 * 
 * Bot 2: Admin/Merchant Bot (@xabarqarz_bot)
 * Token: 8950946252:AAHAvVACplc1oM_wFvF2j7Pe5nsnf1ajlZY
 * Admin Chat ID: 7290313985
 * Function: Receives all customer messages, alerts merchant, allows merchant to reply and view stats.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

const BOT1_TOKEN = '8609669365:AAHqUP5TQp6_Oo6FT76vO0GxCPKF1PKgjXE';
const BOT2_TOKEN = '8950946252:AAHAvVACplc1oM_wFvF2j7Pe5nsnf1ajlZY';
const ADMIN_CHAT_ID = '7290313985';

// Helper: Get local network IP address
function getLocalIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address;
        }
      }
    }
  } catch (e) {}
  return 'localhost';
}

// In-memory conversation state trackers
const bot1Sessions = new Map();
const bot2Sessions = new Map();

// Pending messages queue in case admin hasn't clicked /start on Bot 2 yet
const pendingAdminMessages = [];

// Helper: Escape HTML for Telegram
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Helper: Read database safely
function readDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.customers) parsed.customers = [];
      if (!parsed.messages) parsed.messages = [];
      return parsed;
    }
  } catch (err) {
    console.error('Error reading database:', err);
  }
  return {
    merchant: { name: "Mening Do'konim", shopName: "Do'kon / Rasta", phone: "" },
    customers: [],
    messages: []
  };
}

// Helper: Save database safely
function saveDatabase(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// Helper: Format currency
function formatSum(num) {
  return Number(num || 0).toLocaleString('uz-UZ').replace(/,/g, ' ');
}

// Helper: Calculate debt metrics for a customer
function calculateCustomerStats(customer) {
  if (!customer || !customer.transactions) {
    return { totalDebt: 0, totalPaid: 0, balance: 0 };
  }
  const totalDebt = customer.transactions
    .filter(tx => tx.type === 'DEBT')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalPaid = customer.transactions
    .filter(tx => tx.type === 'PAYMENT')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const balance = totalDebt - totalPaid;
  return { totalDebt, totalPaid, balance };
}

/**
 * Intelligent Customer Finder
 * Matches by:
 * 1. 5-digit ID (58219, 10001, etc.)
 * 2. Formatted ID ("#58219", "ID: 58219", "id 58219", "58219.")
 * 3. Digits extracted from anywhere in the text
 * 4. Internal customer ID ("cust_...")
 * 5. Customer name ("Alisher", "Jasur", etc.)
 * 6. Phone number ("+998901234567" or "901234567")
 */
function findCustomer(db, query) {
  if (!query) return null;
  const raw = String(query).trim();
  const rawLower = raw.toLowerCase();
  const digitsOnly = raw.replace(/\D/g, '');

  const customers = db.customers || [];
  if (customers.length === 0) return null;

  // 1. Direct 5-digit match
  let found = customers.find(c => {
    const cId5 = String(c.id5 || '').trim();
    return cId5 && (cId5 === raw || (digitsOnly && cId5 === digitsOnly));
  });
  if (found) return found;

  // 2. Query contains customer's 5-digit ID (e.g. "ID: 58219" or "id 58219" or "58219.")
  found = customers.find(c => {
    const cId5 = String(c.id5 || '').trim();
    return cId5 && (rawLower.includes(cId5.toLowerCase()) || (digitsOnly && digitsOnly.includes(cId5)));
  });
  if (found) return found;

  // 3. Match internal customer id
  found = customers.find(c => {
    const cId = String(c.id || '').trim();
    return cId && (cId === raw || cId === `cust_${digitsOnly}`);
  });
  if (found) return found;

  // 4. Match by phone number
  if (digitsOnly.length >= 7) {
    found = customers.find(c => {
      const cPhone = String(c.phone || '').replace(/\D/g, '');
      return cPhone && (cPhone === digitsOnly || cPhone.endsWith(digitsOnly) || digitsOnly.endsWith(cPhone));
    });
    if (found) return found;
  }

  // 5. Match by customer name
  if (raw.length >= 3) {
    found = customers.find(c => {
      const cName = String(c.name || '').toLowerCase().trim();
      return cName && (cName === rawLower || cName.includes(rawLower) || rawLower.includes(cName));
    });
    if (found) return found;
  }

  return null;
}

// Telegram API request helper with retry
function callTelegram(token, method, payload = {}) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 35000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({ ok: false, error: 'JSON_PARSE_ERROR', raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'REQUEST_TIMEOUT' });
    });

    req.write(postData);
    req.end();
  });
}

// Safe send message with HTML fallback
async function safeSendMessage(token, chatId, htmlText, options = {}) {
  const payload = {
    chat_id: chatId,
    text: htmlText,
    parse_mode: 'HTML',
    ...options
  };
  const res = await callTelegram(token, 'sendMessage', payload);
  if (!res.ok && res.description && res.description.includes('can\'t parse entities')) {
    const plainText = htmlText.replace(/<[^>]*>/g, '');
    return await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: plainText,
      ...options
    });
  }
  return res;
}

// ============================================================================
// BOT 1: Customer Bot (@qarzingnikor_bot) Logic
// ============================================================================

async function handleBot1Update(update) {
  // 1. Handle Inline Button Clicks
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message.chat.id;
    const data = cq.data;

    console.log(`[BOT 1 CALLBACK from ${chatId}]: ${data}`);
    await callTelegram(BOT1_TOKEN, 'answerCallbackQuery', { callback_query_id: cq.id });

    // Handle view customer directly
    if (data.startsWith('view_cust_')) {
      const id5 = data.replace('view_cust_', '');
      await showCustomerDebt(chatId, id5);
      return;
    }

    // Handle open site button
    if (data === 'open_site') {
      const localIp = getLocalIp();
      const fromUser = cq.from || {};
      const fromName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';

      // Notify shopkeeper via Bot 2
      safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID,
        `🌐 <b>MIJOZ SAYTGA KIRMOQCHI!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Ism:</b> ${escapeHtml(fromName)}\n` +
        `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
        `<i>Mijoz "Saytni ochish" tugmasini bosdi.</i>`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "💬 Unga xabar yozish", callback_data: `reply_${chatId}_user` }]]
          }
        }
      ).catch(() => {});

      await safeSendMessage(BOT1_TOKEN, chatId,
        `🌐 <b>Savdogar Daftari Sayti:</b>\n\n` +
        `Daftarni ochish uchun quyidagi havolalardan birini bosing:\n\n` +
        `💻 <b>Kompyuterda:</b> <a href="http://localhost:3030">http://localhost:3030</a>\n` +
        `📱 <b>Telefonda (Wi-Fi):</b> <a href="http://${localIp}:3030">http://${localIp}:3030</a>\n\n` +
        `<i>(Telefondan kirish uchun kompyuter bilan bir xil Wi-Fi tarmog'iga ulangan bo'lishingiz kerak)</i>`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💻 Kompyuterda ochish", url: "http://localhost:3030" },
                { text: "📱 Telefonda ochish", url: `http://${localIp}:3030` }
              ],
              [
                { text: "✍️ Do'kondorga xabar yuborish", callback_data: "write_to_merchant" }
              ]
            ]
          }
        }
      );
      return;
    }

    if (data === 'write_to_merchant') {
      bot1Sessions.set(chatId, { state: 'WAITING_FOR_MESSAGE' });
      await safeSendMessage(BOT1_TOKEN, chatId,
        `✍️ <b>Do'kondorga xabar yuborish</b>\n\n` +
        `Iltimos, do'kondorga yetkazmoqchi bo'lgan xabaringizni yozib yuboring:\n` +
        `<i>(Matn, ovozli xabar yoki rasm yuborishingiz mumkin)</i>\n\n` +
        `Bekor qilish uchun: <code>/bekor</code>`,
        {
          reply_markup: {
            keyboard: [[{ text: "❌ Bekor qilish" }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
      return;
    }

    if (data.startsWith('send_msg_')) {
      const id5 = data.replace('send_msg_', '');
      const db = readDatabase();
      const customer = findCustomer(db, id5);
      
      bot1Sessions.set(chatId, {
        state: 'WAITING_FOR_MESSAGE',
        customerId5: id5,
        customerName: customer ? customer.name : 'Mijoz'
      });

      await safeSendMessage(BOT1_TOKEN, chatId,
        `✍️ <b>Do'kondorga xabar yuborish</b> (ID: #${escapeHtml(id5)})\n\n` +
        `Iltimos, do'kondorga yetkazmoqchi bo'lgan xabaringizni yozib yuboring.\n` +
        `<i>(Matn, ovozli xabar yoki rasm yuborishingiz mumkin)</i>\n\n` +
        `Bekor qilish uchun: <code>/bekor</code>`,
        {
          reply_markup: {
            keyboard: [[{ text: "❌ Bekor qilish" }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
      return;
    }

    if (data.startsWith('refresh_')) {
      const id5 = data.replace('refresh_', '');
      await showCustomerDebt(chatId, id5);
      return;
    }

    if (data === 'change_id') {
      bot1Sessions.set(chatId, { state: 'WAITING_FOR_ID' });
      await safeSendMessage(BOT1_TOKEN, chatId,
        `🔢 <b>5 xonali ID raqamingizni kiriting:</b>`,
        { reply_markup: { remove_keyboard: true } }
      );
      return;
    }
  }

  // 2. Handle Messages
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text = (msg.text || msg.caption || '').trim();
  const session = bot1Sessions.get(chatId) || { state: 'WAITING_FOR_ID' };

  console.log(`[BOT 1 MSG from ${chatId}]: "${text}" (State: ${session.state})`);

  // Handle Cancel
  if (text === '/bekor' || text === '❌ Bekor qilish') {
    bot1Sessions.set(chatId, { state: 'WAITING_FOR_ID' });
    await safeSendMessage(BOT1_TOKEN, chatId,
      `Amal bekor qilindi.\n\nKerakli bo'limni tanlang:`,
      {
        reply_markup: {
          keyboard: [
            [{ text: "🌐 Saytni ochish" }],
            [{ text: "✍️ Do'kondorga xabar yozish" }]
          ],
          resize_keyboard: true
        }
      }
    );
    return;
  }

  // Handle /start command
  if (text.startsWith('/start')) {
    const fromUser = msg.from || {};
    const fromName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';
    const fromUsername = fromUser.username ? `@${fromUser.username}` : "Mavjud emas";
    const nowStr = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    // 1. Immediately send notification to the shopkeeper via Bot 2
    const shopkeeperAlert = `🔔 <b>YANGI FOYDALANUVCHI BOTGA START BOSDI!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Ism:</b> ${escapeHtml(fromName)}\n` +
      `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
      `📱 <b>Username:</b> ${escapeHtml(fromUsername)}\n` +
      `⏰ <b>Vaqt:</b> ${nowStr}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<i>Mijoz hozirgina @qarzingnikor_bot ga /start bosdi.</i>`;

    safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID, shopkeeperAlert, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💬 Unga xabar yozish", callback_data: `reply_${chatId}_user` }]
        ]
      }
    }).catch(err => console.error('[BOT 2] Alert error:', err));

    const parts = text.split(' ');
    if (parts.length > 1 && parts[1].trim()) {
      await showCustomerDebt(chatId, parts[1].trim());
      return;
    }

    bot1Sessions.set(chatId, { state: 'WAITING_FOR_ID' });
    const localIp = getLocalIp();

    const welcome = `👋 <b>Assalomu alaykum!</b>\n\n` +
      `<b>"Savdogar Daftari"</b> tizimiga xush kelibsiz.\n\n` +
      `Quyidagi bo'limlardan birini tanlang:\n` +
      `• 🌐 <b>Saytni ochish</b> — daftarni brauzerda ko'rish va boshqarish\n` +
      `• ✍️ <b>Do'kondorga xabar yozish</b> — do'kondorga to'g'ridan-to'g'ri xabar yuborish\n\n` +
      `💳 <i>Agar 5 xonali ID raqamingiz bo'lsa (masalan: <code>68129</code>), uni yozib qarz miqdoringizni bilishingiz mumkin.</i>`;

    await safeSendMessage(BOT1_TOKEN, chatId, welcome, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🌐 Saytni ochish", callback_data: "open_site" }
          ],
          [
            { text: "✍️ Do'kondorga xabar yozish", callback_data: "write_to_merchant" }
          ]
        ]
      }
    });

    // Also set Reply Keyboard for easy access at bottom of screen
    await safeSendMessage(BOT1_TOKEN, chatId, "👇 Kerakli bo'limni tanlang:", {
      reply_markup: {
        keyboard: [
          [{ text: "🌐 Saytni ochish" }],
          [{ text: "✍️ Do'kondorga xabar yozish" }]
        ],
        resize_keyboard: true
      }
    });
    return;
  }

  // Handle "Saytni ochish" command
  if (text === '🌐 Saytni ochish' || text.toLowerCase().includes('saytni ochish') || text.toLowerCase() === 'sayt') {
    const fromUser = msg.from || {};
    const fromName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';
    const localIp = getLocalIp();

    // Notify shopkeeper via Bot 2
    safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID,
      `🌐 <b>MIJOZ SAYTGA KIRMOQCHI!</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Ism:</b> ${escapeHtml(fromName)}\n` +
      `🆔 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
      `<i>Mijoz "Saytni ochish" tugmasini bosdi.</i>`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "💬 Unga xabar yozish", callback_data: `reply_${chatId}_user` }]]
        }
      }
    ).catch(err => console.error('[BOT 2] Notice error:', err));

    await safeSendMessage(BOT1_TOKEN, chatId,
      `🌐 <b>Savdogar Daftari Sayti:</b>\n\n` +
      `Daftarni ochish uchun quyidagi havolalardan birini bosing:\n\n` +
      `💻 <b>Kompyuterda:</b> <a href="http://localhost:3030">http://localhost:3030</a>\n` +
      `📱 <b>Telefonda (Wi-Fi):</b> <a href="http://${localIp}:3030">http://${localIp}:3030</a>\n\n` +
      `<i>(Telefondan kirish uchun kompyuter bilan bir xil Wi-Fi tarmog'iga ulangan bo'lishingiz kerak)</i>`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💻 Kompyuterda ochish", url: "http://localhost:3030" },
              { text: "📱 Telefonda ochish", url: `http://${localIp}:3030` }
            ],
            [
              { text: "✍️ Do'kondorga xabar yozish", callback_data: "write_to_merchant" }
            ]
          ]
        }
      }
    );
    return;
  }

  // Handle "Xabar yozish" command
  if (text.toLowerCase() === 'xabar yozish' || text === '/xabar' || text === "✍️ Do'kondorga xabar yozish" || text.toLowerCase().includes('do\'kondorga xabar') || text.toLowerCase().includes('xabar')) {
    bot1Sessions.set(chatId, {
      state: 'WAITING_FOR_MESSAGE',
      customerId5: session.customerId5 || '',
      customerName: session.customerName || 'Mijoz'
    });
    await safeSendMessage(BOT1_TOKEN, chatId,
      `✍️ <b>Do'kondorga xabar yozish:</b>\n\n` +
      `Iltimos, do'kondorga yetkazmoqchi bo'lgan xabaringizni yozib yuboring (matn, ovozli xabar yoki rasm):\n\n` +
      `<i>Xabaringiz to'g'ridan-to'g'ri do'kondorning Telegramiga yetkaziladi.</i>\n\n` +
      `Bekor qilish uchun: <code>/bekor</code>`,
      {
        reply_markup: {
          keyboard: [[{ text: "❌ Bekor qilish" }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
    return;
  }

  const db = readDatabase();

  // PRIORITY 1: Did the user enter a valid customer ID or name?
  const customerMatch = findCustomer(db, text);
  if (customerMatch) {
    console.log(`[BOT 1] Matched customer: ${customerMatch.name} (#${customerMatch.id5})`);
    await showCustomerDebt(chatId, customerMatch);
    return;
  }

  // PRIORITY 2: Customer typing message (either state is WAITING_FOR_MESSAGE OR general user text message)
  // If the user entered digits like '99999' that wasn't found in DB:
  const digitsOnly = text.replace(/\D/g, '');
  const looksLikeId = digitsOnly.length >= 4 && digitsOnly.length <= 7 && text.length <= 10;

  if (looksLikeId && session.state !== 'WAITING_FOR_MESSAGE') {
    // Alert merchant about unknown ID attempt
    const fromUser = msg.from || {};
    const fromName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi';
    safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID,
      `⚠️ <b>NOANIQ ID BILAN SO'ROV:</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Kimdan:</b> ${escapeHtml(fromName)} (ID: <code>${chatId}</code>)\n` +
      `🔢 <b>Kiritilgan ID:</b> <code>#${escapeHtml(text)}</code>\n` +
      `<i>Ushbu ID bazada topilmadi.</i>`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "💬 Unga xabar yozish", callback_data: `reply_${chatId}_user` }]]
        }
      }
    ).catch(() => {});

    await safeSendMessage(BOT1_TOKEN, chatId,
      `❌ <b>Kechirasiz, #${escapeHtml(text)} raqamli mijoz topilmadi!</b>\n\n` +
      `Iltimos, do'kondor bergan 5 xonali ID raqamini tekshirib qayta kiriting yoki quyidagi tugma orqali do'kondorga xabar yuboring:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "✍️ Do'kondorga xabar yuborish", callback_data: "write_to_merchant" }],
            [{ text: "🌐 Saytni ochish", callback_data: "open_site" }]
          ]
        }
      }
    );
    return;
  }

  // Treat as a direct message to the shopkeeper!
  const customerId5 = session.customerId5 || '';
  const customer = customerId5 ? findCustomer(db, customerId5) : null;
  const fromUser = msg.from || {};
  const customerName = customer ? customer.name : ([fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ') || 'Foydalanuvchi');
  const customerPhone = customer ? customer.phone : '';
  const stats = calculateCustomerStats(customer);

  const messageContent = text || (msg.voice ? '[🎤 Ovozli xabar]' : (msg.photo ? '[📷 Rasm]' : '[Xabar]'));
  const messageType = msg.voice ? 'voice' : (msg.photo ? 'photo' : 'text');

  const newMsg = {
    id: 'msg_' + Date.now(),
    chatId: chatId,
    customerId: customer ? customer.id : null,
    customerId5: customerId5,
    customerName: customerName,
    customerPhone: customerPhone,
    content: messageContent,
    type: messageType,
    date: new Date().toISOString(),
    delivered: false
  };
  db.messages.unshift(newMsg);
  saveDatabase(db);

  bot1Sessions.set(chatId, {
    state: customerId5 ? 'ID_VERIFIED' : 'WAITING_FOR_ID',
    customerId5: customerId5,
    customerName: customerName
  });

  const confirmButtons = [];
  if (customerId5) {
    confirmButtons.push([{ text: "📊 Qarzlarni ko'rish", callback_data: `refresh_${customerId5}` }]);
    confirmButtons.push([{ text: "✍️ Yana xabar yozish", callback_data: `send_msg_${customerId5}` }]);
  } else {
    confirmButtons.push([{ text: "🌐 Saytni ochish", callback_data: "open_site" }]);
    confirmButtons.push([{ text: "✍️ Yana xabar yozish", callback_data: "write_to_merchant" }]);
  }

  await safeSendMessage(BOT1_TOKEN, chatId,
    `✅ <b>Xabaringiz do'kondorga muvaffaqiyatli yetkazildi!</b>\n\n` +
    `Do'kondor xabarni ko'rib, tez orada javob qaytaradi. Rahmat!`,
    {
      reply_markup: {
        inline_keyboard: confirmButtons
      }
    }
  );

  // DELIVER TO MERCHANT BOT (@xabarqarz_bot)
  await deliverMessageToMerchant(newMsg, stats, msg);
}

// Display customer debt details in Bot 1
async function showCustomerDebt(chatId, customerOrQuery) {
  const db = readDatabase();
  let customer = null;

  if (typeof customerOrQuery === 'object' && customerOrQuery !== null && customerOrQuery.id5) {
    customer = customerOrQuery;
  } else {
    customer = findCustomer(db, customerOrQuery);
  }

  if (!customer) {
    console.warn(`[BOT 1] Customer not found for query: "${customerOrQuery}"`);
    const notFoundText = `❌ <b>Kechirasiz, bunday ID raqamli mijoz topilmadi!</b>\n\n` +
      `Iltimos, do'kondor bergan 5 xonali ID raqamingizni tekshirib qaytadan kiriting.`;

    await safeSendMessage(BOT1_TOKEN, chatId, notFoundText, {
      reply_markup: { remove_keyboard: true }
    });
    bot1Sessions.set(chatId, { state: 'WAITING_FOR_ID' });
    return;
  }

  // Update session
  bot1Sessions.set(chatId, {
    state: 'ID_VERIFIED',
    customerId5: customer.id5,
    customerName: customer.name
  });

  const stats = calculateCustomerStats(customer);
  const nowStr = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  let balanceText = '';
  if (stats.balance > 0) {
    balanceText = `🔴 <b>QOLDIQ QARZINGIZ:</b> <code>${formatSum(stats.balance)} so'm</code>`;
  } else if (stats.balance === 0) {
    balanceText = `🟢 <b>SIZDA HECH QANDAY QARZ YO'Q!</b>\n<i>Barcha qarzlar to'liq to'langan.</i> 🎉`;
  } else {
    balanceText = `🔵 <b>SIZNING HAQQINGIZ BOR:</b> <code>${formatSum(Math.abs(stats.balance))} so'm</code> (Ortiqcha to'lov)`;
  }

  let txList = '';
  const recentTx = (customer.transactions || []).slice(0, 5);
  if (recentTx.length > 0) {
    txList = `\n\n📋 <b>Oxirgi operatsiyalar:</b>\n`;
    recentTx.forEach(tx => {
      const d = (tx.date || '').split('T')[0];
      const sign = tx.type === 'DEBT' ? '🔴 -' : '🟢 +';
      const typeLabel = tx.type === 'DEBT' ? 'Nasiya' : "To'lov";
      const desc = tx.description ? ` (${escapeHtml(tx.description)})` : '';
      const paidStatus = tx.isPaid ? ' [To\'landi]' : '';
      txList += `• ${d}: ${sign}${formatSum(tx.amount)} so'm — ${typeLabel}${desc}${paidStatus}\n`;
    });
  } else {
    txList = `\n\n📋 <b>Operatsiyalar:</b> Hozircha amallar yozilmagan.`;
  }

  const phoneInfo = customer.phone ? `\n📞 Telefon: ${escapeHtml(customer.phone)}` : '';
  const noteInfo = customer.note ? `\n📝 Izoh: <i>${escapeHtml(customer.note)}</i>` : '';

  const report = `👤 <b>MIJOZ MA'LUMOTLARI:</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Ism:</b> ${escapeHtml(customer.name)}
🆔 <b>ID:</b> <code>#${escapeHtml(customer.id5)}</code>${phoneInfo}${noteInfo}

📊 <b>MOLIYAVIY HISOB:</b>
🔴 Jami olingan nasiya: <b>${formatSum(stats.totalDebt)} so'm</b>
🟢 Qaytarilgan to'lov: <b>${formatSum(stats.totalPaid)} so'm</b>
━━━━━━━━━━━━━━━━━━━━
${balanceText}
━━━━━━━━━━━━━━━━━━━━
⏰ <i>Yangilandi: ${nowStr}</i>${txList}`;

  await safeSendMessage(BOT1_TOKEN, chatId, report, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌐 Saytni ochish", callback_data: "open_site" }
        ],
        [
          { text: "✍️ Do'kondorga xabar yozish", callback_data: `send_msg_${customer.id5}` }
        ],
        [
          { text: "🔄 Yangilash", callback_data: `refresh_${customer.id5}` },
          { text: "🔢 Boshqa ID kiritish", callback_data: "change_id" }
        ]
      ]
    }
  });

  // Notify shopkeeper via Bot 2
  const merchantNotice = `👁 <b>MIJOZ O'Z QARZINI TEKSHIRDI!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Mijoz:</b> <b>${escapeHtml(customer.name)}</b> (#${escapeHtml(customer.id5)})\n` +
    `⚖️ <b>Qoldiq qarz:</b> ${formatSum(stats.balance)} so'm\n` +
    `📱 <b>Telegram ID:</b> <code>${chatId}</code>\n` +
    `⏰ <b>Vaqt:</b> ${nowStr}`;

  safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID, merchantNotice, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 Unga xabar yozish", callback_data: `reply_${chatId}_${customer.id5}` }]
      ]
    }
  }).catch(err => console.error('[BOT 2] Notice error:', err));
}

// Deliver customer message to Merchant via Bot 2
async function deliverMessageToMerchant(msgRecord, stats, rawMsg) {
  const balanceStr = stats.balance > 0 
    ? `🔴 ${formatSum(stats.balance)} so'm qarz`
    : (stats.balance === 0 ? "🟢 Qarz yo'q (0 so'm)" : `🔵 ${formatSum(Math.abs(stats.balance))} so'm haqdor`);

  const nowStr = new Date().toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const phoneStr = msgRecord.customerPhone ? `\n📞 <b>Telefon:</b> <code>${escapeHtml(msgRecord.customerPhone)}</code>` : '';

  const merchantNotice = `📩 <b>YANGI MIJOZ XABARI!</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> <b>${escapeHtml(msgRecord.customerName)}</b>
🆔 <b>ID:</b> <code>#${escapeHtml(msgRecord.customerId5)}</code>${phoneStr}
⚖️ <b>Holati:</b> ${balanceStr}
━━━━━━━━━━━━━━━━━━━━
💬 <b>XABAR MATNI:</b>
"${escapeHtml(msgRecord.content)}"
━━━━━━━━━━━━━━━━━━━━
⏰ <b>Vaqt:</b> ${nowStr}
<i>Yuboruvchi bot: @qarzingnikor_bot</i>`;

  const sendRes = await safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID, merchantNotice, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💬 Javob qaytarish", callback_data: `reply_${msgRecord.chatId}_${msgRecord.customerId5}` }
        ]
      ]
    }
  });

  if (sendRes && sendRes.ok) {
    console.log(`[BOT 2] Message delivered to admin ${ADMIN_CHAT_ID}`);
    msgRecord.delivered = true;
    const db = readDatabase();
    const stored = db.messages.find(m => m.id === msgRecord.id);
    if (stored) stored.delivered = true;
    saveDatabase(db);

    if (rawMsg.voice) {
      await callTelegram(BOT2_TOKEN, 'sendVoice', {
        chat_id: ADMIN_CHAT_ID,
        voice: rawMsg.voice.file_id,
        caption: `🎤 Mijoz: ${msgRecord.customerName} (#${msgRecord.customerId5}) ning ovozli xabari`
      });
    } else if (rawMsg.photo && rawMsg.photo.length > 0) {
      const bestPhoto = rawMsg.photo[rawMsg.photo.length - 1];
      await callTelegram(BOT2_TOKEN, 'sendPhoto', {
        chat_id: ADMIN_CHAT_ID,
        photo: bestPhoto.file_id,
        caption: `📷 Mijoz: ${msgRecord.customerName} (#${msgRecord.customerId5}) yuborgan rasm`
      });
    }
  } else {
    console.warn(`[BOT 2] Could not send to admin ${ADMIN_CHAT_ID} directly (${sendRes ? sendRes.error || sendRes.description : 'Unknown'}). Message queued.`);
    pendingAdminMessages.push({ msgRecord, stats, rawMsg, text: merchantNotice });
  }
}

// Deliver queued pending messages when admin starts Bot 2
async function flushPendingMessagesForAdmin() {
  if (pendingAdminMessages.length === 0) return;
  console.log(`[BOT 2] Delivering ${pendingAdminMessages.length} queued messages to admin ${ADMIN_CHAT_ID}`);

  while (pendingAdminMessages.length > 0) {
    const item = pendingAdminMessages.shift();
    try {
      const res = await safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID, item.text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "💬 Javob qaytarish", callback_data: `reply_${item.msgRecord.chatId}_${item.msgRecord.customerId5}` }]
          ]
        }
      });
      if (res && res.ok) {
        item.msgRecord.delivered = true;
        const db = readDatabase();
        const stored = db.messages.find(m => m.id === item.msgRecord.id);
        if (stored) stored.delivered = true;
        saveDatabase(db);
      }
    } catch (e) {
      console.error('[BOT 2] Error flushing pending message:', e);
    }
  }
}

// ============================================================================
// BOT 2: Admin / Merchant Bot (@xabarqarz_bot) Logic
// ============================================================================

async function handleBot2Update(update) {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message.chat.id;
    const data = cq.data;

    console.log(`[BOT 2 CALLBACK from ${chatId}]: ${data}`);
    await callTelegram(BOT2_TOKEN, 'answerCallbackQuery', { callback_query_id: cq.id });

    if (data.startsWith('reply_')) {
      const parts = data.split('_');
      const targetCustomerChatId = parts[1];
      const targetCustomerId5 = parts[2] || '';

      const db = readDatabase();
      const customer = findCustomer(db, targetCustomerId5);
      const custName = customer ? customer.name : 'Mijoz';
      const idLabel = (customer && customer.id5) ? ` (#${customer.id5})` : '';

      bot2Sessions.set(chatId, {
        state: 'WAITING_FOR_REPLY',
        targetCustomerChatId: targetCustomerChatId,
        targetCustomerId5: targetCustomerId5,
        customerName: custName
      });

      await safeSendMessage(BOT2_TOKEN, chatId,
        `✍️ <b>${escapeHtml(custName)}${idLabel}</b> ga javob yozing:\n\n` +
        `Xabaringiz @qarzingnikor_bot orqali to'g'ridan-to'g'ri mijozga yetkaziladi.\n\n` +
        `Bekor qilish: <code>/bekor</code>`,
        {
          reply_markup: {
            keyboard: [[{ text: "❌ Bekor qilish" }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        }
      );
      return;
    }
  }

  if (!update.message) return;
  const msg = update.message;
  const chatId = String(msg.chat.id);
  const text = (msg.text || '').trim();
  const session = bot2Sessions.get(chatId) || { state: 'IDLE' };

  console.log(`[BOT 2 MSG from ${chatId}]: "${text}"`);

  if (chatId === ADMIN_CHAT_ID) {
    await flushPendingMessagesForAdmin();
  }

  if (text === '/bekor' || text === '❌ Bekor qilish') {
    bot2Sessions.set(chatId, { state: 'IDLE' });
    await safeSendMessage(BOT2_TOKEN, chatId,
      `Javob yozish bekor qilindi.`,
      { reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  if (session.state === 'WAITING_FOR_REPLY') {
    const targetChatId = session.targetCustomerChatId;
    const custName = session.customerName;
    const replyText = text;

    bot2Sessions.set(chatId, { state: 'IDLE' });

    const replyButtons = [];
    if (session.targetCustomerId5 && session.targetCustomerId5 !== 'user' && session.targetCustomerId5 !== 'unknown') {
      replyButtons.push([
        { text: "✍️ Yana javob yozish", callback_data: `send_msg_${session.targetCustomerId5}` },
        { text: "📊 Hisobni ko'rish", callback_data: `refresh_${session.targetCustomerId5}` }
      ]);
    } else {
      replyButtons.push([
        { text: "✍️ Yana xabar yozish", callback_data: "write_to_merchant" },
        { text: "🌐 Saytni ochish", callback_data: "open_site" }
      ]);
    }

    const custRes = await safeSendMessage(BOT1_TOKEN, targetChatId,
      `📩 <b>DO'KONDORDAN JAVOB:</b>\n━━━━━━━━━━━━━━━━━━━━\n"${escapeHtml(replyText)}"\n━━━━━━━━━━━━━━━━━━━━\n<i>Savdogar Daftari orqali yuborildi</i>`,
      {
        reply_markup: {
          inline_keyboard: replyButtons
        }
      }
    );

    if (custRes && custRes.ok) {
      const idLabel = (session.targetCustomerId5 && session.targetCustomerId5 !== 'user' && session.targetCustomerId5 !== 'unknown') ? ` (#${session.targetCustomerId5})` : '';
      await safeSendMessage(BOT2_TOKEN, chatId,
        `✅ Javobingiz <b>${escapeHtml(custName)}${idLabel}</b> ga muvaffaqiyatli yetkazildi!`,
        { reply_markup: { remove_keyboard: true } }
      );
    } else {
      await safeSendMessage(BOT2_TOKEN, chatId,
        `⚠️ Mijozga yetkazishda xatolik yuz berdi. Mijoz botni to'xtatgan bo'lishi mumkin.`,
        { reply_markup: { remove_keyboard: true } }
      );
    }
    return;
  }

  if (text.startsWith('/start')) {
    const db = readDatabase();
    let totalDebt = 0;
    let debtorsCount = 0;
    db.customers.forEach(c => {
      const stats = calculateCustomerStats(c);
      if (stats.balance > 0) {
        totalDebt += stats.balance;
        debtorsCount++;
      }
    });

    const welcome = `👋 <b>Assalomu alaykum, Do'kondor!</b>

<b>Savdogar Daftari Admin Botiga</b> xush kelibsiz!
Bu bot sizning shaxsiy bildirishnoma markazingizdir.

Mijozlaringiz @qarzingnikor_bot orqali o'z 5 xonali ID sini kiritib qarzini tekshirsa va xabar yozsa, barcha xabarlar shu yerga keladi!

📊 <b>JORIY HOLAT:</b>
• 👥 Jami mijozlar: <b>${db.customers.length} ta</b>
• 🔴 Qarzdorlar soni: <b>${debtorsCount} ta</b>
• 💰 Jami berilgan nasiya: <b>${formatSum(totalDebt)} so'm</b>
• 📩 Kelgan xabarlar: <b>${db.messages.length} ta</b>

⚙️ <b>Buyruqlar:</b>
/stat - To'liq moliyaviy hisobot
/mijozlar - Qarzdorlar ro'yxati
/xabarlar - Oxirgi mijoz xabarlari`;

    await safeSendMessage(BOT2_TOKEN, chatId, welcome, {
      reply_markup: {
        keyboard: [
          [{ text: "📊 Statistika" }, { text: "👥 Qarzdorlar" }],
          [{ text: "📩 Oxirgi xabarlar" }]
        ],
        resize_keyboard: true
      }
    });
    return;
  }

  if (text === '/stat' || text === '📊 Statistika') {
    const db = readDatabase();
    let totalDebt = 0;
    let totalPaid = 0;
    let debtorsCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let todayDebt = 0;
    let todayPaid = 0;

    db.customers.forEach(c => {
      const stats = calculateCustomerStats(c);
      if (stats.balance > 0) {
        totalDebt += stats.balance;
        debtorsCount++;
      }
      (c.transactions || []).forEach(tx => {
        const d = (tx.date || '').split('T')[0];
        if (d === todayStr) {
          if (tx.type === 'DEBT') todayDebt += Number(tx.amount || 0);
          if (tx.type === 'PAYMENT') todayPaid += Number(tx.amount || 0);
        }
      });
      totalPaid += stats.totalPaid;
    });

    const statMsg = `📊 <b>MOLIYAVIY HISOBOT:</b>
━━━━━━━━━━━━━━━━━━━━
👥 Jami mijozlar: <b>${db.customers.length} nafar</b>
🔴 Qarzdorlar: <b>${debtorsCount} nafar</b>

💰 <b>Kassadagi umumiy holat:</b>
🔴 Umumiy qoldiq qarz: <b>${formatSum(totalDebt)} so'm</b>
🟢 Jami qabul qilingan to'lov: <b>${formatSum(totalPaid)} so'm</b>

📅 <b>Bugungi ko'rsatkichlar:</b>
🔴 Bugun berilgan nasiya: <b>${formatSum(todayDebt)} so'm</b>
🟢 Bugun qaytarilgan to'lov: <b>${formatSum(todayPaid)} so'm</b>
━━━━━━━━━━━━━━━━━━━━
⏰ <i>Vaqt: ${new Date().toLocaleTimeString('uz-UZ')}</i>`;

    await safeSendMessage(BOT2_TOKEN, chatId, statMsg);
    return;
  }

  if (text === '/mijozlar' || text === '👥 Qarzdorlar') {
    const db = readDatabase();
    const debtors = db.customers
      .map(c => ({ ...c, stats: calculateCustomerStats(c) }))
      .filter(c => c.stats.balance > 0)
      .sort((a, b) => b.stats.balance - a.stats.balance);

    if (debtors.length === 0) {
      await safeSendMessage(BOT2_TOKEN, chatId,
        `🎉 <b>Ajoyib! Hozirda hech qanday qarzdor yo'q!</b>\nBarcha mijozlar hisob-kitobni yopgan.`
      );
      return;
    }

    let msgText = `🔴 <b>QARZDORLAR RO'YXATI (${debtors.length} ta):</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    debtors.slice(0, 20).forEach((d, idx) => {
      const phone = d.phone ? ` (${escapeHtml(d.phone)})` : '';
      msgText += `${idx + 1}. <b>${escapeHtml(d.name)}</b> [ID: <code>#${escapeHtml(d.id5)}</code>]\n   💰 Qarz: <b>${formatSum(d.stats.balance)} so'm</b>${phone}\n`;
    });

    if (debtors.length > 20) {
      msgText += `\n<i>...va yana ${debtors.length - 20} ta mijoz.</i>`;
    }

    await safeSendMessage(BOT2_TOKEN, chatId, msgText);
    return;
  }

  if (text === '/xabarlar' || text === '📩 Oxirgi xabarlar') {
    const db = readDatabase();
    const msgs = (db.messages || []).slice(0, 8);

    if (msgs.length === 0) {
      await safeSendMessage(BOT2_TOKEN, chatId, `Hozircha mijozlardan yangi xabarlar kelmagan.`);
      return;
    }

    let msgList = `📩 <b>OXIRGI MIJOZ XABARLARI:</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    msgs.forEach((m, idx) => {
      const d = new Date(m.date).toLocaleDateString('uz-UZ', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      msgList += `${idx + 1}. <b>${escapeHtml(m.customerName)}</b> (#${escapeHtml(m.customerId5)}) [${d}]:\n   "${escapeHtml(m.content)}"\n\n`;
    });

    await safeSendMessage(BOT2_TOKEN, chatId, msgList);
    return;
  }
}

// ============================================================================
// Long Polling Engine
// ============================================================================

class BotPoller {
  constructor(token, name, handler) {
    this.token = token;
    this.name = name;
    this.handler = handler;
    this.offset = 0;
    this.running = false;
  }

  async start() {
    this.running = true;
    console.log(`[${this.name}] Long polling ishga tushdi...`);
    this.poll();
  }

  stop() {
    this.running = false;
  }

  async poll() {
    while (this.running) {
      try {
        const res = await callTelegram(this.token, 'getUpdates', {
          offset: this.offset,
          timeout: 25,
          allowed_updates: ['message', 'callback_query']
        });

        if (res && res.ok && Array.isArray(res.result)) {
          for (const update of res.result) {
            this.offset = update.update_id + 1;
            try {
              await this.handler(update);
            } catch (err) {
              console.error(`[${this.name}] Handler error:`, err);
            }
          }
        } else if (res && !res.ok) {
          console.warn(`[${this.name}] getUpdates warning:`, res.description || res.error);
          await new Promise(r => setTimeout(r, 3000));
        }
      } catch (err) {
        console.error(`[${this.name}] Polling network error:`, err.message);
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }
}

const bot1Poller = new BotPoller(BOT1_TOKEN, 'Bot 1 (Customer: @qarzingnikor_bot)', handleBot1Update);
const bot2Poller = new BotPoller(BOT2_TOKEN, 'Bot 2 (Merchant: @xabarqarz_bot)', handleBot2Update);

function startTelegramBots() {
  bot1Poller.start();
  bot2Poller.start();
}

async function notifyAdminNewCustomer(customer) {
  if (!customer) return;
  const alertText = `🆕 <b>YANGI MIJOZ RO'YXATGA OLINDI!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 <b>Ism:</b> ${escapeHtml(customer.name)}\n` +
    `🆔 <b>ID:</b> <code>#${escapeHtml(customer.id5)}</code>\n` +
    (customer.phone ? `📞 <b>Telefon:</b> <code>${escapeHtml(customer.phone)}</code>\n` : '') +
    (customer.note ? `📝 <b>Izoh:</b> <i>${escapeHtml(customer.note)}</i>\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <i>Ushbu ID darhol @qarzingnikor_bot tizimida faollashtirildi!</i>`;

  return await safeSendMessage(BOT2_TOKEN, ADMIN_CHAT_ID, alertText);
}

module.exports = {
  startTelegramBots,
  readDatabase,
  saveDatabase,
  calculateCustomerStats,
  findCustomer,
  notifyAdminNewCustomer
};

if (require.main === module) {
  startTelegramBots();
  console.log("Savdogar Daftari Telegram botlari faol rejimda!");
}
