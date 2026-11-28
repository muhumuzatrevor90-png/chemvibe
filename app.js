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

// --- Helper: Escape HTML safely without regex parsing issues ---
function escapeHTML(str) {
  return String(str || "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#039;");
}

// --- Library Rendering with Payment Gateway Routing & Discussion Threads ---
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
      ? `<p class="muted" style="font-size: 0.85rem; margin: 6px 0;">No questions yet. Need clarification on a topic or page? Ask below!</p>`
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

      <!-- Expandable Topic Discussion Thread -->
      <div id="discussion-${res.id}" hidden style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
        <h4 style="font-size: 0.92rem; margin-bottom: 8px; color: #0f172a;">Need Clarification? Discussion</h4>
        <div id="comments-list-${res.id}" style="max-height: 220px; overflow-y: auto; margin-bottom: 10px;">
          ${commentsHtml}
        </div>
        <form class="resource-comment-form" data-id="${res.id}" data-title="${escapeHTML(res.title)}" style="display: flex; gap: 6px;">
          <input class="field" type="text" required placeholder="Ask a question about these notes..." style="flex: 1; padding: 8px 10px; font-size: 0.88rem;">
          <button class="button primary" type="submit" style="padding: 8px 14px; font-size: 0.85rem;">Post</button>
        </form>
      </div>
    `;
    container.appendChild(card);
  });

  // Bookmark click handlers
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

  // Toggle discussion thread visibility
  document.querySelectorAll(".toggle-discussion-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const resId = e.target.dataset.id;
      const box = byId(`discussion-${resId}`);
      if (box) box.hidden = !box.hidden;
    });
  });

  // Submit new comment / clarification question
  document.querySelectorAll(".resource-comment-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resId = form.dataset.id;
      const resTitle = form.dataset.title;
      const input = form.querySelector("input");
      const message = input.value.trim();
      if (!message) return;

      if (!configured || !auth || !auth.currentUser) {
        alert("Please sign in to post a question or reply in the discussion thread.");
        window.location.href = "signin.html";
        return;
      }

      const userEmail = auth.currentUser.email || "Student";
      const isInstructor = ADMIN_EMAILS.includes(userEmail.toLowerCase());
      const authorName = isInstructor
        ? "Muhumuza Trevor (Instructor)"
        : userEmail.split("@")[0];

      const dateLabel = new Date().toLocaleDateString("en-UG", {
        month: "short",
        day: "numeric",
        year: "numeric"
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
