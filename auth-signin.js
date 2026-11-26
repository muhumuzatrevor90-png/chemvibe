import { auth, configured, signInWithEmailAndPassword, sendPasswordResetEmail } from "./firebase.js";

const byId = (id) => document.getElementById(id);

// Password visibility toggle
const toggleBtn = byId("toggle-signin-password");
const passwordInput = byId("signin-password");
if (toggleBtn && passwordInput) {
  toggleBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggleBtn.textContent = "🙈";
    } else {
      passwordInput.type = "password";
      toggleBtn.textContent = "👁️";
    }
  });
}

// Sign-in form submission
const form = byId("signin-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = byId("signin-email").value.trim();
    const password = byId("signin-password").value;
    const status = byId("signin-status");
    const submitBtn = byId("signin-submit");

    if (!configured || !auth) {
      status.textContent = "Firebase is not configured correctly in firebase.js.";
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "Signing in...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      status.textContent = "Success! Redirecting...";
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 600);
    } catch (error) {
      console.error("Sign-in error:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        status.textContent = "Incorrect email or password.";
      } else if (error.code === "auth/invalid-email") {
        status.textContent = "Please enter a valid email address.";
      } else {
        status.textContent = `Sign-in failed: ${error.message}`;
      }
      submitBtn.disabled = false;
    }
  });
}

// Forgot Password Handler
const forgotLink = byId("forgot-password-link");
if (forgotLink) {
  forgotLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const emailInput = byId("signin-email");
    const status = byId("signin-status");
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      status.textContent = "Please enter your email address above first, then click 'Forgot password?'.";
      if (emailInput) emailInput.focus();
      return;
    }

    if (!configured || !auth) {
      status.textContent = "Firebase is not configured correctly.";
      return;
    }

    try {
      status.textContent = "Sending password reset email...";
      await sendPasswordResetEmail(auth, email);
      status.textContent = "Password reset link sent! Check your inbox.";
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.code === "auth/user-not-found") {
        status.textContent = "No account found with this email address.";
      } else {
        status.textContent = `Failed to send reset email: ${error.message}`;
      }
    }
  });
}
