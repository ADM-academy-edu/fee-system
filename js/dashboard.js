/* =========================================================================
   js/dashboard.js
   -------------------------------------------------------------------------
   NEW FILE — Admin Analytics for pages/dashboard.html.

   This module is strictly READ-ONLY: it only reads the existing global
   `students` array (js/students.js) and `vouchers` array (js/vouchers.js)
   already loaded on the page, and reuses existing helpers from js/app.js
   (formatCurrency, monthYearLabel, studentsByClass, setLoading, showToast,
   etc.). It never creates, edits, or deletes a student or voucher record,
   and never touches payment status, fine, fee, or dates.

   Data shape assumed (matches js/students.js / js/vouchers.js exactly):
     student:  { studentId, rollNo, name, fatherName, className }
     voucher:  { voucherId, studentId, studentName, fatherName, rollNo,
                 className, month, year, totalFee, actualFee, discount,
                 discountPct, tuitionFee, assessmentFee, fineRate, fine,
                 finalPayable, issueDate, dueDate, paymentDate, status }

   Revenue is always based on `paymentDate`, never `issueDate`, and only
   vouchers with status === "PAID" count toward collected revenue.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initDashboardAnalytics();
});

/* -------------------------------------------------------------------------
   Period definitions
   ------------------------------------------------------------------------- */

const ANALYTICS_PERIODS = [
  { key: "current-month", label: "Current Month" },
  { key: "last-month", label: "Last Month" },
  { key: "last-3-months", label: "Last 3 Months" },
  { key: "current-year", label: "Current Year" },
  { key: "all-time", label: "All Time" },
  { key: "custom", label: "Custom Range" }
];

let activePeriod = "current-month";

/* -------------------------------------------------------------------------
   Entry point
   ------------------------------------------------------------------------- */

function initDashboardAnalytics() {
  const section = document.getElementById("analyticsSection");
  if (!section) return; // analytics markup not present — nothing to do

  renderPeriodFilter();
  loadDashboardData();

  const applyBtn = document.getElementById("applyCustomRangeBtn");
  if (applyBtn) applyBtn.addEventListener("click", () => {
    if (validateCustomRange()) loadDashboardData();
  });
}

/* -------------------------------------------------------------------------
   loadDashboardData()
   Reads the existing global data, guards against it being missing/broken,
   shows a loading state while calculating, then updates every KPI/chart.
   ------------------------------------------------------------------------- */

function loadDashboardData() {
  const section = document.getElementById("analyticsSection");
  showLoading(section);
  clearError();

  // Defer slightly so the loading state is actually visible/perceptible,
  // and so a calculation error doesn't leave the UI stuck mid-render.
  setTimeout(() => {
    let studentList, voucherList;

    try {
      if (typeof students === "undefined") throw new Error("students missing");
      studentList = students;
    } catch (err) {
      hideLoading(section);
      showError("Unable to load student data.");
      return;
    }

    try {
      if (typeof vouchers === "undefined") throw new Error("vouchers missing");
      voucherList = vouchers;
    } catch (err) {
      hideLoading(section);
      showError("Unable to load voucher data.");
      return;
    }

    try {
      updateAnalytics(studentList, voucherList);
    } catch (err) {
      console.error("Dashboard analytics calculation failed:", err);
      showError("Unable to calculate analytics from the existing data.");
    }

    hideLoading(section);
  }, 150);
}

/* -------------------------------------------------------------------------
   updateAnalytics()
   Orchestrates every calculation + render step for the current period.
   ------------------------------------------------------------------------- */

