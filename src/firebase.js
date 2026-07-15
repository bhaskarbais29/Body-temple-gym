import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_VALUE",
  authDomain: "PASTE_YOUR_VALUE",
  projectId: "PASTE_YOUR_VALUE",
  storageBucket: "PASTE_YOUR_VALUE",
  messagingSenderId: "PASTE_YOUR_VALUE",
  appId: "PASTE_YOUR_VALUE",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
