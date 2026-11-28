import { auth, configured, createUserWithEmailAndPassword } from "./firebase.js";

const byId = (id) => document.getElementById(id);

const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Professional Password Visibility Toggle ---
const passwordInput = byId("signup-password");
const toggleBtn = byId("toggle-password");
const eyeIcon = byId("eye-icon");

if (passwordInput && toggleBtn && eyeIcon) {
  toggleBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      // Change to professional "eye-off" vector paths
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
      toggleBtn.title = "Hide Password";
    } else {
      passwordInput.type = "password";
      // Switch back to standard open eye vector paths
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
      toggleBtn.title = "Show Password";
    }
  });
}

// --- Account Creation Handling ---
const signupForm = byId("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = byId("signup-email").value.trim();
    const password = byId("signup-password").value;
    const status = byId("signup-status");

    if (!configured || !auth) {
      status.textContent = "Firebase is not configured properly.";
      return;
    }

    try {
      status.textContent = "Creating account...";
      await createUserWithEmailAndPassword(auth, email, password);
      status.textContent = "Account created successfully! Redirecting...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      status.textContent = `Error: ${error.message}`;
    }
  });
}