function updateAnalytics(studentList, voucherList) {
  const totalStudents = calculateTotalStudents(studentList);
  const classCounts = calculateClassCounts(studentList);

  const range = filterVouchersByPeriod(activePeriod);
  const paidInPeriod = getPaidVouchersInRange(voucherList, range);
  const paidStudents = calculatePaidStudents(paidInPeriod);
  const revenue = calculateRevenue(paidInPeriod);
  const fineRevenue = calculateFineRevenue(paidInPeriod);
  const feeRevenue = revenue - fineRevenue;

  const now = new Date();
  const currentMonthRange = { fromISO: firstDayOfMonthISO(now), toISO: todayISO() };
  const currentMonthPaid = getPaidVouchersInRange(voucherList, currentMonthRange);
  const currentMonthRevenue = calculateRevenue(currentMonthPaid);

  const unpaidCount = voucherList.filter((v) => v && v.status === "UNPAID").length;

  updateKPICards({
    totalStudents,
    paidStudentsCount: paidStudents.size,
    totalCollected: revenue,
    currentMonthRevenue,
    currentMonthLabel: monthYearLabel(now.getMonth() + 1, now.getFullYear())
  });

  updateBreakdown({
    feeRevenue,
    fineRevenue,
    totalRevenue: revenue,
    paidVoucherCount: paidInPeriod.length,
    unpaidVoucherCount: unpaidCount,
    hasData: paidInPeriod.length > 0
  });

  renderClassChart(classCounts);

  toggleEmptyState("noStudentsNotice", totalStudents === 0);
}

/* -------------------------------------------------------------------------
   Calculation functions
   ------------------------------------------------------------------------- */

/** Total registered students — reads js/students.js directly, never hard-coded. */
function calculateTotalStudents(studentList) {
  return Array.isArray(studentList) ? studentList.length : 0;
}

/** Number of students per class (1-12), using the existing classOptions from config.js. */
function calculateClassCounts(studentList) {
  const counts = {};
  (typeof classOptions !== "undefined" ? classOptions : []).forEach((c) => (counts[c] = 0));
  (studentList || []).forEach((s) => {
    if (!s || !s.className) return;
    counts[s.className] = (counts[s.className] || 0) + 1;
  });
  return counts;
}

/** Unique Student IDs with at least one PAID voucher in the given voucher list (not voucher count). */
function calculatePaidStudents(paidVouchers) {
  const ids = new Set();
  paidVouchers.forEach((v) => v && v.studentId && ids.add(v.studentId));
  return ids;
}

/** Total collected (Rs.) from a list of already-filtered PAID vouchers, using the existing finalPayable field. */
function calculateRevenue(paidVouchers) {
  return paidVouchers.reduce((sum, v) => sum + (Number(v && v.finalPayable) || 0), 0);
}

/** Total fine collected (Rs.) from a list of already-filtered PAID vouchers. */
function calculateFineRevenue(paidVouchers) {
  return paidVouchers.reduce((sum, v) => sum + (Number(v && v.fine) || 0), 0);
}

/**
 * Resolve the current analytics period into a { fromISO, toISO } range.
 * "all-time" returns null bounds (no filtering).
 */
