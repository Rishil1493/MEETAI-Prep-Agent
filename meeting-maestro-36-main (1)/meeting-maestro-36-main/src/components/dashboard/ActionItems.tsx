import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// Task interface for type safety
interface TaskItem {
  id: string | number;
  text: string;
  assignee: string;
  deadline: string;
  meeting: string;
  done: boolean;
}

const ActionItems = () => {
  const [items, setItems] = useState<TaskItem[]>([
    { id: "static-1", text: "Send revised proposal to Acme Corp", assignee: "You", deadline: "Apr 2", meeting: "Client Review", done: false },
  ]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.runPipeline();

      // 👉 Safely transform emails to tasks
      const emails = data?.emails || [];
      const generated: TaskItem[] = emails.map((email: any, index: number) => ({
        id: `email-task-${email.id || index}-${Math.random().toString(36).substr(2, 5)}`, 
        text: `Reply to: ${email.subject || "New Inquiry"}`,
        assignee: "You",
        deadline: "Today",
        meeting: "Email Task",
        done: false,
      }));

      // 🔥 Sync logic: Don't add if text already exists
      if (generated.length > 0) {
        setItems(prev => {
          const existingTexts = new Set(prev.map(i => i.text.toLowerCase()));
          const uniqueNewItems = generated.filter(n => !existingTexts.has(n.text.toLowerCase()));
          return [...prev, ...uniqueNewItems];
        });
      }
    } catch (err) {
      console.error("ActionItems fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggle = (id: string | number) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, done: !it.done } : it
      )
    );

  const pending = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);

  return (
    <div className="space-y-4">
      <Card className="shadow-card border-none bg-white/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <CheckSquare className="h-5 w-5 text-primary" /> Tasks & Action Items
          </CardTitle>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardHeader>

        <CardContent>
          <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest font-bold">
            AI-Generated from Pipeline
          </p>

          {/* 🔥 PENDING SECTION */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700">Pending</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
              {pending.length} Tasks
            </Badge>
          </div>

          <div className="space-y-3 mb-6">
            {pending.length === 0 && !loading && (
              <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50/50">
                <p className="text-xs text-muted-foreground">All tasks completed. Good job! 🎯</p>
              </div>
            )}
            
            {pending.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 cursor-pointer hover:bg-white hover:shadow-md transition-all group border-l-4 border-l-primary/40"
              >
                <Checkbox
                  checked={item.done}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-1 data-[state=checked]:bg-primary"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-800 block group-hover:text-primary transition-colors">
                    {item.text}
                  </span>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[9px] py-0 bg-white">{item.assignee}</Badge>
                    <Badge variant="outline" className="text-[9px] py-0 bg-white">Due: {item.deadline}</Badge>
                    <Badge className="text-[9px] py-0 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">
                      {item.meeting}
                    </Badge>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* 🔥 COMPLETED SECTION */}
          {completed.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold mb-3 text-slate-400">Completed</h3>
              <div className="space-y-2">
                {completed.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 cursor-pointer opacity-60 bg-slate-50/50 grayscale-[0.5]"
                  >
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={() => toggle(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm line-through text-slate-400 font-medium">
                        {item.text}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionItems;