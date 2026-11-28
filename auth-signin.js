import { auth, configured, signInWithEmailAndPassword } from "./firebase.js";

const byId = (id) => document.getElementById(id);

const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Professional Password Visibility Toggle ---
const passwordInput = byId("signin-password");
const toggleBtn = byId("toggle-signin-password");
const eyeIcon = byId("signin-eye-icon");

if (passwordInput && toggleBtn && eyeIcon) {
  toggleBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
      toggleBtn.title = "Hide Password";
    } else {
      passwordInput.type = "password";
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
      toggleBtn.title = "Show Password";
    }
  });
}

// --- Sign In Handling ---
const signinForm = byId("signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = byId("signin-email").value.trim();
    const password = byId("signin-password").value;
    const status = byId("signin-status");

    if (!configured || !auth) {
      status.textContent = "Firebase is not configured properly.";
      return;
    }

    try {
      status.textContent = "Signing in...";
      await signInWithEmailAndPassword(auth, email, password);
      status.textContent = "Sign in successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
    } catch (error) {
      console.error("Sign in error:", error);
      status.textContent = `Error: ${error.message}`;
    }
  });
}
