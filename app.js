import {
  configured,
  auth,
  db,
  createAccount,
  signIn,
  signOutCurrentUser,
  observeAuth
} from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Set your Admin email here
const ADMIN_EMAILS = ["muhumuzatrevormbabazi@gmail.com"];

const byId = (id) => document.getElementById(id);

function isAdminUser(user) {
  return Boolean(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

function initMenu() {
  byId("menu-toggle")?.addEventListener("click", () => {
    byId("main-nav")?.classList.toggle("open");
  });
}

// Show Admin nav link if the logged-in user is an Admin
function initGlobalAuthUI() {
  if (!configured) return;
  observeAuth((user) => {
    const adminNav = byId("nav-admin");
    if (adminNav) {
      adminNav.hidden = !isAdminUser(user);
    }
  });
}

async function initLibrary() {
  const container = byId("resource-list");
  if (!container) return;
  const search = byId("resource-search");
  const count = byId("resource-count");
  const empty = byId("resource-empty");
  let type = "all";
  let resources = [];

  if (configured && db) {
    try {
      const snapshot = await getDocs(collection(db, "resources"));
      resources = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.error("Failed to load resources:", error);
    }
  }

  function render() {
    const term = search ? search.value.trim().toLowerCase() : "";
    let visible = 0;
    container.innerHTML = "";

    resources.forEach((res) => {
      const resType = res.type || "Notes";
      const resTitle = res.title || "Untitled Resource";
      const resDesc = res.description || "";
      const resPrice = res.price || "Free";

      const matchesType = type === "all" || resType === type;
      const matchesText = !term || `${resTitle} ${resDesc} ${resType}`.toLowerCase().includes(term);

      if (matchesType && matchesText) {
        visible++;

        const card = document.createElement("article");
        card.className = "card resource-card";

        const meta = document.createElement("div");
        meta.className = "card-meta";

        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = resType.toUpperCase();

        const price = document.createElement("span");
        price.className = "price";
        price.textContent = resPrice;

        meta.append(tag, price);

        const titleEl = document.createElement("h3");
        titleEl.textContent = resTitle;

        const descEl = document.createElement("p");
        descEl.textContent = resDesc;

        const btn = document.createElement("button");
        btn.className = "button secondary purchase-button";
        btn.type = "button";
        btn.textContent = "View resource";
        btn.addEventListener("click", () => {
          if (res.fileUrl) {
            window.open(res.fileUrl, "_blank", "noopener,noreferrer");
          } else {
            alert("File link not available for this resource.");
          }
        });

        card.append(meta, titleEl, descEl, btn);
        container.appendChild(card);
      }
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

  if (search) search.addEventListener("input", render);
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
      const cred = await signIn(byId("signin-email").value.trim(), byId("signin-password").value);
      location.href = isAdminUser(cred.user) ? "admin.html" : "profile.html";
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
      const cred = await createAccount(byId("signup-email").value.trim(), password, byId("signup-name").value.trim());
      location.href = isAdminUser(cred.user) ? "admin.html" : "profile.html";
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
  const signInBtn = byId("profile-signin-btn");
  const signUpBtn = byId("profile-signup-btn");
  const adminBtn = byId("profile-admin-btn");
  const signOutBtn = byId("signout-button");

  if (!configured) {
    status.textContent = "Firebase is not connected yet.";
    return;
  }

  observeAuth((user) => {
    status.textContent = user ? `Signed in as ${user.displayName || "ChemVibe student"}.` : "Not signed in.";
    email.textContent = user?.email || "";
    if (signInBtn) signInBtn.hidden = Boolean(user);
    if (signUpBtn) signUpBtn.hidden = Boolean(user);
    if (signOutBtn) signOutBtn.hidden = !user;
    if (adminBtn) adminBtn.hidden = !isAdminUser(user);
  });

  signOutBtn?.addEventListener("click", async () => {
    await signOutCurrentUser();
    location.href = "index.html";
  });
}

function initAdminWorkspace() {
  const deniedBox = byId("admin-denied");
  const workspaceBox = byId("admin-workspace");
  const manageBox = byId("admin-manage");
  if (!deniedBox || !workspaceBox) return;

  const deniedMsg = byId("admin-denied-msg");

  if (!configured) {
    deniedMsg.textContent = "Firebase is not configured yet.";
    return;
  }

  async function loadAdminResources() {
    const list = byId("admin-resource-list");
    if (!list) return;
    list.innerHTML = "<p class='muted'>Loading documents…</p>";
    try {
      const snapshot = await getDocs(collection(db, "resources"));
      list.innerHTML = "";
      if (snapshot.empty) {
        list.innerHTML = "<p class='muted'>No documents uploaded yet.</p>";
        return;
      }
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--line); border-radius:10px; gap:12px;";
        
        const info = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = data.title || "Untitled";
        const meta = document.createElement("div");
        meta.className = "muted";
        meta.textContent = `${data.type || "Notes"} • ${data.price || "Free"}`;
        info.append(title, meta);

        const delBtn = document.createElement("button");
        delBtn.className = "button danger";
        delBtn.type = "button";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", async () => {
          if (!confirm(`Delete "${data.title}"?`)) return;
          delBtn.disabled = true;
          try {
            await deleteDoc(doc(db, "resources", docSnap.id));
            loadAdminResources();
          } catch (err) {
            console.error(err);
            alert("Failed to delete document. Check Firestore rules.");
            delBtn.disabled = false;
          }
        });

        row.append(info, delBtn);
        list.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      list.innerHTML = "<p class='muted'>Could not load documents.</p>";
    }
  }

  observeAuth((user) => {
    if (isAdminUser(user)) {
      deniedBox.hidden = true;
      workspaceBox.hidden = false;
      if (manageBox) {
        manageBox.hidden = false;
        loadAdminResources();
      }
    } else {
      deniedBox.hidden = false;
      workspaceBox.hidden = true;
      if (manageBox) manageBox.hidden = true;
      deniedMsg.textContent = user
        ? `Access denied. Your account (${user.email}) does not have admin privileges.`
        : "Please sign in with your admin email to access this workspace.";
    }
  });

  const uploadForm = byId("upload-form");
  uploadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const uploadStatus = byId("upload-status");
    const uploadSubmit = byId("upload-submit");
    const fileUrl = byId("res-url").value.trim();

    if (!fileUrl || !isAdminUser(auth.currentUser)) return;

    uploadSubmit.disabled = true;
    uploadStatus.textContent = "Publishing document to library…";

    try {
      await addDoc(collection(db, "resources"), {
        title: byId("res-title").value.trim(),
        type: byId("res-type").value,
        price: byId("res-price").value.trim(),
        description: byId("res-desc").value.trim(),
        fileUrl: fileUrl,
        uploadedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      uploadStatus.textContent = "Success! Document is now live in the library.";
      uploadForm.reset();
      loadAdminResources();
    } catch (error) {
      console.error("Upload error:", error);
      uploadStatus.textContent = "Failed to add document. Ensure your Firestore rules allow admin writes.";
    } finally {
      uploadSubmit.disabled = false;
    }
  });
}

initMenu();
initGlobalAuthUI();
initLibrary();
initBlog();
initAuthForms();
initProfile();
initAdminWorkspace();
