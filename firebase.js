import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDoBJMiGxHT0XbO6xTsbp41yLzYdYSwM8o",
  authDomain: "chemvibe.firebaseapp.com",
  projectId: "chemvibe",
  storageBucket: "chemvibe.firebasestorage.app",
  messagingSenderId: "842828658625",
  appId: "1:842828658625:web:797d90fb084d1276f1a140",
  measurementId: "G-HBTZTN90DW"
};

export const configured =
  !firebaseConfig.apiKey.startsWith("PASTE_") &&
  !firebaseConfig.projectId.startsWith("PASTE_");

export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function createAccount(email, password, displayName) {
  if (!auth) throw new Error("Firebase is not configured yet.");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(result.user, { displayName });
  return result;
}

export function signIn(email, password) {
  if (!auth) throw new Error("Firebase is not configured yet.");
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutCurrentUser() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export function observeAuth(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}
