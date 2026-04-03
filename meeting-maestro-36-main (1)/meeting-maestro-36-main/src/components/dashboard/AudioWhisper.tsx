import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Upload, Play, Pause, FileAudio, CheckCircle, Loader2, Lightbulb, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api"; 

interface ActionItem {
  text: string;
  assignee: string;
  deadline: string;
  priority: "high" | "medium" | "low";
}

interface TranscriptResult {
  fileName: string;
  fileUrl: string; // 🔥 Audio play karne ke liye URL
  duration: string;
  transcript: string;
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};

const AudioWhisper = () => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<TranscriptResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TranscriptResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // 🔥 Function to play/pause audio
  const togglePlay = (url: string) => {
    if (audioRef.current?.src !== url) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("audio") && !file.name.endsWith(".m4a") && !file.name.endsWith(".mp3")) {
      toast({ title: "Invalid File", description: "Please upload a valid audio file.", variant: "destructive" });
      return;
    }

    try {
      setProcessing(true);
      
      const transcribeData = await api.transcribe(file);
      const text = transcribeData.transcript;

      if (!text) {
        throw new Error(transcribeData.error || "No transcript text found");
      }

      const extractData = await api.extractData(text);

      const newResult: TranscriptResult = {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file), // 🔥 Temp URL for playback
        duration: "Auto",
        transcript: text,
        summary: extractData.summary || "Summary generated from transcript.",
        keyDecisions: extractData.key_decisions || extractData.keyDecisions || ["No major decisions identified."],
        actionItems: (extractData.action_items || extractData.actionItems || []).map((a: any) => ({
          text: a.text || a.task || "Action item",
          assignee: a.assignee || "Unassigned",
          deadline: a.deadline || "TBD",
          priority: (a.priority?.toLowerCase() as "high" | "medium" | "low") || "medium",
        })),
      };

      setResults((prev) => [newResult, ...prev]);
      setSelectedResult(newResult);
      toast({ title: "Analysis Complete", description: "Meeting insights are ready." });

    } catch (err: any) {
      console.error("❌ Whisper Error:", err);
      toast({
        title: "Processing Failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* UPLOAD AREA */}
      <Card className="shadow-sm border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Meeting Intelligence</h3>
              <p className="text-sm text-muted-foreground">AI summaries, key decisions, and tasks from audio.</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp3,.wav,.m4a"
              className="hidden"
              onChange={(e) => {
                handleUpload(e);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="gradient-primary"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Audio...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Recording
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* LEFT: HISTORY */}
        <Card className="lg:col-span-2 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-md">
              <FileAudio className="h-4 w-4 text-primary" /> Recent Recordings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.length === 0 && !processing && (
              <p className="text-sm text-muted-foreground text-center py-4">No analysis history found.</p>
            )}
            {results.map((r, index) => (
              <div
                key={index}
                onClick={() => setSelectedResult(r)}
                className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer transition-all ${
                  selectedResult?.fileName === r.fileName ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-muted"
                }`}
              >
                {/* 🔥 Play Button in List */}
                <div 
                  onClick={(e) => { e.stopPropagation(); togglePlay(r.fileUrl); }}
                  className="p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {isPlaying && audioRef.current?.src === r.fileUrl ? (
                    <Pause className="h-3 w-3 text-primary" />
                  ) : (
                    <Play className="h-3 w-3 text-primary" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate">{r.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{r.actionItems.length} tasks extracted</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* RIGHT: AI INSIGHTS */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedResult ? (
              <motion.div
                key={selectedResult.fileName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* SUMMARY */}
                <Card className="border-l-4 border-l-primary shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 leading-relaxed italic">
                    "{selectedResult.summary}"
                  </CardContent>
                </Card>

                {/* KEY DECISIONS */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-600">
                      <Lightbulb className="h-4 w-4" /> Key Decisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResult.keyDecisions.map((decision, i) => (
                      <div key={i} className="flex items-center gap-3 bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 text-xs font-medium text-slate-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                        {decision}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* TASKS */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">Action Items & Owners</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedResult.actionItems.map((item, i) => (
                      <div key={i} className="flex items-start justify-between border p-3 rounded-xl bg-slate-50/30">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800">{item.text}</p>
                          <div className="flex gap-3 text-[10px] text-muted-foreground font-medium">
                            <span>👤 {item.assignee}</span>
                            <span>📅 {item.deadline}</span>
                          </div>
                        </div>
                        <Badge className={`${priorityColors[item.priority]} text-[9px] uppercase border-none px-2`}>
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* TRANSCRIPT */}
                <Card className="shadow-sm opacity-80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[120px] overflow-y-auto rounded-xl bg-muted/40 p-4 text-[11px] leading-relaxed text-slate-500 font-mono">
                      {selectedResult.transcript}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed border-2 bg-slate-50/50">
                <FileAudio className="h-12 w-12 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">Select a meeting recording to view AI insights</p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AudioWhisper;