import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false); // 🔥 added

  const { signup } = useAuth();
  const navigate = useNavigate();

  // 🔥 BACKEND READY SIGNUP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      return toast.error("Please fill all fields");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setLoading(true);

      const API_URL = "http://127.0.0.1:8000";

      // 🔴 FUTURE BACKEND CALL (abhi optional)
      /*
      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.message || "Signup failed");
      }
      */

      // ✅ ABHI LOCAL AUTH (same as tera code)
      signup(name, email, password);

      toast.success("Account created!");
      navigate("/dashboard");

    } catch (err) {
      console.log("Signup error:", err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 gradient-primary lg:flex lg:flex-col lg:items-center lg:justify-center p-12">
        <Bot className="h-16 w-16 text-primary-foreground mb-6 animate-float" />
        <h2 className="font-display text-3xl font-bold text-primary-foreground text-center">
          Join MEETAI today
        </h2>
        <p className="mt-4 text-primary-foreground/80 text-center max-w-md">
          Let AI handle the scheduling, prep, and follow-ups while you focus on high-impact work.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between p-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            MEET<span className="text-primary">AI</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-bold">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start automating your meetings
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Full name"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground border-0"
              >
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;