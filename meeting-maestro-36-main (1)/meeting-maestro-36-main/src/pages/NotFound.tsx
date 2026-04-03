import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ ADDED

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // 🔥 OPTIONAL AUTO REDIRECT (future-ready)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/"); // after 5 sec go home
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">

        <h1 className="mb-4 text-4xl font-bold">404</h1>

        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>

        {/* 🔥 ADDED: show path */}
        <p className="mb-4 text-sm text-muted-foreground">
          Path: {location.pathname}
        </p>

        <a
          href="/"
          className="text-primary underline hover:text-primary/90"
        >
          Return to Home
        </a>

        {/* 🔥 ADDED: auto redirect info */}
        <p className="mt-4 text-xs text-muted-foreground">
          Redirecting to home in 5 seconds...
        </p>

      </div>
    </div>
  );
};

export default NotFound;