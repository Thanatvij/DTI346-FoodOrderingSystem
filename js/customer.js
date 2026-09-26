// ================================
// customer.js — หน้าฝั่งลูกค้า: home, menu, booking, payment, queue status
// ================================

// ---------- Select element ที่ต้องใช้ ----------
// หน้าแรก
const waitingCount = document.querySelector("#waitingCount");
const waitingTime = document.querySelector("#waitingTime");
const closedMessage = document.querySelector("#closedMessage");
const bookBtn = document.querySelector("#bookBtn");
const profileChipBtn = document.querySelector("#profileChipBtn");
const customerTabButtons = document.querySelectorAll(".tab-btn");

// หน้าโปรไฟล์
const profileBackBtn = document.querySelector("#profileBackBtn");
const profilePhoneText = document.querySelector("#profilePhoneText");
const nicknameInput = document.querySelector("#nicknameInput");
const saveProfileBtn = document.querySelector("#saveProfileBtn");
const profileLogoutBtn = document.querySelector("#profileLogoutBtn");

// หน้าเมนู
const menuBackBtn = document.querySelector("#menuBackBtn");
const menuClosedText = document.querySelector("#menuClosedText");
const menuList = document.querySelector("#menuList");
const customizePanel = document.querySelector("#customizePanel");
const customizeTitle = document.querySelector("#customizeTitle");
const addonList = document.querySelector("#addonList");
const spiceList = document.querySelector("#spiceList");
const itemNote = document.querySelector("#itemNote");
const confirmAddBtn = document.querySelector("#confirmAddBtn");
const cancelAddBtn = document.querySelector("#cancelAddBtn");
const cartSummary = document.querySelector("#cartSummary");
const cartEmptyText = document.querySelector("#cartEmptyText");
const cartList = document.querySelector("#cartList");
const cartTotal = document.querySelector("#cartTotal");
const toBookingBtn = document.querySelector("#toBookingBtn");

// หน้าฟอร์มจอง
const bookingBackBtn = document.querySelector("#bookingBackBtn");
const nameInput = document.querySelector("#nameInput");
const nowBtn = document.querySelector("#nowBtn");
const arrivalTime = document.querySelector("#arrivalTime");
const formError = document.querySelector("#formError");
const toPaymentBtn = document.querySelector("#toPaymentBtn");

// หน้าชำระเงิน
const paymentBackBtn = document.querySelector("#paymentBackBtn");
const paymentInfo = document.querySelector("#paymentInfo");
const paymentList = document.querySelector("#paymentList");
const paymentTotal = document.querySelector("#paymentTotal");
const paidBtn = document.querySelector("#paidBtn");

// หน้าคิวของฉัน
const loginRequiredBox = document.querySelector("#loginRequiredBox");
const goLoginBtn = document.querySelector("#goLoginBtn");
const noQueueText = document.querySelector("#noQueueText");
const queueDisplay = document.querySelector("#queueDisplay");
const queueOrderBox = document.querySelector("#queueOrderBox");
const queueOrderList = document.querySelector("#queueOrderList");
const otherOrdersBox = document.querySelector("#otherOrdersBox");
const otherOrdersList = document.querySelector("#otherOrdersList");
const backHomeBtn = document.querySelector("#backHomeBtn");


// ================================
// showCustomerScreen: เติมข้อมูลของหน้าลูกค้าให้ทันสมัยก่อนแสดง
// (ถูกเรียกจาก showScreen ใน app.js ทุกครั้งที่สลับ screen)
// ================================
function showCustomerScreen(screenId) {
  if (screenId === "homeScreen") updateHomeStatus();
  if (screenId === "menuScreen") {
    renderMenuList();
    renderCart();
  }
  if (screenId === "queueStatus") renderQueueStatus();
  if (screenId === "profileScreen") {
    profilePhoneText.textContent = currentUserPhone;
    nicknameInput.value = getNickname();
  }
  // ฟอร์มสั่งอาหาร: prefill ชื่อด้วยชื่อเล่น (เฉพาะตอนช่องยังว่าง จะได้ไม่ทับที่ผู้ใช้แก้เอง)
  if (screenId === "bookingForm" && nameInput.value === "") {
    nameInput.value = getNickname();
  }
}

