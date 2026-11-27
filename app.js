import { 
  auth, db, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";
import { 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);

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

// --- Fetch Data from Firestore ---
async function loadDataFromFirestore() {
  if (!configured || !db) return;

  try {
    // 1. Fetch Resources
    const resSnapshot = await getDocs(collection(db, "resources"));
    resources = [];
    resSnapshot.forEach((doc) => {
      resources.push({ id: doc.id, ...doc.data() });
    });
    renderResources(resources);
    renderBookmarks(); // Render saved bookmarks on profile page if present

    // 2. Fetch Blog Posts
    const blogSnapshot = await getDocs(collection(db, "blogs"));
    blogPosts = [];
    blogSnapshot.forEach((doc) => {
      blogPosts.push({ id: doc.id, ...doc.data() });
    });
    renderBlog();

    // 3. Fetch Live Classes
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

// --- Library Rendering & Bookmarking Support ---
function renderResources(list) {
  const container = byId("resource-list");
  const emptyState = byId("resource-empty");
  const countLabel = byId("resource-count");
  if (!container) return;

  container.innerHTML = "";
  if (countLabel) countLabel.textContent = `${list.length} resources`;

  if (list.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  const bookmarks = JSON.parse(localStorage.getItem("chemvibe_bookmarks") || "[]");

  list.forEach((res) => {
    const isBookmarked = bookmarks.includes(res.id);
    const card = document.createElement("div");
    card.className = "card resource-card";
    card.innerHTML = `
      <div class="card-meta">
        <span class="tag">${res.category || "Notes"}</span>
        <span class="price">${res.price || "Free"}</span>
      </div>
      <h3>${res.title}</h3>
      <p>${res.description}</p>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <a class="button primary" href="${res.link}" target="_blank" style="flex: 1; text-align: center; text-decoration: none;">View resource</a>
        <button class="button secondary bookmark-btn" data-id="${res.id}" style="background: ${isBookmarked ? '#4d79ff' : 'transparent'}; color: ${isBookmarked ? 'white' : 'inherit'}; border: 1px solid #ccc; padding: 8px 12px; cursor: pointer;">
          ${isBookmarked ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach bookmark toggle listeners
  document.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const resId = e.target.dataset.id;
      let currentBookmarks = JSON.parse(localStorage.getItem("chemvibe_bookmarks") || "[]");

      if (currentBookmarks.includes(resId)) {
        currentBookmarks = currentBookmarks.filter((id) => id !== resId);
      } else {
        currentBookmarks.push(resId);
      }

      localStorage.setItem("chemvibe_bookmarks", JSON.stringify(currentBookmarks));
      filterAndRenderResources();
      renderBookmarks();
    });
  });
}

// --- Render Bookmarks on Profile Page ---
function renderBookmarks() {
  const container = byId("bookmarked-list");
  const emptyState = byId("bookmarked-empty");
  if (!container) return;

  const bookmarks = JSON.parse(localStorage.getItem("chemvibe_bookmarks") || "[]");
  container.innerHTML = "";

  const savedResources = resources.filter((res) => bookmarks.includes(res.id));

  if (savedResources.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  savedResources.forEach((res) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "12px";
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="tag">${res.category || "Notes"}</span>
          <h3 style="margin-top: 4px;">${res.title}</h3>
        </div>
        <a class="button primary" href="${res.link}" target="_blank" style="padding: 6px 12px; text-decoration: none;">View</a>
      </div>
    `;
    container.appendChild(card);
  });
}

const searchInput = byId("resource-search");
const filterChips = document.querySelectorAll("#resource-filters .chip");

function filterAndRenderResources() {
  const queryText = searchInput ? searchInput.value.toLowerCase() : "";
  const activeChip = document.querySelector("#resource-filters .chip.active");
  const selectedType = activeChip ? activeChip.dataset.type : "all";

  const filtered = resources.filter((res) => {
    const matchesQuery = (res.title && res.title.toLowerCase().includes(queryText)) || 
                         (res.description && res.description.toLowerCase().includes(queryText));
    const matchesType = selectedType === "all" || (res.category && res.category.toLowerCase() === selectedType.toLowerCase());
    return matchesQuery && matchesType;
  });

  renderResources(filtered);
}

if (searchInput) {
  searchInput.addEventListener("input", filterAndRenderResources);
}

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    filterAndRenderResources();
  });
});

// --- Blog Rendering ---
function renderBlog() {
  const container = byId("blog-list");
  const emptyState = byId("blog-empty");
  if (!container) return;

  container.innerHTML = "";
  if (blogPosts.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  blogPosts.forEach((post) => {
    const card = document.createElement("div");
    card.className = "card blog-card";
    card.innerHTML = `
      <span class="muted">${post.date || ""}</span>
      <h2>${post.title}</h2>
      <p>${post.summary}</p>
      ${post.link && post.link !== "#" ? `<a class="text-link" href="${post.link}" target="_blank" style="display: inline-block; margin-top: 8px;">Read article / View file →</a>` : ""}
    `;
    container.appendChild(card);
  });
}

// --- Live Classes Rendering ---
function renderClasses() {
  const container = byId("classes-list");
  const emptyState = byId("classes-empty");
  if (!container) return;

  container.innerHTML = "";
  if (liveClasses.length === 0) {
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  liveClasses.forEach((cls) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <span class="tag">Live Session</span>
      <h3>${cls.title}</h3>
      <p><strong>Host:</strong> ${cls.host}</p>
      <p><strong>Time:</strong> ${cls.time}</p>
      <a class="button primary" href="${cls.link}" target="_blank" style="margin-top: 10px; display: inline-block; text-align: center; text-decoration: none;">Join session</a>
    `;
    container.appendChild(card);
  });
}

// --- Notifications Rendering & Unread Badge Counter ---
async function loadNotificationsFromFirestore() {
  const container = byId("notifications-list");
  const emptyState = byId("notifications-empty");
  const badge = byId("notification-badge");

  if (!configured || !db) return;

  try {
    const snap = await getDocs(collection(db, "notifications"));
    let notifications = [];
    snap.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    const totalCount = notifications.length;
    const isNotificationsPage = window.location.pathname.includes("notifications.html");

    if (isNotificationsPage) {
      localStorage.setItem("chemvibe_last_read_count", totalCount);
      if (badge) badge.hidden = true;
    } else {
      const lastReadCount = parseInt(localStorage.getItem("chemvibe_last_read_count") || "0", 10);
      const unreadCount = totalCount - lastReadCount;

      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      }
    }

    if (container) {
      container.innerHTML = "";
      if (notifications.length === 0) {
        if (emptyState) emptyState.hidden = false;
        return;
      }
      if (emptyState) emptyState.hidden = true;

      notifications.forEach((notif) => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.marginBottom = "16px";
        card.innerHTML = `
          <span class="tag">${notif.date || "Announcement"}</span>
          <h3>${notif.title}</h3>
          <p style="margin-top: 8px;">${notif.message}</p>
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

// Initialize data fetching on startup
loadDataFromFirestore();
loadNotificationsFromFirestore();
