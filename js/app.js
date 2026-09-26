// ================================
// app.js — ส่วนกลาง: showScreen (ใช้ร่วมทั้งสองฝั่ง), login, bootstrap
// ================================

// ---------- Select element ที่ต้องใช้ ----------
const allScreens = document.querySelectorAll(".screen");
const allTabBars = document.querySelectorAll(".tab-bar");

// หน้า login (ใช้ร่วมกันทั้งลูกค้าและร้านค้า)
const loginBackBtn = document.querySelector("#loginBackBtn");
const phoneInput = document.querySelector("#phoneInput");
const phoneError = document.querySelector("#phoneError");
const sendOtpBtn = document.querySelector("#sendOtpBtn");
const otpBox = document.querySelector("#otpBox");
const demoOtpText = document.querySelector("#demoOtpText");
const otpInput = document.querySelector("#otpInput");
const otpError = document.querySelector("#otpError");
const verifyOtpBtn = document.querySelector("#verifyOtpBtn");

const dineInNotice = document.querySelector("#dineInNotice");


// ================================
// showScreen: สลับ screen (ใช้ classList.add / remove "hidden" ไม่โหลดหน้าใหม่)
// มี guard: ถ้าจะเข้า #shopScreen ทั้งที่ isShopLoggedIn ไม่ใช่ true → เด้งกลับหน้าแรก
// ================================
function showScreen(screenId) {
  if (screenId === "shopScreen" && !isShopLoggedIn) {
    screenId = "homeScreen";
  }

  // ซ่อนทุก screen แล้วเปิดเฉพาะ screen ที่ต้องการ
  allScreens.forEach(function (screen) {
    screen.classList.add("hidden");
  });
  document.querySelector("#" + screenId).classList.remove("hidden");

  // ซ่อน Tab Bar หลักถ้าอยู่ในโหมดร้านค้า
  allTabBars.forEach(function (bar) {
    bar.classList.toggle("hidden", isShopLoggedIn);
  });

  // ไฮไลต์ปุ่มใน Tab Bar หลักที่ตรงกับ screen นี้
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.target === screenId);
  });

  // ให้แต่ละฝั่งเติมข้อมูลของหน้านั้นให้ทันสมัย
  if (screenId === "shopScreen") {
    renderShop();
    showShopTab("shopQueueTab"); // เข้าหน้าร้านค้าทีไรเริ่มที่แท็บคิวปัจจุบัน
  } else {
    showCustomerScreen(screenId);
  }
}


// ================================
// Event: ปุ่มย้อนกลับของหน้า login → หน้าแรก
// ================================
loginBackBtn.addEventListener("click", function () {
  showScreen("homeScreen");
});

// ================================
// สุ่มรหัส OTP 6 หลัก (100000-999999)
// ================================
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ================================
// Event: กด #sendOtpBtn → ตรวจเบอร์ สุ่มรหัสใหม่ แล้วโชว์รหัสจำลองบนจอ (ไม่ส่ง SMS จริง)
// ================================
sendOtpBtn.addEventListener("click", function () {
  if (!/^[0-9]{10}$/.test(phoneInput.value.trim())) {
    phoneError.textContent = "กรุณากรอกเบอร์โทรเป็นตัวเลข 10 หลัก";
    phoneError.classList.remove("hidden");
    return;
  }
  phoneError.classList.add("hidden");
  currentOtp = generateOtp(); // กดส่งซ้ำ = ได้รหัสใหม่ รหัสเก่าใช้ไม่ได้
  demoOtpText.textContent = "รหัส Demo: " + currentOtp;
  otpBox.classList.remove("hidden");
});

// ================================
// Event: กด #verifyOtpBtn → เทียบรหัส แล้ว "ตัดสิน role" หลังยืนยันสำเร็จเท่านั้น
//   รหัสผิด → แสดง #otpError
//   รหัสถูก → เก็บเบอร์ แล้วเช็ค SELLER_PHONES.includes(phone)
//       true  → isShopLoggedIn = true → #shopScreen
//       false → #menuScreen (ลูกค้าปกติ)
// ================================
verifyOtpBtn.addEventListener("click", function () {
  // currentOtp === "" = ยังไม่เคยกดส่งรหัส ต้องไม่ผ่านแม้ช่องกรอกจะว่าง
  if (currentOtp === "" || otpInput.value !== currentOtp) {
    otpError.textContent = "รหัสไม่ถูกต้อง";
    otpError.classList.remove("hidden");
    return;
  }
  otpError.classList.add("hidden");
  currentOtp = ""; // ใช้ได้ครั้งเดียว
  currentUserPhone = phoneInput.value.trim();

  // ล้างฟอร์ม login ไว้ใช้ครั้งหน้า
  phoneInput.value = "";
  otpInput.value = "";
  otpBox.classList.add("hidden");

  if (SELLER_PHONES.includes(currentUserPhone)) {
    isShopLoggedIn = true;
    isCustomerLoggedIn = false;
    showScreen("shopScreen");
  } else {
    isShopLoggedIn = false;
    isCustomerLoggedIn = true; // จำไว้ว่าลูกค้าล็อกอินแล้ว รอบหน้ากด "สั่งอาหารเลย" ข้าม login ได้
    showScreen("menuScreen");
  }
});


// ================================
// bootstrap: ทำงานตอนโหลดหน้าเว็บ
// ================================
buildCustomizeOptions();                          // สร้าง add-on / ระดับเผ็ด (customer.js)
dineInNotice.classList.toggle("hidden", !isDineInMode); // โชว์ข้อความถ้ามาจาก ?mode=dinein
showScreen("homeScreen");
