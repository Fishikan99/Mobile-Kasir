// Initial Products Catalog
let products = [
  { id: 1, name: "Nasi Goreng Spesial", category: "makanan", price: 25000, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80" },
  { id: 2, name: "Ayam Goreng Kremes", category: "makanan", price: 28000, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80" },
  { id: 3, name: "Mie Goreng Jawa", category: "makanan", price: 22000, image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80" },
  { id: 4, name: "Soto Ayam Kampung", category: "makanan", price: 20000, image: "https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=400&q=80" },
  { id: 5, name: "Es Teh Manis", category: "minuman", price: 6000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80" },
  { id: 6, name: "Kopi Susu Gula Aren", category: "minuman", price: 18000, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80" },
  { id: 7, name: "Jus Alpukat", category: "minuman", price: 15000, image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80" },
  { id: 8, name: "French Fries", category: "snack", price: 14000, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80" },
  { id: 9, name: "Pisang Goreng Keju", category: "snack", price: 16000, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80" }
];

let cart = {}; 
let activeCategory = 'all';
let selectedPaymentMethod = 'cash';
let transactionsHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  // Identify if we are on Kasir or Customer display
  if (document.getElementById('product-grid')) {
    initKasir();
  } else if (document.getElementById('display-items')) {
    initCustomerDisplay();
  }
});

function initKasir() {
  updateClock();
  setInterval(updateClock, 1000);
  renderProducts();
  renderTransactions();
  syncToCustomerDisplay();
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  if (document.getElementById('current-time')) {
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
  }
}

function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

// REALTIME SYNC VIA LOCALSTORAGE
function syncToCustomerDisplay() {
  let subtotal = 0;
  const cartItems = [];

  Object.keys(cart).forEach(id => {
    const prod = products.find(p => p.id == id);
    if (prod) {
      const qty = cart[id];
      subtotal += prod.price * qty;
      cartItems.push({ name: prod.name, qty: qty, price: prod.price, image: prod.image });
    }
  });

  const taxEnabled = document.getElementById('toggle-tax')?.checked ?? true;
  const tax = taxEnabled ? subtotal * 0.10 : 0;

  const discountPercent = parseFloat(document.getElementById('discount-select')?.value) || 0;
  const discount = subtotal * (discountPercent / 100);

  const total = subtotal + tax - discount;
  const customerName = document.getElementById('customer-name')?.value || "Umum";
  const cashPaid = parseInt(document.getElementById('cash-received')?.value) || 0;
  const change = cashPaid > 0 ? cashPaid - total : 0;

  const posData = {
    customer: customerName,
    items: cartItems,
    subtotal: subtotal,
    tax: tax,
    discount: discount,
    total: total,
    paid: cashPaid,
    change: change
  };

  localStorage.setItem('POS_LIVE_DATA', JSON.stringify(posData));
}

// CUSTOMER DISPLAY SYNC LISTENER
function initCustomerDisplay() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'POS_LIVE_DATA') {
      renderCustomerDisplay();
    }
  });
  renderCustomerDisplay();
}

function renderCustomerDisplay() {
  const data = JSON.parse(localStorage.getItem('POS_LIVE_DATA')) || {
    customer: 'Umum', items: [], subtotal: 0, tax: 0, discount: 0, total: 0, paid: 0, change: 0
  };

  document.getElementById('display-customer').textContent = `Pelanggan: ${data.customer}`;
  document.getElementById('display-subtotal').textContent = formatIDR(data.subtotal);
  document.getElementById('display-tax').textContent = formatIDR(data.tax);
  document.getElementById('display-discount').textContent = `- ${formatIDR(data.discount)}`;
  document.getElementById('display-total').textContent = formatIDR(data.total);

  const cashInfoGroup = document.getElementById('display-cash-info');
  if (data.paid > 0) {
    cashInfoGroup.classList.remove('hidden');
    document.getElementById('display-paid').textContent = formatIDR(data.paid);
    document.getElementById('display-change').textContent = formatIDR(data.change >= 0 ? data.change : 0);
  } else {
    cashInfoGroup.classList.add('hidden');
  }

  const container = document.getElementById('display-items');
  container.innerHTML = '';

  if (data.items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-20 text-stone-400">
        <i class="fa-solid fa-basket-shopping text-4xl mb-3 block"></i>
        <p class="text-sm font-semibold">Belum ada item pesanan.</p>
      </div>`;
    return;
  }

  data.items.forEach(item => {
    const row = document.createElement('div');
    row.className = "flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-100 shadow-sm";
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" class="w-12 h-12 rounded-xl object-cover" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'">
        <div>
          <h3 class="font-bold text-xs text-stone-800">${item.name}</h3>
          <p class="text-[11px] text-stone-400">${formatIDR(item.price)} x ${item.qty}</p>
        </div>
      </div>
      <span class="font-extrabold text-sm text-stone-900">${formatIDR(item.price * item.qty)}</span>
    `;
    container.appendChild(row);
  });
}

// KASIR FUNCTIONS
function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.remove('bg-brand-500', 'text-white', 'shadow-sm', 'shadow-brand-500/20');
    btn.classList.add('bg-white', 'text-stone-600');
  });

  const activeBtn = document.getElementById(`cat-${cat}`);
  if(activeBtn) {
    activeBtn.classList.remove('bg-white', 'text-stone-600');
    activeBtn.classList.add('bg-brand-500', 'text-white', 'shadow-sm', 'shadow-brand-500/20');
  }
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if(!grid) return;

  const searchVal = document.getElementById('search-input')?.value.toLowerCase() || '';
  grid.innerHTML = '';

  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchVal);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-2 py-8 text-center text-xs text-stone-400">Tidak ada menu ditemukan.</div>`;
    return;
  }

  filtered.forEach(product => {
    const qty = cart[product.id] || 0;
    const card = document.createElement('div');
    card.className = "bg-white p-2.5 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group";
    
    card.innerHTML = `
      <div>
        <div class="relative h-24 w-full rounded-xl overflow-hidden bg-stone-100 mb-2">
          <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'">
          ${qty > 0 ? `<div class="absolute top-1.5 right-1.5 bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-sm"><i class="fa-solid fa-check"></i></div>` : ''}
        </div>
        <h3 class="font-bold text-xs text-stone-800 line-clamp-1">${product.name}</h3>
        <p class="text-xs font-extrabold text-brand-600 mt-0.5">${formatIDR(product.price)}</p>
      </div>

      <div class="mt-2 pt-2 border-t border-stone-50 flex items-center justify-between">
        ${qty === 0 ? `
          <button onclick="addToCart(${product.id})" class="w-full bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors">
            <i class="fa-solid fa-plus text-[10px]"></i> Tambah
          </button>
        ` : `
          <div class="flex items-center justify-between w-full bg-stone-50 rounded-xl p-1">
            <button onclick="removeFromCart(${product.id})" class="w-6 h-6 bg-white shadow-sm rounded-lg flex items-center justify-center text-stone-700 active:scale-95 text-xs font-bold">-</button>
            <span class="text-xs font-extrabold text-stone-800 px-2">${qty}</span>
            <button onclick="addToCart(${product.id})" class="w-6 h-6 bg-brand-500 text-white shadow-sm rounded-lg flex items-center justify-center active:scale-95 text-xs font-bold">+</button>
          </div>
        `}
      </div>
    `;
    grid.appendChild(card);
  });

  updateCartSummary();
}

