/* =========================================================================
   js/vouchers.js
   -------------------------------------------------------------------------
   VOUCHER DATA FILE — this array is the ONLY source of issued fee voucher
   records (and their payment updates). There is no database: the Issue
   Fee and Receive Payment pages generate the object/update code for you,
   with a Copy button and exact save instructions — you paste it here.

   Each voucher object has these fields:

     voucherId      -> "IA-YYYY-MM-XXXX", e.g. "IA-2026-08-0001"
     studentId      -> matches a studentId in js/students.js
     studentName    -> snapshot of the student's name at issue time
     fatherName     -> snapshot of father's name at issue time
     rollNo         -> snapshot of roll number at issue time
     className      -> snapshot of class at issue time
     month          -> 1-12 (numeric month the voucher covers)
     year           -> 4-digit year the voucher covers
     totalFee       -> Rs. total fee before discount
     actualFee      -> Rs. actual fee charged
     discount       -> Rs. totalFee - actualFee
     discountPct    -> percentage, 2 decimal places
     tuitionFee     -> Rs. 80% of actualFee (rate configurable in config.js)
     assessmentFee  -> Rs. 20% of actualFee
     fineRate       -> Rs. per late day (from config.js at issue time)
     fine           -> Rs. 0 at issue; recalculated when payment is received
     finalPayable   -> actualFee + fine
     issueDate      -> "YYYY-MM-DD"
     dueDate        -> "YYYY-MM-DD"
     paymentDate    -> "YYYY-MM-DD" or null if not yet paid
     status         -> "UNPAID" or "PAID"

   IMPORTANT — ONE VOUCHER PER STUDENT PER MONTH:
   The app blocks issuing a second voucher for the same studentId + month
   + year combination. Do not manually create duplicates either.

   WHEN A PAYMENT IS RECEIVED, the Receive Payment page generates updated
   JSON for an EXISTING record (same voucherId) — you replace that
   record's fields (fine, finalPayable, paymentDate, status), you do NOT
   add a new object.

   This array starts empty. Vouchers will appear here as you issue them.
   ========================================================================= */

const vouchers = [
{
  voucherId: "IA-2026-08-0001",
  studentId: "STD-10-002",
  studentName: "Hassnain Ali",
  fatherName: "Shahbaz Ali",
  rollNo: "110002",
  className: "10",
  month: 8,
  year: 2026,
  totalFee: 3629,
  actualFee: 2100,
  discount: 1529,
  discountPct: 42.13,
  tuitionFee: 1680,
  assessmentFee: 420,
  fineRate: 50,
  fine: 0,
  finalPayable: 2100,
  issueDate: "2026-08-07",
  dueDate: "2026-08-14",
  paymentDate: "2026-08-13",
  status: "PAID"
},

   
  // ADD / UPDATE VOUCHER RECORDS HERE
];
