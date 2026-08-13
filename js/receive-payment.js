/* =========================================================================
   js/receive-payment.js
   -------------------------------------------------------------------------
   Receive Payment module: default to current month vouchers -> class
   filter + ID/name search -> select voucher -> payment date/status ->
   fine calculation -> preview (same voucher, updated fields) -> export +
   WhatsApp -> generated "update this record" JSON for vouchers.js.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  requireLogin();
  document.getElementById("navName").textContent = academyConfig.name;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  setActiveNav("payment");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  document.getElementById("defaultFilterNote").textContent =
    `Showing ${monthYearLabel(currentMonth, currentYear)} vouchers by default. Use "Show All Months" to see every issued voucher.`;

  const els = {
    classFilterRow: document.getElementById("classFilterRow"),
    searchInput: document.getElementById("searchInput"),
    showAllBtn: document.getElementById("showAllBtn"),
    voucherTableBody: document.getElementById("voucherTableBody"),

    selectView: document.getElementById("selectView"),
    formView: document.getElementById("formView"),
    previewView: document.getElementById("previewView"),
    changeVoucherBtn: document.getElementById("changeVoucherBtn"),

    outVoucherId: document.getElementById("out-voucherId"),
    outClassName: document.getElementById("out-className"),
    outStudentId: document.getElementById("out-studentId"),
    outName: document.getElementById("out-name"),
    outRollNo: document.getElementById("out-rollNo"),
    outMonth: document.getElementById("out-month"),
    outTotalFee: document.getElementById("out-totalFee"),
    outActualFee: document.getElementById("out-actualFee"),
    outDiscount: document.getElementById("out-discount"),
    outDiscountPct: document.getElementById("out-discountPct"),
    outTuition: document.getElementById("out-tuition"),
    outAssessment: document.getElementById("out-assessment"),
    outIssueDate: document.getElementById("out-issueDate"),
    outDueDate: document.getElementById("out-dueDate"),

    paymentDate: document.getElementById("paymentDate"),
    paymentStatus: document.getElementById("paymentStatus"),
    errPaymentDate: document.getElementById("err-paymentDate"),

    calcLateDays: document.getElementById("calc-lateDays"),
    calcFineRate: document.getElementById("calc-fineRate"),
    calcFine: document.getElementById("calc-fine"),
    sumFinalPayable: document.getElementById("sum-finalPayable"),

    generateBtn: document.getElementById("generateBtn"),
    editBtn: document.getElementById("editBtn"),
    regenerateBtn: document.getElementById("regenerateBtn"),
    savePngBtn: document.getElementById("savePngBtn"),
    saveJpgBtn: document.getElementById("saveJpgBtn"),
    savePdfBtn: document.getElementById("savePdfBtn"),
    shareBtn: document.getElementById("shareBtn"),
    voucherEl: document.getElementById("voucherEl"),
    jsonOutput: document.getElementById("jsonOutput"),
    copyJsonBtn: document.getElementById("copyJsonBtn")
  };

  let activeClass = "";
  let showAll = false;
  let selectedVoucher = null;
  let updatedVoucher = null;

  // ------------------------------- Class filter chips -------------------------------

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
    renderTable();
  }
  renderClassFilters();

  // ------------------------------- Table -------------------------------

  function renderTable() {
    const filters = { className: activeClass, query: els.searchInput.value };
    if (!showAll) {
      filters.month = currentMonth;
      filters.year = currentYear;
    }
    const results = searchVouchers(filters);

    els.voucherTableBody.innerHTML = "";
    if (results.length === 0) {
      els.voucherTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; font-family:var(--font-body); color:var(--muted-color);">No vouchers found for the current filters.</td></tr>`;
      return;
    }
    results.forEach((v) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${v.voucherId}</td>
        <td style="font-family:var(--font-body); font-weight:600;">${v.studentName}</td>
        <td>${v.className}</td>
        <td>${monthYearLabel(v.month, v.year)}</td>
        <td>${formatCurrency(v.actualFee)}</td>
        <td>${formatDateHuman(v.dueDate)}</td>
        <td><span class="status-pill status-pill--${v.status === "PAID" ? "paid" : "unpaid"}">${v.status}</span></td>
        <td><button class="btn btn--sm btn--primary">Select</button></td>`;
      tr.querySelector("button").addEventListener("click", () => chooseVoucher(v));
      els.voucherTableBody.appendChild(tr);
    });
  }

  els.searchInput.addEventListener("input", renderTable);
  els.showAllBtn.addEventListener("click", () => {
    showAll = !showAll;
    els.showAllBtn.textContent = showAll ? "Show Current Month Only" : "Show All Months";
    renderTable();
  });

  renderTable();

  // ------------------------------- Select voucher -------------------------------

  function chooseVoucher(v) {
    selectedVoucher = v;

    els.outVoucherId.textContent = v.voucherId;
    els.outClassName.textContent = v.className;
    els.outStudentId.textContent = v.studentId;
    els.outName.textContent = v.studentName;
    els.outRollNo.textContent = v.rollNo;
    els.outMonth.textContent = monthYearLabel(v.month, v.year);

    els.outTotalFee.textContent = formatCurrency(v.totalFee);
    els.outActualFee.textContent = formatCurrency(v.actualFee);
    els.outDiscount.textContent = formatCurrency(v.discount);
    els.outDiscountPct.textContent = formatPercent(v.discountPct);
    els.outTuition.textContent = formatCurrency(v.tuitionFee);
    els.outAssessment.textContent = formatCurrency(v.assessmentFee);
    els.outIssueDate.textContent = formatDateHuman(v.issueDate);
    els.outDueDate.textContent = formatDateHuman(v.dueDate);

    els.paymentDate.value = v.paymentDate || todayISO();
    els.paymentStatus.value = v.status === "PAID" ? "PAID" : "UNPAID";
    els.calcFineRate.textContent = `Rs. ${v.fineRate}/day`;

    recalcFine();

    els.selectView.classList.add("hidden");
    els.formView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  els.changeVoucherBtn.addEventListener("click", () => {
    els.formView.classList.add("hidden");
    els.selectView.classList.remove("hidden");
  });

  // ------------------------------- Fine calculation -------------------------------

  function recalcFine() {
    if (!selectedVoucher) return { lateDays: 0, fine: 0 };
    const fineBreakdown = computeFineBreakdown(selectedVoucher.dueDate, els.paymentDate.value);
    els.calcLateDays.textContent = fineBreakdown.lateDays;
    els.calcFine.textContent = formatCurrency(fineBreakdown.fine);
    const finalPayable = calculateFinalAmount(selectedVoucher.actualFee, fineBreakdown.fine);
    els.sumFinalPayable.textContent = formatCurrency(finalPayable);
    validatePaymentDate(false);
    return fineBreakdown;
  }

  function validatePaymentDate(showErrors) {
    let msg = "";
    if (!els.paymentDate.value && showErrors) msg = "Payment date is required.";
    els.errPaymentDate.textContent = msg;
    return msg === "";
  }

  els.paymentDate.addEventListener("input", recalcFine);
  els.paymentDate.addEventListener("change", recalcFine);
  els.paymentStatus.addEventListener("change", recalcFine);

  // ------------------------------- Generate / Preview -------------------------------

  function buildUpdatedVoucher() {
    const fineBreakdown = recalcFine();
    const finalPayable = calculateFinalAmount(selectedVoucher.actualFee, fineBreakdown.fine);
    return {
      ...selectedVoucher,
      fine: fineBreakdown.fine,
      finalPayable,
      paymentDate: els.paymentDate.value,
      status: els.paymentStatus.value === "PAID" ? "PAID" : "UNPAID"
    };
  }

  function fillPreview(v) {
    document.getElementById("v-academyName").textContent = academyConfig.name;
    document.getElementById("v-motto").textContent = academyConfig.motto;
    document.getElementById("v-contact").textContent = `${academyConfig.address} · ${academyConfig.phone}`;
    document.getElementById("v-voucherId").textContent = v.voucherId;

    document.getElementById("v-studentId").textContent = v.studentId;
    document.getElementById("v-className").textContent = v.className;
    document.getElementById("v-name").textContent = v.studentName;
    document.getElementById("v-rollNo").textContent = v.rollNo;
    document.getElementById("v-fatherName").textContent = v.fatherName;
    document.getElementById("v-monthYear").textContent = monthYearLabel(v.month, v.year);

    document.getElementById("v-totalFee").textContent = formatCurrency(v.totalFee);
    document.getElementById("v-actualFee").textContent = formatCurrency(v.actualFee);
    document.getElementById("v-discount").textContent = formatCurrency(v.discount);
    document.getElementById("v-discountPct").textContent = formatPercent(v.discountPct);
    document.getElementById("v-tuition").textContent = formatCurrency(v.tuitionFee);
    document.getElementById("v-assessment").textContent = formatCurrency(v.assessmentFee);
    document.getElementById("v-fineRate").textContent = `Rs. ${v.fineRate}/day`;
    document.getElementById("v-fine").textContent = formatCurrency(v.fine);
    document.getElementById("v-finalPayable").textContent = formatCurrency(v.finalPayable);

    document.getElementById("v-issueDate").textContent = formatDateHuman(v.issueDate);
    document.getElementById("v-dueDate").textContent = formatDateHuman(v.dueDate);
    document.getElementById("v-paymentDate").textContent = formatDateHuman(v.paymentDate);
    document.getElementById("v-lateDays").textContent = calculateLateDays(v.dueDate, v.paymentDate);

    const statusEl = document.getElementById("v-status");
    statusEl.textContent = v.status;
    statusEl.className = "status-pill " + (v.status === "PAID" ? "status-pill--paid" : "status-pill--unpaid");

    document.getElementById("v-quote").textContent = `"${academyConfig.quote}"`;

    els.jsonOutput.textContent = toJsObjectLiteral(v) + ",";
  }

  els.generateBtn.addEventListener("click", () => {
    if (!selectedVoucher) {
      showToast("Please select a voucher first.", "error");
      return;
    }
    if (!validatePaymentDate(true) || !els.paymentDate.value) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }
    updatedVoucher = buildUpdatedVoucher();
    fillPreview(updatedVoucher);
    els.formView.classList.add("hidden");
    els.previewView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Payment voucher generated successfully.", "success");
  });

  els.editBtn.addEventListener("click", () => {
    els.previewView.classList.add("hidden");
    els.formView.classList.remove("hidden");
  });

  els.regenerateBtn.addEventListener("click", () => {
    if (!validatePaymentDate(true) || !els.paymentDate.value) {
      showToast("Please fix the highlighted fields.", "error");
      els.previewView.classList.add("hidden");
      els.formView.classList.remove("hidden");
      return;
    }
    updatedVoucher = buildUpdatedVoucher();
    fillPreview(updatedVoucher);
    showToast("Voucher regenerated.", "success");
  });

  // ------------------------------- Export / Share -------------------------------

  function filenameBase() {
    return updatedVoucher ? `${updatedVoucher.voucherId}-payment` : "payment-voucher";
  }

  els.savePngBtn.addEventListener("click", () => exportElement(els.voucherEl, "png", filenameBase()));
  els.saveJpgBtn.addEventListener("click", () => exportElement(els.voucherEl, "jpg", filenameBase()));
  els.savePdfBtn.addEventListener("click", () => exportElement(els.voucherEl, "pdf", filenameBase()));

  els.shareBtn.addEventListener("click", () => {
    if (!updatedVoucher) return;
    const v = updatedVoucher;
    const text =
      `${academyConfig.name} — Payment Record\n` +
      `Voucher: ${v.voucherId}\n` +
      `Student: ${v.studentName} (${v.studentId})\n` +
      `Month: ${monthYearLabel(v.month, v.year)}\n` +
      `Final Payable: ${formatCurrency(v.finalPayable)}\n` +
      `Fine: ${formatCurrency(v.fine)}\n` +
      `Status: ${v.status}`;
    shareOnWhatsApp(els.voucherEl, text, filenameBase());
  });

  els.copyJsonBtn.addEventListener("click", () => {
    copyToClipboard(els.jsonOutput.textContent, "Updated JSON copied — replace the matching record in js/vouchers.js.");
  });
});
