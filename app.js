import { 
  auth, db, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";
import { 
  collection, 
  getDocs,
  addDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);
const ADMIN_EMAILS = ["muhumuzatrevormbabazi@gmail.com"];

// --- Mobile Navigation Toggle ---
const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Authentication State Management ---
if (configured && auth) {
  onAuthStateChanged(auth, (user) => {
    const adminLink = byId("nav-admin");
    const profileAdminLink = byId("profile-admin-link");
    const signoutBtn = byId("signout-button");
    const profileSummary = byId("profile-summary");
    const passwordSection = byId("password-section");

    if (user) {
      if (adminLink) adminLink.hidden = false;
      if (profileAdminLink) profileAdminLink.hidden = false;
      if (signoutBtn) signoutBtn.hidden = false;
      if (profileSummary) profileSummary.textContent = `Signed in as: ${user.email}`;
      if (passwordSection) passwordSection.hidden = false;
    } else {
      if (adminLink) adminLink.hidden = true;
      if (profileAdminLink) profileAdminLink.hidden = true;
      if (signoutBtn) signoutBtn.hidden = true;
      if (profileSummary) profileSummary.textContent = "Not signed in.";
      if (passwordSection) passwordSection.hidden = true;
    }
  });

  const signoutBtn = byId("signout-button");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        window.location.href = "signin.html";
      } catch (err) {
        console.error("Sign out error:", err);
      }
    });
  }
}

// --- Password Change Handling ---
const passwordForm = byId("password-change-form");
if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = byId("new-password").value;
    const status = byId("password-status");

    if (!configured || !auth.currentUser) {
      status.textContent = "You must be signed in to change your password.";
      return;
    }

    if (newPassword.length < 6) {
      status.textContent = "Password must be at least 6 characters long.";
      return;
    }

    try {
      status.textContent = "Updating password...";
      await updatePassword(auth.currentUser, newPassword);
      status.textContent = "Password updated successfully!";
      passwordForm.reset();
    } catch (error) {
      console.error("Password update error:", error);
      if (error.code === "auth/requires-recent-login") {
        status.textContent = "For security, please sign out and sign back in before changing your password.";
      } else {
        status.textContent = `Failed to update password: ${error.message}`;
      }
    }
  });
}

// --- Global Data Arrays ---
let resources = [];
let blogPosts = [];
let liveClasses = [];
let resourceComments = {}; // Grouped by resourceId

// --- Fetch Data from Firestore ---
async function loadDataFromFirestore() {
  if (!configured || !db) return;

  try {
    // 1. Fetch Resource Comments
    const commentsSnapshot = await getDocs(collection(db, "resource_comments"));
    resourceComments = {};
    commentsSnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      if (!resourceComments[data.resourceId]) {
        resourceComments[data.resourceId] = [];
      }
      resourceComments[data.resourceId].push(data);
    });
    // Sort comments chronologically per resource
    Object.keys(resourceComments).forEach((resId) => {
      resourceComments[resId].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    });

    // 2. Fetch Resources
    const resSnapshot = await getDocs(collection(db, "resources"));
    resources = [];
    resSnapshot.forEach((doc) => {
      resources.push({ id: doc.id, ...doc.data() });
    });
    renderResources(resources);
    renderBookmarks();

    // 3. Fetch Blog Posts
    const blogSnapshot = await getDocs(collection(db, "blogs"));
    blogPosts = [];
    blogSnapshot.forEach((doc) => {
      blogPosts.push({ id: doc.id, ...doc.data() });
    });
    renderBlog();

    // 4. Fetch Live Classes
    const classSnapshot = await getDocs(collection(db, "classes"));
    liveClasses = [];
    classSnapshot.forEach((doc) => {
      liveClasses.push({ id: doc.id, ...doc.data() });
    });
    renderClasses();

  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
  }
}

// --- Helper: Escape HTML to prevent XSS in student comments ---
function escapeHTML(str) {
  return String(str || "")
    .replace(/
