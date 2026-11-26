import { auth, db, configured, onAuthStateChanged } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);
const ADMIN_EMAIL = "muhumuzatrevormbabazi@gmail.com";

// --- Mobile Navigation Toggle ---
const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Admin Permission Check ---
if (configured && auth) {
  onAuthStateChanged(auth, (user) => {
    const authPanel = byId("admin-auth-panel");
    const workspaceContent = byId("admin-workspace-content");
    const statusTitle = byId("admin-status-title");
    const statusDesc = byId("admin-status-desc");
    const signinBtn = byId("admin-signin-btn");

    if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (authPanel) authPanel.hidden = true;
      if (workspaceContent) workspaceContent.hidden = false;
    } else {
      if (statusTitle) statusTitle.textContent = "Access Denied";
      if (statusDesc) statusDesc.textContent = "This account does not have administrator privileges.";
      if (signinBtn) signinBtn.href = "signin.html";
    }
  });
}

// --- 1. Publish Study Resource to Firestore ---
const adminForm = byId("admin-add-form");
if (adminForm) {
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("admin-title").value;
    const category = byId("admin-category").value;
    const link = byId("admin-link").value;
    const description = byId("admin-desc").value;

    if (!title || !link || !description) return;

    try {
      await addDoc(collection(db, "resources"), {
        title,
        category,
        price: "Free",
        description,
        link,
        createdAt: Date.now()
      });
      adminForm.reset();
      alert("Study resource published successfully to cloud storage!");
    } catch (error) {
      console.error("Error adding resource:", error);
      alert(`Failed to publish: ${error.message}`);
    }
  });
}

// --- 2. Publish Blog Post to Firestore ---
const blogForm = byId("admin-blog-form");
if (blogForm) {
  blogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("blog-title").value;
    const date = byId("blog-date").value;
    const link = byId("blog-link").value;
    const summary = byId("blog-summary").value;

    if (!title || !summary) return;

    try {
      await addDoc(collection(db, "blogs"), {
        title,
        date,
        link: link || "#",
        summary,
        createdAt: Date.now()
      });
      blogForm.reset();
      alert("Blog article published successfully to cloud storage!");
    } catch (error) {
      console.error("Error adding blog post:", error);
      alert(`Failed to publish: ${error.message}`);
    }
  });
}

// --- 3. Schedule Live Class to Firestore ---
const classForm = byId("admin-class-form");
if (classForm) {
  classForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("class-title").value;
    const host = byId("class-host").value;
    const time = byId("class-time").value;
    const link = byId("class-link").value;

    if (!title || !host || !link) return;

    try {
      await addDoc(collection(db, "classes"), {
        title,
        host,
        time,
        link,
        createdAt: Date.now()
      });
      classForm.reset();
      alert("Live class scheduled successfully to cloud storage!");
    } catch (error) {
      console.error("Error scheduling class:", error);
      alert(`Failed to schedule: ${error.message}`);
    }
  });
}