// ชื่อเล่นของลูกค้าที่ล็อกอินอยู่ (ไม่มี → สตริงว่าง)
function getNickname() {
  const profile = customerProfiles[currentUserPhone];
  return profile ? profile.nickname : "";
}

// ================================
// แสดงสถานะคิวที่หน้าแรก + ปิดปุ่มจองเมื่อร้านปิด
// จำนวนคิว = ออเดอร์ที่ยังไม่เสร็จ, เวลารอ = จำนวนคิว x เวลาเฉลี่ยต่อออเดอร์
// ================================
function updateHomeStatus() {
  const queueLength = getSortedActiveOrders().length;
  waitingCount.textContent = queueLength;
  waitingTime.textContent = queueLength * AVG_MINUTES_PER_ORDER;

  const open = isShopOpen();
  bookBtn.disabled = !open;                        // ร้านปิด → กดไม่ได้
  closedMessage.classList.toggle("hidden", open);  // ร้านปิด → โชว์ข้อความ

  // ล็อกอินแล้ว → โชว์ชิปโปรไฟล์ที่ header (ชื่อเล่น ถ้าไม่มีใช้เบอร์เต็ม)
  profileChipBtn.classList.toggle("hidden", !isCustomerLoggedIn);
  profileChipBtn.textContent = getNickname() || currentUserPhone;
}


// ================================
// ฟังก์ชันช่วยแสดงรายการอาหาร (ใช้ร่วมกับ shop.js ด้วย)
// ================================

// ข้อความอธิบาย 1 รายการ: ชื่อ + add-on + ระดับเผ็ด + โน้ต (คั่นด้วย \n)
function itemLabel(item) {
  const menu = menuItems.find(function (m) { return m.id === item.menuId; });
  let text = menu ? menu.name : item.menuId;
  if (item.addons.length > 0) {
    const addonNames = item.addons.map(function (id) {
      const addon = ADDON_OPTIONS.find(function (a) { return a.id === id; });
      return addon ? addon.name : id;
    });
    text += " + " + addonNames.join(", ");
  }
  text += "\nระดับเผ็ด: " + item.spiceLevel;
  if (item.note !== "") {
    text += "\nโน้ต: " + item.note;
  }
  return text;
}

// เติมรายการอาหารลงใน <ul> — ใช้ textContent เพื่อไม่ให้ข้อความที่ผู้ใช้พิมพ์ถูกตีความเป็น HTML
function renderItemList(ul, items) {
  ul.textContent = "";
  items.forEach(function (item) {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = itemLabel(item);
    const price = document.createElement("span");
    price.textContent = itemPrice(item) + " บาท";
    li.appendChild(text);
    li.appendChild(price);
    ul.appendChild(li);
  });
}


// ================================
// หน้าเมนู
// ================================

// สร้าง checkbox add-on และ radio ระดับเผ็ดใน #customizePanel (เรียกครั้งเดียวตอนเริ่มต้น)
function buildCustomizeOptions() {
  ADDON_OPTIONS.forEach(function (addon) {
    const label = document.createElement("label");
    label.className = "radio-row";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.name = "addon";
    box.value = addon.id;
    const text = document.createElement("span");
    text.textContent = addon.name + " (+" + addon.price + " บาท)";
    label.appendChild(box);
    label.appendChild(text);
    addonList.appendChild(label);
  });

  SPICE_LEVELS.forEach(function (level) {
    const label = document.createElement("label");
    label.className = "radio-row";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "spice";
    radio.value = level;
    const text = document.createElement("span");
    text.textContent = level;
    label.appendChild(radio);
    label.appendChild(text);
    spiceList.appendChild(label);
  });
}

