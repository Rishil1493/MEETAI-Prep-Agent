import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Negotiation {
  id: number;
  subject: string;
  from: string;
  status: "in_progress" | "resolved" | "stalled";
  proposedSlot: string; // Isme hum formatted string rakhenge
  turns: number;
  lastMessage: string;
}

const statusConfig: Record<string, { icon: any; badge: string; color: string }> = {
  in_progress: { icon: Clock, badge: "Negotiating", color: "bg-primary/10 text-primary" },
  resolved: { icon: CheckCircle, badge: "Confirmed", color: "bg-accent/10 text-accent" },
  stalled: { icon: AlertCircle, badge: "Stalled", color: "bg-destructive/10 text-destructive" },
};

const NegotiationsPanel = () => {
  const [data, setData] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const res = await api.runPipeline();

        const formatted: Negotiation[] = (res.emails || []).map((email: any, index: number) => {
          // 🔥 FIX: Agar res.freeSlots[0] ek object hai {start, end}, toh use string banao
          let slotDisplay = "TBD";
          const firstSlot = res.freeSlots?.[0];

          if (firstSlot && typeof firstSlot === 'object') {
            // Object se readable time nikal rahe hain
            const start = new Date(firstSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const end = new Date(firstSlot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            slotDisplay = `${start} - ${end}`;
          } else if (typeof firstSlot === 'string') {
            slotDisplay = firstSlot;
          }

          return {
            id: index + 1,
            subject: email.subject || "Meeting",
            from: email.from || "Unknown",
            status: "in_progress",
            proposedSlot: slotDisplay, // Ab ye hamesha String rahega ✅
            turns: 1,
            lastMessage: email.snippet || "New email received",
          };
        });

        setData(formatted);
      } catch (err) {
        console.error("Pipeline error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, []);

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Email Negotiations
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading negotiations...</p>}

          {!loading && data.length === 0 && (
            <p className="text-sm text-muted-foreground">No negotiations found</p>
          )}

          {!loading && data.map((n) => {
            const cfg = statusConfig[n.status];
            const Icon = cfg.icon;

            return (
              <div
                key={n.id}
                className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{n.subject}</span>
                    <Badge className={`text-[10px] ${cfg.color} border-0`}>
                      {cfg.badge}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    From: {n.from} · {n.turns} turn{n.turns > 1 ? "s" : ""}
                  </p>

                  <p className="mt-1.5 text-sm text-muted-foreground italic">
                    "{n.lastMessage}"
                  </p>

                  {n.proposedSlot !== "TBD" && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Suggested: {n.proposedSlot}
                    </p>
                  )}
                </div>

                <Button variant="ghost" size="sm" className="shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default NegotiationsPanel;