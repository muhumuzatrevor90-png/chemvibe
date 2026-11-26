import { auth, configured, createUserWithEmailAndPassword } from "./firebase.js";

const byId = (id) => document.getElementById(id);

// Password visibility toggle
const toggleBtn = byId("toggle-signup-password");
const passwordInput = byId("signup-password");
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

// Sign-up form submission
const form = byId("signup-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = byId("signup-email").value.trim();
    const password = byId("signup-password").value;
    const status = byId("signup-status");
    const submitBtn = byId("signup-submit");

    if (!configured || !auth) {
      status.textContent = "Firebase is not configured correctly in firebase.js.";
      return;
    }

    if (password.length < 6) {
      status.textContent = "Password must be at least 6 characters long.";
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "Creating account...";

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      status.textContent = "Account created successfully! Redirecting...";
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 800);
    } catch (error) {
      console.error("Sign-up error:", error);
      if (error.code === "auth/email-already-in-use") {
        status.textContent = "This email is already registered. Try signing in.";
      } else if (error.code === "auth/invalid-email") {
        status.textContent = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        status.textContent = "Password is too weak. Please choose a stronger password.";
      } else {
        status.textContent = `Sign-up failed: ${error.message}`;
      }
      submitBtn.disabled = false;
    }
  });
}