// วาดรายการเมนูจาก menuItems ใหม่ทุกครั้ง (เพราะร้านค้าอาจแก้เมนู)
// ร้านปิด → แสดง "ร้านปิดแล้ว" แทนเมนู
function renderMenuList() {
  const open = isShopOpen();
  menuClosedText.classList.toggle("hidden", open);
  menuList.classList.toggle("hidden", !open);
  cartSummary.classList.toggle("hidden", !open);
  toBookingBtn.classList.toggle("hidden", !open);
  if (!open) return;

  menuList.textContent = "";
  menuItems.forEach(function (menu) {
    const row = document.createElement("div");
    row.className = "menu-row";
    if (!menu.available) row.classList.add("unavailable"); // จางลง

    const info = document.createElement("div");
    info.className = "menu-info";
    const name = document.createElement("strong");
    name.textContent = menu.name;
    const price = document.createElement("p");
    price.className = "menu-price";
    price.textContent = menu.price + " บาท";
    info.appendChild(name);
    info.appendChild(price);
    if (!menu.available) {
      price.classList.add("price-struck"); // ขีดฆ่าราคา
      const soldOut = document.createElement("span");
      soldOut.className = "badge badge-muted";
      soldOut.textContent = "หมดวันนี้";
      info.appendChild(soldOut);
    }

    // ปุ่ม "+ เพิ่ม" ใช้ class ไม่ใช่ id (มีหลายปุ่ม id ซ้ำกันไม่ได้)
    const btn = document.createElement("button");
    btn.className = "addToCartBtn";
    btn.type = "button";
    btn.textContent = "+ เพิ่ม";
    btn.disabled = !menu.available;
    btn.addEventListener("click", function () {
      openCustomizePanel(menu.id);
    });

    row.appendChild(info);
    row.appendChild(btn);
    menuList.appendChild(row);
  });
}

// เปิด #customizePanel ของเมนูที่กด: รีเซ็ตตัวเลือกให้ว่างก่อน
function openCustomizePanel(menuId) {
  selectedMenuId = menuId;
  const menu = menuItems.find(function (m) { return m.id === menuId; });
  customizeTitle.textContent = menu.name;

  document.querySelectorAll("input[name='addon']").forEach(function (box) {
    box.checked = false;
  });
  document.querySelectorAll("input[name='spice']").forEach(function (radio, index) {
    radio.checked = (index === 0); // ค่าเริ่มต้น = "ไม่เผ็ด"
  });
  itemNote.value = "";

  customizePanel.classList.remove("hidden");
}

// แสดงตะกร้า + ราคารวมแบบ real-time + เปิด/ปิดปุ่ม "ถัดไป"
function renderCart() {
  renderItemList(cartList, cart);

  // เพิ่มปุ่ม "ลบ" ต่อรายการ
  cartList.querySelectorAll("li").forEach(function (li, index) {
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.type = "button";
    removeBtn.textContent = "ลบ";
    removeBtn.addEventListener("click", function () {
      cart.splice(index, 1); // เอารายการที่ index นี้ออกจาก cart
      renderCart();
    });
    li.appendChild(removeBtn);
  });

  cartTotal.textContent = calcTotal(cart);
  cartEmptyText.classList.toggle("hidden", cart.length > 0);
  toBookingBtn.disabled = (cart.length === 0); // ตะกร้าว่าง → กดถัดไปไม่ได้
}


// ================================
// หน้าคิวของฉัน
// ================================

// ข้อความเวลารอของ 1 ออเดอร์ — คำนวณตำแหน่งจาก getQueuePosition ทุกครั้ง
// (ตำแหน่งจึงขยับเองเมื่อร้านกด "ทำเสร็จแล้ว" หรือมีคนจองเวลาก่อนหน้า)
function getWaitText(order) {
  const maxMinutes = getQueuePosition(order) * AVG_MINUTES_PER_ORDER;
  // เวลาที่เหลือ = ค่าจากตัวนับ (ลดทุกนาที) แต่ไม่เกิน ตำแหน่ง x เวลาเฉลี่ย
  const counted = minutesLeftByOrder[order.queueNumber];
  const minutes = (counted === undefined) ? maxMinutes : Math.min(counted, maxMinutes);
  return (minutes <= 0)
    ? "ใกล้ถึงคิวของคุณแล้ว!"
    : `เหลือเวลาประมาณ ${minutes} นาที`;
}

// ข้อความ 1 ออเดอร์แบบข้อความล้วน (ใช้กับรายการ "ออเดอร์อื่น")
function getOrderText(order) {
  if (order.completed) {
    return `ออเดอร์ #${order.queueNumber}\nทำเสร็จแล้ว รับอาหารได้เลย!`;
  }
  return `ออเดอร์ #${order.queueNumber}\nตำแหน่งคิวของคุณ: ${getQueuePosition(order)}\n${getWaitText(order)}`;
}

