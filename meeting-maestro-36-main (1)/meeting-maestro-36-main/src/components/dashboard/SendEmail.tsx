import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Wand2, Clock, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Types definition
interface SentEmail {
  id: number;
  to: string;
  subject: string;
  status: "sent" | "delivered" | "pending";
  sentAt: string;
}

const statusIcons: Record<string, any> = {
  sent: Clock,
  delivered: CheckCircle,
  pending: RefreshCw,
};

const emailTemplates = [
  { label: "Negotiate Time Slot", subject: "Meeting Scheduling", body: "Hi,\n\nI'd like to coordinate a time for our meeting based on my availability.\n\nBest regards," },
  { label: "Follow-up Actions", subject: "Follow-up: Our Meeting", body: "Hi,\n\nFollowing up on our discussion, here are the next steps...\n\nThanks!" },
  { label: "Confirm Meeting", subject: "Meeting Confirmation", body: "Hi,\n\nConfirming our meeting for the agreed time. Looking forward to it.\n\nBest," },
];

const SendEmail = () => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dummy history (Ideally you'd fetch this from backend)
  const [history, setHistory] = useState<SentEmail[]>([
    { id: 1, to: "sarah@acme.com", subject: "Q2 Strategy Review", status: "delivered", sentAt: "10 min ago" },
  ]);

  const { toast } = useToast();

  // AI Draft Generator (Simulated)
  const handleAIDraft = (template: typeof emailTemplates[0]) => {
    setIsGenerating(true);
    // Simulate AI delay
    setTimeout(() => {
      setSubject(template.subject);
      setBody(template.body);
      setIsGenerating(false);
      toast({ title: "Draft Generated", description: "AI has filled the template for you." });
    }, 600);
  };

  // 🔥 Real Backend Connection
  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await api.sendEmail({ to, subject, body });

      if (res.status === "error" || res.error) {
        throw new Error(res.message || res.error || "Failed to send");
      }

      toast({
        title: "✅ Email Sent",
        description: `Successfully sent to ${to}`,
      });

      // Update local history dummy
      const newEntry: SentEmail = {
        id: Date.now(),
        to,
        subject,
        status: "sent",
        sentAt: "Just now"
      };
      setHistory([newEntry, ...history]);

      // Clear form
      setTo("");
      setSubject("");
      setBody("");

    } catch (err: any) {
      console.error("Send Error:", err);
      toast({
        title: "❌ Sending Failed",
        description: err.message || "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        
        {/* Compose Section */}
        <Card className="shadow-lg lg:col-span-3 border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Compose Meeting Email
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {emailTemplates.map((t) => (
                <Button 
                  key={t.label} 
                  variant="outline" 
                  size="sm" 
                  disabled={isGenerating || isSending}
                  onClick={() => handleAIDraft(t)}
                >
                  {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Recipient Email (to)"
                value={to}
                disabled={isSending}
                onChange={(e) => setTo(e.target.value)}
              />
              <Input
                placeholder="Subject"
                value={subject}
                disabled={isSending}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                placeholder="Write your message here..."
                className="min-h-[200px]"
                value={body}
                disabled={isSending}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleSend} 
              className="w-full md:w-auto gradient-primary"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No emails sent yet.</p>
            ) : (
              history.map((email) => {
                const Icon = statusIcons[email.status] || Clock;
                return (
                  <div key={email.id} className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50/50">
                    <div className="mt-1">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate">{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">To: {email.to}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{email.sentAt}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                          {email.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default SendEmail;