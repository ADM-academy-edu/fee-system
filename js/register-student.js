/* =========================================================================
   js/register-student.js
   -------------------------------------------------------------------------
   Register New Student: class selection -> auto Student ID / Roll Number
   generation -> name/father name entry -> preview -> JSON generation with
   copy button and exact save-location instructions.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  requireLogin();
  document.getElementById("navName").textContent = academyConfig.name;
  document.getElementById("logoutBtn").addEventListener("click", logout);
  setActiveNav("register");

  const els = {
    classGrid: document.getElementById("classGrid"),
    idPanel: document.getElementById("idPanel"),
    detailsPanel: document.getElementById("detailsPanel"),
    outStudentId: document.getElementById("out-studentId"),
    outRollNo: document.getElementById("out-rollNo"),
    studentName: document.getElementById("studentName"),
    fatherName: document.getElementById("fatherName"),
    errName: document.getElementById("err-studentName"),
    errFather: document.getElementById("err-fatherName"),
    registerBtn: document.getElementById("registerBtn"),
    formView: document.getElementById("formView"),
    resultView: document.getElementById("resultView"),
    pvStudentId: document.getElementById("pv-studentId"),
    pvRollNo: document.getElementById("pv-rollNo"),
    pvClassName: document.getElementById("pv-className"),
    pvName: document.getElementById("pv-name"),
    pvFatherName: document.getElementById("pv-fatherName"),
    jsonOutput: document.getElementById("jsonOutput"),
    copyJsonBtn: document.getElementById("copyJsonBtn"),
    registerAnotherBtn: document.getElementById("registerAnotherBtn")
  };

  let selectedClass = null;
  let pendingStudentId = null;
  let pendingRollNo = null;

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

  function selectClass(className, chipEl) {
    selectedClass = className;
    document.querySelectorAll(".class-chip").forEach((c) => c.classList.remove("class-chip--active"));
    chipEl.classList.add("class-chip--active");

    const seq = nextSequenceForClass(className);
    pendingStudentId = generateStudentId(className, seq);
    pendingRollNo = generateRollNo(className, seq);

    els.outStudentId.textContent = pendingStudentId;
    els.outRollNo.textContent = pendingRollNo;
    els.idPanel.style.display = "";
    els.detailsPanel.style.display = "";
    els.idPanel.classList.add("fade-in");
    els.detailsPanel.classList.add("fade-in");
  }

  renderClassGrid();

  // ------------------------------- Validation -------------------------------

  function validateForm() {
    let valid = true;
    els.errName.textContent = "";
    els.errFather.textContent = "";

    if (!selectedClass) {
      showToast("Please select a class first.", "error");
      valid = false;
    }
    if (!els.studentName.value.trim()) {
      els.errName.textContent = "Student name is required.";
      valid = false;
    }
    if (!els.fatherName.value.trim()) {
      els.errFather.textContent = "Father name is required.";
      valid = false;
    }
    if (valid && isDuplicateStudentId(pendingStudentId)) {
      showToast("Generated Student ID already exists — please refresh and try again.", "error");
      valid = false;
    }
    if (valid && isDuplicateRollNo(pendingRollNo)) {
      showToast("Generated Roll Number already exists — please refresh and try again.", "error");
      valid = false;
    }
    return valid;
  }

  // ------------------------------- Register -------------------------------

  els.registerBtn.addEventListener("click", () => {
    if (!validateForm()) return;

    const studentObj = {
      studentId: pendingStudentId,
      rollNo: pendingRollNo,
      name: els.studentName.value.trim(),
      fatherName: els.fatherName.value.trim(),
      className: selectedClass
    };

    els.pvStudentId.textContent = studentObj.studentId;
    els.pvRollNo.textContent = studentObj.rollNo;
    els.pvClassName.textContent = studentObj.className;
    els.pvName.textContent = studentObj.name;
    els.pvFatherName.textContent = studentObj.fatherName;

    els.jsonOutput.textContent = toJsObjectLiteral(studentObj) + ",";

    els.formView.classList.add("hidden");
    els.resultView.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });

    showToast("Student data generated successfully. Copy it into js/students.js.", "success");
  });

  els.copyJsonBtn.addEventListener("click", () => {
    copyToClipboard(els.jsonOutput.textContent, "JSON copied — paste it into js/students.js.");
  });

  els.registerAnotherBtn.addEventListener("click", () => {
    els.studentName.value = "";
    els.fatherName.value = "";
    selectedClass = null;
    document.querySelectorAll(".class-chip").forEach((c) => c.classList.remove("class-chip--active"));
    els.idPanel.style.display = "none";
    els.detailsPanel.style.display = "none";
    els.resultView.classList.add("hidden");
    els.formView.classList.remove("hidden");
    renderClassGrid();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
