/* =========================================================================
   js/app.js
   -------------------------------------------------------------------------
   Shared application helpers used by every page: session/auth guard,
   toast notifications, currency/date formatting, Student ID & Roll Number
   generation, student/voucher lookup & search, voucher ID generation,
   duplicate-month protection, JSON pretty-print + copy-to-clipboard, and
   simple nav active-state handling.
   ========================================================================= */

/* ------------------------------- Session -------------------------------- */

const SESSION_KEY = "ia_admin_session";

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}
function setLoggedIn() {
  sessionStorage.setItem(SESSION_KEY, "true");
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  const inPages = window.location.pathname.includes("/pages/");
  window.location.href = inPages ? "../index.html" : "index.html";
}
/** Call at the top of any protected page (inside /pages/) to bounce unauthenticated visitors back to login. */
function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = "../index.html";
  }
}

/* ---------------------------- Currency & Numbers ------------------------- */

function formatCurrency(amount) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return "Rs. " + Math.round(safe).toLocaleString("en-PK");
}
function formatPercent(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(2) + "%";
}

/* -------------------------------- Dates ---------------------------------- */

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatDateHuman(isoDate) {
  if (!isoDate) return "-";
  const [y, m, d] = isoDate.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${dd}-${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`;
}
/** Whole number of calendar days between two "YYYY-MM-DD" dates (later - earlier), local-date math. */
function daysBetween(earlierISO, laterISO) {
  const [y1, m1, d1] = earlierISO.split("-").map(Number);
  const [y2, m2, d2] = laterISO.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function monthYearLabel(month, year) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/* ------------------------------- Students -------------------------------- */

function findStudentById(id) {
  if (typeof students === "undefined") return null;
  return students.find((s) => s.studentId === id) || null;
}
function studentsByClass(className) {
  if (typeof students === "undefined") return [];
  if (!className) return students.slice();
  return students.filter((s) => s.className === String(className));
}
/** Search students by (partial, case-insensitive) ID or name. */
function searchStudents(query, className) {
  const pool = studentsByClass(className);
  const q = (query || "").trim().toLowerCase();
  if (!q) return pool;
  return pool.filter(
    (s) => s.studentId.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

/* --------------------- Student ID / Roll No generation -------------------- */

/** Next 3-digit sequence number for a given class, based on existing students. */
function nextSequenceForClass(className) {
  const existing = studentsByClass(className);
  let max = 0;
  existing.forEach((s) => {
    const parts = s.studentId.split("-");
    const seq = parseInt(parts[2], 10);
    if (!isNaN(seq) && seq > max) max = seq;
  });
  return max + 1;
}
function generateStudentId(className, sequence) {
  return `STD-${className}-${String(sequence).padStart(3, "0")}`;
}
function generateRollNo(className, sequence) {
  const classPart = String(className).padStart(2, "0");
  const seqPart = String(sequence).padStart(3, "0");
  return `1${classPart}${seqPart}`;
}
function isDuplicateStudentId(id) {
  return !!findStudentById(id);
}
function isDuplicateRollNo(rollNo) {
  if (typeof students === "undefined") return false;
  return students.some((s) => s.rollNo === rollNo);
}

/* -------------------------------- Vouchers -------------------------------- */

function findVoucherById(voucherId) {
  if (typeof vouchers === "undefined") return null;
  return vouchers.find((v) => v.voucherId === voucherId) || null;
}
function vouchersForStudent(studentId) {
  if (typeof vouchers === "undefined") return [];
  return vouchers.filter((v) => v.studentId === studentId);
}
/** Does this student already have a voucher for the given month/year? */
function hasVoucherForMonth(studentId, month, year) {
  if (typeof vouchers === "undefined") return null;
  return vouchers.find(
    (v) => v.studentId === studentId && v.month === Number(month) && v.year === Number(year)
  ) || null;
}
/** Next sequence for a voucher ID within a given year+month, e.g. IA-2026-08-0001. */
function generateVoucherId(month, year) {
  if (typeof vouchers === "undefined") return `IA-${year}-${String(month).padStart(2,"0")}-0001`;
  const prefix = `IA-${year}-${String(month).padStart(2, "0")}-`;
  let max = 0;
  vouchers.forEach((v) => {
    if (v.voucherId && v.voucherId.startsWith(prefix)) {
      const seq = parseInt(v.voucherId.split("-")[3], 10);
      if (!isNaN(seq) && seq > max) max = seq;
    }
  });
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/** Filter vouchers by class / studentId / name search text (any combination, all optional). */
function searchVouchers({ className, query, month, year } = {}) {
  if (typeof vouchers === "undefined") return [];
  let list = vouchers.slice();
  if (className) list = list.filter((v) => v.className === String(className));
  if (month) list = list.filter((v) => v.month === Number(month));
  if (year) list = list.filter((v) => v.year === Number(year));
  const q = (query || "").trim().toLowerCase();
  if (q) {
    list = list.filter(
      (v) => v.studentId.toLowerCase().includes(q) || (v.studentName || "").toLowerCase().includes(q)
    );
  }
  return list;
}

/* -------------------------------- Toasts ---------------------------------- */

/** type: "error" | "success" | "info" | "warning" */
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

/* ------------------------------ JSON / Copy -------------------------------- */

/** Pretty-print a plain object as a JS object literal (unquoted keys) for pasting into a data file. */
function toJsObjectLiteral(obj, indent = 2) {
  const pad = " ".repeat(indent);
  const lines = Object.keys(obj).map((key) => {
    const val = obj[key];
    const formatted = typeof val === "string" ? `"${val}"` : val === null ? "null" : val;
    return `${pad}${key}: ${formatted}`;
  });
  return `{\n${lines.join(",\n")}\n}`;
}

/** Copy text to clipboard with a toast confirmation; falls back gracefully if the Clipboard API is unavailable. */
async function copyToClipboard(text, successMessage = "Copied to clipboard.") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage, "success");
  } catch (err) {
    // Fallback for older/unsupported browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(successMessage, "success");
    } catch (e) {
      showToast("Could not copy automatically — please select and copy manually.", "error");
    }
    ta.remove();
  }
}

/* ------------------------------ Navigation -------------------------------- */

/** Highlight the current page's nav link. Call after the navbar HTML exists in the DOM. */
function setActiveNav(pageKey) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.getAttribute("data-nav") === pageKey) {
      link.classList.add("navbar__link--active");
      link.setAttribute("aria-current", "page");
    }
  });
}

/* -------------------------------- Loading ---------------------------------- */

/** Show/hide a full-panel loading overlay inside a given container element. */
function setLoading(container, isLoading, message = "Loading…") {
  if (!container) return;
  let overlay = container.querySelector(".loading-overlay");
  if (isLoading) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "loading-overlay";
      overlay.innerHTML = `<div class="spinner" aria-hidden="true"></div><span>${message}</span>`;
      container.style.position = "relative";
      container.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
}
