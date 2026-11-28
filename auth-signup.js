import { auth, configured, createUserWithEmailAndPassword } from "./firebase.js";

const byId = (id) => document.getElementById(id);

const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Password Visibility Toggle ---
const passwordInput = byId("signup-password");
const toggleBtn = byId("toggle-password");

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
