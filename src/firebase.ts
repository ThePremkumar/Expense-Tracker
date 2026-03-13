import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBNL7xcr_y6NtYV-9broy5F_gR7415dpvo",
  authDomain: "student-expense-tracker-4fd6f.firebaseapp.com",
  projectId: "student-expense-tracker-4fd6f",
  storageBucket: "student-expense-tracker-4fd6f.firebasestorage.app",
  messagingSenderId: "924132315678",
  appId: "1:924132315678:web:c7ccec012628e4aa5ad40f",
  measurementId: "G-CXLYCCGPTW"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
export const functions = getFunctions(app, 'asia-south1');
export const googleProvider = new GoogleAuthProvider();
