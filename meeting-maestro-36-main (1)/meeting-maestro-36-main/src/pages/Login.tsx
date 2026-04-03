import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // 🔥 BACKEND LOGIN CONNECTED (Vite Proxy Version)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error("Please fill all fields");
    }

    try {
      // Pura http://127.0.0.1:8000 hataya hai taaki Vite Proxy kaam kare ✅
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // ❌ Login failed (Backend se error aaya)
      if (!res.ok) {
        return toast.error(data.message || "Login failed");
      }

      // ✅ SUCCESS
      login(email, password); // Local auth update
      toast.success("Welcome back!");

      // Dashboard par redirect
      navigate("/dashboard");

    } catch (err) {
      console.log("Login error:", err);
      toast.error("Backend not reachable ❌");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Branding */}
      <div className="hidden w-1/2 gradient-primary lg:flex lg:flex-col lg:items-center lg:justify-center p-12">
        <Bot className="h-16 w-16 text-primary-foreground mb-6 animate-float" />
        <h2 className="font-display text-3xl font-bold text-primary-foreground text-center">
          Welcome back to MEETAI
        </h2>
        <p className="mt-4 text-primary-foreground/80 text-center max-w-md">
          Your autonomous meeting assistant is ready to handle scheduling, prep, and follow-ups.
        </p>
      </div>

      {/* Right panel - Form */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between p-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            MEET<span className="text-primary">AI</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-bold">Log in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to continue
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground border-0"
              >
                Log in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;