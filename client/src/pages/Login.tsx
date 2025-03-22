import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { signInWithGoogle, loginWithEmail, registerWithEmail, checkRedirectResult } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Wallet } from "lucide-react";

const Login = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Verificar resultado de redirecionamento quando a página carrega
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const user = await checkRedirectResult();
        if (user) {
          handleAuthSuccess(user);
        }
      } catch (error) {
        console.error("Error checking redirect result:", error);
        // Evitar usar toast dentro do useEffect inicial
        console.error("Failed to complete Google sign-in");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateLoginForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!loginData.email) {
      newErrors.loginEmail = "Email is required";
    }
    
    if (!loginData.password) {
      newErrors.loginPassword = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateRegisterForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!registerData.displayName) {
      newErrors.displayName = "Name is required";
    }
    
    if (!registerData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!registerData.password) {
      newErrors.password = "Password is required";
    } else if (registerData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;
    
    setLoading(true);
    try {
      const user = await loginWithEmail(loginData.email, loginData.password);
      handleAuthSuccess(user);
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Failed to login. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    try {
      const user = await registerWithEmail(
        registerData.email, 
        registerData.password, 
        registerData.displayName
      );
      handleAuthSuccess(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to register. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already in use";
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Não precisamos chamar handleAuthSuccess aqui
      // O redirecionamento vai ocorrer e o usuário será tratado no useEffect
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Login Failed",
        description: "Google sign-in failed. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
    // Não chamamos setLoading(false) aqui pois há um redirecionamento
  };
  
  const handleAuthSuccess = (user: User | null) => {
    if (!user) return; // Ignora se não tiver usuário
    
    toast({
      title: "Login Successful",
      description: `Welcome ${user.displayName || user.email}!`,
    });
    setLocation("/dashboard");
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex justify-center items-center">
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">FinTrack</CardTitle>
          <CardDescription className="text-center">
            Your personal financial management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      onChange={handleLoginChange}
                      value={loginData.email}
                      disabled={loading}
                      className={errors.loginEmail ? "border-red-500" : ""}
                    />
                    {errors.loginEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.loginEmail}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      onChange={handleLoginChange}
                      value={loginData.password}
                      disabled={loading}
                      className={errors.loginPassword ? "border-red-500" : ""}
                    />
                    {errors.loginPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.loginPassword}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      name="displayName"
                      type="text"
                      placeholder="John Doe"
                      onChange={handleRegisterChange}
                      value={registerData.displayName}
                      disabled={loading}
                      className={errors.displayName ? "border-red-500" : ""}
                    />
                    {errors.displayName && (
                      <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      onChange={handleRegisterChange}
                      value={registerData.email}
                      disabled={loading}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      onChange={handleRegisterChange}
                      value={registerData.password}
                      disabled={loading}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm Password</Label>
                    <Input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      onChange={handleRegisterChange}
                      value={registerData.confirmPassword}
                      disabled={loading}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
