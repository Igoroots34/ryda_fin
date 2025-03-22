import { createContext, useEffect } from "react";
import { auth, User } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextProps {
  children: React.ReactNode;
}

// The actual auth state is managed by the useAuth hook
export const AuthContext = createContext<null>(null);

export const AuthProvider = ({ children }: AuthContextProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up an auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Update the auth query with the new user state
      queryClient.setQueryData(['auth'], user);

      // Invalidate queries that depend on user authentication
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/imports'] });
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