// เติมกล่อง #queueDisplay ของออเดอร์หลัก: ตำแหน่งคิวเป็นเลขใหญ่ (.queue-number-hero)
function renderQueueDisplay(order) {
  queueDisplay.textContent = "";

  const orderLine = document.createElement("p");
  orderLine.className = "meta-text";
  orderLine.textContent = "ออเดอร์ #" + order.queueNumber;
  queueDisplay.appendChild(orderLine);

  if (order.completed) {
    const done = document.createElement("p");
    done.className = "section-title";
    done.textContent = "ทำเสร็จแล้ว รับอาหารได้เลย!";
    queueDisplay.appendChild(done);
    return;
  }

  const label = document.createElement("p");
  label.textContent = "ตำแหน่งคิวของคุณ";
  const hero = document.createElement("p");
  hero.className = "queue-number-hero";
  hero.textContent = getQueuePosition(order);
  const wait = document.createElement("p");
  wait.textContent = getWaitText(order);

  queueDisplay.appendChild(label);
  queueDisplay.appendChild(hero);
  queueDisplay.appendChild(wait);
}

// เรียงออเดอร์ของลูกค้า: ใบที่ยังไม่เสร็จก่อน (ตำแหน่งคิวน้อย → มาก) แล้วตามด้วยใบที่เสร็จแล้ว (ใหม่ → เก่า)
function sortMyOrders(orders) {
  const active = orders
    .filter(function (o) { return !o.completed; })
    .sort(function (a, b) { return getQueuePosition(a) - getQueuePosition(b); });
  const done = orders
    .filter(function (o) { return o.completed; })
    .sort(function (a, b) { return b.queueNumber - a.queueNumber; });
  return active.concat(done);
}

// นับเวลาถอยหลัง: setInterval ทุก 1 นาที ลดเวลาที่เหลือของทุกออเดอร์ทีละ 1
// แล้ววาดหน้า "คิวของฉัน" ใหม่ถ้าผู้ใช้เปิดหน้านั้นอยู่
setInterval(function () {
  Object.keys(minutesLeftByOrder).forEach(function (queueNumber) {
    if (minutesLeftByOrder[queueNumber] > 0) minutesLeftByOrder[queueNumber]--;
  });
  if (!document.querySelector("#queueStatus").classList.contains("hidden")) {
    renderQueueStatus();
  }
}, 60000);

// แสดงหน้า "คิวของฉัน"
//   ยังไม่ล็อกอิน → ให้ไปล็อกอินก่อน
//   ล็อกอินแล้ว   → แสดงผลจาก getMyOrders() (ใบแรกที่เรียงแล้วเป็นออเดอร์หลัก ที่เหลืออยู่ในกล่อง "ออเดอร์อื่น")
function renderQueueStatus() {
  const myOrders = isCustomerLoggedIn ? sortMyOrders(getMyOrders()) : [];
  const hasOrder = myOrders.length > 0;

  loginRequiredBox.classList.toggle("hidden", isCustomerLoggedIn);
  noQueueText.classList.toggle("hidden", !isCustomerLoggedIn || hasOrder);
  queueDisplay.classList.toggle("hidden", !hasOrder);
  queueOrderBox.classList.toggle("hidden", !hasOrder);
  otherOrdersBox.classList.toggle("hidden", myOrders.length <= 1);
  if (!hasOrder) return;

  renderQueueDisplay(myOrders[0]);
  renderItemList(queueOrderList, myOrders[0].cart);

  // ออเดอร์อื่น: แสดงบรรทัดเดียวต่อใบ
  otherOrdersList.textContent = "";
  myOrders.slice(1).forEach(function (order) {
    const li = document.createElement("li");
    li.textContent = getOrderText(order).replace(/\n/g, " — ");
    otherOrdersList.appendChild(li);
  });
}

