import { auth, configured, signInWithEmailAndPassword } from "./firebase.js";

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
