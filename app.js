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

function initGlobalAuthUI() {
  if (!configured) return;
  observeAuth((user) => {
    const adminNav = byId("nav-admin");
    if (adminNav) {
      adminNav.hidden = !isAdminUser(user);
    }
  });
}

// 1. Dynamic Library
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

// 2. Dynamic Blog
async function initBlog() {
  const container = byId("blog-list");
  if (!container) return;
  const search = byId("blog-search");
  const empty = byId("blog-empty");
  let blogs = [];

  if (configured && db) {
    try {
      const snapshot = await getDocs(collection(db, "blogs"));
      blogs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.error("Failed to load blog posts:", error);
    }
  }

  function render() {
    const term = search ? search.value.trim().toLowerCase() : "";
    let shown = 0;
    container.innerHTML = "";

    blogs.forEach((post) => {
      const title = post.title || "Untitled Article";
      const tagText = post.tag || "CHEMISTRY";
      const bodyText = post.body || "";

      const matchesText = !term || `${title} ${tagText} ${bodyText}`.toLowerCase().includes(term);

      if (matchesText) {
        shown++;
        const card = document.createElement("article");
        card.className = "card blog-card";

        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = tagText.toUpperCase();

        const h2 = document.createElement("h2");
        h2.textContent = title;

        const p = document.createElement("p");
        p.textContent = bodyText;

        card.append(tag, h2, p);
        container.appendChild(card);
      }
    });

    if (empty) empty.hidden = shown > 0;
  }

  if (search) search.addEventListener("input", render);
  render();
}

// 3. Dynamic Live Classes
async function initClasses() {
  const container = byId("classes-list");
  if (!container) return;
  const empty = byId("classes-empty");
  let classes = [];

  if (configured && db) {
    try {
      const snapshot = await getDocs(collection(db, "classes"));
      classes = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.error("Failed to load live classes:", error);
    }
  }

  container.innerHTML = "";
  let shown = 0;

  classes.forEach((cls) => {
    shown++;
    const card = document.createElement("article");
    card.className = "card resource-card";

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "LIVE SESSION";

    const timeEl = document.createElement("span");
    timeEl.className = "price";
    timeEl.textContent = cls.time || "Upcoming";

    meta.append(tag, timeEl);

    const h3 = document.createElement("h3");
    h3.textContent = cls.title || "Chemistry Class";

    const p = document.createElement("p");
    p.textContent = cls.description || "";

    const btn = document.createElement("button");
    btn.className = "button primary purchase-button";
    btn.type = "button";
    btn.textContent = "Join Session";
    btn.addEventListener("click", () => {
      if (cls.meetUrl) {
        window.open(cls.meetUrl, "_blank", "noopener,noreferrer");
      } else {
        alert("Meeting link has not been posted yet.");
      }
    });

    card.append(meta, h3, p, btn);
    container.appendChild(card);
  });

  if (empty) empty.hidden = shown > 0;
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
  const adminContent = byId("admin-content");
  if (!deniedBox || !adminContent) return;

  const deniedMsg = byId("admin-denied-msg");

  if (!configured) {
    deniedMsg.textContent = "Firebase is not configured yet.";
    return;
  }

  async function renderCollectionList(collectionName, containerId, labelField, subField) {
    const list = byId(containerId);
    if (!list) return;
    list.innerHTML = "<p class='muted'>Loading…</p>";
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      list.innerHTML = "";
      if (snapshot.empty) {
        list.innerHTML = "<p class='muted'>Nothing published yet.</p>";
        return;
      }
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--line); border-radius:10px; gap:12px;";

        const info = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = data[labelField] || "Untitled";
        const meta = document.createElement("div");
        meta.className = "muted";
        meta.textContent = data[subField] || "";
        info.append(title, meta);

        const delBtn = document.createElement("button");
        delBtn.className = "button danger";
        delBtn.type = "button";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", async () => {
          if (!confirm(`Delete "${data[labelField]}"?`)) return;
          delBtn.disabled = true;
          try {
            await deleteDoc(doc(db, collectionName, docSnap.id));
            refreshAllAdminLists();
          } catch (err) {
            console.error(err);
            alert("Failed to delete item. Check Firestore rules.");
            delBtn.disabled = false;
          }
        });

        row.append(info, delBtn);
        list.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      list.innerHTML = "<p class='muted'>Could not load items.</p>";
    }
  }

  function refreshAllAdminLists() {
    renderCollectionList("resources", "admin-resource-list", "title", "type");
    renderCollectionList("blogs", "admin-blog-list", "title", "tag");
    renderCollectionList("classes", "admin-class-list", "title", "time");
  }

  observeAuth((user) => {
    if (isAdminUser(user)) {
      deniedBox.hidden = true;
      adminContent.hidden = false;
      refreshAllAdminLists();
    } else {
      deniedBox.hidden = false;
      adminContent.hidden = true;
      deniedMsg.textContent = user
        ? `Access denied. Your account (${user.email}) does not have admin privileges.`
        : "Please sign in with your admin email to access this workspace.";
    }
  });

  // 1. Submit Study Document
  const uploadForm = byId("upload-form");
  uploadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("upload-status");
    const submit = byId("upload-submit");
    if (!isAdminUser(auth.currentUser)) return;

    submit.disabled = true;
    status.textContent = "Publishing document…";
    try {
      await addDoc(collection(db, "resources"), {
        title: byId("res-title").value.trim(),
        type: byId("res-type").value,
        price: byId("res-price").value.trim(),
        description: byId("res-desc").value.trim(),
        fileUrl: byId("res-url").value.trim(),
        uploadedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      status.textContent = "Document added to Library!";
      uploadForm.reset();
      refreshAllAdminLists();
    } catch (error) {
      console.error(error);
      status.textContent = "Failed to add document. Check Firestore rules.";
    } finally {
      submit.disabled = false;
    }
  });

  // 2. Submit Blog Article
  const blogForm = byId("blog-form");
  blogForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("blog-status");
    const submit = byId("blog-submit");
    if (!isAdminUser(auth.currentUser)) return;

    submit.disabled = true;
    status.textContent = "Publishing article…";
    try {
      await addDoc(collection(db, "blogs"), {
        title: byId("blog-title").value.trim(),
        tag: byId("blog-tag").value.trim(),
        body: byId("blog-body").value.trim(),
        createdAt: serverTimestamp()
      });
      status.textContent = "Article published to Blog!";
      blogForm.reset();
      refreshAllAdminLists();
    } catch (error) {
      console.error(error);
      status.textContent = "Failed to publish article. Check Firestore rules.";
    } finally {
      submit.disabled = false;
    }
  });

  // 3. Submit Live Class
  const classForm = byId("class-form");
  classForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = byId("class-status");
    const submit = byId("class-submit");
    if (!isAdminUser(auth.currentUser)) return;

    submit.disabled = true;
    status.textContent = "Posting live class…";
    try {
      await addDoc(collection(db, "classes"), {
        title: byId("class-title").value.trim(),
        time: byId("class-time").value.trim(),
        description: byId("class-desc").value.trim(),
        meetUrl: byId("class-url").value.trim(),
        createdAt: serverTimestamp()
      });
      status.textContent = "Live class posted!";
      classForm.reset();
      refreshAllAdminLists();
    } catch (error) {
      console.error(error);
      status.textContent = "Failed to post class. Check Firestore rules.";
    } finally {
      submit.disabled = false;
    }
  });
}

initMenu();
initGlobalAuthUI();
initLibrary();
initBlog();
initClasses();
initAuthForms();
initProfile();
initAdminWorkspace();
