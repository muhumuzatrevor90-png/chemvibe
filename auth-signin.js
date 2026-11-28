import { auth, configured, signInWithEmailAndPassword } from "./firebase.js";

const byId = (id) => document.getElementById(id);

const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Password Visibility Toggle ---
const passwordInput = byId("signin-password");
const toggleBtn = byId("toggle-signin-password");

if (passwordInput && toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleBtn.textContent = "🙈";
      toggleBtn.title = "Hide Password";
    } else {
      passwordInput.type = "password";
      toggleBtn.textContent = "👁️";
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
