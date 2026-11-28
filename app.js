import { 
  auth, db, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";
import { 
  collection, 
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const byId = (id) => document.getElementById(id);
const ADMIN_EMAILS = ["muhumuzatrevormbabazi@gmail.com"];

// --- 1. Mobile Navigation Toggle (Runs first so 3-dash menu never breaks) ---
function initMobileMenu() {
  const menuToggle = byId("menu-toggle");
  const mainNav = byId("main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mainNav.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (mainNav.classList.contains("open") && !mainNav.contains(e.target) && e.target !== menuToggle) {
        mainNav.classList.remove("open");
      }
    });
  }
}
initMobileMenu();

// --- 2. Sign-In-First Gate & Auth State Management ---
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const isAuthPage = currentPage === "signin.html" || currentPage === "signup.html";

if (configured && auth) {
  onAuthStateChanged(auth, (user) => {
    // Redirect visitors to Sign In first if they are not logged in
    if (!user && !isAuthPage) {
      window.location.href = "signin.html";
      return;
    }

    const adminLink = byId("nav-admin");
    const messagesLink = byId("nav-messages");
    const profileAdminLink = byId("profile-admin-link");
    const signoutBtn = byId("signout-button");
    const navAuthBtn = byId("nav-signin-out");
    const welcomeBanner = byId("welcome-banner");

    if (user) {
      const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
      const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Student");
      const savedPhoto = localStorage.getItem(`chemvibe_avatar_${user.uid}`) || user.photoURL || "";

      // Personalized Welcome Banner
      if (welcomeBanner) {
        welcomeBanner.textContent = `Welcome back, ${displayName}!`;
        welcomeBanner.hidden = false;
      }

      // Admin-only navigation links
      if (adminLink) adminLink.hidden = !isAdmin;
      if (messagesLink) messagesLink.hidden = !isAdmin;
      if (profileAdminLink) profileAdminLink.hidden = !isAdmin;

      if (signoutBtn) signoutBtn.hidden = false;
      if (navAuthBtn) {
        navAuthBtn.textContent = "Sign out";
        navAuthBtn.href = "#";
        navAuthBtn.onclick = async (e) => {
          e.preventDefault();
          await signOut(auth);
          window.location.href = "signin.html";
        };
      }

      // Populate Profile Settings Page
      const profileNameDisplay = byId("profile-display-name");
      const profileHandleDisplay = byId("profile-handle");
      const profileEmailDisplay = byId("profile-email-display");
      const profileAvatarImg = byId("profile-avatar-img");
      const nameInput = byId("profile-new-name");

      if (profileNameDisplay) profileNameDisplay.textContent = displayName;
      if (profileHandleDisplay) profileHandleDisplay.textContent = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;
      if (profileEmailDisplay) profileEmailDisplay.textContent = user.email;
      if (nameInput && !nameInput.value) nameInput.value = displayName;
      if (profileAvatarImg && savedPhoto) {
        profileAvatarImg.src = savedPhoto;
      }

      // Load data once authenticated
      loadDataFromFirestore(user, isAdmin);
      loadNotificationsFromFirestore();
      loadPrivateMessages(user, isAdmin);
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

// --- 3. Profile Picture Upload (Resizes cleanly to save in browser & profile) ---
const avatarInput = byId("avatar-upload");
const changePicBtn = byId("change-picture-btn");
if (changePicBtn && avatarInput) {
  changePicBtn.addEventListener("click", () => avatarInput.click());
  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !auth.currentUser) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 180;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);

        localStorage.setItem(`chemvibe_avatar_${auth.currentUser.uid}`, compressedDataUrl);
        const avatarImg = byId("profile-avatar-img");
        if (avatarImg) avatarImg.src = compressedDataUrl;

        const picStatus = byId("picture-status");
        if (picStatus) picStatus.textContent = "Profile picture updated!";
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- 4. Profile Username & Password Update ---
const profileNameForm = byId("profile-name-form");
if (profileNameForm) {
  profileNameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = byId("profile-new-name").value.trim();
    const status = byId("name-status");
    if (!configured || !auth.currentUser || !newName) return;

    try {
      status.textContent = "Updating username...";
      await updateProfile(auth.currentUser, { displayName: newName });
      status.textContent = "Username updated successfully!";
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
    }
  });
}

const passwordForm = byId("password-change-form");
if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = byId("new-password").value;
    const confirmPassword = byId("confirm-password") ? byId("confirm-password").value : newPassword;
    const status = byId("password-status");

    if (!configured || !auth.currentUser) return;
    if (newPassword.length < 6) {
      status.textContent = "Password must be at least 6 characters long.";
      return;
    }
    if (newPassword !== confirmPassword) {
      status.textContent = "Passwords do not match.";
      return;
    }

    try {
      status.textContent = "Updating password...";
      await updatePassword(auth.currentUser, newPassword);
      status.textContent = "Password updated successfully!";
      passwordForm.reset();
    } catch (error) {
      if (error.code === "auth/requires-recent-login") {
        status.textContent = "Please sign out and sign back in before changing your password.";
      } else {
        status.textContent = `Failed: ${error.message}`;
      }
    }
  });
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

