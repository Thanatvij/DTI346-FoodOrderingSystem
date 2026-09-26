// ================================
// data.js — ข้อมูลจำลอง + state ทั้งหมด (ไม่มี Backend จริง)
// ใช้ตัวแปรในหน่วยความจำแทน database (รีเฟรชหน้าแล้วข้อมูลหาย)
// ================================

// ---------- ข้อมูลเมนู ----------
// ใช้ let เพราะร้านค้าแก้ไขได้ (เพิ่ม/ลบ/สลับ มี-หมด)
let menuItems = [
  { id: "m1", name: "กะเพราหมูสับ", price: 50, available: true },
  { id: "m2", name: "ผัดไทย", price: 45, available: true },
  { id: "m3", name: "ข้าวผัดกุ้ง", price: 60, available: true },
  { id: "m4", name: "ต้มยำกุ้ง", price: 70, available: true },
  { id: "m5", name: "ข้าวมันไก่", price: 45, available: true },
  { id: "m6", name: "ส้มตำ", price: 40, available: true },
  { id: "m7", name: "กะเพราหมูตุ๋น", price: 60, available: true },
  { id: "m8", name: "กะเพราเนื้อตุ๋น", price: 70, available: true },
  { id: "m9", name: "ข้าวหมูกรอบคั่วพริกเกลือ", price: 60, available: true },
  { id: "m10", name: "ข้าวหมูกรอบ", price: 50, available: true },
  { id: "m11", name: "ข้าวกะเพราหมูกรอบ", price: 55, available: true },
  { id: "m12", name: "ข้าวหมูซอสเกาหลี", price: 50, available: true },
  { id: "m13", name: "ก๋วยเตี๋ยวหมูน้ำใส", price: 45, available: true },  // ราคาสมมติ ปรับได้
  { id: "m14", name: "ก๋วยเตี๋ยวหมูน้ำตก", price: 45, available: true },  // ราคาสมมติ ปรับได้
  { id: "m15", name: "ก๋วยเตี๋ยวหมูแห้ง", price: 45, available: true }    // ราคาสมมติ ปรับได้
];

const ADDON_OPTIONS = [
  { id: "a1", name: "ไข่ดาว", price: 10 },
  { id: "a2", name: "ไข่ต้ม", price: 10 },
  { id: "a3", name: "ไข่เจียว", price: 15 }
];
const SPICE_LEVELS = ["ไม่เผ็ด", "เผ็ดน้อย", "เผ็ดปานกลาง", "เผ็ดมาก"];

// ---------- ค่าคงที่ ----------
const SELLER_PHONES = ["0811111111"];  // เบอร์โทรร้านค้า (ตัวอย่าง สำหรับ demo)
const ENFORCE_SHOP_HOURS = false;      // ปิดเช็คเวลาทำการระหว่าง dev — เปลี่ยนเป็น true ก่อนส่งงานจริง
const AVG_MINUTES_PER_ORDER = 5;       // เวลาเฉลี่ยต่อ 1 ออเดอร์ (นาที)

// ---------- State หลัก ----------
let cart = [];            // { menuId, addons[], spiceLevel, note } ต่อรายการ เลือกเมนูเดิมซ้ำได้
let allOrders = [];       // ออเดอร์ที่ยืนยัน+จ่ายแล้วทั้งหมด — คิวเดียว ไม่มีคิวแยกตามช่องทาง
let queueCounter = 0;     // เลขอ้างอิงออเดอร์ (unique id) — ไม่ใช่ลำดับคิวที่แสดงผล!
let isShopLoggedIn = false;
let isCustomerLoggedIn = false;  // แยกจาก isShopLoggedIn เพื่อความชัดเจนตอนอธิบาย
let currentUserPhone = "";
let customerProfiles = {}; // key: เบอร์โทร, value: { nickname }
let currentOtp = "";      // รหัส OTP จำลอง สุ่มใหม่ทุกครั้งที่กดส่งรหัส (ไม่ใช่ระบบจริง)
let selectedMenuId = "";  // เมนูที่กำลังเปิด panel ปรับแต่งอยู่

// ---------- State ฝั่งลูกค้าที่ใช้หน้า "คิวของฉัน" ----------
// เวลารอที่เหลือ (นาที) ของแต่ละออเดอร์ — key คือ queueNumber, ลดลงทุก 1 นาที
let minutesLeftByOrder = {};

// โหมดจำลองการสแกน QR ที่โต๊ะ: เปิดหน้าด้วย index.html?mode=dinein
const isDineInMode = new URLSearchParams(window.location.search).get("mode") === "dinein";

/*
โครงสร้าง 1 order ใน allOrders:
{ queueNumber, customerName, arrivalTime, dineType, cart, totalPrice, paid: true, phone, completed: false }
*/
