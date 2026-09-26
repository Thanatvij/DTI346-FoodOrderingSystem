// ================================
// shop.js — หน้าฝั่งร้านค้า: 3 แท็บ (คิวปัจจุบัน / สรุปเมนูที่ต้องทำ / จัดการเมนู)
// ================================

// ---------- Select element ที่ต้องใช้ ----------
const shopLogoutBtn = document.querySelector("#shopLogoutBtn");
const shopTabButtons = document.querySelectorAll(".shop-tab-btn");
const shopTabPanels = document.querySelectorAll(".shop-tab-panel");

const shopEmptyText = document.querySelector("#shopEmptyText");
const shopOrderList = document.querySelector("#shopOrderList");

const kitchenEmptyText = document.querySelector("#kitchenEmptyText");
const kitchenBatchList = document.querySelector("#kitchenBatchList");

const menuManageList = document.querySelector("#menuManageList");
const newItemName = document.querySelector("#newItemName");
const newItemPrice = document.querySelector("#newItemPrice");
const newItemError = document.querySelector("#newItemError");
const addMenuItemBtn = document.querySelector("#addMenuItemBtn");


// ================================
// วาดทั้ง 3 แท็บใหม่ (เรียกจาก showScreen ตอนเข้า #shopScreen และหลังแก้ข้อมูล)
// ================================
function renderShop() {
  renderShopOrders();
  renderKitchenBatches();
  renderMenuManagement();
}

// ================================
// สลับแท็บภายในหน้าร้านค้า: ซ่อนทุก panel แล้วเปิดเฉพาะแท็บที่เลือก
// ================================
function showShopTab(tabId) {
  shopTabPanels.forEach(function (panel) {
    panel.classList.toggle("hidden", panel.id !== tabId);
  });
  shopTabButtons.forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
}

// ================================
// แท็บ "คิวปัจจุบัน": การ์ดออเดอร์ที่ยังไม่เสร็จ เรียงตามเวลาที่จะมาถึง
// ================================
function renderShopOrders() {
  const orders = getSortedActiveOrders();
  shopOrderList.textContent = "";
  shopEmptyText.classList.toggle("hidden", orders.length > 0);

  orders.forEach(function (order) {
    const card = document.createElement("div");
    card.className = "order-card";

    const title = document.createElement("p");
    title.className = "order-title";
    title.textContent =
      `คิวที่ ${getQueuePosition(order)} — ${order.customerName} (ออเดอร์ #${order.queueNumber})`;

    const info = document.createElement("p");
    info.className = "meta-text";
    info.textContent = `เวลา ${order.arrivalTime} | ${order.dineType}`;

    // badge สถานะจ่ายเงิน
    const badge = document.createElement("span");
    badge.className = order.paid ? "badge badge-success" : "badge badge-muted";
    badge.textContent = order.paid ? "ชำระเงินแล้ว" : "ยังไม่ชำระเงิน";

    const list = document.createElement("ul");
    list.className = "item-list";
    renderItemList(list, order.cart);

    const total = document.createElement("p");
    total.textContent = "รวม " + order.totalPrice + " บาท";

    // ปุ่ม "ทำเสร็จแล้ว" ต่อใบ (ใช้ class เพราะมีหลายใบ) → completed = true
    const completeBtn = document.createElement("button");
    completeBtn.className = "btn btn-primary completeBtn";
    completeBtn.type = "button";
    completeBtn.textContent = "ทำเสร็จแล้ว";
    completeBtn.addEventListener("click", function () {
      order.completed = true;
      renderShop(); // ออเดอร์หายจากคิว + สรุปเมนูอัปเดตตาม
    });

    card.appendChild(title);
    card.appendChild(info);
    card.appendChild(badge);
    card.appendChild(list);
    card.appendChild(total);
    card.appendChild(completeBtn);
    shopOrderList.appendChild(card);
  });
}

// ================================
// แท็บ "สรุปเมนูที่ต้องทำ": จัดกลุ่มเมนูตามช่วงเวลา 15 นาที
// ================================
function renderKitchenBatches() {
  const batches = getKitchenBatches(15);
  const labels = Object.keys(batches).sort(); // "HH:MM-HH:MM" เรียงตามตัวอักษรก็ตรงกับเวลา

  kitchenBatchList.textContent = "";
  kitchenEmptyText.classList.toggle("hidden", labels.length > 0);

  labels.forEach(function (label) {
    // แปลง { ชื่อเมนู: จำนวน } เป็นข้อความ "กะเพราหมูสับ x3, ผัดไทย x2"
    const parts = Object.keys(batches[label]).map(function (menuName) {
      return menuName + " x" + batches[label][menuName];
    });

    const row = document.createElement("div");
    row.className = "panel";
    const timeText = document.createElement("strong");
    timeText.textContent = label;
    const menuText = document.createElement("p");
    menuText.textContent = parts.join(", ");
    row.appendChild(timeText);
    row.appendChild(menuText);
    kitchenBatchList.appendChild(row);
  });
}

// ================================
// แท็บ "จัดการเมนู": toggle มี/หมด, ลบถาวร
// ================================
function renderMenuManagement() {
  menuManageList.textContent = "";

  menuItems.forEach(function (menu) {
    const row = document.createElement("div");
    row.className = "menu-row";

    const info = document.createElement("div");
    info.className = "menu-info";
    const name = document.createElement("strong");
    name.textContent = menu.name;
    const price = document.createElement("p");
    price.className = "menu-price";
    price.textContent = menu.price + " บาท";
    info.appendChild(name);
    info.appendChild(price);

    // checkbox "มีวันนี้" (class toggleAvailable เพราะมีหลายเมนู)
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "radio-row";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "toggleAvailable";
    toggle.checked = menu.available;
    toggle.addEventListener("change", function () {
      menu.available = toggle.checked;
    });
    const toggleText = document.createElement("span");
    toggleText.textContent = "มีวันนี้";
    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(toggleText);

    // ปุ่ม "ลบถาวร" (class deleteMenuItem)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "remove-btn deleteMenuItem";
    deleteBtn.type = "button";
    deleteBtn.textContent = "ลบถาวร";
    deleteBtn.addEventListener("click", function () {
      menuItems = menuItems.filter(function (m) { return m.id !== menu.id; });
      renderMenuManagement();
    });

    row.appendChild(info);
    row.appendChild(toggleLabel);
    row.appendChild(deleteBtn);
    menuManageList.appendChild(row);
  });
}


// ================================
// Event listener ของหน้าร้านค้า
// ================================

// Event: กดแท็บภายใน → สลับ panel ตาม data-tab
shopTabButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    showShopTab(btn.dataset.tab);
  });
});

// Event: กด #addMenuItemBtn → ตรวจชื่อ/ราคา แล้วเพิ่มเมนูใหม่ลง menuItems
addMenuItemBtn.addEventListener("click", function () {
  const name = newItemName.value.trim();
  const price = Number(newItemPrice.value);

  if (name === "" || !(price > 0)) {
    newItemError.textContent = "กรุณากรอกชื่อเมนูและราคา (มากกว่า 0)";
    newItemError.classList.remove("hidden");
    return;
  }
  newItemError.classList.add("hidden");

  menuItems.push({ id: "m" + Date.now(), name: name, price: price, available: true });
  newItemName.value = "";
  newItemPrice.value = "";
  renderMenuManagement();
});

// Event: กด #shopLogoutBtn → ออกจากระบบร้านค้า กลับหน้าแรก
shopLogoutBtn.addEventListener("click", function () {
  isShopLoggedIn = false;
  currentUserPhone = "";
  showScreen("homeScreen");
});
