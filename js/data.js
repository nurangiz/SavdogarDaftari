/* ==========================================================================
   SAVDOGAR DAFTARI — Data Store & LocalStorage Persistence
   No mock data, 5-digit customer IDs, persistent storage, paid status tracking
   ========================================================================== */

const STORAGE_KEY = 'savdogar_daftari_v2';

const API_BASE = (typeof window !== 'undefined' && (window.location.protocol === 'http:' || window.location.protocol === 'https:'))
  ? (window.location.origin.includes('3030') ? window.location.origin : 'http://localhost:3030')
  : 'http://localhost:3030';

// Clean initial store: Zero pre-existing debts as requested by user
const DEFAULT_STORE = {
  merchant: {
    name: "Mening Do'konim",
    shopName: "Do'kon / Rasta",
    phone: ""
  },
  nextId5: 10001,
  customers: [] // Completely clean, no mock debts!
};

class DataStore {
  constructor() {
    this.data = this.load();
    this.fetchFromServer();
    // Auto-sync polling every 8 seconds
    if (typeof window !== 'undefined') {
      setInterval(() => this.fetchFromServer(), 8000);
    }
  }

  load() {
    try {
      // Clear old v1 mock data if present
      localStorage.removeItem('savdogar_daftari_v1');

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure data integrity and 5-digit IDs on any existing customers
        if (!parsed.customers) parsed.customers = [];
        if (!parsed.nextId5) parsed.nextId5 = 10001;
        
        parsed.customers.forEach((c, idx) => {
          if (!c.id5) {
            c.id5 = String(10001 + idx);
          }
        });
        return parsed;
      }
    } catch (e) {
      console.warn("Storage load error, falling back to defaults", e);
    }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STORE));
    this.save(fresh);
    return fresh;
  }

  async syncServer(data) {
    try {
      await fetch(API_BASE + '/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || this.data)
      });
    } catch (e) {
      // Offline fallback silent
    }
  }

  async fetchFromServer() {
    try {
      const res = await fetch(API_BASE + '/api/data');
      if (res.ok) {
        const remote = await res.json();
        const localCustomers = (this.data && this.data.customers) || [];
        const remoteCustomers = (remote && remote.customers) || [];

        // Bidirectional Map-based merge
        const mergedMap = new Map();

        // 1. Add remote customers
        remoteCustomers.forEach(c => {
          const key = String(c.id5 || c.id || '');
          if (key) mergedMap.set(key, c);
        });

        // 2. Add local customers (merge any that are missing or newer)
        localCustomers.forEach(c => {
          const key = String(c.id5 || c.id || '');
          if (key) {
            if (!mergedMap.has(key)) {
              mergedMap.set(key, c);
            } else {
              const existing = mergedMap.get(key);
              const exCount = (existing.transactions || []).length;
              const curCount = (c.transactions || []).length;
              if (curCount > exCount) {
                mergedMap.set(key, c);
              }
            }
          }
        });

        this.data.customers = Array.from(mergedMap.values());
        if (remote.merchant) this.data.merchant = { ...this.data.merchant, ...remote.merchant };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        
        // Push merged state to server so server also has everything
        this.syncServer(this.data);

        if (window.App && typeof window.App.renderCustomerList === 'function') {
          window.App.renderCustomerList();
        }
        if (window.App && typeof window.App.updateMetrics === 'function') {
          window.App.updateMetrics();
        }
      }
    } catch (e) {
      // offline or silent
    }
  }

  save(dataToSave) {
    try {
      const data = dataToSave || this.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
      this.syncServer(data);
    } catch (e) {
      console.error("Storage save failed", e);
    }
  }

  getMerchant() {
    return this.data.merchant || DEFAULT_STORE.merchant;
  }

  updateMerchant(patch) {
    this.data.merchant = { ...this.getMerchant(), ...patch };
    this.save();
    return this.data.merchant;
  }

  getCustomers() {
    return this.data.customers || [];
  }

  getCustomer(idOrCustomer) {
    if (!idOrCustomer) return null;
    if (typeof idOrCustomer === 'object' && idOrCustomer.id) {
      return this.data.customers.find(c => c.id === idOrCustomer.id) || idOrCustomer;
    }
    return this.data.customers.find(c => c.id === idOrCustomer) || null;
  }

  getCustomerById5(id5) {
    if (!id5) return null;
    const cleanId = String(id5).replace('#', '').trim();
    const digitsOnly = cleanId.replace(/\D/g, '');
    return this.data.customers.find(c => {
      const cId5 = String(c.id5 || '').trim();
      return cId5 === cleanId || (digitsOnly && cId5 === digitsOnly) || String(c.id || '') === cleanId;
    }) || null;
  }

  // Generate unique RANDOM 5-digit ID (e.g. 48291, 73019...)
  generate5DigitId() {
    let randomId;
    let attempts = 0;
    do {
      randomId = String(Math.floor(10000 + Math.random() * 90000));
      attempts++;
    } while (this.data.customers.some(c => c.id5 === randomId) && attempts < 1000);
    return randomId;
  }

  // Total debt given to customer (Chiqim / Nasiya)
  getCustomerTotalDebt(customerOrId) {
    const customer = this.getCustomer(customerOrId);
    if (!customer || !customer.transactions) return 0;
    return customer.transactions
      .filter(tx => tx.type === 'DEBT')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }

  // Total payments received from customer (Kirim / To'lov)
  getCustomerTotalPaid(customerOrId) {
    const customer = this.getCustomer(customerOrId);
    if (!customer || !customer.transactions) return 0;
    return customer.transactions
      .filter(tx => tx.type === 'PAYMENT')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }

  // Calculate customer balance: positive = owes money (qoldiq qarz), 0 = settled (to'liq to'langan)
  getCustomerBalance(customerOrId) {
    const customer = this.getCustomer(customerOrId);
    const debt = this.getCustomerTotalDebt(customer);
    const paid = this.getCustomerTotalPaid(customer);
    return debt - paid;
  }

  addCustomer(name, phone = '', note = '', photo = '', customId5 = '') {
    const rawCustom = String(customId5 || '').replace(/\D/g, '').trim();
    let id5 = (rawCustom.length === 5) ? rawCustom : this.generate5DigitId();

    const newCustomer = {
      id: 'cust_' + Date.now(),
      id5: id5, // Unique random or custom 5-digit ID
      name: name.trim(),
      phone: phone.trim(),
      note: note.trim(),
      photo: photo || '', // Optional base64 photo
      createdAt: new Date().toISOString(),
      transactions: []
    };

    // Remove old with same id5 if exists
    this.data.customers = this.data.customers.filter(c => c.id5 !== id5);
    this.data.customers.unshift(newCustomer);
    this.save();

    // Immediately push to server API so Telegram bot gets it with 0ms delay!
    fetch(API_BASE + '/api/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    }).catch(err => console.warn('Customer push to server failed:', err));

    return newCustomer;
  }

  updateCustomer(customerId, patch) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;
    Object.assign(customer, patch);
    this.save();
    return customer;
  }

  findOrCreateCustomerByName(name, customId5 = '') {
    const clean = name.trim();
    // Check if input is a 5-digit ID
    if (/^\d{5}$/.test(clean)) {
      const byId = this.getCustomerById5(clean);
      if (byId) return byId;
    }

    const lower = clean.toLowerCase();
    const existing = this.data.customers.find(c => c.name.toLowerCase() === lower);
    if (existing) return existing;
    return this.addCustomer(name, '', '', '', customId5);
  }

  addTransaction(customerId, type, amount, description = '', isPaid = false) {
    const customer = this.getCustomer(customerId);
    if (!customer) throw new Error("Mijoz topilmadi");

    const tx = {
      id: 'tx_' + Date.now(),
      type: type, // 'DEBT' or 'PAYMENT'
      amount: Math.abs(Number(amount)),
      description: description.trim() || (type === 'DEBT' ? 'Nasiya savdo' : "To'lov"),
      isPaid: Boolean(isPaid),
      date: new Date().toISOString()
    };

    customer.transactions.unshift(tx);
    this.save();

    // Immediately push transaction to server API
    fetch(API_BASE + '/api/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: customer.id,
        customerId5: customer.id5,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        isPaid: tx.isPaid
      })
    }).catch(err => console.warn('Transaction push to server failed:', err));

    return { customer, transaction: tx };
  }

  // Mark a specific debt as paid ("To'landi deb yozish")
  markDebtAsPaid(customerId, debtTxId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;

    const debtTx = customer.transactions.find(t => t.id === debtTxId);
    if (!debtTx) return null;

    debtTx.isPaid = true;

    // Automatically record the corresponding payment
    const paymentTx = {
      id: 'tx_' + (Date.now() + 1),
      type: 'PAYMENT',
      amount: debtTx.amount,
      description: `To'landi: ${debtTx.description || 'nasiya'}`,
      linkedDebtId: debtTx.id,
      date: new Date().toISOString()
    };

    customer.transactions.unshift(paymentTx);
    this.save();
    return { customer, debtTx, paymentTx };
  }

  // Pay full outstanding balance for a customer
  settleFullCustomerDebt(customerId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return null;

    const balance = this.getCustomerBalance(customer);
    if (balance <= 0) return null;

    // Mark all debts as paid
    customer.transactions.forEach(t => {
      if (t.type === 'DEBT') t.isPaid = true;
    });

    // Create payment transaction
    const paymentTx = {
      id: 'tx_' + Date.now(),
      type: 'PAYMENT',
      amount: balance,
      description: "Qarz to'liq to'landi",
      date: new Date().toISOString()
    };

    customer.transactions.unshift(paymentTx);
    this.save();
    return { customer, paymentTx };
  }

  deleteTransaction(customerId, transactionId) {
    const customer = this.getCustomer(customerId);
    if (!customer) return false;
    customer.transactions = customer.transactions.filter(t => t.id !== transactionId);
    this.save();
    return true;
  }

  deleteCustomer(customerId) {
    this.data.customers = this.data.customers.filter(c => c.id !== customerId);
    this.save();
  }

  // Analytics & Top Metrics
  getMetrics() {
    let totalDebt = 0;
    let todayDebt = 0;
    let todayPaid = 0;
    let activeDebtorsCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    this.data.customers.forEach(cust => {
      const balance = this.getCustomerBalance(cust);
      if (balance > 0) {
        totalDebt += balance;
        activeDebtorsCount++;
      }

      (cust.transactions || []).forEach(tx => {
        const txDay = (tx.date || '').split('T')[0];
        if (txDay === todayStr) {
          if (tx.type === 'DEBT') todayDebt += Number(tx.amount || 0);
          if (tx.type === 'PAYMENT') todayPaid += Number(tx.amount || 0);
        }
      });
    });

    return {
      totalDebt,
      todayDebt,
      todayPaid,
      activeDebtorsCount,
      totalCustomers: this.data.customers.length
    };
  }

  // 7-day stats
  get7DayStats() {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' });

      let debtSum = 0;
      let paidSum = 0;

      this.data.customers.forEach(cust => {
        (cust.transactions || []).forEach(tx => {
          if ((tx.date || '').split('T')[0] === dateKey) {
            if (tx.type === 'DEBT') debtSum += Number(tx.amount || 0);
            if (tx.type === 'PAYMENT') paidSum += Number(tx.amount || 0);
          }
        });
      });

      days.push({
        date: dateKey,
        label: dayName,
        debt: debtSum,
        paid: paidSum
      });
    }

    return days;
  }

  // Clear all data
  clearAll() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STORE));
    this.save();
    return this.data;
  }
}

// Global instance
window.Store = new DataStore();