// ================================
// หน้าชำระเงิน: สร้าง QR Code ด้วย library (qrcodejs จาก CDN)
// เรียกทุกครั้งที่เข้า #paymentScreen — ต้องล้างของเก่าก่อน ไม่งั้น QR ซ้อนกัน
// (ตอนนี้ยังไม่มี order เพราะสร้างตอนกด #paidBtn จึงรับยอดรวม + เลขออเดอร์ที่จะได้ (queueCounter + 1))
// ================================
function renderPaymentQr(totalPrice, nextQueueNumber) {
  const qrBox = document.querySelector("#qrCodeBox");
  qrBox.textContent = ""; // ล้าง QR เดิมก่อนสร้างใหม่

  // library โหลดไม่สำเร็จ (ไม่มีอินเทอร์เน็ต) → แจ้งแทนที่จะ error
  if (typeof QRCode === "undefined") {
    qrBox.textContent = "โหลด QR ไม่สำเร็จ (ต้องเชื่อมต่ออินเทอร์เน็ต)";
    return;
  }

  // ข้อความ placeholder ล้วนๆ สแกนได้จริงแต่ไม่เชื่อมระบบจ่ายเงินใดๆ
  const dummyPayload = "KRUAMANA-DEMO-PAYMENT-" + totalPrice + "BAHT-Q" + nextQueueNumber;
  new QRCode(qrBox, {
    text: dummyPayload,
    width: 200,
    height: 200
  });
}

// อ่านค่า radio ทานที่ร้าน / กลับบ้าน
function getDineType() {
  return document.querySelector("input[name='dineType']:checked").value;
}


// ================================
// Event listener ของหน้าลูกค้า
// ================================

// Event: กดปุ่มใน Tab Bar (หน้าแรก / คิวของฉัน) → สลับ screen ตาม data-target
customerTabButtons.forEach(function (btn) {
  btn.addEventListener("click", function () {
    showScreen(btn.dataset.target);
  });
});

// Event: กด #bookBtn
//   ล็อกอินแล้ว (isCustomerLoggedIn) → ข้ามไป #menuScreen ตรงๆ ไม่ต้องยืนยัน OTP ซ้ำ
//   ยังไม่ล็อกอิน → ไป #loginScreen (ลูกค้าและร้านค้าเข้าทางเดียวกัน ไม่มีทางลัด)
bookBtn.addEventListener("click", function () {
  if (!isShopOpen()) {
    updateHomeStatus(); // เผื่อร้านปิดระหว่างที่เปิดหน้าค้างไว้
    return;
  }
  if (isCustomerLoggedIn) {
    showScreen("menuScreen");
  } else {
    showScreen("loginScreen");
  }
});

// Event: กด #profileChipBtn (header หน้าแรก) → ไป #profileScreen
profileChipBtn.addEventListener("click", function () {
  showScreen("profileScreen");
});

// Event: ปุ่มย้อนกลับของหน้าโปรไฟล์ → หน้าแรก (ไม่แตะสถานะล็อกอิน)
profileBackBtn.addEventListener("click", function () {
  showScreen("homeScreen");
});

// Event: กด #saveProfileBtn → เก็บชื่อเล่นไว้ตามเบอร์โทร แล้วกลับหน้าแรก
saveProfileBtn.addEventListener("click", function () {
  customerProfiles[currentUserPhone] = { nickname: nicknameInput.value.trim() };
  showScreen("homeScreen");
});

// Event: กด #profileLogoutBtn → ออกจากระบบฝั่งลูกค้า (จุดเดียวที่เคลียร์สถานะล็อกอินลูกค้า)
// เคลียร์ตะกร้าด้วย เพื่อไม่ให้ตะกร้าของคนเดิมค้างไปถึงคนถัดไป
profileLogoutBtn.addEventListener("click", function () {
  isCustomerLoggedIn = false;
  currentUserPhone = "";
  cart = [];
  showScreen("homeScreen");
});

// Event: กด #goLoginBtn (หน้าคิวของฉันตอนยังไม่ล็อกอิน) → ไป #loginScreen
goLoginBtn.addEventListener("click", function () {
  showScreen("loginScreen");
});

// Event: ปุ่มย้อนกลับของแต่ละหน้า
menuBackBtn.addEventListener("click", function () { showScreen("homeScreen"); });
bookingBackBtn.addEventListener("click", function () { showScreen("menuScreen"); });
paymentBackBtn.addEventListener("click", function () { showScreen("bookingForm"); });

