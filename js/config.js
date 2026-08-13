/* =========================================================================
   js/config.js
   -------------------------------------------------------------------------
   CENTRAL CONFIGURATION FILE
   Edit values here to update academy branding, login credentials, fee
   rules, and the class list across the entire application. No other file
   should need to be touched for these kinds of changes.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. ACADEMY INFORMATION
   ------------------------------------------------------------------------- */
const academyConfig = {
  name: "Intelligence Academy",
  motto: "Where Intelligence Meets Excellence",
  ownerName: "Abdul Rehman Minhas",
  phone: "+92-3086427239",
  whatsapp: "92-3407756109", // digits only, country code first, no + or spaces (used for wa.me links)
  email: "minhaskips485@gmail.com",
  address: "Street 3A, CB-2490k Gujranwala Rahwali Cantt, Pakistan",
  // Recommended: keep the filename "academy-logo.png" and just replace the
  // file itself in images/. If you rename/move it, also update the <img>
  // src="..." tags in index.html and every file in pages/ — see images/README.txt.
  logoRoot: "images/academy-logo.png",   // path from files at the project root (index.html)
  logoPages: "../images/academy-logo.png", // path from files inside /pages
  quote: "Your dedication today builds your success tomorrow."
};

/* -------------------------------------------------------------------------
   2. LOGIN CREDENTIALS
   Frontend-only prototype credentials. See README "Security Note".
   ------------------------------------------------------------------------- */
const authConfig = {
  username: "Abdul Rehman Minhas",
  password: "456$Abcd"
};

/* -------------------------------------------------------------------------
   3. FEE RULES
   ------------------------------------------------------------------------- */
const feeConfig = {
  defaultTotalFee: 4500,
  tuitionPercentage: 80,
  assessmentPercentage: 20,
  finePerDay: 50
};

/* -------------------------------------------------------------------------
   4. CLASS OPTIONS
   Classes 1 through 12. Add/remove class numbers here — every class
   selector, Student ID generator, and Roll Number generator in the app
   reads from this single array.
   ------------------------------------------------------------------------- */
const classOptions = ["1","2","3","4","5","6","7","8","9","10","11","12"];
