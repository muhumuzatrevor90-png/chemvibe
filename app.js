import { 
  auth, db, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";
import { 
  collection, 
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
    const nameSection = byId("name-section");

    if (user) {
      const nameDisplay = user.displayName ? user.displayName : "Not set";
      const displayLabel = `${nameDisplay} (${user.email})`;
      
      if (adminLink) adminLink.hidden = false;
      if (profileAdminLink) profileAdminLink.hidden = false;
      if (signoutBtn) signoutBtn.hidden = false;
      if (profileSummary) profileSummary.textContent = `Signed in as: ${displayLabel}`;
      if (passwordSection) passwordSection.hidden = false;
      if (nameSection) nameSection.hidden = false;

      const nameInput = byId("profile-new-name");
      if (nameInput && user.displayName && !nameInput.value) {
        nameInput.value = user.displayName;
      }
    } else {
      if (adminLink) adminLink.hidden = true;
      if (profileAdminLink) profileAdminLink.hidden = true;
      if (signoutBtn) signoutBtn.hidden = true;
      if (profileSummary) profileSummary.textContent = "Not signed in.";
      if (passwordSection) passwordSection.hidden = true;
      if (nameSection) nameSection.hidden = true;
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

// --- Profile Name Update Handling ---
const profileNameForm = byId("profile-name-form");
if (profileNameForm) {
  profileNameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = byId("profile-new-name").value.trim();
    const status = byId("name-status");

    if (!configured || !auth.currentUser) {
      status.textContent = "You must be signed in to update your name.";
      return;
    }

    try {
      status.textContent = "Saving name...";
      await updateProfile(auth.currentUser, {
        displayName: newName
      });
      status.textContent = "Student name updated successfully!";
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error("Name update error:", error);
      status.textContent = `Failed to update name: ${error.message}`;
    }
  });
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
let resourceComments = {}; 

// --- Fetch Data from Firestore ---
async function loadDataFromFirestore() {
  if (!configured || !db) return;

  try {
    const commentsSnapshot = await getDocs(collection(db, "resource_comments"));
    resourceComments = {};
    commentsSnapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() };
      if (!resourceComments[data.resourceId]) {
        resourceComments[data.resourceId] = [];
      }
      resourceComments[data.resourceId].push(data);
    });
    Object.keys(resourceComments).forEach((resId) => {
      resourceComments[resId].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    });

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

// --- Helper: Escape HTML ---
function escapeHTML(str) {
  return String(str || "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#039;");
}

// --- Library Rendering ---
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
    const isFree = !res.price || res.price.toLowerCase() === "free";
    const actionUrl = isFree ? res.link : (res.paymentLink || "#");
    const comments = resourceComments[res.id] || [];

    const commentsHtml = comments.length === 0
      ? `<p class="muted" style="font-size: 0.85rem; margin: 6px 0;">No questions yet. Ask below!</p>`
      : comments.map((c) => `
          <div style="background: ${c.isInstructor ? '#eff6ff' : '#f8fafc'}; border-left: 3px solid ${c.isInstructor ? '#0284c7' : '#cbd5e1'}; padding: 8px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 0.88rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <strong style="color: #0f172a;">
                ${escapeHTML(c.authorName)}
                ${c.isInstructor ? `<span style="background: #0284c7; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Instructor</span>` : ""}
              </strong>
              <span class="muted" style="font-size: 0.75rem;">${escapeHTML(c.dateLabel || "")}</span>
            </div>
            <p style="margin: 0; color: #334155;">${escapeHTML(c.message)}</p>
          </div>
        `).join("");

    const card = document.createElement("div");
    card.className = "card resource-card";
    card.innerHTML = `
      <div>
        <div class="card-meta">
          <span class="tag">${escapeHTML(res.category || "Notes")}</span>
          <span class="price">${escapeHTML(res.price || "Free")}</span>
        </div>
        <h3>${escapeHTML(res.title)}</h3>
        <p>${escapeHTML(res.description)}</p>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
        ${
          isFree 
            ? `<a class="button primary" href="${actionUrl}" target="_blank" style="flex: 1;">View resource</a>`
            : `<a class="button primary" href="${actionUrl}" target="_blank" style="flex: 1; background-color: #059669;">Buy Now (${escapeHTML(res.price)})</a>`
        }
        <button class="button secondary bookmark-btn" data-id="${res.id}" style="background: ${isBookmarked ? '#0284c7' : '#e2e8f0'}; color: ${isBookmarked ? 'white' : '#1e293b'};">
          ${isBookmarked ? '★ Saved' : '☆ Save'}
        </button>
        <button class="button secondary toggle-discussion-btn" data-id="${res.id}" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;">
          💬 Q&A (${comments.length})
        </button>
      </div>

      <div id="discussion-${res.id}" hidden style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
        <h4 style="font-size: 0.92rem; margin-bottom: 8px; color: #0f172a;">Need Clarification? Discussion</h4>
        <div id="comments-list-${res.id}" style="max-height: 220px; overflow-y: auto; margin-bottom: 10px;">
          ${commentsHtml}
        </div>
        <form class="resource-comment-form" data-id="${res.id}" data-title="${escapeHTML(res.title)}" style="display: flex; gap: 6px;">
          <input class="field" type="text" required placeholder="Ask a question..." style="flex: 1; padding: 8px 10px; font-size: 0.88rem;">
          <button class="button primary" type="submit" style="padding: 8px 14px; font-size: 0.85rem;">Post</button>
        </form>
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

  document.querySelectorAll(".toggle-discussion-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const resId = e.target.dataset.id;
      const box = byId(`discussion-${resId}`);
      if (box) box.hidden = !box.hidden;
    });
  });

  document.querySelectorAll(".resource-comment-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resId = form.dataset.id;
      const resTitle = form.dataset.title;
      const input = form.querySelector("input");
      const message = input.value.trim();
      if (!message) return;

      if (!configured || !auth || !auth.currentUser) {
        alert("Please sign in to post a question.");
        window.location.href = "signin.html";
        return;
      }

      const userEmail = auth.currentUser.email || "Student";
      const studentName = auth.currentUser.displayName || userEmail.split("@")[0];
      const isInstructor = ADMIN_EMAILS.includes(userEmail.toLowerCase());
      const authorName = isInstructor ? "Muhumuza Trevor (Instructor)" : studentName;

      const dateLabel = new Date().toLocaleDateString("en-UG", {
        month: "short", day: "numeric", year: "numeric"
      });

      const submitBtn = form.querySelector("button");
      submitBtn.disabled = true;
      submitBtn.textContent = "...";

      try {
        const newComment = {
          resourceId: resId,
          resourceTitle: resTitle,
          authorEmail: userEmail,
          authorName,
          isInstructor,
          message,
          dateLabel,
          createdAt: Date.now()
        };

        const docRef = await addDoc(collection(db, "resource_comments"), newComment);
        if (!resourceComments[resId]) resourceComments[resId] = [];
        resourceComments[resId].push({ id: docRef.id, ...newComment });

        filterAndRenderResources();
        const reopenedBox = byId(`discussion-${resId}`);
        if (reopenedBox) reopenedBox.hidden = false;
      } catch (err) {
        console.error("Error posting comment:", err);
        alert("Could not post your comment.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Post";
      }
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
    const isFree = !res.price || res.price.toLowerCase() === "free";
    const actionUrl = isFree ? res.link : (res.paymentLink || "#");
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "12px";
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="tag">${escapeHTML(res.category || "Notes")}</span>
          <h3 style="margin-top: 4px;">${escapeHTML(res.title)}</h3>
        </div>
        <a class="button primary" href="${actionUrl}" target="_blank" style="padding: 8px 14px;">
          ${isFree ? "View" : "Buy Now"}
        </a>
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
      <span class="muted">${escapeHTML(post.date || "")}</span>
      <h3>${escapeHTML(post.title)}</h3>
      <p>${escapeHTML(post.summary)}</p>
      ${post.link && post.link !== "#" ? `<a class="text-link" href="${post.link}" target="_blank">Read article →</a>` : ""}
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
    const isOfficeHours = cls.sessionType === "office-hours";
    const card = document.createElement("div");
    card.className = "card";
    if (isOfficeHours) {
      card.style.borderLeft = "4px solid #d97706";
    }
    card.innerHTML = `
      <div>
        <span class="tag" style="${isOfficeHours ? 'background: #fef3c7; color: #b45309;' : ''}">
          ${isOfficeHours ? '🕒 Weekly Office Hours (Open Q&A)' : '🎓 Live Lecture'}
        </span>
        <h3 style="margin-top: 8px;">${escapeHTML(cls.title)}</h3>
        <p><strong>Host:</strong> ${escapeHTML(cls.host)}</p>
        <p><strong>Schedule:</strong> ${escapeHTML(cls.time)}</p>
        ${cls.notes ? `<p class="muted" style="font-size: 0.9rem; margin-top: 4px;">${escapeHTML(cls.notes)}</p>` : ""}
      </div>
      <a class="button primary" href="${cls.link}" target="_blank" style="margin-top: 12px; ${isOfficeHours ? 'background-color: #d97706;' : ''}">
        ${isOfficeHours ? 'Drop Into Office Hours' : 'Join Live Session'}
      </a>
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
      const lastReadCount = parseInt(localStorage.getItem("chemvibe_last_read_count"] || "0", 10);
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

      notifications.notifications.forEach?.((notif) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <span class="tag">${escapeHTML(notif.date || "Announcement")}</span>
          <h3>${escapeHTML(notif.title)}</h3>
          <p>${escapeHTML(notif.message)}</p>
        `;
        container.appendChild(card);
      });
      notifications.forEach((notif) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <span class="tag">${escapeHTML(notif.date || "Announcement")}</span>
          <h3>${escapeHTML(notif.title)}</h3>
          <p>${escapeHTML(notif.message)}</p>
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
