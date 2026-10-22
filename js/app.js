/* ==========================================================================
   SAVDOGAR DAFTARI — Master Application Controller
   Customer Portal, Admin Security (08092010), Camera Snapshot & FinTech Ledger
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const SESSION_AUTH_KEY = 'savdogar_admin_session';
  const ADMIN_PIN_CODE = '08092010';

  // Portals
  const portalCustomer = document.getElementById('portal-customer');
  const portalAdmin = document.getElementById('portal-admin');

  // Customer Portal Elements
  const formCustPortalSearch = document.getElementById('formCustPortalSearch');
  const custPortalIdInput = document.getElementById('custPortalIdInput');
  const portalCustEmptyState = document.getElementById('portalCustEmptyState');
  const portalCustResultState = document.getElementById('portalCustResultState');
  const portalCustNotFoundState = document.getElementById('portalCustNotFoundState');
  const portalCustNotFoundMsg = document.getElementById('portalCustNotFoundMsg');
  const custPortalShopName = document.getElementById('custPortalShopName');
  const custPortalAvatarContainer = document.getElementById('custPortalAvatarContainer');
  const custPortalName = document.getElementById('custPortalName');
  const custPortalIdBadge = document.getElementById('custPortalIdBadge');
  const custPortalPhone = document.getElementById('custPortalPhone');
  const custPortalStatusBadge = document.getElementById('custPortalStatusBadge');
  const custPortalTotalDebt = document.getElementById('custPortalTotalDebt');
  const custPortalTotalPaid = document.getElementById('custPortalTotalPaid');
  const custPortalBalance = document.getElementById('custPortalBalance');
  const custPortalTimeline = document.getElementById('custPortalTimeline');
  const btnCustPortalReset = document.getElementById('btnCustPortalReset');
  const btnCustPortalPrint = document.getElementById('btnCustPortalPrint');
  const btnCustPortalContactShop = document.getElementById('btnCustPortalContactShop');
  const btnOpenAdminLogin = document.getElementById('btnOpenAdminLogin');
  const custPortalThemeBtn = document.getElementById('custPortalThemeBtn');

  // Admin Header & Auth Elements
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const adminPinModal = document.getElementById('adminPinModal');
  const adminPinInput = document.getElementById('adminPinInput');
  const pinDialogBody = document.getElementById('pinDialogBody');
  const btnClosePinModal = document.getElementById('btnClosePinModal');
  const btnPinSubmit = document.getElementById('btnPinSubmit');
  const btnPinClear = document.getElementById('btnPinClear');
  const btnPinBackspace = document.getElementById('btnPinBackspace');

  // Admin Dashboard Elements
  const activeTabElements = document.querySelectorAll('.tab-btn, .mobile-nav-item');
  const viewSections = document.querySelectorAll('.app-view');
  const elTotalDebt = document.getElementById('metricTotalDebt');
  const elTodayDebt = document.getElementById('metricTodayDebt');
  const elTodayPaid = document.getElementById('metricTodayPaid');
  const elDebtorsCount = document.getElementById('metricDebtorsCount');
  const searchInput = document.getElementById('customerSearchInput');
  const filterChips = document.querySelectorAll('.filter-chip');
  const customerListContainer = document.getElementById('customerListContainer');

  // Voice Assistant Elements
  const voiceModal = document.getElementById('voiceModal');
  const btnOpenVoice = document.getElementById('btnOpenVoice');
  const btnVoiceHeroRecord = document.getElementById('btnVoiceHeroRecord');
  const btnMobileMic = document.getElementById('btnMobileMic');
  const voiceBigMic = document.getElementById('voiceBigMic');
  const voiceStatusLabel = document.getElementById('voiceStatusLabel');
  const voiceTranscriptPreview = document.getElementById('voiceTranscriptPreview');
  const audioVisualizerCanvas = document.getElementById('audioVisualizer');
  const btnVoiceDone = document.getElementById('btnVoiceDone');
  const btnLangUz = document.getElementById('btnLangUz');
  const btnLangRu = document.getElementById('btnLangRu');

  // Confirmation Modal Elements
  const confirmModal = document.getElementById('confirmModal');
  const confirmCustName = document.getElementById('confirmCustName');
  const confirmTxType = document.getElementById('confirmTxType');
  const confirmAmount = document.getElementById('confirmAmount');
  const confirmDesc = document.getElementById('confirmDesc');
  const confirmAutoMarkPaid = document.getElementById('confirmAutoMarkPaid');
  const btnConfirmApprove = document.getElementById('btnConfirmApprove');
  const btnConfirmCancel = document.getElementById('btnConfirmCancel');

  // Add Customer Modal & Photo Upload Elements
  const addCustomerModal = document.getElementById('addCustomerModal');
  const btnAddNewCustomer = document.getElementById('btnAddNewCustomer');
  const formAddCustomer = document.getElementById('formAddCustomer');
  const newCustName = document.getElementById('newCustName');
  const newCustPhone = document.getElementById('newCustPhone');
  const newCustNote = document.getElementById('newCustNote');
  const newCustPhotoData = document.getElementById('newCustPhotoData');
  const newCustPhotoThumb = document.getElementById('newCustPhotoThumb');
  const btnOpenAddCustCamera = document.getElementById('btnOpenAddCustCamera');
  const newCustPhotoFileInput = document.getElementById('newCustPhotoFileInput');
  const btnRemoveNewCustPhoto = document.getElementById('btnRemoveNewCustPhoto');

  // Camera Snapshot Modal Elements
  const cameraModal = document.getElementById('cameraModal');
  const btnCloseCameraModal = document.getElementById('btnCloseCameraModal');
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraCapturedImg = document.getElementById('cameraCapturedImg');
  const cameraCanvas = document.getElementById('cameraCanvas');
  const cameraGuideRing = document.getElementById('cameraGuideRing');
  const btnSnapPhoto = document.getElementById('btnSnapPhoto');
  const btnRetakePhoto = document.getElementById('btnRetakePhoto');
  const btnSavePhoto = document.getElementById('btnSavePhoto');
  const cameraStatusMsg = document.getElementById('cameraStatusMsg');

  // Customer Drawer / Sheet Elements
  const customerSheet = document.getElementById('customerSheet');
  const customerSheetOverlay = document.getElementById('customerSheetOverlay');
  const btnCloseSheet = document.getElementById('btnCloseSheet');
  const sheetCustAvatarContainer = document.getElementById('sheetCustAvatarContainer');
  const sheetCustName = document.getElementById('sheetCustName');
  const sheetCustId5 = document.getElementById('sheetCustId5');
  const sheetCustPhone = document.getElementById('sheetCustPhone');
  const sheetCustTotalDebt = document.getElementById('sheetCustTotalDebt');
  const sheetCustTotalPaid = document.getElementById('sheetCustTotalPaid');
  const sheetCustBalance = document.getElementById('sheetCustBalance');
  const btnSheetSettleFull = document.getElementById('btnSheetSettleFull');
  const btnDrawerUpdatePhoto = document.getElementById('btnDrawerUpdatePhoto');
  const ledgerTimeline = document.getElementById('ledgerTimeline');
  const reminderTextPreview = document.getElementById('reminderTextPreview');
  const reminderTabChips = document.querySelectorAll('.reminder-tab-chip');
  const btnReminderTelegram = document.getElementById('btnReminderTelegram');
  const btnReminderSMS = document.getElementById('btnReminderSMS');
  const btnReminderCopy = document.getElementById('btnReminderCopy');
  const btnSheetAddNasiya = document.getElementById('btnSheetAddNasiya');
  const btnSheetAddPayment = document.getElementById('btnSheetAddPayment');
  const btnDeleteCustomer = document.getElementById('btnDeleteCustomer');

  // Manual Transaction Modal
  const manualTxModal = document.getElementById('manualTxModal');
  const formManualTx = document.getElementById('formManualTx');

  // Theme & Sound Buttons
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');

  // Application State
  let currentFilter = 'all';
  let searchQuery = '';
  let selectedCustomerId = null;
  let activeReminderType = 'friendly';
  let cameraStream = null;
  let capturedPhotoBase64 = null;
  let cameraTarget = 'newCustomer'; // 'newCustomer' or 'drawerCustomer'

  /* -------------------------------------------------------------
     1. Modern Dialog Light-Dismiss Fallback
  ------------------------------------------------------------- */
  document.querySelectorAll('dialog').forEach(dialog => {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (isDialogContent) return;
        dialog.close();
      });
    }
  });

  /* -------------------------------------------------------------
     2. Theme Management (dark-mode-toggle)
  ------------------------------------------------------------- */
  function applyTheme(theme) {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) return;

    if (theme === 'dark') {
      meta.content = 'dark';
      localStorage.setItem('color-scheme', 'dark');
      if (themeToggleBtn) themeToggleBtn.innerHTML = '🌙';
      if (custPortalThemeBtn) custPortalThemeBtn.innerHTML = '🌙';
    } else if (theme === 'light') {
      meta.content = 'light';
      localStorage.setItem('color-scheme', 'light');
      if (themeToggleBtn) themeToggleBtn.innerHTML = '☀️';
      if (custPortalThemeBtn) custPortalThemeBtn.innerHTML = '☀️';
    } else {
      meta.content = 'light dark';
      localStorage.removeItem('color-scheme');
      if (themeToggleBtn) themeToggleBtn.innerHTML = '🌓';
      if (custPortalThemeBtn) custPortalThemeBtn.innerHTML = '🌓';
    }
  }

  const savedTheme = localStorage.getItem('color-scheme');
  applyTheme(savedTheme || 'light dark');

  [themeToggleBtn, custPortalThemeBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        window.AudioEngine.playPop();
        const current = document.querySelector('meta[name="color-scheme"]').content;
        if (current === 'light dark') applyTheme('dark');
        else if (current === 'dark') applyTheme('light');
        else applyTheme('light dark');
      });
    }
  });

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      window.AudioEngine.soundEnabled = !window.AudioEngine.soundEnabled;
      soundToggleBtn.innerHTML = window.AudioEngine.soundEnabled ? '🔔' : '🔕';
      if (window.AudioEngine.soundEnabled) window.AudioEngine.playPop();
    });
  }

  /* -------------------------------------------------------------
     3. Portal Routing: Customer Portal vs Admin Panel
  ------------------------------------------------------------- */
  function showCustomerPortal() {
    portalAdmin.style.display = 'none';
    portalCustomer.style.display = 'flex';
    resetCustomerPortal();
    updateShopNameDisplay();
  }

  function showAdminPanel() {
    portalCustomer.style.display = 'none';
    portalAdmin.style.display = 'flex';
    updateMetrics();
    renderCustomerList();
    updateShopNameDisplay();
  }

  function updateShopNameDisplay() {
    const merchant = window.Store.getMerchant();
    const name = merchant.shopName || "Chilonzor Bozor, 14-do'kon";
    if (custPortalShopName) custPortalShopName.textContent = name;
    const headerShopName = document.getElementById('headerShopName');
    if (headerShopName) headerShopName.textContent = name;
  }

  // Admin login button clicked in Customer Portal
  btnOpenAdminLogin.addEventListener('click', () => {
    window.AudioEngine.playPop();
    if (sessionStorage.getItem(SESSION_AUTH_KEY) === 'true') {
      showAdminPanel();
    } else {
      adminPinInput.value = '';
      adminPinModal.showModal();
    }
  });

  // Admin Logout button clicked in Admin Panel
  btnAdminLogout.addEventListener('click', () => {
    window.AudioEngine.playPop();
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    showCustomerPortal();
    showToast("Admin kabinetidan chiqildi 🔒");
  });

  /* -------------------------------------------------------------
     4. Admin Security PIN Verification (08092010)
  ------------------------------------------------------------- */
  document.querySelectorAll('.pin-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.AudioEngine.playPop();
      if (adminPinInput.value.length < 8) {
        adminPinInput.value += btn.dataset.key;
      }
    });
  });

  btnPinClear.addEventListener('click', () => {
    window.AudioEngine.playPop();
    adminPinInput.value = '';
  });

  btnPinBackspace.addEventListener('click', () => {
    window.AudioEngine.playPop();
    adminPinInput.value = adminPinInput.value.slice(0, -1);
  });

  btnPinSubmit.addEventListener('click', () => {
    verifyAdminPin();
  });

  function verifyAdminPin() {
    const pin = adminPinInput.value.trim();
    if (pin === ADMIN_PIN_CODE) {
      window.AudioEngine.playChimeSuccess();
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      adminPinModal.close();
      showAdminPanel();
      showToast("Xush kelibsiz! Admin paneli ochildi 🔓");
    } else {
      window.AudioEngine.playWarning();
      pinDialogBody.classList.remove('pin-shake');
      void pinDialogBody.offsetWidth; // Trigger reflow
      pinDialogBody.classList.add('pin-shake');
      adminPinInput.value = '';
      showToast("Noto'g'ri PIN-kod! Kirish rad etildi.", "error");
    }
  }

  btnClosePinModal.addEventListener('click', () => {
    adminPinModal.close();
  });

  /* -------------------------------------------------------------
     5. Customer Portal — 5-Digit ID Lookup
  ------------------------------------------------------------- */
  formCustPortalSearch.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawId = custPortalIdInput.value.trim().replace(/[^0-9]/g, '');

    if (!rawId || rawId.length < 4 || rawId.length > 6) {
      window.AudioEngine.playWarning();
      alert("Iltimos, do'konchi bergan 5 xonali ID raqamingizni to'liq kiriting!");
      return;
    }

    let customer = window.Store.getCustomerById5(rawId);

    // If not in local memory, check server API
    if (!customer) {
      try {
        const res = await fetch(`/api/customer/${rawId}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.customer) {
            customer = json.customer;
            window.Store.data.customers.push(customer);
            window.Store.save();
          }
        }
      } catch (err) {
        // silent
      }
    }

    if (customer) {
      window.AudioEngine.playChimeSuccess();
      renderCustomerPortalResult(customer);
    } else {
      window.AudioEngine.playWarning();
      portalCustEmptyState.style.display = 'none';
      portalCustResultState.style.display = 'none';
      portalCustNotFoundState.style.display = 'flex';
      portalCustNotFoundMsg.textContent = `Bunday ID (#${rawId}) bo'yicha mijoz topilmadi. Iltimos, raqamni tekshirib qaytadan kiriting.`;
    }
  });

  function renderCustomerPortalResult(customer) {
    portalCustEmptyState.style.display = 'none';
    portalCustNotFoundState.style.display = 'none';
    portalCustResultState.style.display = 'flex';

    // Render Avatar / Photo
    custPortalAvatarContainer.innerHTML = '';
    if (customer.photo) {
      custPortalAvatarContainer.innerHTML = `<img src="${customer.photo}" class="customer-avatar-large-photo" alt="${customer.name}">`;
    } else {
      const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      custPortalAvatarContainer.innerHTML = `<div class="customer-avatar" style="width: 64px; height: 64px; font-size: 24px; border-radius: 50%;">${initials}</div>`;
    }

    custPortalName.textContent = customer.name;
    custPortalIdBadge.textContent = `#${customer.id5}`;
    custPortalPhone.textContent = customer.phone || "Telefon kiritilmagan";

    const totalDebt = window.Store.getCustomerTotalDebt(customer);
    const totalPaid = window.Store.getCustomerTotalPaid(customer);
    const balance = window.Store.getCustomerBalance(customer);

    custPortalTotalDebt.textContent = totalDebt.toLocaleString('uz-UZ');
    custPortalTotalPaid.textContent = totalPaid.toLocaleString('uz-UZ');
    custPortalBalance.textContent = balance.toLocaleString('uz-UZ');

    if (balance > 0) {
      custPortalStatusBadge.className = 'debt-badge unpaid';
      custPortalStatusBadge.textContent = 'Qarzdor';
    } else {
      custPortalStatusBadge.className = 'debt-badge settled';
      custPortalStatusBadge.textContent = "To'liq to'langan";
    }

    // Render Timeline of transactions
    custPortalTimeline.innerHTML = '';
    if (!customer.transactions || customer.transactions.length === 0) {
      custPortalTimeline.innerHTML = `
        <p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
          Hozircha hech qanday nasiya yoki to'lov yozilmagan.
        </p>
      `;
    } else {
      customer.transactions.forEach(tx => {
        const item = document.createElement('div');
        const isDebt = tx.type === 'DEBT';
        item.className = `ledger-item ${isDebt ? 'debt-item' : 'paid-item'}`;
        const dateObj = new Date(tx.date);
        const formattedDate = `${dateObj.toLocaleDateString('uz-UZ')} ${dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;

        item.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 14px;">${tx.description || (isDebt ? 'Nasiya savdo' : "To'lov")}</strong>
              ${isDebt ? (tx.isPaid ? '<span class="tx-status-badge paid">🟢 To\'landi</span>' : '<span class="tx-status-badge unpaid">🔴 Nasiya</span>') : '<span class="tx-status-badge paid">🟢 Kirim</span>'}
            </div>
            <span class="ledger-date">${formattedDate}</span>
          </div>
          <span class="ledger-amount ${isDebt ? 'debt' : 'paid'}">
            ${isDebt ? '+' : '-'}${Number(tx.amount).toLocaleString('uz-UZ')} so'm
          </span>
        `;
        custPortalTimeline.appendChild(item);
      });
    }

    // Contact store button
    btnCustPortalContactShop.onclick = () => {
      const merchant = window.Store.getMerchant();
      if (merchant.phone) {
        window.location.href = `tel:${merchant.phone.replace(/[^0-9+]/g, '')}`;
      } else {
        alert(`Do'kon: ${merchant.shopName || "Savdogar Daftari"}`);
      }
    };

    // Deep link to @qarzingnikor_bot with customer's 5-digit ID
    const btnCustPortalTelegramChat = document.getElementById('btnCustPortalTelegramChat');
    if (btnCustPortalTelegramChat) {
      btnCustPortalTelegramChat.href = `https://t.me/qarzingnikor_bot?start=${customer.id5}`;
    }
  }

  function resetCustomerPortal() {
    custPortalIdInput.value = '';
    portalCustEmptyState.style.display = 'flex';
    portalCustResultState.style.display = 'none';
    portalCustNotFoundState.style.display = 'none';
  }

  btnCustPortalReset.addEventListener('click', () => {
    window.AudioEngine.playPop();
    resetCustomerPortal();
  });

  btnCustPortalPrint.addEventListener('click', () => {
    window.AudioEngine.playPop();
    window.print();
  });

  /* -------------------------------------------------------------
     6. Camera & Snapshot Capture (Webcam & File Upload)
  ------------------------------------------------------------- */
  async function openCamera(target = 'newCustomer') {
    cameraTarget = target;
    cameraCapturedImg.style.display = 'none';
    cameraVideo.style.display = 'block';
    cameraGuideRing.style.display = 'block';
    btnSnapPhoto.style.display = 'inline-flex';
    btnRetakePhoto.style.display = 'none';
    btnSavePhoto.style.display = 'none';
    cameraStatusMsg.textContent = "Kameraga qarang va yuzingizni aylanaga to'g'irlang";

    cameraModal.showModal();

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
          audio: false
        });
        cameraVideo.srcObject = cameraStream;
      } else {
        cameraStatusMsg.textContent = "Kameraga ulanib bo'lmadi. Fayldan rasm yuklashingiz mumkin.";
      }
    } catch (err) {
      console.warn("Camera error:", err);
      cameraStatusMsg.textContent = "Kameraga ruxsat berilmadi. Fayl tanlash orqali yuklang.";
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  btnSnapPhoto.addEventListener('click', () => {
    window.AudioEngine.playPop();
    const width = 320;
    const height = 320;
    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, width, height);

    capturedPhotoBase64 = cameraCanvas.toDataURL('image/jpeg', 0.85);

    cameraCapturedImg.src = capturedPhotoBase64;
    cameraCapturedImg.style.display = 'block';
    cameraVideo.style.display = 'none';
    cameraGuideRing.style.display = 'none';

    btnSnapPhoto.style.display = 'none';
    btnRetakePhoto.style.display = 'inline-flex';
    btnSavePhoto.style.display = 'inline-flex';
    cameraStatusMsg.textContent = "Surat tayyor! 'Saqlash' tugmasini bosing yoki qaytadan oling.";
  });

  btnRetakePhoto.addEventListener('click', () => {
    window.AudioEngine.playPop();
    cameraCapturedImg.style.display = 'none';
    cameraVideo.style.display = 'block';
    cameraGuideRing.style.display = 'block';
    btnSnapPhoto.style.display = 'inline-flex';
    btnRetakePhoto.style.display = 'none';
    btnSavePhoto.style.display = 'none';
    cameraStatusMsg.textContent = "Kameraga qarang va suratga tushiring";
  });

  btnSavePhoto.addEventListener('click', () => {
    window.AudioEngine.playChimeSuccess();
    stopCamera();
    cameraModal.close();

    if (cameraTarget === 'newCustomer') {
      newCustPhotoData.value = capturedPhotoBase64;
      newCustPhotoThumb.innerHTML = `<img src="${capturedPhotoBase64}">`;
      btnRemoveNewCustPhoto.style.display = 'flex';
      showToast("Mijoz surati olindi! 📸");
    } else if (cameraTarget === 'drawerCustomer' && selectedCustomerId) {
      window.Store.updateCustomer(selectedCustomerId, { photo: capturedPhotoBase64 });
      openCustomerDrawer(selectedCustomerId);
      renderCustomerList();
      showToast("Mijoz surati muvaffaqiyatli yangilandi! 📸");
    }
  });

  btnCloseCameraModal.addEventListener('click', () => {
    stopCamera();
    cameraModal.close();
  });

  btnOpenAddCustCamera.addEventListener('click', () => {
    openCamera('newCustomer');
  });

  btnDrawerUpdatePhoto.addEventListener('click', () => {
    openCamera('drawerCustomer');
  });

  // Photo upload from file picker fallback
  newCustPhotoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 320, 320);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);

        newCustPhotoData.value = compressed;
        newCustPhotoThumb.innerHTML = `<img src="${compressed}">`;
        btnRemoveNewCustPhoto.style.display = 'flex';
        showToast("Rasm yuklandi! 📸");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  btnRemoveNewCustPhoto.addEventListener('click', () => {
    newCustPhotoData.value = '';
    newCustPhotoThumb.innerHTML = '<span>👤</span>';
    btnRemoveNewCustPhoto.style.display = 'none';
  });

  /* -------------------------------------------------------------
     7. Admin Navigation & Tab Switcher
  ------------------------------------------------------------- */
  function switchTab(tabId) {
    window.AudioEngine.playPop();
    activeTabElements.forEach(el => {
      if (el.dataset.tab === tabId) el.classList.add('active');
      else el.classList.remove('active');
    });

    viewSections.forEach(section => {
      if (section.id === `view-${tabId}`) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });

    if (tabId === 'analytics') {
      renderCharts();
    }
    if (tabId === 'messages') {
      renderTelegramMessages();
    }
  }

  activeTabElements.forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.tab) switchTab(el.dataset.tab);
    });
  });

  /* -------------------------------------------------------------
     8. Render Admin Dashboard & Customer Cards
  ------------------------------------------------------------- */
  function updateMetrics() {
    const metrics = window.Store.getMetrics();
    elTotalDebt.textContent = metrics.totalDebt.toLocaleString('uz-UZ');
    elTodayDebt.textContent = metrics.todayDebt.toLocaleString('uz-UZ');
    elTodayPaid.textContent = metrics.todayPaid.toLocaleString('uz-UZ');
    elDebtorsCount.textContent = metrics.activeDebtorsCount;
    
    const customerBadge = document.getElementById('tabCustomerBadge');
    if (customerBadge) customerBadge.textContent = metrics.totalCustomers;
  }

  function renderCustomerList() {
    const customers = window.Store.getCustomers();
    customerListContainer.innerHTML = '';

    const q = searchQuery.toLowerCase().trim();
    let filtered = customers.filter(c => {
      const matchSearch = !q || 
                          c.name.toLowerCase().includes(q) ||
                          (c.phone && c.phone.includes(q)) ||
                          (c.id5 && (c.id5.includes(q) || ('#' + c.id5).includes(q)));
      if (!matchSearch) return false;

      const balance = window.Store.getCustomerBalance(c);
      if (currentFilter === 'debtors') return balance > 0;
      if (currentFilter === 'settled') return balance === 0;
      return true;
    });

    if (currentFilter === 'top_debt') {
      filtered.sort((a, b) => window.Store.getCustomerBalance(b) - window.Store.getCustomerBalance(a));
    }

    if (filtered.length === 0) {
      customerListContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📖</div>
          <h3>Daftaringiz bo'sh</h3>
          <p style="color: var(--text-muted); font-size: 14px; max-width: 420px;">
            Hozircha hech qanday qarzlar yo'q. Birinchi mijozingizni qo'shing yoki mikrofon orqali yozing!
          </p>
          <div style="display:flex; gap: 10px; margin-top: 6px;">
            <button class="btn btn-primary" id="btnEmptyAdd">
              ➕ Yangi Mijoz Qo'shish
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('btnOpenVoice').click()">
              🎙️ Ovoz orqali yozish
            </button>
          </div>
        </div>
      `;
      const btnEmptyAdd = document.getElementById('btnEmptyAdd');
      if (btnEmptyAdd) {
        btnEmptyAdd.addEventListener('click', () => addCustomerModal.showModal());
      }
      return;
    }

    filtered.forEach(customer => {
      const totalDebt = window.Store.getCustomerTotalDebt(customer);
      const totalPaid = window.Store.getCustomerTotalPaid(customer);
      const balance = window.Store.getCustomerBalance(customer);
      const hasDebt = balance > 0;
      const isSettled = balance === 0;

      const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      let lastActivityText = "Hali amal yo'q";
      if (customer.transactions && customer.transactions.length > 0) {
        const lastTx = customer.transactions[0];
        const dateObj = new Date(lastTx.date);
        lastActivityText = `${dateObj.toLocaleDateString('uz-UZ')} ${dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
      }

      const card = document.createElement('div');
      card.className = 'customer-card';
      card.innerHTML = `
        <div class="customer-card-header">
          <div class="customer-avatar-group">
            ${customer.photo ? 
              `<img src="${customer.photo}" class="customer-avatar-photo" alt="${customer.name}">` : 
              `<div class="customer-avatar ${hasDebt ? 'has-debt' : (isSettled ? 'paid' : '')}">${initials}</div>`
            }
            <div class="customer-info">
              <div style="display:flex; align-items:center; gap: 6px;">
                <span class="badge-id">#${customer.id5 || '10001'}</span>
                <h3>${customer.name}</h3>
              </div>
              <div class="customer-phone">${customer.phone || "Telefon kiritilmagan"}</div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap: 8px;">
            <div class="debt-badge ${hasDebt ? 'unpaid' : 'settled'}">
              ${hasDebt ? `${balance.toLocaleString('uz-UZ')} so'm` : 'Qarzi yo\'q'}
            </div>
            <button class="btn-close btn-delete-customer-card" data-id="${customer.id}" title="Mijozni daftardan o'chirish" style="width: 28px; height: 28px; font-size: 13px;">
              🗑️
            </button>
          </div>
        </div>

        <!-- 3-Column Financial Stats -->
        <div class="customer-card-stats">
          <div class="customer-stat-col">
            <span>🔴 Nasiya:</span>
            <strong class="stat-val-debt">${totalDebt.toLocaleString('uz-UZ')}</strong>
          </div>
          <div class="customer-stat-col">
            <span>🟢 To'landi:</span>
            <strong class="stat-val-paid">${totalPaid.toLocaleString('uz-UZ')}</strong>
          </div>
          <div class="customer-stat-col">
            <span>⚖️ Qoldiq:</span>
            <strong class="stat-val-bal">${balance.toLocaleString('uz-UZ')}</strong>
          </div>
        </div>

        <div class="customer-card-meta">
          <span>Oxirgi harakat:</span>
          <strong>${lastActivityText}</strong>
        </div>

        <div class="customer-card-actions">
          <button class="btn-card-action action-nasiya" data-id="${customer.id}" title="Nasiya yozish">
            🔴 + Nasiya
          </button>
          <button class="btn-card-action action-pay" data-id="${customer.id}" title="To'lov qabul qilish">
            🟢 - To'lov
          </button>
          ${hasDebt ? `
          <button class="btn-card-action action-quick-settle" data-id="${customer.id}" title="Qarzni to'liq to'landi deb yozish" style="grid-column: 1 / -1; background: var(--color-paid-light); color: var(--color-paid); border-color: var(--color-primary-border);">
            💵 Qarzni "To'liq to'landi" deb yozish
          </button>
          ` : ''}
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.customer-card-actions') || e.target.closest('.btn-delete-customer-card')) return;
        openCustomerDrawer(customer.id);
      });

      card.querySelector('.action-nasiya').addEventListener('click', (e) => {
        e.stopPropagation();
        openManualTxModal(customer.id, 'DEBT');
      });

      card.querySelector('.action-pay').addEventListener('click', (e) => {
        e.stopPropagation();
        openManualTxModal(customer.id, 'PAYMENT');
      });

      const btnDelCard = card.querySelector('.btn-delete-customer-card');
      if (btnDelCard) {
        btnDelCard.addEventListener('click', (e) => {
          e.stopPropagation();
          confirmAndDeleteCustomer(customer.id);
        });
      }

      const btnQuickSettle = card.querySelector('.action-quick-settle');
      if (btnQuickSettle) {
        btnQuickSettle.addEventListener('click', (e) => {
          e.stopPropagation();
          const res = window.Store.settleFullCustomerDebt(customer.id);
          if (res) {
            window.AudioEngine.playCashPaid();
            showToast(`${customer.name}: Qarz to'liq to'landi deb yozildi! 💵`);
            updateMetrics();
            renderCustomerList();
          }
        });
      }

      customerListContainer.appendChild(card);
    });
  }

  /* -------------------------------------------------------------
     9. Customer Drawer / Ledger Sheet
  ------------------------------------------------------------- */
  function openCustomerDrawer(customerId) {
    const customer = window.Store.getCustomer(customerId);
    if (!customer) return;

    selectedCustomerId = customerId;
    sheetCustName.textContent = customer.name;
    sheetCustId5.textContent = '#' + (customer.id5 || '10001');
    sheetCustPhone.textContent = customer.phone || "Telefon raqami mavjud emas";

    // Avatar in Drawer
    sheetCustAvatarContainer.innerHTML = '';
    if (customer.photo) {
      sheetCustAvatarContainer.innerHTML = `<img src="${customer.photo}" class="customer-avatar-photo" style="width: 50px; height: 50px;" alt="${customer.name}">`;
    } else {
      const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      sheetCustAvatarContainer.innerHTML = `<div class="customer-avatar" style="width: 50px; height: 50px; font-size: 18px;">${initials}</div>`;
    }

    const totalDebt = window.Store.getCustomerTotalDebt(customer);
    const totalPaid = window.Store.getCustomerTotalPaid(customer);
    const balance = window.Store.getCustomerBalance(customer);

    sheetCustTotalDebt.textContent = totalDebt.toLocaleString('uz-UZ') + " so'm";
    sheetCustTotalPaid.textContent = totalPaid.toLocaleString('uz-UZ') + " so'm";
    sheetCustBalance.textContent = balance.toLocaleString('uz-UZ') + " so'm";

    if (balance <= 0) {
      btnSheetSettleFull.style.display = 'none';
    } else {
      btnSheetSettleFull.style.display = 'block';
    }

    // Render Ledger Timeline
    ledgerTimeline.innerHTML = '';
    if (!customer.transactions || customer.transactions.length === 0) {
      ledgerTimeline.innerHTML = `
        <p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
          Bu mijoz uchun hali hech qanday nasiya yoki to'lov yozilmagan.
        </p>
      `;
    } else {
      customer.transactions.forEach(tx => {
        const item = document.createElement('div');
        const isDebt = tx.type === 'DEBT';
        item.className = `ledger-item ${isDebt ? 'debt-item' : 'paid-item'}`;
        const dateObj = new Date(tx.date);
        const formattedDate = `${dateObj.toLocaleDateString('uz-UZ')} ${dateObj.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;

        item.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
            <div style="display:flex; align-items:center; gap: 8px;">
              <span class="ledger-desc">${tx.description || (isDebt ? 'Nasiya berildi' : "To'lov qaytdi")}</span>
              ${isDebt ? (tx.isPaid ? '<span class="tx-status-badge paid">🟢 To\'landi</span>' : '<span class="tx-status-badge unpaid">🔴 Nasiya</span>') : '<span class="tx-status-badge paid">🟢 Kirim</span>'}
            </div>
            <span class="ledger-date">${formattedDate}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${isDebt && !tx.isPaid ? `
            <button class="btn-mark-paid" data-txid="${tx.id}" title="Ushbu nasiyani to'landi deb yozish">
              💵 To'landi
            </button>
            ` : ''}
            <span class="ledger-amount ${isDebt ? 'debt' : 'paid'}">
              ${isDebt ? '+' : '-'}${Number(tx.amount).toLocaleString('uz-UZ')} so'm
            </span>
            <button class="btn-close btn-delete-tx" data-txid="${tx.id}" style="width: 24px; height: 24px; font-size: 11px;" title="Amalni o'chirish">
              ✕
            </button>
          </div>
        `;

        const btnMarkPaid = item.querySelector('.btn-mark-paid');
        if (btnMarkPaid) {
          btnMarkPaid.addEventListener('click', () => {
            const res = window.Store.markDebtAsPaid(customer.id, tx.id);
            if (res) {
              window.AudioEngine.playCashPaid();
              showToast("Nasiya to'landi deb belgilandi va kassaga yozildi! 💵");
              openCustomerDrawer(customer.id);
              updateMetrics();
              renderCustomerList();
            }
          });
        }

        item.querySelector('.btn-delete-tx').addEventListener('click', () => {
          if (confirm("Haqiqatan ham bu yozuvni daftardan o'chirmoqchimisiz?")) {
            window.Store.deleteTransaction(customer.id, tx.id);
            window.AudioEngine.playWarning();
            showToast("Yozuv o'chirildi");
            openCustomerDrawer(customer.id);
            updateMetrics();
            renderCustomerList();
          }
        });

        ledgerTimeline.appendChild(item);
      });
    }

    updateReminderPreview();

    customerSheetOverlay.classList.add('active');
    customerSheet.classList.add('active');
    window.AudioEngine.playPop();
  }

  function closeCustomerDrawer() {
    customerSheetOverlay.classList.remove('active');
    customerSheet.classList.remove('active');
    selectedCustomerId = null;
  }

  customerSheetOverlay.addEventListener('click', closeCustomerDrawer);
  btnCloseSheet.addEventListener('click', closeCustomerDrawer);

  btnSheetSettleFull.addEventListener('click', () => {
    if (!selectedCustomerId) return;
    const res = window.Store.settleFullCustomerDebt(selectedCustomerId);
    if (res) {
      window.AudioEngine.playCashPaid();
      showToast("Barcha qarz to'liq to'landi deb yozildi! 💵");
      openCustomerDrawer(selectedCustomerId);
      updateMetrics();
      renderCustomerList();
    }
  });

  // Delete Customer Logic
  function confirmAndDeleteCustomer(customerId, fromDrawer = false) {
    const customer = window.Store.getCustomer(customerId);
    if (!customer) return;

    const balance = window.Store.getCustomerBalance(customer);
    let confirmMsg = `"${customer.name}" (#${customer.id5}) mijozini daftardan butunlay o'chirmoqchimisiz?`;
    if (balance > 0) {
      confirmMsg = `⚠️ DIQQAT!\n"${customer.name}" mijozida hali ${balance.toLocaleString('uz-UZ')} so'm qoldiq qarz bor.\n\nBaribir ushbu mijozni va uning barcha hisob-kitob tarixini daftardan o'chirmoqchimisiz?`;
    }

    if (confirm(confirmMsg)) {
      window.Store.deleteCustomer(customerId);
      window.AudioEngine.playWarning();
      showToast(`"${customer.name}" daftardan o'chirildi`);
      if (fromDrawer || selectedCustomerId === customerId) {
        closeCustomerDrawer();
      }
      updateMetrics();
      renderCustomerList();
    }
  }

  if (btnDeleteCustomer) {
    btnDeleteCustomer.addEventListener('click', () => {
      if (selectedCustomerId) {
        confirmAndDeleteCustomer(selectedCustomerId, true);
      }
    });
  }

  // Reminder tabs
  reminderTabChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.AudioEngine.playPop();
      reminderTabChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeReminderType = chip.dataset.type;
      updateReminderPreview();
    });
  });

  function updateReminderPreview() {
    if (!selectedCustomerId) return;
    const customer = window.Store.getCustomer(selectedCustomerId);
    if (!customer) return;

    const text = window.ExportManager.getReminderText(activeReminderType, customer);
    reminderTextPreview.textContent = text;
  }

  btnReminderTelegram.addEventListener('click', () => {
    if (!selectedCustomerId) return;
    const customer = window.Store.getCustomer(selectedCustomerId);
    const text = reminderTextPreview.textContent;
    window.ExportManager.shareViaTelegram(customer.phone, text);
    showToast("Telegram ochilmoqda...");
  });

  btnReminderSMS.addEventListener('click', () => {
    if (!selectedCustomerId) return;
    const customer = window.Store.getCustomer(selectedCustomerId);
    const text = reminderTextPreview.textContent;
    window.ExportManager.shareViaSMS(customer.phone, text);
  });

  btnReminderCopy.addEventListener('click', async () => {
    const text = reminderTextPreview.textContent;
    const copied = await window.ExportManager.copyText(text);
    if (copied) {
      window.AudioEngine.playChimeSuccess();
      showToast("Eslatma xabari nusxalandi! ✅");
    }
  });

  btnSheetAddNasiya.addEventListener('click', () => {
    if (selectedCustomerId) openManualTxModal(selectedCustomerId, 'DEBT');
  });

  btnSheetAddPayment.addEventListener('click', () => {
    if (selectedCustomerId) openManualTxModal(selectedCustomerId, 'PAYMENT');
  });

  /* -------------------------------------------------------------
     10. Voice Assistant Flow & Confirmation Modal
  ------------------------------------------------------------- */
  function openVoiceModal() {
    voiceTranscriptPreview.textContent = "Mikrofonni bosib gapiring...";
    voiceStatusLabel.textContent = "Ovoz kutilmoqda. Mikrofonni bosing va gapiring:";
    voiceBigMic.classList.remove('recording');
    btnVoiceDone.style.display = 'none';
    voiceModal.showModal();
    window.AudioEngine.startVisualizer(audioVisualizerCanvas);
  }

  [btnOpenVoice, btnVoiceHeroRecord, btnMobileMic].forEach(btn => {
    if (btn) btn.addEventListener('click', openVoiceModal);
  });

  document.getElementById('btnCloseVoiceModal').addEventListener('click', () => {
    window.AudioEngine.stopListening();
    voiceModal.close();
  });

  if (btnLangUz && btnLangRu) {
    btnLangUz.addEventListener('click', () => {
      btnLangUz.classList.add('active');
      btnLangRu.classList.remove('active');
      window.AudioEngine.setLanguage('uz-UZ');
      window.AudioEngine.playPop();
      showToast("Til: O'zbekcha tanlandi");
    });

    btnLangRu.addEventListener('click', () => {
      btnLangRu.classList.add('active');
      btnLangUz.classList.remove('active');
      window.AudioEngine.setLanguage('ru-RU');
      window.AudioEngine.playPop();
      showToast("Язык: Русский выбран");
    });
  }

  voiceBigMic.addEventListener('click', () => {
    if (window.AudioEngine.isRecording) {
      window.AudioEngine.stopListening();
      voiceBigMic.classList.remove('recording');
      btnVoiceDone.style.display = 'none';
      voiceStatusLabel.textContent = "Ovoz yozish to'xtatildi.";
      if (voiceTranscriptPreview.textContent && voiceTranscriptPreview.textContent !== "Mikrofonni bosib gapiring...") {
        handleVoiceParsedResult(voiceTranscriptPreview.textContent);
      }
    } else {
      voiceBigMic.classList.add('recording');
      btnVoiceDone.style.display = 'inline-flex';
      voiceStatusLabel.textContent = "🎙️ Tinglanmoqda... (Gapiring)";
      
      const started = window.AudioEngine.startListening({
        onStart: () => {
          voiceTranscriptPreview.textContent = "Eshitilmoqda... (Gapiring)";
          voiceStatusLabel.textContent = "🎙️ Gapiring, tizim eshitmoqda...";
        },
        onResult: (res) => {
          voiceTranscriptPreview.textContent = res.text;
        },
        onEnd: (finalStr) => {
          voiceBigMic.classList.remove('recording');
          btnVoiceDone.style.display = 'none';
          const captured = (finalStr || voiceTranscriptPreview.textContent || '').trim();
          if (captured && captured !== "Mikrofonni bosib gapiring..." && captured !== "Eshitilmoqda... (Gapiring)") {
            handleVoiceParsedResult(captured);
          }
        },
        onError: (err) => {
          voiceBigMic.classList.remove('recording');
          btnVoiceDone.style.display = 'none';
          voiceStatusLabel.textContent = `⚠️ ${err}`;
          showToast(`Mikrofon: ${err}`, 'error');
        }
      });

      if (!started) {
        voiceBigMic.classList.remove('recording');
        btnVoiceDone.style.display = 'none';
      }
    }
  });

  btnVoiceDone.addEventListener('click', () => {
    window.AudioEngine.stopListening();
    voiceBigMic.classList.remove('recording');
    btnVoiceDone.style.display = 'none';
    if (voiceTranscriptPreview.textContent && voiceTranscriptPreview.textContent !== "Mikrofonni bosib gapiring...") {
      handleVoiceParsedResult(voiceTranscriptPreview.textContent);
    }
  });

  document.querySelectorAll('.voice-test-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const phrase = chip.dataset.phrase;
      voiceTranscriptPreview.textContent = phrase;
      window.AudioEngine.playPop();
      handleVoiceParsedResult(phrase);
    });
  });

  function handleVoiceParsedResult(text) {
    const parsed = window.UzbekParser.parse(text);
    if (!parsed || (!parsed.amount && !parsed.customerName)) {
      showToast("Ovoz tushunarsiz bo'ldi, iltimos qaytadan gapiring", "error");
      return;
    }

    voiceModal.close();
    window.AudioEngine.stopVisualizer();

    confirmCustName.value = parsed.customerName;
    confirmTxType.value = parsed.type;
    confirmAmount.value = parsed.amount || '';
    confirmDesc.value = parsed.description || '';
    confirmAutoMarkPaid.checked = false;

    confirmModal.showModal();
    window.AudioEngine.playPop();
  }

  btnConfirmApprove.addEventListener('click', (e) => {
    e.preventDefault();
    const name = confirmCustName.value.trim();
    const type = confirmTxType.value;
    const amount = Number(confirmAmount.value);
    const desc = confirmDesc.value.trim();
    const autoPaid = confirmAutoMarkPaid.checked;

    if (!name || isNaN(amount) || amount <= 0) {
      window.AudioEngine.playWarning();
      alert("Iltimos, ism va to'g'ri summani kiriting!");
      return;
    }

    const customer = window.Store.findOrCreateCustomerByName(name);

    if (type === 'DEBT' && autoPaid) {
      window.Store.addTransaction(customer.id, 'DEBT', amount, desc, true);
      window.Store.addTransaction(customer.id, 'PAYMENT', amount, `To'landi: ${desc || 'nasiya'}`);
      window.AudioEngine.playCashPaid();
      showToast(`✅ ${customer.name}: +${amount.toLocaleString('uz-UZ')} so'm nasiya yozildi va TO'LANDI deb qayd etildi!`);
    } else {
      window.Store.addTransaction(customer.id, type, amount, desc);
      if (type === 'PAYMENT') {
        window.AudioEngine.playCashPaid();
        showToast(`💵 ${customer.name}: ${amount.toLocaleString('uz-UZ')} so'm to'lov qabul qilindi!`);
      } else {
        window.AudioEngine.playChimeSuccess();
        showToast(`📝 ${customer.name} (#${customer.id5}): +${amount.toLocaleString('uz-UZ')} so'm nasiya yozildi!`);
      }
    }

    confirmModal.close();
    updateMetrics();
    renderCustomerList();
    if (selectedCustomerId === customer.id) {
      openCustomerDrawer(customer.id);
    }
  });

  btnConfirmCancel.addEventListener('click', () => {
    confirmModal.close();
  });

  document.getElementById('btnCloseConfirmModal').addEventListener('click', () => {
    confirmModal.close();
  });

  /* -------------------------------------------------------------
     11. Manual Add Transaction Modal
  ------------------------------------------------------------- */
  function openManualTxModal(customerId, defaultType = 'DEBT') {
    const customer = window.Store.getCustomer(customerId);
    if (!customer) return;

    document.getElementById('manualTxCustId').value = customer.id;
    document.getElementById('manualTxCustName').value = `${customer.name} (#${customer.id5})`;
    document.getElementById('manualTxType').value = defaultType;
    document.getElementById('manualTxAmount').value = '';
    document.getElementById('manualTxDesc').value = '';

    manualTxModal.showModal();
    window.AudioEngine.playPop();
  }

  formManualTx.addEventListener('submit', (e) => {
    e.preventDefault();
    const custId = document.getElementById('manualTxCustId').value;
    const type = document.getElementById('manualTxType').value;
    const amount = Number(document.getElementById('manualTxAmount').value);
    const desc = document.getElementById('manualTxDesc').value;

    if (!amount || amount <= 0) {
      window.AudioEngine.playWarning();
      return;
    }

    window.Store.addTransaction(custId, type, amount, desc);
    manualTxModal.close();

    if (type === 'PAYMENT') {
      window.AudioEngine.playCashPaid();
      showToast("To'lov muvaffaqiyatli qabul qilindi! 💵");
    } else {
      window.AudioEngine.playChimeSuccess();
      showToast("Nasiya daftarga yozildi! ✍️");
    }

    updateMetrics();
    renderCustomerList();
    if (selectedCustomerId === custId) {
      openCustomerDrawer(custId);
    }
  });

  document.getElementById('btnCloseManualTx').addEventListener('click', () => {
    manualTxModal.close();
  });

  /* -------------------------------------------------------------
     12. Add New Customer Modal (with 5-Digit ID and Optional Photo)
  ------------------------------------------------------------- */
  btnAddNewCustomer.addEventListener('click', () => {
    newCustName.value = '';
    newCustPhone.value = '';
    newCustNote.value = '';
    newCustPhotoData.value = '';
    newCustPhotoThumb.innerHTML = '<span>👤</span>';
    btnRemoveNewCustPhoto.style.display = 'none';

    if (newCustId5) {
      newCustId5.value = window.Store.generate5DigitId();
    }
    addCustomerModal.showModal();
    window.AudioEngine.playPop();
  });

  const newCustId5 = document.getElementById('newCustId5');
  const btnGenRandomId = document.getElementById('btnGenRandomId');

  if (btnGenRandomId) {
    btnGenRandomId.addEventListener('click', () => {
      window.AudioEngine.playPop();
      if (newCustId5) newCustId5.value = window.Store.generate5DigitId();
    });
  }

  document.getElementById('btnCloseAddCustModal').addEventListener('click', () => {
    addCustomerModal.close();
  });

  formAddCustomer.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newCustName.value.trim();
    const phone = newCustPhone.value.trim();
    const note = newCustNote.value.trim();
    const photo = newCustPhotoData.value;
    const customId = newCustId5 ? newCustId5.value.trim() : '';

    if (!name) return;

    const newCust = window.Store.addCustomer(name, phone, note, photo, customId);
    addCustomerModal.close();
    window.AudioEngine.playChimeSuccess();
    showToast(`Mijoz qo'shildi: ${newCust.name} (ID: #${newCust.id5}) 👤`);

    updateMetrics();
    renderCustomerList();
  });

  /* -------------------------------------------------------------
     13. Search & Filter Handlers
  ------------------------------------------------------------- */
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCustomerList();
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      window.AudioEngine.playPop();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderCustomerList();
    });
  });

  /* -------------------------------------------------------------
     14. Export & Print Handlers
  ------------------------------------------------------------- */
  document.getElementById('btnExportExcel').addEventListener('click', () => {
    window.AudioEngine.playPop();
    window.ExportManager.exportToCSV();
    showToast("Excel jadvali yuklab olindi! 📊");
  });

  document.getElementById('btnPrintReport').addEventListener('click', () => {
    window.AudioEngine.playPop();
    window.ExportManager.printReport();
  });

  /* -------------------------------------------------------------
     15. Settings & Reset Handlers
  ------------------------------------------------------------- */
  const merchant = window.Store.getMerchant();
  const inputShopName = document.getElementById('settingsShopName');
  const inputOwnerName = document.getElementById('settingsOwnerName');

  if (inputShopName) {
    inputShopName.value = merchant.shopName;
    inputOwnerName.value = merchant.name;
    updateShopNameDisplay();
  }

  document.getElementById('formSettings').addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = window.Store.updateMerchant({
      shopName: inputShopName.value.trim(),
      name: inputOwnerName.value.trim()
    });
    updateShopNameDisplay();
    window.AudioEngine.playChimeSuccess();
    showToast("Do'kon ma'lumotlari saqlandi! 🏪");
  });

  document.getElementById('btnResetData').addEventListener('click', () => {
    if (confirm("Diqqat! Barcha mijozlar va qarzlar o'chirilib, toza boshlang'ich holatga o'tkazilsinmi?")) {
      window.Store.clearAll();
      window.AudioEngine.playWarning();
      showToast("Daftar tozalandi (Bo'sh holat)");
      updateMetrics();
      renderCustomerList();
      resetCustomerPortal();
    }
  });

  /* -------------------------------------------------------------
     16. Analytics SVG Charts Renderer
  ------------------------------------------------------------- */
  function renderCharts() {
    const stats = window.Store.get7DayStats();
    const svgChart = document.getElementById('analyticsSvgChart');
    if (!svgChart) return;

    const maxVal = Math.max(...stats.map(s => Math.max(s.debt, s.paid)), 500000);
    const height = 180;
    const width = 600;
    const barWidth = 18;
    const groupSpacing = width / stats.length;

    let svgInner = '';

    stats.forEach((day, i) => {
      const xGroup = i * groupSpacing + 25;
      
      const debtHeight = (day.debt / maxVal) * (height - 40);
      const yDebt = height - debtHeight - 24;

      const paidHeight = (day.paid / maxVal) * (height - 40);
      const yPaid = height - paidHeight - 24;

      svgInner += `
        <rect x="${xGroup}" y="${yDebt}" width="${barWidth}" height="${debtHeight}" rx="4" fill="#f43f5e" opacity="0.9">
          <title>${day.label}: ${day.debt.toLocaleString('uz-UZ')} so'm nasiya</title>
        </rect>
        <rect x="${xGroup + barWidth + 4}" y="${yPaid}" width="${barWidth}" height="${paidHeight}" rx="4" fill="#10b981" opacity="0.9">
          <title>${day.label}: ${day.paid.toLocaleString('uz-UZ')} so'm to'lov</title>
        </rect>
        <text x="${xGroup + barWidth}" y="${height - 6}" font-size="11" font-family="var(--font-sans)" fill="var(--text-muted)" text-anchor="middle">
          ${day.label}
        </text>
      `;
    });

    svgChart.innerHTML = svgInner;

    const topDebtorsContainer = document.getElementById('analyticsTopDebtors');
    if (topDebtorsContainer) {
      const topList = [...window.Store.getCustomers()]
        .filter(c => window.Store.getCustomerBalance(c) > 0)
        .sort((a, b) => window.Store.getCustomerBalance(b) - window.Store.getCustomerBalance(a))
        .slice(0, 5);

      topDebtorsContainer.innerHTML = '';
      if (topList.length === 0) {
        topDebtorsContainer.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:10px 0;">Hozirda hech kimda qarz yo\'q!</p>';
      } else {
        topList.forEach((c, idx) => {
          const b = window.Store.getCustomerBalance(c);
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);font-size:14px;';
          row.innerHTML = `
            <span><strong>${idx + 1}. ${c.name}</strong> <span class="badge-id">#${c.id5}</span></span>
            <span style="font-family:var(--font-mono);font-weight:700;color:var(--color-debt);">${b.toLocaleString('uz-UZ')} so'm</span>
          `;
          topDebtorsContainer.appendChild(row);
        });
      }
    }
  }

  /* -------------------------------------------------------------
     17. Toast Notification Helper
  ------------------------------------------------------------- */
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '🔔' : '⚠️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* -------------------------------------------------------------
     17.5. Telegram Messages Controller
  ------------------------------------------------------------- */
  const telegramMessagesList = document.getElementById('telegramMessagesList');
  const tabMessagesBadge = document.getElementById('tabMessagesBadge');
  const btnRefreshMessages = document.getElementById('btnRefreshMessages');

  if (btnRefreshMessages) {
    btnRefreshMessages.addEventListener('click', () => {
      window.AudioEngine.playPop();
      renderTelegramMessages();
    });
  }

  async function renderTelegramMessages() {
    if (!telegramMessagesList) return;
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || [];

        // Update badge
        if (tabMessagesBadge) {
          if (msgs.length > 0) {
            tabMessagesBadge.textContent = msgs.length;
            tabMessagesBadge.style.display = 'inline-block';
          } else {
            tabMessagesBadge.style.display = 'none';
          }
        }

        if (msgs.length === 0) {
          telegramMessagesList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: var(--bg-surface-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
              <div style="font-size: 36px; margin-bottom: 8px;">📭</div>
              <strong style="font-size: 15px; color: var(--text-color);">Hozircha yangi xabarlar yo'q</strong>
              <p style="font-size: 13px; margin-top: 4px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                Mijozlaringiz <strong>@qarzingnikor_bot</strong> orqali 5 xonali ID sini kiritib xabar yozganda, barcha murojaatlar bu yerda va sizning Telegramingizda (<strong>@xabarqarz_bot</strong>) paydo bo'ladi.
              </p>
            </div>
          `;
          return;
        }

        let html = '';
        msgs.forEach(m => {
          const d = new Date(m.date);
          const timeStr = `${d.toLocaleDateString('uz-UZ')} ${d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
          const isDelivered = m.delivered !== false;

          html += `
            <div class="metric-card" style="padding: 16px; border-left: 4px solid #229ED9;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong style="font-size: 15px;">${m.customerName || 'Mijoz'}</strong>
                    <span class="badge-id">#${m.customerId5 || '-----'}</span>
                    ${m.customerPhone ? `<span style="font-size: 12px; color: var(--text-muted);">${m.customerPhone}</span>` : ''}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    ⏰ ${timeStr}
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="badge-pro" style="background: ${isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; color: ${isDelivered ? 'var(--color-paid)' : '#f59e0b'}; border: none; font-size: 11px;">
                    ${isDelivered ? '✅ Do\'kondorga yetkazildi' : '⏳ Kutilmoqda'}
                  </span>
                  <a href="https://t.me/xabarqarz_bot" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 11px; padding: 4px 10px; gap: 4px; text-decoration: none;">
                    💬 Javob berish
                  </a>
                </div>
              </div>

              <div style="margin-top: 10px; padding: 12px; background: var(--bg-surface-subtle); border-radius: var(--radius-sm); font-size: 14px; line-height: 1.5; color: var(--text-color); border: 1px solid var(--border-color);">
                "${m.content || 'Xabar matni'}"
              </div>
            </div>
          `;
        });
        telegramMessagesList.innerHTML = html;
      }
    } catch (e) {
      console.warn("Could not fetch messages:", e);
    }
  }

  // Periodic poll for messages
  setInterval(() => {
    if (sessionStorage.getItem(SESSION_AUTH_KEY) === 'true') {
      renderTelegramMessages();
    }
  }, 12000);

  // Global window.App export
  window.App = {
    renderCustomerList,
    renderCharts,
    renderTelegramMessages,
    updateMetrics
  };

  /* -------------------------------------------------------------
     18. App Initialization
  ------------------------------------------------------------- */
  if (window.location.protocol === 'file:') {
    const hint = document.getElementById('fileProtocolHint');
    if (hint) hint.style.display = 'block';
  }

  // Check if admin was already logged in this session
  if (sessionStorage.getItem(SESSION_AUTH_KEY) === 'true') {
    showAdminPanel();
  } else {
    showCustomerPortal();
  }
});
