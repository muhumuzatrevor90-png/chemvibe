import {
  configured,
  auth,
  db,
  storage,
  createAccount,
  signIn,
  signOutCurrentUser,
  observeAuth
} from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const byId = (id) => document.getElementById(id);

function initMenu() {
  byId("menu-toggle")?.addEventListener("click", () => {
    byId("main-nav")?.classList.toggle("open");
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
      resources = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

        // Build card safely with DOM methods to prevent XSS
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
  const uploadSection = byId("upload-section");

  if (!configured) {
    status.textContent = "Firebase is not connected yet.";
    return;
  }

  observeAuth((user) => {
    status.textContent = user ? `Signed in as ${user.displayName || "ChemVibe student"}.` : "Not signed in.";
    email.textContent = user?.email || "";
    if (uploadSection) {
      uploadSection.hidden = !user;
    }
  });

  byId("signout-button")?.addEventListener("click", async () => {
    await signOutCurrentUser();
    location.href = "index.html";
  });

  const uploadForm = byId("upload-form");
  uploadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const uploadStatus = byId("upload-status");
    const uploadSubmit = byId("upload-submit");
    const fileInput = byId("res-file");
    const file = fileInput.files[0];

    if (!file || !auth.currentUser) return;

    uploadSubmit.disabled = true;
    uploadStatus.textContent = "Uploading document… please wait.";

    try {
      // 1. Upload file to Firebase Storage
      const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const storageRef = ref(storage, `resources/${safeFileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Save document details to Firestore
      await addDoc(collection(db, "resources"), {
        title: byId("res-title").value.trim(),
        type: byId("res-type").value,
        price: byId("res-price").value.trim(),
        description: byId("res-desc").value.trim(),
        fileUrl: downloadURL,
        uploadedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });

      uploadStatus.textContent = "Success! Document added to the library.";
      uploadForm.reset();
    } catch (error) {
      console.error("Upload error:", error);
      uploadStatus.textContent = "Upload failed. Ensure Firebase Storage is enabled and rules allow uploads.";
    } finally {
      uploadSubmit.disabled = false;
    }
  });
}

initMenu();
initLibrary();
initBlog();
initAuthForms();
initProfile();
