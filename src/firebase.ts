import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSzJJbvUDjI2iH6Se2Vmtm3JOC2_20oCY",
  authDomain: "ai-life-management-6b80b.firebaseapp.com",
  projectId: "ai-life-management-6b80b",
  storageBucket: "ai-life-management-6b80b.firebasestorage.app",
  messagingSenderId: "270691596574",
  appId: "1:270691596574:web:6632da8c841e379ecb310f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
