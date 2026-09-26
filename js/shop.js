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

    // ปุ่ม "ทำเสร็จแล้ว" ต่อใบ (ใช้ class เพราะมีหลายใบ) → ส่ง order ของการ์ดนี้เข้า handleCompleteOrder
    const completeBtn = document.createElement("button");
    completeBtn.className = "btn btn-primary completeBtn";
    completeBtn.type = "button";
    completeBtn.textContent = "ทำเสร็จแล้ว";
    completeBtn.addEventListener("click", function () {
      handleCompleteOrder(order);
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
// กด "ทำเสร็จแล้ว": ทำเครื่องหมายเสร็จ (การ์ดหายจากคิวทันที) แล้วถามว่าจะพิมพ์ใบเสร็จไหม
// กด Cancel = ไม่พิมพ์ และย้อนกลับมาพิมพ์ทีหลังไม่ได้ (ออเดอร์ไม่อยู่ในลิสต์แล้ว)
// ================================
function handleCompleteOrder(order) {
  // จับตำแหน่งคิวไว้ก่อนทำเครื่องหมายเสร็จ (หลังเสร็จ getQueuePosition จะคืน 0 เพราะออกจากคิวแล้ว)
  const queuePosition = getQueuePosition(order);

  order.completed = true;
  renderShop(); // ออเดอร์หายจากคิว + สรุปเมนูอัปเดตตาม

  const wantsPrint = window.confirm(
    "ออเดอร์ #" + order.queueNumber + " เสร็จแล้ว\nต้องการพิมพ์ใบเสร็จหรือไม่?"
  );

  if (wantsPrint) {
    printReceipt(order, queuePosition); // ใช้ order ที่ส่งเข้ามาตรงๆ ไม่ต้องหาใหม่จาก DOM หรือ allOrders
  }
}

// ================================
// พิมพ์ใบเสร็จของ 1 ออเดอร์: เติมข้อมูลลง #receiptContent แล้วเรียก print dialog ของเบราว์เซอร์
// ใช้ textContent สร้างทีละบรรทัด (ไม่ใช้ innerHTML) เพราะชื่อลูกค้าเป็นข้อความที่ผู้ใช้พิมพ์เอง
// queuePosition = ตำแหน่งคิวตอนกดเสร็จ (ไม่ส่งมา = คำนวณสดจาก getQueuePosition)
// ================================
function printReceipt(order, queuePosition) {
  if (queuePosition === undefined) queuePosition = getQueuePosition(order);

  const content = document.querySelector("#receiptContent");
  content.textContent = ""; // ล้างใบเสร็จเดิมก่อน

  // เพิ่ม 1 บรรทัดลงในใบเสร็จ (tag ไม่ระบุ = <p>)
  function addLine(text, tag) {
    const el = document.createElement(tag || "p");
    el.textContent = text;
    content.appendChild(el);
  }

  addLine("ครัวมานา", "h2");
  addLine("คิวที่ " + queuePosition + " — ออเดอร์ #" + order.queueNumber);
  addLine("ชื่อ: " + order.customerName);
  addLine("เวลา: " + order.arrivalTime + " | " + order.dineType);
  content.appendChild(document.createElement("hr"));

  // รายการอาหาร: ใช้ itemLabel/itemPrice ตัวเดียวกับหน้าชำระเงินและคิวของฉัน
  // itemLabel คั่นด้วย \n (ชื่อ+เครื่องเคียง / ระดับเผ็ด / โน้ต) — <p> ไม่ขึ้นบรรทัดใหม่ให้เอง
  // จึงแยกเป็นบรรทัดละ 1 <p> ราคาต่อท้ายบรรทัดแรก
  order.cart.forEach(function (item) {
    const lines = itemLabel(item).split("\n");
    addLine(lines[0] + " — " + itemPrice(item) + " บาท");
    lines.slice(1).forEach(function (line) {
      addLine(line);
    });
  });

  content.appendChild(document.createElement("hr"));
  addLine("รวม " + order.totalPrice + " บาท", "strong");

  document.querySelector("#receiptTemplate").classList.remove("hidden"); // ต้องเอา hidden ออกก่อน ไม่งั้น display:none บังตอนพิมพ์

  // ตั้งชื่อไฟล์ชั่วคราวสำหรับตอน Save as PDF (เบราว์เซอร์ใช้ค่า title ณ ตอนพิมพ์เป็นชื่อไฟล์)
  const originalTitle = document.title;
  document.title = "Receipt-" + String(order.queueNumber).padStart(2, "0");

  window.print();

  // คืนค่า title เดิมทันที (print() บล็อกจนกว่า dialog จะปิดในเบราว์เซอร์ส่วนใหญ่)
  document.title = originalTitle;

  // ข้อสำคัญ: ฟังก์ชันนี้ห้ามแตะ order.completed หรือทำให้ออเดอร์หายจากคิว
  // — พิมพ์ใบเสร็จไม่ใช่การทำเครื่องหมายว่าเสร็จงาน
}

// Event: พิมพ์เสร็จหรือยกเลิกการพิมพ์ → ซ่อนใบเสร็จกลับ
// (ห้ามมีโค้ดอื่นในนี้นอกจากซ่อน receiptTemplate — โดยเฉพาะเรื่อง completed/re-render)
window.addEventListener("afterprint", function () {
  document.querySelector("#receiptTemplate").classList.add("hidden");
});


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
