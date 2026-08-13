/* =========================================================================
   js/auth.js
   -------------------------------------------------------------------------
   Login page logic (root index.html only). Frontend-only authentication —
   see README "Security Note".
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) {
    window.location.href = "pages/dashboard.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  const errorEl = document.getElementById("loginError");

  document.getElementById("academyName").textContent = academyConfig.name;
  document.getElementById("academyMotto").textContent = academyConfig.motto;
  document.getElementById("academyLogo").src = academyConfig.logoRoot;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    errorEl.classList.remove("visible");

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;

    // Small delay so the loading state is visibly perceptible (professional feel).
    setTimeout(() => {
      const username = usernameEl.value.trim();
      const password = passwordEl.value;

      if (username === authConfig.username && password === authConfig.password) {
        setLoggedIn();
        window.location.href = "pages/dashboard.html";
      } else {
        errorEl.textContent = "Incorrect username or password. Please try again.";
        errorEl.classList.add("visible");
        passwordEl.value = "";
        passwordEl.focus();
        submitBtn.disabled = false;
      }
    }, 350);
  });
});
