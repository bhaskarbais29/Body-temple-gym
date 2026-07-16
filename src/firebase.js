import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-KdpL9UQQ-vPk4WTzsjeU5pFPup_3YTA",
  authDomain: "body-temple-gyms.firebaseapp.com",
  projectId: "body-temple-gyms",
  storageBucket: "body-temple-gyms.firebasestorage.app",
  messagingSenderId: "592590191444",
  appId: "1:592590191444:web:0aa47ed8a1a8fcf67ae6c1",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

