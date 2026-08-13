/* =========================================================================
   js/issue-voucher.js
   -------------------------------------------------------------------------
   Issue Fee module: class selection -> student search -> duplicate-month
   guard -> fee calculation -> dates -> voucher preview (no seal) ->
   PNG/JPG/PDF export + WhatsApp share -> generated vouchers.js JSON.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  requireLogin();
  document.getElementById("navName").textContent = academyConfig.name;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  setActiveNav("issue");

  const els = {
    classGrid: document.getElementById("classGrid"),
    searchPanel: document.getElementById("searchPanel"),
    searchInput: document.getElementById("searchInput"),
    searchResults: document.getElementById("searchResults"),
    selectView: document.getElementById("selectView"),
    formView: document.getElementById("formView"),
    previewView: document.getElementById("previewView"),
    changeStudentBtn: document.getElementById("changeStudentBtn"),

    outStudentId: document.getElementById("out-studentId"),
    outClassName: document.getElementById("out-className"),
    outName: document.getElementById("out-name"),
    outFatherName: document.getElementById("out-fatherName"),
    outRollNo: document.getElementById("out-rollNo"),

    totalFee: document.getElementById("totalFee"),
    actualFee: document.getElementById("actualFee"),
    issueDate: document.getElementById("issueDate"),
    dueDate: document.getElementById("dueDate"),

    calcDiscount: document.getElementById("calc-discount"),
    calcDiscountPct: document.getElementById("calc-discountPct"),
    calcTuition: document.getElementById("calc-tuition"),
    calcAssessment: document.getElementById("calc-assessment"),

    sumTotalFee: document.getElementById("sum-totalFee"),
    sumActualFee: document.getElementById("sum-actualFee"),
    sumDiscount: document.getElementById("sum-discount"),
    sumDiscountPct: document.getElementById("sum-discountPct"),
    sumTuition: document.getElementById("sum-tuition"),
    sumAssessment: document.getElementById("sum-assessment"),
    sumFineRate: document.getElementById("sum-fineRate"),
    sumFine: document.getElementById("sum-fine"),
    sumFinalPayable: document.getElementById("sum-finalPayable"),

    errActualFee: document.getElementById("err-actualFee"),
    errDueDate: document.getElementById("err-dueDate"),

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

  let selectedClass = null;
  let selectedStudent = null;
  let currentVoucher = null;

  // ------------------------------- Class grid -------------------------------

  function renderClassGrid() {
    els.classGrid.innerHTML = "";
    classOptions.forEach((c) => {
      const count = studentsByClass(c).length;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "class-chip";
      chip.innerHTML = `Class ${c}<small>${count} student${count === 1 ? "" : "s"}</small>`;
      chip.addEventListener("click", () => selectClass(c, chip));
      els.classGrid.appendChild(chip);
    });
  }
  renderClassGrid();

  function selectClass(className, chipEl) {
    selectedClass = className;
    document.querySelectorAll(".class-chip").forEach((c) => c.classList.remove("class-chip--active"));
    chipEl.classList.add("class-chip--active");
    els.searchPanel.style.display = "";
    els.searchPanel.classList.add("fade-in");
    els.searchInput.value = "";
    renderSearchResults("");
    els.searchInput.focus();
  }

  // ------------------------------- Student search -------------------------------

  function renderSearchResults(query) {
    const results = searchStudents(query, selectedClass);
    els.searchResults.innerHTML = "";
    if (results.length === 0) {
      els.searchResults.innerHTML = `<div class="search-empty">No matching students in Class ${selectedClass}.</div>`;
      return;
    }
    results.forEach((s) => {
      const row = document.createElement("div");
      row.className = "search-result-row";
      row.innerHTML = `
        <div class="search-result-row__info">
          <span class="search-result-row__name">${s.name}</span>
          <span class="search-result-row__meta">${s.studentId} · Roll ${s.rollNo} · Class ${s.className}</span>
        </div>
        <button class="btn btn--sm btn--primary">Select</button>`;
      row.querySelector("button").addEventListener("click", () => chooseStudent(s));
      els.searchResults.appendChild(row);
    });
  }

  els.searchInput.addEventListener("input", () => renderSearchResults(els.searchInput.value));

  function chooseStudent(student) {
    selectedStudent = student;
    els.outStudentId.textContent = student.studentId;
    els.outClassName.textContent = student.className;
    els.outName.textContent = student.name;
    els.outFatherName.textContent = student.fatherName;
    els.outRollNo.textContent = student.rollNo;

    els.selectView.classList.add("hidden");
    els.formView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  els.changeStudentBtn.addEventListener("click", () => {
    els.formView.classList.add("hidden");
    els.selectView.classList.remove("hidden");
  });

  // ------------------------------- Setup defaults -------------------------------

  els.totalFee.value = feeConfig.defaultTotalFee;
  els.issueDate.value = todayISO();
  els.sumFineRate.textContent = `Rs. ${feeConfig.finePerDay}/day`;

  // ------------------------------- Calculations -------------------------------

  function recalc() {
    const breakdown = computeFeeBreakdown(els.totalFee.value, els.actualFee.value);

    els.calcDiscount.textContent = formatCurrency(breakdown.discount);
    els.calcDiscountPct.textContent = formatPercent(breakdown.discountPct);
    els.calcTuition.textContent = formatCurrency(breakdown.tuitionFee);
    els.calcAssessment.textContent = formatCurrency(breakdown.assessmentFee);

    els.sumTotalFee.textContent = formatCurrency(breakdown.totalFee);
    els.sumActualFee.textContent = formatCurrency(breakdown.actualFee);
    els.sumDiscount.textContent = formatCurrency(breakdown.discount);
    els.sumDiscountPct.textContent = formatPercent(breakdown.discountPct);
    els.sumTuition.textContent = formatCurrency(breakdown.tuitionFee);
    els.sumAssessment.textContent = formatCurrency(breakdown.assessmentFee);
    els.sumFine.textContent = formatCurrency(0);
    els.sumFinalPayable.textContent = formatCurrency(breakdown.actualFee);

    validateActualFee(false);
    return breakdown;
  }

  function validateActualFee(showErrors) {
    const totalFee = Number(els.totalFee.value) || 0;
    const actualFee = Number(els.actualFee.value) || 0;
    let msg = "";
    const raw = els.actualFee.value;

    if (raw === "") msg = showErrors ? "Actual fee is required." : "";
    else if (isNaN(Number(raw))) msg = "Actual fee must be a number.";
    else if (actualFee < 0) msg = "Actual fee cannot be negative.";
    else if (actualFee > totalFee) msg = "Actual fee cannot exceed the total fee.";

    els.errActualFee.textContent = msg;
    return msg === "";
  }

  els.totalFee.addEventListener("input", recalc);
  els.actualFee.addEventListener("input", recalc);

  // ------------------------------- Validation -------------------------------

  function validateForm() {
    let valid = true;
    if (!validateActualFee(true)) valid = false;
    if (els.actualFee.value === "") valid = false;

    els.errDueDate.textContent = "";
    if (!els.dueDate.value) {
      els.errDueDate.textContent = "Due date is required.";
      valid = false;
    }
    return valid;
  }

  // ------------------------------- Generate / Preview -------------------------------

  function buildVoucherObject() {
    const breakdown = recalc();
    const issueDateISO = els.issueDate.value;
    const [y, m] = issueDateISO.split("-").map(Number);
    const voucherId = generateVoucherId(m, y);

    return {
      voucherId,
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.name,
      fatherName: selectedStudent.fatherName,
      rollNo: selectedStudent.rollNo,
      className: selectedStudent.className,
      month: m,
      year: y,
      totalFee: breakdown.totalFee,
      actualFee: breakdown.actualFee,
      discount: breakdown.discount,
      discountPct: Number(breakdown.discountPct.toFixed(2)),
      tuitionFee: breakdown.tuitionFee,
      assessmentFee: breakdown.assessmentFee,
      fineRate: feeConfig.finePerDay,
      fine: 0,
      finalPayable: breakdown.actualFee,
      issueDate: issueDateISO,
      dueDate: els.dueDate.value,
      paymentDate: null,
      status: "UNPAID"
    };
  }

  function fillVoucherPreview(v) {
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

    const statusEl = document.getElementById("v-status");
    statusEl.textContent = v.status;
    statusEl.className = "status-pill status-pill--unpaid";

    document.getElementById("v-quote").textContent = `"${academyConfig.quote}"`;

    els.jsonOutput.textContent = toJsObjectLiteral(v) + ",";
  }

  els.generateBtn.addEventListener("click", () => {
    if (!selectedStudent) {
      showToast("Please select a student first.", "error");
      return;
    }
    if (!validateForm()) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    const issueDateISO = els.issueDate.value;
    const [y, m] = issueDateISO.split("-").map(Number);
    const existing = hasVoucherForMonth(selectedStudent.studentId, m, y);
    if (existing) {
      showToast(`Voucher already exists for this student for ${monthYearLabel(m, y)}.`, "warning");
      const goRow = document.createElement("div");
      goRow.className = "btn-row";
      goRow.innerHTML = `
        <a class="btn btn--outline btn--sm" href="tracking.html">Go to Track Voucher</a>
        <a class="btn btn--outline btn--sm" href="receive-payment.html">Go to Receive Payment</a>`;
      const existingNotice = document.getElementById("duplicateNotice");
      if (existingNotice) existingNotice.remove();
      goRow.id = "duplicateNotice";
      els.formView.appendChild(goRow);
      return;
    }
    const oldNotice = document.getElementById("duplicateNotice");
    if (oldNotice) oldNotice.remove();

    currentVoucher = buildVoucherObject();
    fillVoucherPreview(currentVoucher);

    els.formView.classList.add("hidden");
    els.previewView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Voucher generated successfully.", "success");
  });

  els.editBtn.addEventListener("click", () => {
    els.previewView.classList.add("hidden");
    els.formView.classList.remove("hidden");
  });

  els.regenerateBtn.addEventListener("click", () => {
    if (!validateForm()) {
      showToast("Please fix the highlighted fields.", "error");
      els.previewView.classList.add("hidden");
      els.formView.classList.remove("hidden");
      return;
    }
    currentVoucher = buildVoucherObject();
    fillVoucherPreview(currentVoucher);
    showToast("Voucher regenerated.", "success");
  });

  // ------------------------------- Export / Share -------------------------------

  function filenameBase() {
    return currentVoucher ? `${currentVoucher.voucherId}` : "voucher";
  }

  els.savePngBtn.addEventListener("click", () => exportElement(els.voucherEl, "png", filenameBase()));
  els.saveJpgBtn.addEventListener("click", () => exportElement(els.voucherEl, "jpg", filenameBase()));
  els.savePdfBtn.addEventListener("click", () => exportElement(els.voucherEl, "pdf", filenameBase()));

  els.shareBtn.addEventListener("click", () => {
    if (!currentVoucher) return;
    const v = currentVoucher;
    const text =
      `${academyConfig.name} — Fee Voucher\n` +
      `Voucher: ${v.voucherId}\n` +
      `Student: ${v.studentName} (${v.studentId})\n` +
      `Class: ${v.className} · Roll: ${v.rollNo}\n` +
      `Month: ${monthYearLabel(v.month, v.year)}\n` +
      `Actual Fee: ${formatCurrency(v.actualFee)}\n` +
      `Due Date: ${formatDateHuman(v.dueDate)}\n` +
      `Status: ${v.status}`;
    shareOnWhatsApp(els.voucherEl, text, filenameBase());
  });

  els.copyJsonBtn.addEventListener("click", () => {
    copyToClipboard(els.jsonOutput.textContent, "JSON copied — paste it into js/vouchers.js.");
  });

  recalc();
});
