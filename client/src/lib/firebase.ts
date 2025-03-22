import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
  try {
    // Redirect to Google sign-in page
    await signInWithRedirect(auth, googleProvider);
    // The user will be redirected back after sign-in
    return null; // We'll handle the result in checkRedirectResult
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

// Function to check redirect result when the page loads
export const checkRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      
      // Check if user exists in our database
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      // If not, create a new user
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: Timestamp.now()
        });
        
        // Add default categories
        await addDefaultCategories(user.uid);
      }
      
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error processing redirect result: ", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile
    await updateProfile(user, { displayName });
    
    // Create user in Firestore
    await setDoc(doc(db, "users", user.uid), {
      displayName,
      email,
      photoURL: null,
      createdAt: Timestamp.now()
    });
    
    // Add default categories
    await addDefaultCategories(user.uid);
    
    return user;
  } catch (error) {
    console.error("Error registering with email: ", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.error("Error logging in with email: ", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out: ", error);
    throw error;
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

// Helper functions
const addDefaultCategories = async (userId: string) => {
  const defaultCategories = [
    { name: "Salary", icon: "briefcase", color: "#10b981", type: "income" },
    { name: "Investments", icon: "trending-up", color: "#10b981", type: "income" },
    { name: "Freelance", icon: "code", color: "#10b981", type: "income" },
    { name: "Gifts", icon: "gift", color: "#10b981", type: "income" },
    { name: "Housing", icon: "home", color: "#3b82f6", type: "expense" },
    { name: "Food", icon: "utensils", color: "#f59e0b", type: "expense" },
    { name: "Transportation", icon: "car", color: "#f59e0b", type: "expense" },
    { name: "Entertainment", icon: "film", color: "#8b5cf6", type: "expense" },
    { name: "Utilities", icon: "zap", color: "#ef4444", type: "expense" },
    { name: "Health", icon: "activity", color: "#ef4444", type: "expense" },
    { name: "Debt", icon: "credit-card", color: "#ef4444", type: "expense" },
  ];
  
  for (const category of defaultCategories) {
    await setDoc(doc(collection(db, "categories")), {
      ...category,
      userId
    });
  }
};

export { app, auth, db, storage };
export type { User };
