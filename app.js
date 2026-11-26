import { 
  auth, configured, 
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
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

// --- Global Data Store & State ---
let resources = [
  { id: "1", title: "Physical Chemistry Thermodynamics Notes", category: "Notes", price: "Free", description: "Comprehensive lecture notes covering the first, second, and third laws of thermodynamics.", link: "#" },
  { id: "2", title: "Organic Chemistry Reaction Mechanisms Practice", category: "Practice", price: "Free", description: "Step-by-step problem sets focusing on nucleophilic substitution and elimination reactions.", link: "#" },
  { id: "3", title: "Inorganic Chemistry Past Paper (2024)", category: "Past paper", price: "Free", description: "University exam paper with complete answer keys for coordination complexes and crystal field theory.", link: "#" },
  { id: "4", title: "Analytical Chemistry Spectroscopy Guide", category: "Guide", price: "Free", description: "A quick-reference study guide for NMR, IR, and UV-Vis spectroscopy interpretation.", link: "#" }
];

let blogPosts = [
  { id: "1", title: "Understanding Enthalpy and Entropy Changes", date: "Nov 20, 2026", summary: "A clear breakdown of how spontaneity is determined by Gibbs free energy in chemical reactions." },
  { id: "2", title: "Mastering Acid-Base Titration Curves", date: "Nov 15, 2026", summary: "Key tips for identifying equivalence points and buffer regions in complex titrations." }
];

let liveClasses = [
  { id: "1", title: "Q&A Session: Organic Synthesis Pathways", host: "Dr. Ruth Mbabazi", time: "Tomorrow, 4:00 PM EAT", link: "#" },
  { id: "2", title: "Problem Solving: Electrochemistry Cell Potentials", host: "Trevor Mbabazi", time: "Friday, 6:00 PM EAT", link: "#" }
];

// --- Authentication State Management ---
if (configured && auth) {
  onAuthStateChanged(auth, (user) => {
    const adminLink = byId("nav-admin");
    const profileAdminLink = byId("profile-admin-link");
    const signoutBtn = byId("signout-button");
    const profileSummary = byId("profile-summary");

    if (user) {
      if (adminLink) adminLink.hidden = false;
      if (profileAdminLink) profileAdminLink.hidden = false;
      if (signoutBtn) signoutBtn.hidden = false;
      if (profileSummary) profileSummary.textContent = `Signed in as: ${user.email}`;
    } else {
      if (adminLink) adminLink.hidden = true;
      if (profileAdminLink) profileAdminLink.hidden = true;
      if (signoutBtn) signoutBtn.hidden = true;
      if (profileSummary) profileSummary.textContent = "Not signed in.";
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

// --- Admin Workspace Handling ---
const adminForm = byId("admin-add-form");
if (adminForm) {
  adminForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = byId("admin-title").value;
    const category = byId("admin-category").value;
    const description = byId("admin-desc").value;

    if (!title || !description) return;

    resources.push({
      id: Date.now().toString(),
      title,
      category,
      price: "Free",
      description,
      link: "#"
    });

    adminForm.reset();
    alert("Resource added successfully!");
    renderResources(resources);
  });
}
