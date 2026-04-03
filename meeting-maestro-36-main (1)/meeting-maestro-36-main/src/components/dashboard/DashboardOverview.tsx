import { useEffect, useState } from "react";
import { Calendar, Mail, CheckSquare, Clock, TrendingUp, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const typeColors: Record<string, string> = {
  classifier: "bg-blue-100 text-blue-700",
  negotiator: "bg-purple-100 text-purple-700",
  brief: "bg-green-100 text-green-700",
  summarizer: "bg-orange-100 text-orange-700",
};

const DashboardOverview = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const inbox = await api.getInbox();
      const pipeline = await api.runPipeline();

      // 🔥 Dynamic Stats Calculation
      const emailCount = inbox?.emails?.length || 0;
      const slotCount = pipeline?.freeSlots?.length || 0;
      const actionItemsCount = pipeline?.emails?.length || 0;

      setStats([
        { icon: Calendar, label: "Meetings Today", value: String(slotCount), trend: "Auto-detected slots" },
        { icon: Mail, label: "Pending Inbox", value: String(emailCount), trend: "From Gmail API" },
        { icon: CheckSquare, label: "Action Items", value: String(actionItemsCount), trend: "AI Extracted" },
        { icon: Clock, label: "System Status", value: "Active", trend: "All agents live" },
      ]);

      // 🔥 Dynamic Activity Logs
      const logs = (pipeline?.emails || []).slice(0, 5).map((mail: any, i: number) => ({
        id: `activity-${i}-${mail.id || Math.random()}`,
        time: `${i + 2} min ago`,
        text: `Classified: ${mail.subject || "Meeting Request"}`,
        type: "classifier",
      }));
      setActivity(logs);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && stats.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Syncing Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* STATS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm border-none bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900">{s.value}</div>
              <p className="mt-1 text-[10px] font-medium text-slate-500">{s.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECENT ACTIVITY */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <TrendingUp className="h-4 w-4 text-primary" /> Recent Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {activity.length > 0 ? activity.map((a) => (
                <div key={a.id} className="flex gap-4 items-start border-l-2 border-slate-100 pl-4 relative">
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">{a.time}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${typeColors[a.type]}`}>
                    {a.type}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground italic py-4 text-center">No recent AI activity detected.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PIPELINE PROGRESS */}
        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="h-4 w-4 text-primary" /> Agent Node Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Email Classifier", status: stats[1]?.value > 0 ? "Active" : "Idle", pct: stats[1]?.value > 0 ? 95 : 20 },
              { label: "Slot Negotiator", status: stats[0]?.value > 0 ? "Processing" : "Idle", pct: stats[0]?.value > 0 ? 85 : 10 },
              { label: "Action Item Engine", status: stats[2]?.value > 0 ? "Synced" : "Idle", pct: stats[2]?.value > 0 ? 100 : 0 },
              { label: "Whisper Summarizer", status: "Ready", pct: 100 },
            ].map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-700">{p.label}</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase ${p.status !== 'Idle' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${p.status !== 'Idle' ? 'bg-primary' : 'bg-slate-300'}`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;