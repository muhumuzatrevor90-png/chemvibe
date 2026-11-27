import { auth, db, configured, onAuthStateChanged } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const byId = (id) => document.getElementById(id);
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

    if (user && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (authPanel) authPanel.hidden = true;
      if (workspaceContent) workspaceContent.hidden = false;
      loadAdminContent();
    } else {
      if (statusTitle) statusTitle.textContent = "Access Denied";
      if (statusDesc) statusDesc.textContent = "This account does not have administrator privileges.";
      if (signinBtn) signinBtn.href = "signin.html";
    }
  });
}

// --- Load Content for Management & Deletion ---
async function loadAdminContent() {
  if (!db) {
    console.error("Firestore DB is not initialized.");
    return;
  }

  try {
    // 1. Resources
    const resContainer = byId("admin-resource-list");
    if (resContainer) {
      const resSnap = await getDocs(collection(db, "resources"));
      resContainer.innerHTML = resSnap.empty ? "<p class='muted'>No resources found.</p>" : "";
      resSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "10px";
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div><strong>${data.title || "Untitled"}</strong> <span class="muted">(${data.category || "Notes"} — ${data.price || "Free"})</span></div>
            <button class="button secondary delete-btn" data-coll="resources" data-id="${docSnap.id}" style="background: #ff4d4d; color: white; border: none; padding: 6px 12px; cursor: pointer;">Delete</button>
          </div>
        `;
        resContainer.appendChild(div);
      });
    }

    // 2. Blogs
    const blogContainer = byId("admin-blog-list");
    if (blogContainer) {
      const blogSnap = await getDocs(collection(db, "blogs"));
      blogContainer.innerHTML = blogSnap.empty ? "<p class='muted'>No blog posts found.</p>" : "";
      blogSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "10px";
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div><strong>${data.title || "Untitled"}</strong> <span class="muted">(${data.date || ""})</span></div>
            <button class="button secondary delete-btn" data-coll="blogs" data-id="${docSnap.id}" style="background: #ff4d4d; color: white; border: none; padding: 6px 12px; cursor: pointer;">Delete</button>
          </div>
        `;
        blogContainer.appendChild(div);
      });
    }

    // 3. Classes
    const classContainer = byId("admin-class-list");
    if (classContainer) {
      const classSnap = await getDocs(collection(db, "classes"));
      classContainer.innerHTML = classSnap.empty ? "<p class='muted'>No live classes found.</p>" : "";
      classSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "10px";
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div><strong>${data.title || "Untitled"}</strong> <span class="muted">(${data.time || ""})</span></div>
            <button class="button secondary delete-btn" data-coll="classes" data-id="${docSnap.id}" style="background: #ff4d4d; color: white; border: none; padding: 6px 12px; cursor: pointer;">Delete</button>
          </div>
        `;
        classContainer.appendChild(div);
      });
    }

    // 4. Notifications
    const notifContainer = byId("admin-notif-list");
    if (notifContainer) {
      const notifSnap = await getDocs(collection(db, "notifications"));
      notifContainer.innerHTML = notifSnap.empty ? "<p class='muted'>No notifications found.</p>" : "";
      notifSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "card";
        div.style.marginBottom = "10px";
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div><strong>${data.title || "Untitled"}</strong> <span class="muted">(${data.date || ""})</span></div>
            <button class="button secondary delete-btn" data-coll="notifications" data-id="${docSnap.id}" style="background: #ff4d4d; color: white; border: none; padding: 6px 12px; cursor: pointer;">Delete</button>
          </div>
        `;
        notifContainer.appendChild(div);
      });
    }

    // Attach delete handlers to all delete buttons
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const collectionName = e.target.dataset.coll;
        const docId = e.target.dataset.id;

        if (confirm("Are you sure you want to delete this post?")) {
          try {
            await deleteDoc(doc(db, collectionName, docId));
            alert("Post deleted successfully!");
            loadAdminContent();
          } catch (err) {
            console.error("Error deleting document:", err);
            alert("Failed to delete post. Check console for details.");
          }
        }
      });
    });

  } catch (error) {
    console.error("Error loading admin content from Firestore:", error);
  }
}

// --- Publish Resource ---
const adminForm = byId("admin-add-form");
if (adminForm) {
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("admin-title").value;
    const category = byId("admin-category").value;
    const price = byId("admin-price").value.trim() || "Free";
    const link = byId("admin-link").value;
    const description = byId("admin-desc").value;

    if (!title || !link || !description) return;

    try {
      await addDoc(collection(db, "resources"), {
        title, category, price, description, link, createdAt: Date.now()
      });
      adminForm.reset();
      byId("admin-price").value = "Free";
      alert("Study resource published successfully!");
      loadAdminContent();
    } catch (error) {
      console.error("Error adding resource:", error);
      alert("Failed to publish resource.");
    }
  });
}

// --- Publish Blog ---
const blogForm = byId("admin-blog-form");
if (blogForm) {
  blogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("blog-title").value;
    const date = byId("blog-date").value;
    const link = byId("blog-link").value;
    const summary = byId("blog-summary").value;

    if (!title || !summary) return;

    try {
      await addDoc(collection(db, "blogs"), {
        title, date, link: link || "#", summary, createdAt: Date.now()
      });
      blogForm.reset();
      alert("Blog article published successfully!");
      loadAdminContent();
    } catch (error) {
      console.error("Error adding blog post:", error);
      alert("Failed to publish blog post.");
    }
  });
}

// --- Schedule Class ---
const classForm = byId("admin-class-form");
if (classForm) {
  classForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("class-title").value;
    const host = byId("class-host").value;
    const time = byId("class-time").value;
    const link = byId("class-link").value;

    if (!title || !host || !link) return;

    try {
      await addDoc(collection(db, "classes"), {
        title, host, time, link, createdAt: Date.now()
      });
      classForm.reset();
      alert("Live class scheduled successfully!");
      loadAdminContent();
    } catch (error) {
      console.error("Error scheduling class:", error);
      alert("Failed to schedule class.");
    }
  });
}

// --- Broadcast Notification ---
const notifForm = byId("admin-notif-form");
if (notifForm) {
  notifForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = byId("notif-title").value;
    const date = byId("notif-date").value;
    const message = byId("notif-message").value;

    if (!title || !message) return;

    try {
      await addDoc(collection(db, "notifications"), {
        title, date, message, createdAt: Date.now()
      });
      notifForm.reset();
      alert("Notification broadcasted successfully!");
      loadAdminContent();
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to broadcast notification.");
    }
  });
}
