import {
  configured,
  auth,
  createAccount,
  signIn,
  signOutCurrentUser,
  observeAuth
} from "./firebase.js";

const byId = (id) => document.getElementById(id);

function initMenu() {
  byId("menu-toggle")?.addEventListener("click", () => {
    byId("main-nav")?.classList.toggle("open");
  });
}

function initLibrary() {
  const search = byId("resource-search");
  if (!search) return;
  const cards = [...document.querySelectorAll(".resource-card")];
  const count = byId("resource-count");
  const empty = byId("resource-empty");
  let type = "all";

  function render() {
    const term = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matchesType = type === "all" || card.dataset.type === type;
      const matchesText = !term || `${card.dataset.search} ${card.innerText}`.toLowerCase().includes(term);
      card.hidden = !(matchesType && matchesText);
      if (!card.hidden) visible++;
    });
    if (count) count.textContent = `${visible} resources`;
    if (empty) empty.hidden = visible > 0;
  }

  document.querySelectorAll("#resource-filters .chip").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#resource-filters .chip").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      type = button.dataset.type;
      render();
    });
  });

  search.addEventListener("input", render);
  document.querySelectorAll(".purchase-button").forEach((button) => {
    button.addEventListener("click", () => alert("Demo listing only. Secure checkout and file delivery will be added after backend setup."));
  });
  render();
}

function initBlog() {
  const search = byId("blog-search");
  if (!search) return;
  const cards = [...document.querySelectorAll(".blog-card")];
  const empty = byId("blog-empty");
  search.addEventListener("input", () => {
    const term = search.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach((card) => {
      card.hidden = Boolean(term) && !`${card.dataset.search} ${card.innerText}`.toLowerCase().includes(term);
      if (!card.hidden) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  });
}

function initAuthForms() {
  const signInForm = byId("signin-form");
  signInForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("signin-status");
    const submit = byId("signin-submit");
    if (!configured) { status.textContent = "Firebase setup is not finished. Add your web app config first."; return; }
    submit.disabled = true;
    status.textContent = "Signing in…";
    try {
      await signIn(byId("signin-email").value.trim(), byId("signin-password").value);
      location.href = "profile.html";
    } catch (error) {
      console.error(error);
      status.textContent = error.code === "auth/invalid-credential" ? "Email or password is incorrect." : "Sign-in failed. Check Firebase Authentication setup.";
    } finally { submit.disabled = false; }
  });

  const signUpForm = byId("signup-form");
  signUpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("signup-status");
    const submit = byId("signup-submit");
    const password = byId("signup-password").value;
    if (password !== byId("signup-confirm").value) { status.textContent = "Passwords do not match."; return; }
    if (!configured) { status.textContent = "Firebase setup is not finished. Add your web app config first."; return; }
    submit.disabled = true;
    status.textContent = "Creating account…";
    try {
      await createAccount(byId("signup-email").value.trim(), password, byId("signup-name").value.trim());
      location.href = "profile.html";
    } catch (error) {
      console.error(error);
      status.textContent = error.code === "auth/email-already-in-use" ? "That email already has an account." : "Sign-up failed. Check Firebase Authentication setup.";
    } finally { submit.disabled = false; }
  });
}

function initProfile() {
  if (!byId("profile-status")) return;
  const status = byId("profile-status");
  const email = byId("profile-email");
  if (!configured) {
    status.textContent = "Firebase is not connected yet.";
    return;
  }
  observeAuth((user) => {
    status.textContent = user ? `Signed in as ${user.displayName || "ChemVibe student"}.` : "Not signed in.";
    email.textContent = user?.email || "";
  });
  byId("signout-button")?.addEventListener("click", async () => {
    await signOutCurrentUser();
    location.href = "index.html";
  });
}

initMenu();
initLibrary();
initBlog();
initAuthForms();
initProfile();