function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  renderProducts();
  syncToCustomerDisplay();
}

function removeFromCart(productId) {
  if (cart[productId]) {
    cart[productId]--;
    if (cart[productId] <= 0) delete cart[productId];
  }
  renderProducts();
  syncToCustomerDisplay();
}

function updateCartSummary() {
  const bar = document.getElementById('floating-cart-bar');
  if(!bar) return;

  let totalQty = 0;
  let totalPrice = 0;

  Object.keys(cart).forEach(id => {
    const qty = cart[id];
    const prod = products.find(p => p.id == id);
    if (prod) {
      totalQty += qty;
      totalPrice += prod.price * qty;
    }
  });

  document.getElementById('cart-badge-count').textContent = totalQty;
  document.getElementById('cart-summary-qty').textContent = `${totalQty} Item Terpilih`;
  document.getElementById('cart-summary-total').textContent = formatIDR(totalPrice);

  if (totalQty > 0) bar.classList.remove('translate-y-32');
  else bar.classList.add('translate-y-32');
}

function switchScreen(screenName) {
  document.getElementById('screen-catalog').classList.add('hidden');
  document.getElementById('screen-checkout').classList.add('hidden');
  document.getElementById('screen-transactions').classList.add('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-brand-500');
    btn.classList.add('text-stone-400');
  });

  if (screenName === 'catalog') {
    document.getElementById('screen-catalog').classList.remove('hidden');
    document.getElementById('nav-catalog').classList.add('text-brand-500');
  } else if (screenName === 'checkout') {
    document.getElementById('screen-checkout').classList.remove('hidden');
  } else if (screenName === 'transactions') {
    document.getElementById('screen-transactions').classList.remove('hidden');
    document.getElementById('nav-transactions').classList.add('text-brand-500');
  }
}

