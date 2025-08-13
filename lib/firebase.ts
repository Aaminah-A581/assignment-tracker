import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Paste your Firebase config here
  apiKey: "AIzaSyBeDPRbYIiZzrcMQC7TCpPIWoYebFF95Y0",
  authDomain: "assignment-tracker-581.firebaseapp.com",
  projectId: "assignment-tracker-581",
  storageBucket: "assignment-tracker-581.firebasestorage.app",
  messagingSenderId: "811908346318",
  appId: "1:811908346318:web:203c06eb51cebde063fb9f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);