import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Import from "@/pages/Import";
import NotFound from "@/pages/not-found";

// Protected Route component to handle authenticated routes
const ProtectedRoute = ({ component: Component, ...rest }: { component: React.ComponentType<any>, [x: string]: any }) => {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  
  if (!user) {
    setLocation("/login");
    return null;
  }
  
  return <Component {...rest} />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login" component={Login} />
        
        <Route path="/">
          <Redirect to="/dashboard" />
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
        
        <Route>
          <AppLayout>
            <NotFound />
          </AppLayout>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
