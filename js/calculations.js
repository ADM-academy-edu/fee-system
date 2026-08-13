/* =========================================================================
   js/calculations.js
   -------------------------------------------------------------------------
   CALCULATION ENGINE — every fee/fine formula used anywhere in the app
   lives here as a small, pure, reusable function. No other file should
   re-implement these formulas.
   ========================================================================= */

/** Rs. discount = Total Fee - Actual Fee (never negative in normal use). */
function calculateDiscount(totalFee, actualFee) {
  const t = Number(totalFee) || 0;
  const a = Number(actualFee) || 0;
  return t - a;
}

/** Discount as a percentage of Total Fee, e.g. 33.33 (not 0.3333). */
function calculateDiscountPercentage(totalFee, actualFee) {
  const t = Number(totalFee) || 0;
  const discount = calculateDiscount(totalFee, actualFee);
  return t > 0 ? (discount / t) * 100 : 0;
}

/** Tuition portion of the actual fee, using feeConfig.tuitionPercentage. */
function calculateTuitionFee(actualFee) {
  const a = Number(actualFee) || 0;
  return a * (feeConfig.tuitionPercentage / 100);
}

/** Assessment portion of the actual fee, using feeConfig.assessmentPercentage. */
function calculateAssessmentFee(actualFee) {
  const a = Number(actualFee) || 0;
  return a * (feeConfig.assessmentPercentage / 100);
}

/**
 * Whole number of late days between a due date and a payment date, both
 * "YYYY-MM-DD". Parsed as local calendar dates (no UTC/timezone math) so
 * results are never off by one. Never negative — payment on/before the
 * due date returns 0.
 */
function calculateLateDays(dueDateISO, paymentDateISO) {
  if (!dueDateISO || !paymentDateISO) return 0;
  const diff = daysBetween(dueDateISO, paymentDateISO);
  return diff > 0 ? diff : 0;
}

/** Rs. fine = late days x feeConfig.finePerDay. Never negative. */
function calculateFine(lateDays) {
  const days = Number(lateDays) || 0;
  const fine = days * feeConfig.finePerDay;
  return fine > 0 ? fine : 0;
}

/** Rs. final payable = Actual Fee + Fine. */
function calculateFinalAmount(actualFee, fine) {
  const a = Number(actualFee) || 0;
  const f = Number(fine) || 0;
  return a + f;
}

/**
 * Run every fee-side calculation at once and return a single object.
 * Convenience wrapper used by the Issue Voucher and Receive Payment pages.
 */
function computeFeeBreakdown(totalFee, actualFee) {
  return {
    totalFee: Number(totalFee) || 0,
    actualFee: Number(actualFee) || 0,
    discount: calculateDiscount(totalFee, actualFee),
    discountPct: calculateDiscountPercentage(totalFee, actualFee),
    tuitionFee: calculateTuitionFee(actualFee),
    assessmentFee: calculateAssessmentFee(actualFee)
  };
}

/**
 * Run every fine-side calculation at once.
 */
function computeFineBreakdown(dueDateISO, paymentDateISO) {
  const lateDays = calculateLateDays(dueDateISO, paymentDateISO);
  const fine = calculateFine(lateDays);
  return { lateDays, fine, fineRate: feeConfig.finePerDay };
}
