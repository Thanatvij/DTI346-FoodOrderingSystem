// ================================
// queue-utils.js — pure function (อ่านข้อมูลจาก data.js อย่างเดียว ไม่แตะหน้าจอ)
// ================================

// ตรวจเวลาทำการร้าน: ปิดวันอาทิตย์, เปิด 11:00-20:00
function isShopOpen() {
  if (!ENFORCE_SHOP_HOURS) return true;    // ปิดใช้งานชั่วคราวระหว่างพัฒนา
  const now = new Date();
  const day = now.getDay();                // 0 = อาทิตย์
  const mins = now.getHours() * 60 + now.getMinutes();
  if (day === 0) return false;
  return mins >= 11 * 60 && mins < 20 * 60;
}

// ลำดับคิว: เรียงตามเวลาที่จะมาถึงจริง (arrivalTime) ไม่ใช่ลำดับจ่ายเงิน
// เหตุผล: คนที่ถึงเวลาแล้ว/ใกล้ถึงแล้ว ควรได้คิวก่อน แม้จะจ่ายเงินผ่านแอปทีหลังคนที่จองล่วงหน้าไว้ไกลๆ

// แปลง "HH:MM" เป็นจำนวนนาทีตั้งแต่เที่ยงคืน (เช่น "12:30" → 750)
function timeToMinutes(timeStr) {
  const parts = timeStr.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// แปลงจำนวนนาทีกลับเป็น "HH:MM" (เช่น 750 → "12:30")
function minutesToTimeLabel(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return h + ":" + m;
}

// ออเดอร์ที่ยังไม่เสร็จ เรียงตามเวลาที่จะมาถึง (น้อย → มาก)
function getSortedActiveOrders() {
  return allOrders
    .filter(function (o) { return !o.completed; })
    .sort(function (a, b) { return timeToMinutes(a.arrivalTime) - timeToMinutes(b.arrivalTime); });
}

// ตำแหน่งคิวของออเดอร์ (เริ่มที่ 1) — คืน 0 ถ้าไม่อยู่ในคิว (เช่น ทำเสร็จแล้ว)
function getQueuePosition(order) {
  const sorted = getSortedActiveOrders();
  return sorted.findIndex(function (o) { return o.queueNumber === order.queueNumber; }) + 1;
}

// ออเดอร์ทั้งหมดของลูกค้าที่ล็อกอินอยู่ (ผูกกับเบอร์โทร) — รองรับสั่งมากกว่า 1 ครั้ง
function getMyOrders() {
  return allOrders.filter(function (o) { return o.phone === currentUserPhone; });
}

// สรุปเมนูที่ต้องทำ แบบจัดกลุ่มตามช่วงเวลา — เหตุผล: ออเดอร์เมนูเดียวกันที่เวลาใกล้กัน
// ควรทำพร้อมกันทีเดียว (ผัดพร้อมกัน) ไม่ใช่ทำทีละใบ
function getKitchenBatches(windowMinutes) {
  const batches = {}; // key: "12:00-12:15", value: { ชื่อเมนู: จำนวนจาน }
  getSortedActiveOrders().forEach(function (order) {
    const mins = timeToMinutes(order.arrivalTime);
    const bucketStart = Math.floor(mins / windowMinutes) * windowMinutes;
    const label = minutesToTimeLabel(bucketStart) + "-" + minutesToTimeLabel(bucketStart + windowMinutes);
    if (!batches[label]) batches[label] = {};
    order.cart.forEach(function (item) {
      const menu = menuItems.find(function (m) { return m.id === item.menuId; });
      const name = menu ? menu.name : item.menuId;
      batches[label][name] = (batches[label][name] || 0) + 1;
    });
  });
  return batches;
}

// ราคาต่อ 1 รายการ = ราคาเมนู + ราคา add-on ทั้งหมดที่เลือก (ราคามาจาก data.js เสมอ)
function itemPrice(item) {
  const menu = menuItems.find(function (m) { return m.id === item.menuId; });
  const addonTotal = item.addons.reduce(function (sum, addonId) {
    const addon = ADDON_OPTIONS.find(function (a) { return a.id === addonId; });
    return sum + (addon ? addon.price : 0);
  }, 0);
  return (menu ? menu.price : 0) + addonTotal;
}

// ราคารวมของรายการทั้งหมด
function calcTotal(items) {
  return items.reduce(function (sum, item) { return sum + itemPrice(item); }, 0);
}
