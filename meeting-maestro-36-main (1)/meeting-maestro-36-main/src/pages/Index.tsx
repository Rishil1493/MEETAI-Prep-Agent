import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Calendar, Mail, FileText, Mic, ArrowRight, Zap, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react"; // ✅ ADDED

const features = [
  { icon: Mail, title: "Email Classifier", desc: "AI classifies incoming emails and detects meeting requests automatically." },
  { icon: Calendar, title: "Smart Negotiator", desc: "Autonomously negotiates time slots based on your calendar availability." },
  { icon: FileText, title: "Brief Generator", desc: "Generates pre-meeting briefs with attendee context and past notes." },
  { icon: Mic, title: "Audio Summarizer", desc: "Transcribes meeting audio and extracts action items with Whisper + LLM." },
];

const stats = [
  { value: "85%", label: "Time saved on scheduling" },
  { value: "10x", label: "Faster meeting prep" },
  { value: "99%", label: "Accurate extraction" },
];

const Index = () => {

  // 🔥 BACKEND CONNECTION STATE (ADDED)
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);

  // 🔥 BACKEND HEALTH CHECK (ADDED)
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const API_URL = "http://127.0.0.1:8000";

        const res = await fetch(`${API_URL}/api/health`);
        if (!res.ok) throw new Error("Backend not reachable");

        const data = await res.json();
        setBackendStatus(data.status || "Connected 🚀");
      } catch (err) {
        console.log("Backend error:", err);
        setBackendStatus("❌ Backend not connected");
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* 🔥 BACKEND STATUS BAR (ADDED - SAFE UI) */}
      <div className="text-center text-sm py-2 bg-muted">
        {loading ? "🔄 Connecting to backend..." : `Backend: ${backendStatus}`}
      </div>

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-card">
                <Zap className="h-3.5 w-3.5 text-accent" /> Powered by LangGraph & Whisper
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Your AI{" "}
                <span className="bg-clip-text text-transparent gradient-primary">
                  Meeting Assistant
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Stop wasting hours on scheduling conflicts and unpreparedness. MEETAI autonomously
                handles email negotiations, generates meeting briefs, and extracts action items — so you
                can focus on what matters.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link to="/signup">
                  <Button size="lg" className="gradient-primary text-primary-foreground border-0 px-8 text-base">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="px-8 text-base">
                    Live Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-bold text-primary md:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ⚠️ BAQI CODE SAME (NO CHANGE) */}
      {/* 👉 Maine niche ka code intentionally untouched chhoda hai */}
      
      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-accent">Core Agents</span>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
              Intelligent Pipeline Architecture
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Four specialized AI agents work in concert, orchestrated by a LangGraph state machine
              with conditional routing and real-time status updates.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated"
              >
                <div className="mb-4 inline-flex rounded-lg gradient-primary p-2.5">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <span className="font-display font-semibold">MEET<span className="text-primary">AI</span></span>
          <span>© 2026 MEETAI. Autonomous Meeting Scheduler & Prep Agent.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;