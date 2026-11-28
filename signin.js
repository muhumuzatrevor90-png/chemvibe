import { auth, configured, signInWithEmailAndPassword } from "./firebase.js";

const byId = (id) => document.getElementById(id);

// --- 1. Password Visibility Toggle ---
const togglePasswordBtn = byId("toggle-password");
const passwordInput = byId("signin-password");

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.style.color = isPassword ? "#38bdf8" : "#94a3b8";
  });
}

// --- 2. Portal Sign-In Form Handler ---
const signinForm = byId("signin-form");
if (signinForm) {
  signinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = byId("signin-email").value.trim();
    const password = byId("signin-password").value;
    const status = byId("signin-status");

    if (!configured || !auth) {
      if (status) status.textContent = "Firebase is not configured correctly.";
      return;
    }

    try {
      if (status) status.textContent = "Signing in...";
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (error) {
      if (status) {
        if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
          status.textContent = "Invalid email or password. Please try again.";
        } else {
          status.textContent = `Sign in failed: ${error.message}`;
        }
      }
    }
  });
}
