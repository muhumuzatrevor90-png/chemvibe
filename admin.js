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
        // Access Granted!
        if (authPanel) authPanel.hidden = true;
        if (workspaceContent) workspaceContent.hidden = false;
      } else {
        // Logged in, but not the admin email
        if (statusTitle) statusTitle.textContent = "Access Denied";
        if (statusDesc) statusDesc.textContent = `Signed in as ${user.email}. This account does not have administrator privileges.`;
        if (signinBtn) {
          signinBtn.textContent = "Sign in with Admin Account";
          signinBtn.href = "signin.html";
        }
      }
    } else {
      // Not logged in at all
      if (statusTitle) statusTitle.textContent = "Checking permissions...";
      if (statusDesc) statusDesc.textContent = "Please sign in with your admin email to access the workspace.";
      if (signinBtn) {
        signinBtn.textContent = "Sign in as Admin";
        signinBtn.href = "signin.html";
      }
    }
  });
}

// --- Handle Admin Resource Submission ---
const adminForm = byId("admin-add-form");
if (adminForm) {
  adminForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = byId("admin-title").value;
    const category = byId("admin-category").value;
    const description = byId("admin-desc").value;

    if (!title || !description) return;

    // Retrieve existing resources or initialize
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
