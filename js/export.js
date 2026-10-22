/* ==========================================================================
   SAVDOGAR DAFTARI — Export & Gentle Reminder Generator
   Includes 5-digit customer IDs, detailed debt/paid columns & polite templates
   ========================================================================== */

class ExportAndShareManager {
  constructor() {
    this.reminderTemplates = {
      friendly: (customer, amountFormatted, shopName) => 
        `Assalomu alaykum ${customer.name}! Ishlaringiz yaxshimi? Siz bilan hisob-kitob bo'yicha (${customer.id5 ? 'ID: #' + customer.id5 + ' ' : ''})do'konimizdan ${amountFormatted} so'm nasiyangiz bor edi. Qulay vaqtingizda tashlab ketsangiz juda xursand bo'lardik. Rahmat, sog' bo'ling! Hurmat bilan, ${shopName}.`,

      formal: (customer, amountFormatted, shopName) => 
        `Assalomu alaykum hurmatli ${customer.name}! "${shopName}" hisob-kitob daftari bo'yicha (Mijoz ID: #${customer.id5 || '10001'}) qoldiq qarz miqdori: ${amountFormatted} so'm. To'lovni o'z vaqtida amalga oshirishingizni so'raymiz. Hamkorlik uchun tashakkur!`,

      monthEnd: (customer, amountFormatted, shopName) => 
        `Assalomu alaykum ${customer.name}! Oy yakuni munosabati bilan umumiy do'kon hisob-kitoblari yopilmoqda. Sizning umumiy qoldiq nasiyangiz: ${amountFormatted} so'm. Do'konga kelib hisob-kitob qilib ketishingizni iltimos qilamiz. ${shopName}.`
    };
  }

  getReminderText(type = 'friendly', customer, shopName) {
    const balance = window.Store.getCustomerBalance(customer);
    const formattedAmount = balance.toLocaleString('uz-UZ') + " so'm";
    const shop = shopName || window.Store.getMerchant().shopName;
    const templateFn = this.reminderTemplates[type] || this.reminderTemplates.friendly;
    return templateFn(customer, formattedAmount, shop);
  }

  shareViaTelegram(phone, text) {
    const encoded = encodeURIComponent(text);
    const url = `https://t.me/share/url?url=&text=${encoded}`;
    window.open(url, '_blank');
  }

  shareViaSMS(phone, text) {
    const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
    const encoded = encodeURIComponent(text);
    const url = `sms:${cleanPhone}?body=${encoded}`;
    window.location.href = url;
  }

  async copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      console.warn("Clipboard API failed, fallback to textarea", e);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }

  /* -------------------------------------------------------------
     Export to Excel / CSV with UTF-8 BOM
  ------------------------------------------------------------- */
  exportToCSV() {
    const customers = window.Store.getCustomers();
    const rows = [
      ["ID (5 xonali)", "Mijoz Ismi", "Telefon raqami", "Jami Nasiya (so'm)", "To'langan (so'm)", "Qoldiq Qarz (so'm)", "Holati", "Izoh"]
    ];

    customers.forEach(cust => {
      const totalDebt = window.Store.getCustomerTotalDebt(cust);
      const totalPaid = window.Store.getCustomerTotalPaid(cust);
      const balance = window.Store.getCustomerBalance(cust);
      const status = balance > 0 ? "Qarzdor" : (balance === 0 ? "To'liq to'langan" : "Ortiqcha to'langan");
      
      rows.push([
        cust.id5 || "-",
        cust.name,
        cust.phone || "-",
        totalDebt,
        totalPaid,
        balance,
        status,
        cust.note || ""
      ]);
    });

    const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute("href", url);
    link.setAttribute("download", `Savdogar_Daftari_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  printReport() {
    window.print();
  }
}

// Global instance
window.ExportManager = new ExportAndShareManager();
