/* =========================================================================
   js/tracking.js
   -------------------------------------------------------------------------
   Track Voucher module: search by class/ID/name -> full voucher history
   (paid + unpaid, never hidden) -> period filter (current month, last
   month, last year, all history, custom range) -> report preview ->
   PDF/PNG/JPG export + WhatsApp share.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  requireLogin();
  document.getElementById("navName").textContent = academyConfig.name;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  setActiveNav("tracking");

  const els = {
    classFilterRow: document.getElementById("classFilterRow"),
    searchInput: document.getElementById("searchInput"),
    searchResults: document.getElementById("searchResults"),

    historyView: document.getElementById("historyView"),
    changeStudentBtn: document.getElementById("changeStudentBtn"),
    outStudentId: document.getElementById("out-studentId"),
    outClassName: document.getElementById("out-className"),
    outName: document.getElementById("out-name"),
    outRollNo: document.getElementById("out-rollNo"),

    periodFilterRow: document.getElementById("periodFilterRow"),
    customRangeRow: document.getElementById("customRangeRow"),
    fromDate: document.getElementById("fromDate"),
    toDate: document.getElementById("toDate"),
    historyTableBody: document.getElementById("historyTableBody"),
    previewReportBtn: document.getElementById("previewReportBtn"),

    reportView: document.getElementById("reportView"),
    reportEl: document.getElementById("reportEl"),
    reportTableBody: document.getElementById("reportTableBody"),
    backBtn: document.getElementById("backBtn"),
    savePngBtn: document.getElementById("savePngBtn"),
    saveJpgBtn: document.getElementById("saveJpgBtn"),
    savePdfBtn: document.getElementById("savePdfBtn"),
    shareBtn: document.getElementById("shareBtn")
  };

  let activeClass = "";
  let selectedStudent = null;
  let activePeriod = "current"; // current | last-month | last-year | all | custom
  let filteredVouchers = [];

  // ------------------------------- Class filter + search -------------------------------

  function renderClassFilters() {
    els.classFilterRow.innerHTML = "";
    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = "filter-chip filter-chip--active";
    allChip.textContent = "All Classes";
    allChip.addEventListener("click", () => setActiveClass("", allChip));
    els.classFilterRow.appendChild(allChip);

    classOptions.forEach((c) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip";
      chip.textContent = `Class ${c}`;
      chip.addEventListener("click", () => setActiveClass(c, chip));
      els.classFilterRow.appendChild(chip);
    });
  }
  function setActiveClass(className, chipEl) {
    activeClass = className;
    els.classFilterRow.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("filter-chip--active"));
    chipEl.classList.add("filter-chip--active");
    renderSearchResults(els.searchInput.value);
  }
  renderClassFilters();

  function renderSearchResults(query) {
    const results = searchStudents(query, activeClass);
    els.searchResults.innerHTML = "";
    if (!query && !activeClass) {
      els.searchResults.innerHTML = `<div class="search-empty">Start typing a Student ID or Name, or pick a class above.</div>`;
      return;
    }
    if (results.length === 0) {
      els.searchResults.innerHTML = `<div class="search-empty">No matching students.</div>`;
      return;
    }
    results.slice(0, 20).forEach((s) => {
      const row = document.createElement("div");
      row.className = "search-result-row";
      row.innerHTML = `
        <div class="search-result-row__info">
          <span class="search-result-row__name">${s.name}</span>
          <span class="search-result-row__meta">${s.studentId} · Roll ${s.rollNo} · Class ${s.className}</span>
        </div>
        <button class="btn btn--sm btn--primary">View History</button>`;
      row.querySelector("button").addEventListener("click", () => chooseStudent(s));
      els.searchResults.appendChild(row);
    });
  }
  els.searchInput.addEventListener("input", () => renderSearchResults(els.searchInput.value));
  renderSearchResults("");

  function chooseStudent(student) {
    selectedStudent = student;
    els.outStudentId.textContent = student.studentId;
    els.outClassName.textContent = student.className;
    els.outName.textContent = student.name;
    els.outRollNo.textContent = student.rollNo;

    els.historyView.classList.remove("hidden");
    renderPeriodFilters();
    applyPeriodFilter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  els.changeStudentBtn.addEventListener("click", () => {
    els.historyView.classList.add("hidden");
  });

  // ------------------------------- Period filter -------------------------------

  const PERIODS = [
    { key: "current", label: "Current Month" },
    { key: "last-month", label: "Last Month" },
    { key: "last-year", label: "Last Year" },
    { key: "all", label: "All History" },
    { key: "custom", label: "Custom Range" }
  ];

  function renderPeriodFilters() {
    els.periodFilterRow.innerHTML = "";
    PERIODS.forEach((p) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip" + (p.key === activePeriod ? " filter-chip--active" : "");
      chip.textContent = p.label;
      chip.addEventListener("click", () => {
        activePeriod = p.key;
        els.periodFilterRow.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("filter-chip--active"));
        chip.classList.add("filter-chip--active");
        els.customRangeRow.classList.toggle("visible", p.key === "custom");
        applyPeriodFilter();
      });
      els.periodFilterRow.appendChild(chip);
    });
    els.customRangeRow.classList.toggle("visible", activePeriod === "custom");
  }

  function periodRange() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    if (activePeriod === "current") {
      return { fromISO: `${y}-${String(m).padStart(2,"0")}-01`, toISO: todayISO() };
    }
    if (activePeriod === "last-month") {
      const lm = m === 1 ? 12 : m - 1;
      const ly = m === 1 ? y - 1 : y;
      const lastDay = new Date(ly, lm, 0).getDate();
      return { fromISO: `${ly}-${String(lm).padStart(2,"0")}-01`, toISO: `${ly}-${String(lm).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}` };
    }
    if (activePeriod === "last-year") {
      return { fromISO: `${y-1}-01-01`, toISO: `${y-1}-12-31` };
    }
    if (activePeriod === "custom") {
      return { fromISO: els.fromDate.value || "0000-01-01", toISO: els.toDate.value || "9999-12-31" };
    }
    // all
    return { fromISO: "0000-01-01", toISO: "9999-12-31" };
  }

  function applyPeriodFilter() {
    if (!selectedStudent) return;
    const all = vouchersForStudent(selectedStudent.studentId);
    if (activePeriod === "all") {
      filteredVouchers = all.slice();
    } else {
      const { fromISO, toISO } = periodRange();
      filteredVouchers = all.filter((v) => v.issueDate >= fromISO && v.issueDate <= toISO);
    }
    filteredVouchers.sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
    renderHistoryTable();
  }

  els.fromDate.addEventListener("change", applyPeriodFilter);
  els.toDate.addEventListener("change", applyPeriodFilter);

  function renderHistoryTable() {
    els.historyTableBody.innerHTML = "";
    if (filteredVouchers.length === 0) {
      els.historyTableBody.innerHTML = `<tr><td colspan="13" style="text-align:center; font-family:var(--font-body); color:var(--muted-color);">No vouchers found for this period.</td></tr>`;
      return;
    }
    filteredVouchers.forEach((v) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${monthYearLabel(v.month, v.year)}</td>
        <td>${v.voucherId}</td>
        <td>${formatDateHuman(v.issueDate)}</td>
        <td>${formatDateHuman(v.dueDate)}</td>
        <td>${v.paymentDate ? formatDateHuman(v.paymentDate) : "-"}</td>
        <td>${formatCurrency(v.actualFee)}</td>
        <td>${formatCurrency(v.discount)}</td>
        <td>${formatCurrency(v.tuitionFee)}</td>
        <td>${formatCurrency(v.assessmentFee)}</td>
        <td>Rs. ${v.fineRate}/day</td>
        <td>${formatCurrency(v.fine)}</td>
        <td>${formatCurrency(v.finalPayable)}</td>
        <td><span class="status-pill status-pill--${v.status === "PAID" ? "paid" : "unpaid"}">${v.status}</span></td>`;
      els.historyTableBody.appendChild(tr);
    });
  }

  // ------------------------------- Report preview -------------------------------

  els.previewReportBtn.addEventListener("click", () => {
    if (!selectedStudent) return;
    if (filteredVouchers.length === 0) {
      showToast("No vouchers to include in the report for this period.", "warning");
      return;
    }

    document.getElementById("r-academyName").textContent = academyConfig.name;
    document.getElementById("r-motto").textContent = academyConfig.motto;
    document.getElementById("r-contact").textContent = `${academyConfig.address} · ${academyConfig.phone}`;
    document.getElementById("r-period").textContent = PERIODS.find((p) => p.key === activePeriod).label;

    document.getElementById("r-studentId").textContent = selectedStudent.studentId;
    document.getElementById("r-className").textContent = selectedStudent.className;
    document.getElementById("r-name").textContent = selectedStudent.name;
    document.getElementById("r-rollNo").textContent = selectedStudent.rollNo;

    els.reportTableBody.innerHTML = "";
    filteredVouchers.forEach((v) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${monthYearLabel(v.month, v.year)}</td>
        <td>${formatDateHuman(v.issueDate)}</td>
        <td>${formatDateHuman(v.dueDate)}</td>
        <td>${v.paymentDate ? formatDateHuman(v.paymentDate) : "-"}</td>
        <td>${formatCurrency(v.actualFee)}</td>
        <td>${formatCurrency(v.fine)}</td>
        <td>${formatCurrency(v.finalPayable)}</td>
        <td><span class="status-pill status-pill--${v.status === "PAID" ? "paid" : "unpaid"}">${v.status}</span></td>`;
      els.reportTableBody.appendChild(tr);
    });

    document.getElementById("r-quote").textContent = `"${academyConfig.quote}"`;

    els.historyView.classList.add("hidden");
    els.reportView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Report generated.", "success");
  });

  els.backBtn.addEventListener("click", () => {
    els.reportView.classList.add("hidden");
    els.historyView.classList.remove("hidden");
  });

  // ------------------------------- Export / Share -------------------------------

  function filenameBase() {
    return selectedStudent ? `${selectedStudent.studentId}-fee-history` : "fee-history-report";
  }

  els.savePngBtn.addEventListener("click", () => exportElement(els.reportEl, "png", filenameBase()));
  els.saveJpgBtn.addEventListener("click", () => exportElement(els.reportEl, "jpg", filenameBase()));
  els.savePdfBtn.addEventListener("click", () => exportElement(els.reportEl, "pdf", filenameBase()));

  els.shareBtn.addEventListener("click", () => {
    if (!selectedStudent) return;
    const periodLabel = PERIODS.find((p) => p.key === activePeriod).label;
    const text =
      `${academyConfig.name} — Fee History Report\n` +
      `Student: ${selectedStudent.name} (${selectedStudent.studentId})\n` +
      `Class: ${selectedStudent.className}\n` +
      `Period: ${periodLabel}\n` +
      `Vouchers: ${filteredVouchers.length}`;
    shareOnWhatsApp(els.reportEl, text, filenameBase());
  });
});