// Event: กด #confirmAddBtn → อ่านตัวเลือกจาก panel แล้ว push ลง cart[] (เก็บแค่ id)
confirmAddBtn.addEventListener("click", function () {
  // add-on ที่ติ๊กไว้ (เก็บเป็น array ของ id)
  const addons = [];
  document.querySelectorAll("input[name='addon']:checked").forEach(function (box) {
    addons.push(box.value);
  });

  const spiceLevel = document.querySelector("input[name='spice']:checked").value;

  cart.push({
    menuId: selectedMenuId,
    addons: addons,
    spiceLevel: spiceLevel,
    note: itemNote.value.trim()
  });

  customizePanel.classList.add("hidden");
  renderCart();
});

// Event: กด #cancelAddBtn → ปิด panel โดยไม่เพิ่มรายการ
cancelAddBtn.addEventListener("click", function () {
  customizePanel.classList.add("hidden");
});

// Event: กด #toBookingBtn → ไปฟอร์มจอง
// ถ้ามาจาก ?mode=dinein และฟอร์มยังว่าง → prefill "ทานที่ร้าน" + เวลาปัจจุบัน (แก้เองได้)
toBookingBtn.addEventListener("click", function () {
  formError.classList.add("hidden");
  if (isDineInMode && arrivalTime.value === "") {
    document.querySelector("input[name='dineType'][value='ทานที่ร้าน']").checked = true;
    nowBtn.click(); // ใช้ logic เดียวกับปุ่ม "มาถึงตอนนี้เลย"
  }
  showScreen("bookingForm");
});

// Event: กด #nowBtn → เติมเวลาปัจจุบันลง #arrivalTime
nowBtn.addEventListener("click", function () {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  arrivalTime.value = `${hh}:${mm}`;
});

// Event: กด #toPaymentBtn → ตรวจฟอร์ม แล้วเติมสรุปออเดอร์และไปหน้าชำระเงิน
toPaymentBtn.addEventListener("click", function () {
  if (nameInput.value.trim() === "" || arrivalTime.value === "") {
    formError.textContent = "กรุณากรอกชื่อและเวลาที่จะมาถึง";
    formError.classList.remove("hidden");
    return;
  }
  formError.classList.add("hidden");

  paymentInfo.textContent =
    `${nameInput.value.trim()} | เวลา ${arrivalTime.value} | ${getDineType()}`;
  renderItemList(paymentList, cart);
  paymentTotal.textContent = calcTotal(cart);
  renderPaymentQr(calcTotal(cart), queueCounter + 1);

  showScreen("paymentScreen");
});

// Event: กด #paidBtn → สร้าง order, push ลง allOrders[], เริ่มนับคิว, ไป #queueStatus
paidBtn.addEventListener("click", function () {
  queueCounter++; // เลขอ้างอิงออเดอร์ (unique id)

  const order = {
    queueNumber: queueCounter,
    customerName: nameInput.value.trim(),
    arrivalTime: arrivalTime.value,
    dineType: getDineType(),
    cart: cart.slice(), // สำเนาก่อนล้าง cart ไม่งั้นออเดอร์จะว่างตามไปด้วย
    totalPrice: calcTotal(cart),
    paid: true,
    phone: currentUserPhone,
    completed: false
  };
  allOrders.push(order);
  // เริ่มนับถอยหลังของออเดอร์นี้ (ตำแหน่งคิว x เวลาเฉลี่ย)
  minutesLeftByOrder[order.queueNumber] = getQueuePosition(order) * AVG_MINUTES_PER_ORDER;

  // ล้างเฉพาะตะกร้าและฟอร์ม — ห้ามแตะ currentUserPhone / isCustomerLoggedIn
  cart = [];
  nameInput.value = "";
  arrivalTime.value = "";
  document.querySelector("input[name='dineType'][value='ทานที่ร้าน']").checked = true;

  showScreen("queueStatus");
});

// Event: กด #backHomeBtn → กลับหน้าแรก
backHomeBtn.addEventListener("click", function () {
  showScreen("homeScreen");
});
