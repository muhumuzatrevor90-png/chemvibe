// Add these functions inside app.js and call them at the bottom

function initPasswordToggle() {
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const input = byId(targetId);
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        button.textContent = "🙈"; // Hide icon state
      } else {
        input.type = "password";
        button.textContent = "👁️"; // Show icon state
      }
    });
  });
}

function initPasswordChange() {
  const form = byId("password-change-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("password-status");
    const submit = byId("password-submit");
    const currentPass = byId("current-password").value;
    const newPass = byId("new-password").value;

    if (!configured || !auth || !auth.currentUser) {
      status.textContent = "You must be signed in to change your password.";
      return;
    }

    if (newPass.length < 6) {
      status.textContent = "New password must be at least 6 characters long.";
      return;
    }

    submit.disabled = true;
    status.textContent = "Updating password...";

    try {
      // Re-authenticate user before updating password for security
      const credential = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, currentPass);
      await auth.currentUser.reauthenticateWithCredential(credential);
      
      await auth.currentUser.updatePassword(newPass);
      status.textContent = "Password updated successfully!";
      form.reset();
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        status.textContent = "Incorrect current password.";
      } else {
        status.textContent = "Failed to update password. Please try signing in again.";
      }
    } finally {
      submit.disabled = false;
    }
  });
}

// Make sure to execute these initialization functions at the bottom of app.js:
initPasswordToggle();
initPasswordChange();
function initPasswordUI() {
  const openBtn = byId("open-password-btn");
  const closeBtn = byId("close-password-btn");
  const panel = byId("password-change-panel");

  if (openBtn && panel) {
    openBtn.addEventListener("click", () => {
      panel.hidden = false;
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      panel.hidden = true;
    });
  }

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = byId(button.dataset.target);
      if (!input) return;
      if (input.type === "password") {
        input.type = "text";
        button.textContent = "🙈";
      } else {
        input.type = "password";
        button.textContent = "👁️";
      }
    });
  });
}

function initPasswordChange() {
  const form = byId("password-change-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("password-status");
    const submit = byId("password-submit");
    const currentPass = byId("current-password").value;
    const newPass = byId("new-password").value;

    if (!configured || !auth || !auth.currentUser) {
      status.textContent = "You must be signed in to change your password.";
      return;
    }

    if (newPass.length < 6) {
      status.textContent = "New password must be at least 6 characters long.";
      return;
    }

    submit.disabled = true;
    status.textContent = "Updating password...";

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, currentPass);
      await auth.currentUser.reauthenticateWithCredential(credential);
      await auth.currentUser.updatePassword(newPass);
      status.textContent = "Password updated successfully!";
      form.reset();
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        status.textContent = "Incorrect current password.";
      } else {
        status.textContent = "Failed to update password. Please sign in again and retry.";
      }
    } finally {
      submit.disabled = false;
    }
  });
}

// Call both at the bottom of app.js:
initPasswordUI();
initPasswordChange();
