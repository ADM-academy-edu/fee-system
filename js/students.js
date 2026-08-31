/* =========================================================================
   js/students.js
   -------------------------------------------------------------------------
   STUDENT DATA FILE — this array is the ONLY source of student records.
   There is no database: you (or the Register New Student page's generated
   code) add/edit entries here directly.

   Each student object has exactly these fields:
     studentId   -> "STD-{CLASS}-{SEQUENCE}", e.g. "STD-9-001"
     rollNo      -> 6 digits: "1" + class as 2 digits + sequence as 3 digits
                    e.g. class 9, sequence 001 -> "109001"
     name        -> student's full name
     fatherName  -> father's full name
     className   -> must match one of classOptions in js/config.js ("1".."12")

   See README.md -> "HOW TO ADD A NEW STUDENT" for the full manual-entry
   guide, or use the in-app Dashboard -> Register New Student page, which
   generates the object below for you (with the correct next Student ID
   and Roll Number) and gives you a Copy button.

   ADD NEW STUDENT BELOW THIS LINE (inside the array, before the closing "]")
   ========================================================================= */

const students = [
{
  studentId: "STD-10-001",
  rollNo: "110001",
  name: "Hanzala Akram",
  fatherName: "Muhammad Akram",
  className: "10"
},
   {
  studentId: "STD-10-002",
  rollNo: "110002",
  name: "Hassnain Ali",
  fatherName: "Shahbaz Ali",
  className: "10"
},
  // ADD NEW STUDENT HERE
];