// --- 5. Global Data Arrays & Firestore Fetching ---
let resources = [];
let blogPosts = [];
let liveClasses = [];
let privateMessages = [];

async function loadDataFromFirestore(user, isAdmin) {
  if (!configured || !db) return;

  try {
    const resSnapshot = await getDocs(collection(db, "resources"));
    resources = [];
    resSnapshot.forEach((docSnap) => {
      resources.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderResources(resources, user, isAdmin);
    renderBookmarks();

    const blogSnapshot = await getDocs(collection(db, "blogs"));
    blogPosts = [];
    blogSnapshot.forEach((docSnap) => {
      blogPosts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderBlog();

    const classSnapshot = await getDocs(collection(db, "classes"));
    liveClasses = [];
    classSnapshot.forEach((docSnap) => {
      liveClasses.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderClasses();
  } catch (error) {
    console.error("Error fetching data from Firestore:", error);
  }
}

// --- 6. Private 1-on-1 Student–Instructor Messaging ---
async function loadPrivateMessages(user, isAdmin) {
  if (!configured || !db || !user) return;

  try {
    const msgSnapshot = await getDocs(collection(db, "private_messages"));
    privateMessages = [];
    msgSnapshot.forEach((docSnap) => {
      privateMessages.push({ id: docSnap.id, ...docSnap.data() });
    });
    privateMessages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    // Admin Unread Red Badge Counter
    const msgBadge = byId("messages-badge");
    if (isAdmin && msgBadge) {
      const unreadCount = privateMessages.filter((m) => m.senderRole === "student" && !m.readByAdmin).length;
      if (unreadCount > 0) {
        msgBadge.textContent = unreadCount;
        msgBadge.hidden = false;
      } else {
        msgBadge.hidden = true;
      }
    }

    // Re-render resource private threads so each student only sees their own thread
    renderResources(resources, user, isAdmin);

    // If on Admin Messages Page (messages.html), render all student threads
    if (isAdmin && byId("admin-messages-container")) {
      renderAdminMessagesInbox(user);
    }
  } catch (err) {
    console.error("Error loading private messages:", err);
  }
}

// --- 7. Library Rendering (With Private 1-on-1 Student-Instructor Chat) ---
function renderResources(list, user, isAdmin) {
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
  const currentUserEmail = (user?.email || "").toLowerCase();

  list.forEach((res) => {
    const isBookmarked = bookmarks.includes(res.id);
    const isFree = !res.price || res.price.toLowerCase() === "free";
    const actionUrl = isFree ? res.link : (res.paymentLink || "#");

    // STRICT PRIVACY FILTER: Student sees ONLY their own conversation with Instructor; Instructor sees all
    const visibleThread = privateMessages.filter((m) => {
      if (m.resourceId !== res.id) return false;
      if (isAdmin) return true;
      return (m.studentEmail || "").toLowerCase() === currentUserEmail;
    });

    const threadHtml = visibleThread.length === 0
      ? `<p class="muted" style="font-size: 0.85rem; margin: 6px 0;">Private 1-on-1 chat with your instructor. Only you and the instructor see these messages.</p>`
      : visibleThread.map((m) => `
          <div style="background: ${m.senderRole === 'instructor' ? '#eff6ff' : '#f8fafc'}; border-left: 3px solid ${m.senderRole === 'instructor' ? '#0284c7' : '#64748b'}; padding: 8px 10px; border-radius: 6px; margin-bottom: 8px; font-size: 0.88rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <strong style="color: #0f172a;">
                ${escapeHTML(m.senderName)}
                ${m.senderRole === 'instructor' ? `<span style="background: #0284c7; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Instructor</span>` : ""}
              </strong>
              <span class="muted" style="font-size: 0.75rem;">${escapeHTML(m.dateLabel || "")}</span>
            </div>
            <p style="margin: 0; color: #334155;">${escapeHTML(m.message)}</p>
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
          🔒 Private Q&A (${visibleThread.length})
        </button>
      </div>

      <div id="discussion-${res.id}" hidden style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
        <h4 style="font-size: 0.92rem; margin-bottom: 8px; color: #0f172a;">Private Message to Instructor</h4>
        <div style="max-height: 220px; overflow-y: auto; margin-bottom: 10px;">
          ${threadHtml}
        </div>
        <form class="private-msg-form" data-id="${res.id}" data-title="${escapeHTML(res.title)}" style="display: flex; gap: 6px;">
          <input class="field" type="text" required placeholder="Message instructor privately..." style="flex: 1; padding: 8px 10px; font-size: 0.88rem; margin-top: 0;">
          <button class="button primary" type="submit" style="padding: 8px 14px; font-size: 0.85rem;">Send</button>
        </form>
      </div>
    `;
    container.appendChild(card);
  });

  // Bookmark button handlers
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
      filterAndRenderResources(user, isAdmin);
      renderBookmarks();
    });
  });

  // Toggle Private Q&A box
  document.querySelectorAll(".toggle-discussion-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const resId = e.target.dataset.id;
      const box = byId(`discussion-${resId}`);
      if (box) box.hidden = !box.hidden;
    });
  });

  // Submit Private Message
  document.querySelectorAll(".private-msg-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resId = form.dataset.id;
      const resTitle = form.dataset.title;
      const input = form.querySelector("input");
      const message = input.value.trim();
      if (!message || !auth.currentUser) return;

      const userEmail = auth.currentUser.email;
      const studentName = auth.currentUser.displayName || userEmail.split("@")[0];
      const dateLabel = new Date().toLocaleDateString("en-UG", {
        month: "short", day: "numeric", year: "numeric"
      });

      const submitBtn = form.querySelector("button");
      submitBtn.disabled = true;

      try {
        await addDoc(collection(db, "private_messages"), {
          resourceId: resId,
          resourceTitle: resTitle,
          studentEmail: userEmail,
          studentName: studentName,
          senderName: isAdmin ? "Muhumuza Trevor (Instructor)" : studentName,
          senderRole: isAdmin ? "instructor" : "student",
          message: message,
          dateLabel: dateLabel,
          readByAdmin: isAdmin,
          createdAt: Date.now()
        });
        await loadPrivateMessages(auth.currentUser, isAdmin);
        const reopenedBox = byId(`discussion-${resId}`);
        if (reopenedBox) reopenedBox.hidden = false;
      } catch (err) {
        console.error("Error sending private message:", err);
        alert("Could not send message.");
        submitBtn.disabled = false;
      }
    });
  });
}

// --- 8. Admin-Only Messages Inbox (messages.html) ---
function renderAdminMessagesInbox(adminUser) {
  const container = byId("admin-messages-container");
  const emptyState = byId("admin-messages-empty");
  if (!container) return;

  if (privateMessages.length === 0) {
    if (emptyState) emptyState.hidden = false;
    container.innerHTML = "";
    return;
  }
  if (emptyState) emptyState.hidden = true;

  // Group messages by studentEmail + resourceId
  const threads = {};
  privateMessages.forEach((m) => {
    const key = `${m.studentEmail}__${m.resourceId}`;
    if (!threads[key]) {
      threads[key] = {
        studentEmail: m.studentEmail,
        studentName: m.studentName || m.studentEmail.split("@")[0],
        resourceId: m.resourceId,
        resourceTitle: m.resourceTitle || "General Inquiry",
        messages: [],
        hasUnread: false
      };
    }
    threads[key].messages.push(m);
    if (m.senderRole === "student" && !m.readByAdmin) {
      threads[key].hasUnread = true;
    }
  });

  container.innerHTML = "";
  Object.values(threads).forEach((thread) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "18px";
    if (thread.hasUnread) {
      card.style.borderLeft = "4px solid #ef4444";
    }

    const msgsHtml = thread.messages.map((m) => `
      <div style="background: ${m.senderRole === 'instructor' ? '#eff6ff' : '#f8fafc'}; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
          <strong>${escapeHTML(m.senderName)}</strong>
          <span class="muted">${escapeHTML(m.dateLabel || "")}</span>
        </div>
        <p style="margin: 0; font-size: 0.92rem;">${escapeHTML(m.message)}</p>
      </div>
    `).join("");

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <span class="tag">${escapeHTML(thread.resourceTitle)}</span>
          <h3 style="margin-top: 6px;">${escapeHTML(thread.studentName)} <span class="muted" style="font-weight: 400;">(${escapeHTML(thread.studentEmail)})</span></h3>
        </div>
        ${thread.hasUnread ? `<button class="button secondary mark-read-btn" data-student="${escapeHTML(thread.studentEmail)}" data-res="${thread.resourceId}" style="background: #fee2e2; color: #b91c1c; font-size: 0.8rem;">Mark Read</button>` : `<span class="muted" style="font-size: 0.8rem;">✓ Read</span>`}
      </div>
      <div style="max-height: 260px; overflow-y: auto; margin-bottom: 12px;">
        ${msgsHtml}
      </div>
      <form class="admin-reply-form" data-student-email="${escapeHTML(thread.studentEmail)}" data-student-name="${escapeHTML(thread.studentName)}" data-res-id="${thread.resourceId}" data-res-title="${escapeHTML(thread.resourceTitle)}" style="display: flex; gap: 8px;">
        <input class="field" type="text" required placeholder="Reply privately to ${escapeHTML(thread.studentName)}..." style="flex: 1; margin-top: 0;">
        <button class="button primary" type="submit">Send Reply</button>
      </form>
    `;
    container.appendChild(card);
  });

  // Mark thread as read
  document.querySelectorAll(".mark-read-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sEmail = btn.dataset.student;
      const rId = btn.dataset.res;
      const unreadMsgs = privateMessages.filter((m) => m.studentEmail === sEmail && m.resourceId === rId && !m.readByAdmin);
      for (const m of unreadMsgs) {
        await updateDoc(doc(db, "private_messages", m.id), { readByAdmin: true });
      }
      loadPrivateMessages(adminUser, true);
    });
  });

  // Admin reply submission
  document.querySelectorAll(".admin-reply-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const replyText = input.value.trim();
      if (!replyText) return;

      const dateLabel = new Date().toLocaleDateString("en-UG", {
        month: "short", day: "numeric", year: "numeric"
      });

      const unreadMsgs = privateMessages.filter((m) => m.studentEmail === form.dataset.studentEmail && m.resourceId === form.dataset.resId && !m.readByAdmin);
      for (const m of unreadMsgs) {
        await updateDoc(doc(db, "private_messages", m.id), { readByAdmin: true });
      }

      await addDoc(collection(db, "private_messages"), {
        resourceId: form.dataset.resId,
        resourceTitle: form.dataset.resTitle,
        studentEmail: form.dataset.studentEmail,
        studentName: form.dataset.studentName,
        senderName: "Muhumuza Trevor (Instructor)",
        senderRole: "instructor",
        message: replyText,
        dateLabel: dateLabel,
        readByAdmin: true,
        createdAt: Date.now()
      });

      loadPrivateMessages(adminUser, true);
    });
  });
}

// --- 9. Bookmarks, Search Filters, Blog, Classes & Notifications ---
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

function filterAndRenderResources(user, isAdmin) {
  const queryText = searchInput ? searchInput.value.toLowerCase() : "";
  const activeChip = document.querySelector("#resource-filters .chip.active");
  const selectedType = activeChip ? activeChip.dataset.type : "all";

  const filtered = resources.filter((res) => {
    const matchesQuery = (res.title && res.title.toLowerCase().includes(queryText)) || 
                         (res.description && res.description.toLowerCase().includes(queryText));
    const matchesType = selectedType === "all" || (res.category && res.category.toLowerCase() === selectedType.toLowerCase());
    return matchesQuery && matchesType;
  });

  renderResources(filtered, user || auth?.currentUser, isAdmin ?? ADMIN_EMAILS.includes((auth?.currentUser?.email || "").toLowerCase()));
}

if (searchInput) {
  searchInput.addEventListener("input", () => filterAndRenderResources());
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
    if (isOfficeHours) card.style.borderLeft = "4px solid #d97706";
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
    snap.forEach((docSnap) => {
      notifications.push({ id: docSnap.id, ...docSnap.data() });
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
