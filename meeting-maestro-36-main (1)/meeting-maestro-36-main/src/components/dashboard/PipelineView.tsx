import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

import {
  Mail,
  Calendar,
  FileText,
  Mic,
  Brain,
  GitBranch,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle className="h-4 w-4 text-green-500 animate-pulse" />,
  idle: <Clock className="h-4 w-4 text-muted-foreground" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const PipelineView = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const runPipeline = async () => {
    try {
      setLoading(true);
      // Fresh logs
      setActivity((prev) => [`[${new Date().toLocaleTimeString()}] Starting engine...`, ...prev].slice(0, 6));

      const data = await api.runPipeline();
      
      const emailCount = data?.emails?.length || 0;
      const slotCount = data?.freeSlots?.length || 0;
      const hasDraft = !!data?.draftEmail && data.draftEmail !== "Could not generate draft at this time.";

      setNodes([
        {
          id: "email_classifier",
          label: "Email Classifier",
          icon: Mail,
          status: emailCount > 0 ? "active" : "idle",
          metrics: { processed: emailCount },
        },
        {
          id: "slot_negotiator",
          label: "Slot Negotiator",
          icon: Calendar,
          status: slotCount > 0 ? "active" : "idle",
          metrics: { slots: slotCount },
        },
        {
          id: "brief_generator",
          label: "Brief Generator",
          icon: FileText,
          status: hasDraft ? "active" : "idle",
          metrics: { drafts: hasDraft ? 1 : 0 },
        },
        {
          id: "audio_summarizer",
          label: "Audio Summarizer",
          icon: Mic,
          status: "idle",
          metrics: { status: "waiting" },
        },
      ]);

      setActivity((prev) => [
        `✅ Found ${emailCount} new emails`,
        `📅 Identified ${slotCount} free slots`,
        hasDraft ? `📝 Smart draft prepared` : `ℹ️ No draft needed`,
        ...prev
      ].slice(0, 10));

    } catch (err) {
      console.error("❌ Pipeline Error:", err);
      setActivity((prev) => [`❌ Connection to backend failed`, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPipeline();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-primary/10 overflow-hidden">
        <CardHeader className="py-4 bg-muted/30">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" /> AI Engine Status
            </span>

            <button
              onClick={runPipeline}
              disabled={loading}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-95 shadow-sm"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Processing..." : "Sync Engine"}
            </button>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* PIPELINE NODES */}
        <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {nodes.length > 0 ? nodes.map((node, i) => (
              <motion.div
                key={node.id} // Fixed: Using node.id as a stable key
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <Card className={`h-full border-l-4 transition-all hover:shadow-md ${node.status === 'active' ? 'border-l-green-500 shadow-green-50/50' : 'border-l-slate-300'}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${node.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <node.icon className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-bold">{node.label}</h3>
                      </div>
                      {statusIcon[node.status] || statusIcon.idle}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Object.entries(node.metrics || {}).map(([k, v]) => (
                        <span key={`${node.id}-${k}`} className="bg-slate-100 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 tracking-wider">
                          {k}: <span className="text-primary">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              [1, 2, 3, 4].map((n) => (
                <div key={`skeleton-${n}`} className="h-28 bg-muted animate-pulse rounded-xl" />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* LOG TRACE */}
        <Card className="shadow-card border-dashed h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3">
              {activity.map((a, i) => (
                <motion.div 
                  key={`log-${i}-${a.length}`} // Fixed: Stable unique key for logs
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] leading-relaxed border-b border-muted pb-2 last:border-0 font-mono text-slate-600"
                >
                  <span className="text-primary mr-2">›</span> {a}
                </motion.div>
              ))}
              {activity.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No recent activity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ARCHITECTURE FLOW */}
      <Card className="shadow-card bg-slate-50/50 border-none">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <GitBranch className="h-4 w-4" /> Agentic Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
            {[
              "Gmail Poll",
              "Intent",
              "Calendar",
              "Drafting",
              "Review"
            ].map((step, i, arr) => (
              <div key={`step-${step}`} className="flex items-center">
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm border ${loading && i < 3 ? 'bg-primary/5 border-primary/20 text-primary animate-pulse' : 'bg-white'}`}>
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-3 h-[2px] bg-slate-200 mx-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineView;