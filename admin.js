import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Inside your form submit event:
await addDoc(collection(db, "resources"), {
  title,
  category,
  price: "Free",
  description,
  link,
  createdAt: Date.now()
});
