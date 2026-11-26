import { 
  auth, configured, 
  signOut, onAuthStateChanged, updatePassword 
} from "./firebase.js";

const byId = (id) => document.getElementById(id);

// --- Mobile Navigation Toggle ---
const menuToggle = byId("menu-toggle");
const mainNav = byId("main-nav");
if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// --- Dynamic Data Store (Loaded from Admin / LocalStorage or Empty) ---
let resources = JSON.parse(localStorage.getItem("chemvibe_resources")) || [];
let blogPosts = JSON.parse(localStorage.getItem("chemvibe_blogs")) || [];
let liveClasses = JSON.parse(localStorage.getItem("chemvibe_classes")) || [];

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

// --- Library Rendering & Filtering ---
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

  list.forEach((res) => {
    const card = document.createElement("div");
    card.className = "card resource-card";
    card.innerHTML = `
      <div class="card-meta">
        <span class="tag">${res.category}</span>
        <span class="price">${res.price || "Free"}</span>
      </div>
      <h3>${res.title}</h3>
      <p>${res.description}</p>
      <button class="button primary view-res-btn" data-title="${res.title}">View resource</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll(".view-res-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      alert(`Opening resource: ${e.target.dataset.title}`);
    });
  });
}

const searchInput = byId("resource-search");
const filterChips = document.querySelectorAll("#resource-filters .chip");

function filterAndRenderResources() {
  const query = searchInput ? searchInput.value.toLowerCase() : "";
  const activeChip = document.querySelector("#resource-filters .chip.active");
  const selectedType = activeChip ? activeChip.dataset.type : "all";

  const filtered = resources.filter((res) => {
    const matchesQuery = res.title.toLowerCase().includes(query) || res.description.toLowerCase().includes(query);
    const matchesType = selectedType === "all" || res.category.toLowerCase() === selectedType.toLowerCase();
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

renderResources(resources);

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
      <span class="muted">${post.date}</span>
      <h2>${post.title}</h2>
      <p>${post.summary}</p>
      <a class="text-link" href="#">Read article →</a>
    `;
    container.appendChild(card);
  });
}
renderBlog();

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
      <a class="button primary" href="${cls.link}" target="_blank" style="margin-top: 10px;">Join session</a>
    `;
    container.appendChild(card);
  });
}
renderClasses();
