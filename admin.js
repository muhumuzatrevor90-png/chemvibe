import { auth, configured, onAuthStateChanged } from "./firebase.js";

const byId = (id) => document.getElementById(id);

// Authorized Admin Email
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

    if (user) {
      if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (authPanel) authPanel.hidden = true;
        if (workspaceContent) workspaceContent.hidden = false;
      } else {
        if (statusTitle) statusTitle.textContent = "Access Denied";
        if (statusDesc) statusDesc.textContent = `Signed in as ${user.email}. This account does not have administrator privileges.`;
        if (signinBtn) {
          signinBtn.textContent = "Sign in with Admin Account";
          signinBtn.href = "signin.html";
        }
      }
    } else {
      if (statusTitle) statusTitle.textContent = "Checking permissions...";
      if (statusDesc) statusDesc.textContent = "Please sign in with your admin email to access the workspace.";
      if (signinBtn) {
        signinBtn.textContent = "Sign in as Admin";
        signinBtn.href = "signin.html";
      }
    }
  });
}

// --- 1. Publish Study Resource ---
const adminForm = byId("admin-add-form");
if (adminForm) {
  adminForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = byId("admin-title").value;
    const category = byId("admin-category").value;
    const description = byId("admin-desc").value;

    if (!title || !description) return;

    let resources = JSON.parse(localStorage.getItem("chemvibe_resources")) || [];
    resources.push({
      id: Date.now().toString(),
      title,
      category,
      price: "Free",
      description,
      link: "#"
    });

    localStorage.setItem("chemvibe_resources", JSON.stringify(resources));
    adminForm.reset();
    alert("Study resource published successfully!");
  });
}

// --- 2. Publish Blog Post ---
const blogForm = byId("admin-blog-form");
if (blogForm) {
  blogForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = byId("blog-title").value;
    const date = byId("blog-date").value;
    const summary = byId("blog-summary").value;

    if (!title || !summary) return;

    let blogPosts = JSON.parse(localStorage.getItem("chemvibe_blogs")) || [];
    blogPosts.push({
      id: Date.now().toString(),
      title,
      date,
      summary
    });

    localStorage.setItem("chemvibe_blogs", JSON.stringify(blogPosts));
    blogForm.reset();
    alert("Blog article published successfully!");
  });
}

// --- 3. Schedule Live Class ---
const classForm = byId("admin-class-form");
if (classForm) {
  classForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = byId("class-title").value;
    const host = byId("class-host").value;
    const time = byId("class-time").value;
    const link = byId("class-link").value;

    if (!title || !host) return;

    let liveClasses = JSON.parse(localStorage.getItem("chemvibe_classes")) || [];
    liveClasses.push({
      id: Date.now().toString(),
      title,
      host,
      time,
      link
    });

    localStorage.setItem("chemvibe_classes", JSON.stringify(liveClasses));
    classForm.reset();
    alert("Live class scheduled successfully!");
  });
}
