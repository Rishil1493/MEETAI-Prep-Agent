import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Loader2, Clock } from "lucide-react";
import { api } from "@/lib/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM tak extend kiya

interface CalendarMeeting {
  id: string;
  day: number;
  startHour: number;
  startMinute: number;
  duration: number;
  title: string;
  type: "scheduled" | "pending";
}

const CalendarView = () => {
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const res = await api.runPipeline();
        const dynamicMeetings: CalendarMeeting[] = (res.freeSlots || []).map((slot: any, index: number) => {
          const startDate = new Date(slot.start);
          const endDate = new Date(slot.end);
          
          let dayIdx = startDate.getDay() - 1; 
          if (dayIdx === -1) dayIdx = 6; 

          return {
            id: `slot-${index}`,
            day: dayIdx,
            startHour: startDate.getHours(),
            startMinute: startDate.getMinutes(),
            duration: (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60),
            title: "Available Slot",
            type: "pending"
          };
        });
        setMeetings(dynamicMeetings);
      } catch (err) {
        console.error("Calendar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarData();
  }, []);

  return (
    <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="border-b border-slate-800/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-100">
            <CalendarIcon className="h-5 w-5 text-cyan-400" /> 
            Weekly Command Center
          </CardTitle>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Scheduled
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full border border-cyan-400 bg-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.3)]" /> AI Found
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-[500px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
            <p className="text-sm text-slate-500 animate-pulse">Syncing with AI Pipeline...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[900px]" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
              {/* Header Labels */}
              <div className="sticky left-0 z-20 bg-slate-950/80 p-4 border-r border-b border-slate-800" />
              {days.map((d) => (
                <div key={d} className="p-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 bg-slate-900/30">
                  {d}
                </div>
              ))}

              {/* Time Grid */}
              {hours.map((h) => (
                <React.Fragment key={h}>
                  {/* Time Column */}
                  <div className="sticky left-0 z-20 flex items-start justify-center border-b border-r border-slate-800 bg-slate-950/80 py-4 text-[11px] font-bold text-slate-500">
                    {h === 12 ? "12:00 PM" : h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}
                  </div>

                  {/* Day Cells */}
                  {days.map((_, di) => (
                    <div key={`${h}-${di}`} className="group relative h-20 border-b border-r border-slate-800/50 transition-colors hover:bg-slate-800/20">
                      {meetings
                        .filter((m) => m.day === di && m.startHour === h)
                        .map((meeting) => (
                          <div
                            key={meeting.id}
                            className={`absolute inset-x-1 z-10 flex flex-col justify-between rounded-lg border p-2 shadow-lg transition-all hover:scale-[1.02] hover:z-20 ${
                              meeting.type === "scheduled"
                                ? "border-blue-500/50 bg-blue-600/20 text-blue-100"
                                : "border-cyan-400/50 bg-cyan-400/10 text-cyan-50 shadow-[inset_0_0_12px_rgba(34,211,238,0.1)]"
                            }`}
                            style={{
                              top: `${(meeting.startMinute / 60) * 100}%`,
                              height: `${meeting.duration * 80 - 4}px`,
                            }}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold leading-tight uppercase truncate">
                                {meeting.title}
                              </span>
                              <div className="flex items-center gap-1 opacity-70">
                                <Clock className="h-2 w-2" />
                                <span className="text-[8px]">{meeting.duration}hr</span>
                              </div>
                            </div>
                            {meeting.type === "pending" && (
                              <Badge className="w-fit border-none bg-cyan-400/20 px-1 py-0 text-[8px] text-cyan-300">
                                AI OPTIMIZED
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarView;