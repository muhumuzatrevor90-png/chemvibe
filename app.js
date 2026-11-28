import { 
  auth, db, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";
import { 
  collection, 
  getDocs,
  addDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const byId = (id) => document.getElementById(id);
const ADMIN_EMAILS = ["muhumuzatrevormbabazi@gmail.com"];

// --- 1. Mobile Navigation Toggle ---
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

      if (welcomeBanner) {
        welcomeBanner.textContent = `Welcome back, ${displayName}!`; welcomeBanner.hidden = false; }  if (adminLink) adminLink.hidden = !isAdmin; if (messagesLink) messagesLink.hidden = !isAdmin; if (profileAdminLink) profileAdminLink.hidden = !isAdmin;  if (signoutBtn) signoutBtn.hidden = false; if (navAuthBtn) { navAuthBtn.textContent = "Sign out"; navAuthBtn.href = "#"; navAuthBtn.onclick = async (e) => { e.preventDefault(); await signOut(auth); window.location.href = "signin.html"; }; }  const profileNameDisplay = byId("profile-display-name"); const profileHandleDisplay = byId("profile-handle"); const profileEmailDisplay = byId("profile-email-display"); const profileAvatarImg = byId("profile-avatar-img"); const nameInput = byId("profile-new-name");  if (profileNameDisplay) profileNameDisplay.textContent = displayName; if (profileHandleDisplay) profileHandleDisplay.textContent = `@${displayName.toLowerCase().replace(/\s+/g, "")}`;
      if (profileEmailDisplay) profileEmailDisplay.textContent = user.email;
      if (nameInput && !nameInput.value) nameInput.value = displayName;
      if (profileAvatarImg && savedPhoto) {
        profileAvatarImg.src = savedPhoto;
      }

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

// --- 3. Profile Picture Upload ---
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

        localStorage.setItem(`chemvibe_avatar_${auth.currentUser.uid}`, compressedDataUrl); const avatarImg = byId("profile-avatar-img"); if (avatarImg) avatarImg.src = compressedDataUrl;  const picStatus = byId("picture-status"); if (picStatus) picStatus.textContent = "Profile picture updated!"; }; img.src = event.target.result; }; reader.readAsDataURL(file); }); }  // --- 4. Profile Username & Password Update --- const profileNameForm = byId("profile-name-form"); if (profileNameForm) { profileNameForm.addEventListener("submit", async (e) => { e.preventDefault(); const newName = byId("profile-new-name").value.trim(); const status = byId("name-status"); if (!configured \vert{}\vert{} !auth.currentUser \vert{}\vert{} !newName) return;  try { status.textContent = "Updating username..."; await updateProfile(auth.currentUser, { displayName: newName }); status.textContent = "Username updated successfully!"; setTimeout(() => window.location.reload(), 700); } catch (error) { status.textContent = `Error: ${error.message}`;
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
        status.textContent = `Failed: ${error.message}`; } } }); }  function escapeHTML(str) { return String(str \vert{}\vert{} "") .split("&").join("&amp;") .split("<").join("&lt;") .split(">").join("&gt;") .split('"').join("&quot;") .split("'").join("&#039;"); }  let resources = []; let blogPosts = []; let liveClasses = []; let privateMessages = [];  async function loadDataFromFirestore(user, isAdmin) { if (!configured \vert{}\vert{} !db) return;  try { const resSnapshot = await getDocs(collection(db, "resources")); resources = []; resSnapshot.forEach((docSnap) => { resources.push({ id: docSnap.id, ...docSnap.data() }); }); renderResources(resources, user, isAdmin); renderBookmarks();  const blogSnapshot = await getDocs(collection(db, "blogs")); blogPosts = []; blogSnapshot.forEach((docSnap) => { blogPosts.push({ id: docSnap.id, ...docSnap.data() }); }); renderBlog();  const classSnapshot = await getDocs(collection(db, "classes")); liveClasses = []; classSnapshot.forEach((docSnap) => { liveClasses.push({ id: docSnap.id, ...docSnap.data() }); }); renderClasses(); } catch (error) { console.error("Error fetching data from Firestore:", error); } }  async function loadPrivateMessages(user, isAdmin) { if (!configured \vert{}\vert{} !db \vert{}\vert{} !user) return;  try { const msgSnapshot = await getDocs(collection(db, "private_messages")); privateMessages = []; msgSnapshot.forEach((docSnap) => { privateMessages.push({ id: docSnap.id, ...docSnap.data() }); }); privateMessages.sort((a, b) => (a.createdAt \vert{}\vert{} 0) - (b.createdAt \vert{}\vert{} 0));  const msgBadge = byId("messages-badge"); if (isAdmin && msgBadge) { const unreadCount = privateMessages.filter((m) => m.senderRole === "student" && !m.readByAdmin).length; if (unreadCount > 0) { msgBadge.textContent = unreadCount; msgBadge.hidden = false; } else { msgBadge.hidden = true; } }  renderResources(resources, user, isAdmin);  if (isAdmin && byId("admin-messages-container")) { renderAdminMessagesInbox(user); } } catch (err) { console.error("Error loading private messages:", err); } }  function renderResources(list, user, isAdmin) { const container = byId("resource-list"); const emptyState = byId("resource-empty"); const countLabel = byId("resource-count"); if (!container) return;  container.innerHTML = ""; if (countLabel) countLabel.textContent = `${list.length} resources`;

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

    const visibleThread = privateMessages.filter((m) => {
      if (m.resourceId !== res.id) return false;
      if (isAdmin) return true;
      return (m.studentEmail || "").toLowerCase() === currentUserEmail;
    });

    const threadHtml = visibleThread.length === 0
      ? `<p class="muted" style="font-size: 0.85rem; margin: 6px 0;">Private 1-on-1 chat with your instructor. Only you and the instructor see these messages.</p>`
      : visibleThread.map((m) => `
          <div style="background: ${m.senderRole === 'instructor' ? '#eff6ff' : '#f8fafc'}; border-left: 3px solid ${m.senderRole === 'instructor' ? '#0284c7' : '#64748b'}; padding: 8px 10px; border-radius: 6px; margin-bottom: 8
