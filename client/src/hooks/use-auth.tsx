import { useContext, createContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, User } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Use react-query to handle the auth state
  const { data: user, isLoading, error } = useQuery<User | null, Error>({
    queryKey: ['auth'],
    queryFn: () => {
      return new Promise((resolve, reject) => {
        try {
          const unsubscribe = onAuthStateChanged(
            auth, 
            (user) => {
              unsubscribe();
              // Redirect to dashboard in development environment
              if (import.meta.env.DEV && user) {
                window.location.href = '/dashboard';
              }
              resolve(user);
            },
            (error) => {
              unsubscribe();
              console.error("Auth state error:", error);
              resolve(null);
            }
          );
        } catch (err) {
          console.error("Failed to set up auth state listener:", err);
          resolve(null);
        }
      });
    },
    staleTime: Infinity,
    retry: false, 
    refetchOnWindowFocus: false, 
  });

  const value = {
    user: user || null,
    loading: isLoading,
    error: error || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;