function goToConfirmSale() {
  if (Object.keys(cart).length === 0) return;

  const randomInv = "INV-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  document.getElementById('invoice-number').value = randomInv;
  document.getElementById('invoice-date').textContent = dateStr;

  const container = document.getElementById('checkout-items-list');
  container.innerHTML = '';
  let itemCount = 0;

  Object.keys(cart).forEach(id => {
    const qty = cart[id];
    const prod = products.find(p => p.id == id);
    if (prod) {
      itemCount += qty;
      const itemRow = document.createElement('div');
      itemRow.className = "flex items-center justify-between pt-2.5 first:pt-0";
      itemRow.innerHTML = `
        <div>
          <p class="text-xs font-bold text-stone-800">${prod.name}</p>
          <p class="text-[10px] text-stone-400">${formatIDR(prod.price)} x ${qty}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold text-stone-900">${formatIDR(prod.price * qty)}</span>
          <div class="flex items-center bg-stone-100 rounded-lg p-0.5">
            <button onclick="removeFromCart(${prod.id}); goToConfirmSale();" class="w-5 h-5 bg-white text-stone-700 rounded text-[10px] font-bold shadow-sm">-</button>
            <span class="px-1.5 text-[11px] font-bold">${qty}</span>
            <button onclick="addToCart(${prod.id}); goToConfirmSale();" class="w-5 h-5 bg-brand-500 text-white rounded text-[10px] font-bold shadow-sm">+</button>
          </div>
        </div>
      `;
      container.appendChild(itemRow);
    }
  });

  document.getElementById('checkout-item-count').textContent = `(${itemCount})`;
  calculateTotals();
  switchScreen('checkout');
}

function calculateTotals() {
  let subtotal = 0;
  Object.keys(cart).forEach(id => {
    const prod = products.find(p => p.id == id);
    if (prod) subtotal += prod.price * cart[id];
  });

  const taxEnabled = document.getElementById('toggle-tax').checked;
  const tax = taxEnabled ? subtotal * 0.10 : 0;

  const discountPercent = parseFloat(document.getElementById('discount-select').value) || 0;
  const discount = subtotal * (discountPercent / 100);

  const grandTotal = subtotal + tax - discount;

  document.getElementById('summary-subtotal').textContent = formatIDR(subtotal);
  document.getElementById('summary-tax').textContent = formatIDR(tax);
  document.getElementById('summary-discount').textContent = `- ${formatIDR(discount)}`;
  document.getElementById('summary-grandtotal').textContent = formatIDR(grandTotal);

  calculateChange();
  syncToCustomerDisplay();
}

