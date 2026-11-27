import { 
  auth, db, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";
import { 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);

const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

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

let resources = [];
let blogPosts = [];
let liveClasses = [];

async function loadDataFromFirestore() {
  if (!configured || !db) return;

  try {
    const resSnapshot = await getDocs(collection(db, "resources"));
    resources = [];
    resSnapshot.forEach((doc) => {
      resources.push({ id: doc.id, ...doc.data() });
    });
    renderResources(resources);
    renderBookmarks();

    const blogSnapshot = await getDocs(collection(db, "blogs"));
    blogPosts = [];
    blogSnapshot.forEach((doc) => {
      blogPosts.push({ id: doc.id, ...doc.data() });
    });
    renderBlog();

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
      <div>
        <div class="card-meta">
          <span class="tag">${res.category || "Notes"}</span>
          <span class="price">${res.price || "Free"}</span>
        </div>
        <h3>${res.title}</h3>
        <p>${res.description}</p>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <a class="button primary" href="${res.link}" target="_blank" style="flex: 1;">View resource</a>
        <button class="button secondary bookmark-btn" data-id="${res.id}" style="background: ${isBookmarked ? '#0284c7' : '#e2e8f0'}; color: ${isBookmarked ? 'white' : '#1e293b'};">
          ${isBookmarked ? '★ Saved' : '☆ Save'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });

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
        <a class="button primary" href="${res.link}" target="_blank" style="padding: 8px 14px;">View</a>
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
      <h3>${post.title}</h3>
      <p>${post.summary}</p>
      ${post.link && post.link !== "#" ? `<a class="text-link" href="${post.link}" target="_blank">Read article / View file →</a>` : ""}
    `;
    container.appendChild(card);
  });
}

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
      <div>
        <span class="tag">Live Session</span>
        <h3>${cls.title}</h3>
        <p><strong>Host:</strong> ${cls.host}</p>
        <p><strong>Time:</strong> ${cls.time}</p>
      </div>
      <a class="button primary" href="${cls.link}" target="_blank" style="margin-top: 10px;">Join session</a>
    `;
    container.appendChild(card);
  });
}

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
        card.innerHTML = `
          <span class="tag">${notif.date || "Announcement"}</span>
          <h3>${notif.title}</h3>
          <p>${notif.message}</p>
        `;
        container.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

loadDataFromFirestore();
loadNotificationsFromFirestore();