function filterVouchersByPeriod(periodKey) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  if (periodKey === "current-month") {
    return { fromISO: firstDayOfMonthISO(now), toISO: todayISO() };
  }
  if (periodKey === "last-month") {
    const lm = m === 1 ? 12 : m - 1;
    const ly = m === 1 ? y - 1 : y;
    const lastDay = new Date(ly, lm, 0).getDate();
    return { fromISO: `${ly}-${String(lm).padStart(2, "0")}-01`, toISO: `${ly}-${String(lm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` };
  }
  if (periodKey === "last-3-months") {
    const d = new Date(y, m - 1 - 2, 1); // first day, 2 months back + this month = 3 months
    return { fromISO: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`, toISO: todayISO() };
  }
  if (periodKey === "current-year") {
    return { fromISO: `${y}-01-01`, toISO: todayISO() };
  }
  if (periodKey === "custom") {
    const fromEl = document.getElementById("analyticsFromDate");
    const toEl = document.getElementById("analyticsToDate");
    const fromISO = fromEl && fromEl.value ? fromEl.value : "0000-01-01";
    const toISO = toEl && toEl.value ? toEl.value : "9999-12-31";
    return { fromISO, toISO };
  }
  // all-time
  return { fromISO: "0000-01-01", toISO: "9999-12-31" };
}

/**
 * PAID vouchers whose PAYMENT DATE (not issue date) falls within the range.
 * A voucher issued in one month but paid in a later month counts toward
 * the month it was actually paid in.
 */
function getPaidVouchersInRange(voucherList, range) {
  return (voucherList || []).filter((v) => {
    if (!v || v.status !== "PAID" || !v.paymentDate) return false;
    return v.paymentDate >= range.fromISO && v.paymentDate <= range.toISO;
  });
}

function firstDayOfMonthISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/* -------------------------------------------------------------------------
   Rendering
   ------------------------------------------------------------------------- */

function updateKPICards({ totalStudents, paidStudentsCount, totalCollected, currentMonthRevenue, currentMonthLabel }) {
  setText("kpi-totalStudents", totalStudents.toLocaleString("en-PK"));
  setText("kpi-studentsPaid", paidStudentsCount.toLocaleString("en-PK"));
  setText("kpi-totalCollected", formatCurrency(totalCollected));
  setText("kpi-currentMonthValue", formatCurrency(currentMonthRevenue));
  setText("kpi-currentMonthLabel", currentMonthLabel);
}

function updateBreakdown({ feeRevenue, fineRevenue, totalRevenue, paidVoucherCount, unpaidVoucherCount, hasData }) {
  const panel = document.getElementById("breakdownContent");
  const empty = document.getElementById("breakdownEmpty");
  if (!panel) return;

  if (!hasData) {
    panel.classList.add("hidden");
    if (empty) empty.classList.remove("hidden");
    return;
  }
  panel.classList.remove("hidden");
  if (empty) empty.classList.add("hidden");

  setText("breakdown-fee", formatCurrency(feeRevenue));
  setText("breakdown-fine", formatCurrency(fineRevenue));
  setText("breakdown-total", formatCurrency(totalRevenue));
  setText("breakdown-paidCount", paidVoucherCount.toLocaleString("en-PK"));
  setText("breakdown-unpaidCount", unpaidVoucherCount.toLocaleString("en-PK"));
}

function renderClassChart(classCounts) {
  const container = document.getElementById("classChart");
  if (!container) return;

  const entries = Object.entries(classCounts); // [ ["1", 12], ["2", 8], ... ]
  const max = Math.max(1, ...entries.map(([, count]) => count));

  container.innerHTML = "";
  entries.forEach(([className, count]) => {
    const heightPct = Math.round((count / max) * 100);
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.innerHTML = `
      <span class="chart-bar__count">${count}</span>
      <div class="chart-bar__fill" style="height:${Math.max(heightPct, count > 0 ? 4 : 0)}%"></div>
      <span class="chart-bar__label">C${className}</span>`;
    bar.title = `Class ${className}: ${count} student${count === 1 ? "" : "s"}`;
    container.appendChild(bar);
  });
}

function renderPeriodFilter() {
  const row = document.getElementById("analyticsFilterRow");
  const customRow = document.getElementById("analyticsCustomRow");
  if (!row) return;

  row.innerHTML = "";
  ANALYTICS_PERIODS.forEach((p) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip" + (p.key === activePeriod ? " filter-chip--active" : "");
    chip.textContent = p.label;
    chip.addEventListener("click", () => {
      activePeriod = p.key;
      row.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("filter-chip--active"));
      chip.classList.add("filter-chip--active");
      if (customRow) customRow.classList.toggle("visible", p.key === "custom");
      if (p.key !== "custom") loadDashboardData();
    });
    row.appendChild(chip);
  });
  if (customRow) customRow.classList.toggle("visible", activePeriod === "custom");
}

function validateCustomRange() {
  const fromEl = document.getElementById("analyticsFromDate");
  const toEl = document.getElementById("analyticsToDate");
  const errEl = document.getElementById("analyticsRangeError");
  if (!fromEl || !toEl) return true;

  if (!fromEl.value || !toEl.value) {
    if (errEl) errEl.textContent = "Please choose both a From Date and a To Date.";
    return false;
  }
  if (fromEl.value > toEl.value) {
    if (errEl) errEl.textContent = "From Date cannot be after To Date.";
    return false;
  }
  if (errEl) errEl.textContent = "";
  return true;
}

/* -------------------------------------------------------------------------
   Loading / empty / error states
   ------------------------------------------------------------------------- */

/** Thin wrapper around the existing setLoading() helper from js/app.js. */
function showLoading(container) {
  if (typeof setLoading === "function") setLoading(container, true, "Loading Analytics…");
}
function hideLoading(container) {
  if (typeof setLoading === "function") setLoading(container, false);
}

function showError(message) {
  const el = document.getElementById("analyticsError");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}
function clearError() {
  const el = document.getElementById("analyticsError");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function toggleEmptyState(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
