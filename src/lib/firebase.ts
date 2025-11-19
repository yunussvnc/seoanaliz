// Firebase initialization
// Added from provided Firebase web config (modular SDK)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AI2aSyB0uyaPskj9Wl7PYefmzTHyWa4_Lnajcg",
  authDomain: "seo-analiz-efd06.firebaseapp.com",
  projectId: "seo-analiz-efd06",
  storageBucket: "seo-analiz-efd06.appspot.com",
  messagingSenderId: "212908217070",
  appId: "1:212908217070:web:62fe514a961bc9ba9f19ff",
  measurementId: "G-4RZF197W3J"
};

const app = initializeApp(firebaseConfig);
let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics may fail in non-browser environments; ignore silently
}

export { app, analytics };
