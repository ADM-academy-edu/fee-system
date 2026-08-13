IMAGES FOLDER
=============

This folder holds the academy logo used on the login page, the navbar on
every page, and every generated voucher/report.

NOTE: No logo file was supplied in the conversation that produced this
build, so a neutral navy/red placeholder icon has been generated at:

    images/academy-logo.png

TO USE YOUR REAL LOGO
1. Rename your actual Intelligence Academy logo file to exactly:

       academy-logo.png

   (A square image, e.g. 300x300px, PNG with a transparent or solid
   background, works best since it's displayed inside a circular frame.)

2. Copy it into this "images" folder, replacing the placeholder file.
3. Save, then commit and push to GitHub. Netlify will redeploy the site
   automatically.

Because the real logo already contains the academy name as part of its
design, the app does NOT print the academy name a second time on top of
the logo image anywhere — only the logo itself is shown, with the name
appearing separately in text next to/below it.

RECOMMENDED: keep the filename exactly "academy-logo.png" and just
replace the file's contents with your real logo. That way nothing else
in the project needs to change.

If you really want a different filename or format (e.g. .jpg or .svg),
you'll need to update it in two places:
  1. js/config.js — the "logoRoot" and "logoPages" values (these are
     used on the login page and are available for any future page that
     reads the logo path programmatically).
  2. The <img ... src="images/academy-logo.png"> (or "../images/...")
     tag near the top of each HTML file: index.html, and every file in
     pages/ (dashboard.html, issue-voucher.html, receive-payment.html,
     tracking.html, register-student.html).
Keeping the filename as-is avoids step 2 entirely.