function setPaymentMethod(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.classList.remove('bg-brand-50', 'text-brand-600', 'border-brand-500');
    btn.classList.add('bg-stone-50', 'text-stone-600', 'border-stone-200');
  });

  const activeBtn = document.getElementById(`pay-${method}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-stone-50', 'text-stone-600', 'border-stone-200');
    activeBtn.classList.add('bg-brand-50', 'text-brand-600', 'border-brand-500');
  }

  const cashGroup = document.getElementById('cash-input-group');
  if (method === 'cash') cashGroup.classList.remove('hidden');
  else cashGroup.classList.add('hidden');
}

function calculateChange() {
  const grandTotalText = document.getElementById('summary-grandtotal').textContent;
  const grandTotal = parseInt(grandTotalText.replace(/[^0-9]/g, '')) || 0;
  const cashVal = parseInt(document.getElementById('cash-received').value) || 0;

  const change = cashVal - grandTotal;
  const changeEl = document.getElementById('cash-change');

  if (change >= 0) {
    changeEl.textContent = formatIDR(change);
    changeEl.classList.remove('text-red-500');
    changeEl.classList.add('text-stone-900');
  } else {
    changeEl.textContent = "Kurang " + formatIDR(Math.abs(change));
    changeEl.classList.remove('text-stone-900');
    changeEl.classList.add('text-red-500');
  }
  syncToCustomerDisplay();
}

function processTransaction() {
  if (Object.keys(cart).length === 0) return;

  const invId = document.getElementById('invoice-number').value;
  const invDate = document.getElementById('invoice-date').textContent + " • " + (document.getElementById('current-time')?.textContent || '');
  const customer = document.getElementById('customer-name').value || "Umum";

  let subtotal = 0;
  const itemsList = [];

  Object.keys(cart).forEach(id => {
    const prod = products.find(p => p.id == id);
    if (prod) {
      const qty = cart[id];
      subtotal += prod.price * qty;
      itemsList.push({ ...prod, qty });
    }
  });

  const taxEnabled = document.getElementById('toggle-tax').checked;
  const tax = taxEnabled ? subtotal * 0.10 : 0;

  const discountPercent = parseFloat(document.getElementById('discount-select').value) || 0;
  const discount = subtotal * (discountPercent / 100);

  const total = subtotal + tax - discount;
  const cashPaid = selectedPaymentMethod === 'cash' ? (parseInt(document.getElementById('cash-received').value) || total) : total;
  const change = cashPaid - total;

  const newTx = {
    id: invId, date: invDate, customer: customer, items: itemsList,
    subtotal: subtotal, tax: tax, discount: discount, total: total,
    paid: cashPaid, change: change, method: selectedPaymentMethod.toUpperCase(), status: "Lunas"
  };

  transactionsHistory.unshift(newTx);
  renderTransactions();

  document.getElementById('rcp-id').textContent = newTx.id;
  document.getElementById('rcp-date').textContent = newTx.date;
  document.getElementById('rcp-customer').textContent = newTx.customer;
  document.getElementById('rcp-subtotal').textContent = formatIDR(subtotal);
  document.getElementById('rcp-tax').textContent = formatIDR(tax);
  document.getElementById('rcp-discount').textContent = `- ${formatIDR(discount)}`;
  document.getElementById('rcp-total').textContent = formatIDR(total);
  document.getElementById('rcp-method').textContent = newTx.method;
  document.getElementById('rcp-paid').textContent = formatIDR(cashPaid);
  document.getElementById('rcp-change').textContent = formatIDR(Math.max(0, change));

  const rcpItemsContainer = document.getElementById('rcp-items');
  rcpItemsContainer.innerHTML = '';
  itemsList.forEach(item => {
    const row = document.createElement('div');
    row.className = "flex justify-between py-1";
    row.innerHTML = `
      <div>
        <p class="font-bold text-stone-800">${item.name}</p>
        <p class="text-[10px] text-stone-400">${item.qty} x ${formatIDR(item.price)}</p>
      </div>
      <p class="font-bold text-stone-800">${formatIDR(item.qty * item.price)}</p>
    `;
    rcpItemsContainer.appendChild(row);
  });

  document.getElementById('modal-receipt').classList.remove('hidden');

  cart = {};
  renderProducts();
  document.getElementById('customer-name').value = '';
  document.getElementById('cash-received').value = '';
  syncToCustomerDisplay();
}

function closeReceiptModal() {
  document.getElementById('modal-receipt').classList.add('hidden');
  switchScreen('catalog');
}

function renderTransactions() {
  const container = document.getElementById('transactions-list');
  if (!container) return;

  const searchVal = document.getElementById('search-tx-input')?.value.toLowerCase() || '';
  container.innerHTML = '';

  const filtered = transactionsHistory.filter(tx => {
    return tx.id.toLowerCase().includes(searchVal) || tx.customer.toLowerCase().includes(searchVal);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="py-12 text-center text-xs text-stone-400">Belum ada riwayat transaksi.</div>`;
    return;
  }

  filtered.forEach(tx => {
    const card = document.createElement('div');
    card.className = "bg-white p-3.5 rounded-2xl border border-stone-100 shadow-sm space-y-2 hover:shadow-md transition-shadow";
    card.innerHTML = `
      <div class="flex justify-between items-center text-xs">
        <div>
          <span class="font-bold text-stone-900">${tx.id}</span>
          <span class="text-[10px] text-stone-400 ml-1.5">• ${tx.customer}</span>
        </div>
        <span class="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[10px]">${tx.status}</span>
      </div>
      <div class="text-[11px] text-stone-500 line-clamp-1">
        ${tx.items.map(i => `${i.name} (${i.qty})`).join(', ')}
      </div>
      <div class="flex justify-between items-center pt-2 border-t border-stone-50 text-xs">
        <span class="text-[10px] text-stone-400">${tx.date} (${tx.method})</span>
        <span class="font-extrabold text-stone-900">${formatIDR(tx.total)}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function openAddProductModal() { document.getElementById('modal-add-product').classList.remove('hidden'); }
function closeAddProductModal() { document.getElementById('modal-add-product').classList.add('hidden'); }

function saveNewProduct() {
  const name = document.getElementById('new-prod-name').value.trim();
  const cat = document.getElementById('new-prod-cat').value;
  const price = parseInt(document.getElementById('new-prod-price').value);
  let img = document.getElementById('new-prod-img').value.trim();

  if (!name || isNaN(price) || price <= 0) {
    alert("Mohon isi Nama dan Harga produk dengan benar!");
    return;
  }

  if (!img) img = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";

  products.unshift({ id: Date.now(), name: name, category: cat, price: price, image: img });
  renderProducts();
  closeAddProductModal();

  document.getElementById('new-prod-name').value = '';
  document.getElementById('new-prod-price').value = '';
  document.getElementById('new-prod-img').value = '';
}
