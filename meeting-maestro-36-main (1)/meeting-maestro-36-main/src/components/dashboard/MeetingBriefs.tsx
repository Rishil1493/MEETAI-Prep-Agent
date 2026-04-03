import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Clock, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Brief {
  id: string | number;
  title: string;
  time: string;
  attendees: string[];
  context: string;
  pastNotes: string;
  suggestedAgenda: string[];
}

const MeetingBriefs = () => {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefs = async () => {
      try {
        setLoading(true);
        const data = await api.runPipeline();

        // 🔥 Backend se aane wale data ko dynamic briefs mein convert kar rahe hain
        if (data?.emails && data.emails.length > 0) {
          const dynamicBriefs: Brief[] = data.emails.map((email: any, index: number) => ({
            id: `brief-${index}`,
            title: email.subject || "Upcoming Meeting",
            time: "Scheduled via AI",
            attendees: [email.from || "Client", "You"],
            context: data.draftEmail || "Analyzing conversation context...",
            pastNotes: email.snippet || "No previous history found.",
            suggestedAgenda: ["Introduce participants", "Discuss requirements", "Confirm next steps"],
          }));
          setBriefs(dynamicBriefs);
        } else {
          // Fallback static data agar backend khali ho (testing ke liye)
          setBriefs([]);
        }
      } catch (err) {
        console.error("Briefs fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBriefs();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Generating AI Briefs...</p>
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="py-10 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No upcoming meeting briefs generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {briefs.map((b) => (
        <Card key={b.id} className="shadow-card border-l-4 border-l-primary/20 hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <FileText className="h-4 w-4 text-primary" /> {b.title}
                </CardTitle>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {b.time}
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-[10px] h-8 px-3">
                <ExternalLink className="h-3 w-3" /> Full Sync
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Attendees Section */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Participants</h4>
              <div className="flex flex-wrap gap-2">
                {b.attendees.map((a) => (
                  <Badge key={a} variant="secondary" className="gap-1 px-2 py-0.5 font-medium bg-slate-100 text-slate-700 border-none">
                    <User className="h-3 w-3" /> {a}
                  </Badge>
                ))}
              </div>
            </div>

            {/* AI Context Section */}
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Context from RAG
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{b.context}</p>
            </div>

            {/* Past Notes Section */}
            <div className="pl-3 border-l-2 border-slate-200">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Last Communication</h4>
              <p className="text-sm text-slate-500 italic leading-snug">"{b.pastNotes}"</p>
            </div>

            {/* Agenda Section */}
            <div className="pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Suggested Agenda</h4>
              <ul className="space-y-2">
                {b.suggestedAgenda.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MeetingBriefs;