// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoBJMiGxHT0XbO6xTsbp41yLzYdYSwM8o",
  authDomain: "chemvibe.firebaseapp.com",
  projectId: "chemvibe",
  storageBucket: "chemvibe.firebasestorage.app",
  messagingSenderId: "842828658625",
  appId: "1:842828658625:web:797d90fb084d1276f1a140",
  measurementId: "G-HBTZTN90DW"
};

// Initialize Firebase
let app;
let auth;
let db;
let analytics;
let configured = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Analytics can run only in browser environments
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
  }
  
  configured = true;
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { 
  app, 
  auth, 
  db, 
  analytics, 
  configured, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
