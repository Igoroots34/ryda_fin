import { Route, Switch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Import from "@/pages/Import";
import NotFound from "@/pages/not-found";

// Loading component
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
    </div>
  </div>
);

// Protected Route component to handle authenticated routes
const ProtectedRoute = ({ component: Component }: { component: React.ComponentType<any> }) => {
  const { user, loading } = useAuth();
  
  // Show loading screen while auth state is being determined
  if (loading) return <LoadingScreen />;
  
  // If user is not authenticated, show login page
  if (!user) {
    return <Login />;
  }
  
  // User is authenticated, show the requested component
  return <Component />;
};

function App() {
  // For debugging
  useEffect(() => {
    console.log("App component mounted");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        <Route path="/login">
          <Login />
        </Route>
        
        <Route path="/dashboard">
          <AppLayout>
            <ProtectedRoute component={Dashboard} />
          </AppLayout>
        </Route>
        
        <Route path="/transactions">
          <AppLayout>
            <ProtectedRoute component={Transactions} />
          </AppLayout>
        </Route>
        
        <Route path="/import">
          <AppLayout>
            <ProtectedRoute component={Import} />
          </AppLayout>
        </Route>
        
        <Route path="/">
          <AppLayout>
            <ProtectedRoute component={Dashboard} />
          </AppLayout>
        </Route>
        
        <Route>
          <AppLayout>
            <NotFound />
          </AppLayout>
        </Route>
      </Switch>
    </div>
  );
}

export default App;
