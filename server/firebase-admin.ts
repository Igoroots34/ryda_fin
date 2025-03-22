import { getAuth } from "firebase-admin/auth";
import admin from "firebase-admin";

// Initialize Firebase Admin with credentials
// In a real environment, this would use environment variables for service account
let firebaseAdmin: admin.app.App;

// Use a mock implementation for development/demo purposes
// In a production environment, you would initialize the real Firebase Admin SDK
console.log("Using mock Firebase Admin SDK for development");
firebaseAdmin = {
  auth: () => ({
    verifyIdToken: async (token: string) => {
      console.log("Using mock Firebase auth - NEVER USE IN PRODUCTION");
      return { uid: "demo-user-id", email: "demo@example.com" };
    }
  })
} as any;

// Verify Firebase ID Token
export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await getAuth(firebaseAdmin).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification error:", error);
    throw new Error("Invalid token");
  }
}

export default firebaseAdmin;
