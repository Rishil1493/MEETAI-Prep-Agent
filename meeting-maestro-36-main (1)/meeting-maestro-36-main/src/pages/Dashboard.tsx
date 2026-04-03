import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

import Navbar from "@/components/Navbar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import CalendarView from "@/components/dashboard/CalendarView";
import NegotiationsPanel from "@/components/dashboard/NegotiationsPanel";
import ActionItems from "@/components/dashboard/ActionItems";
import MeetingBriefs from "@/components/dashboard/MeetingBriefs";
import AudioWhisper from "@/components/dashboard/AudioWhisper";
import PipelineView from "@/components/dashboard/PipelineView";
import SendEmail from "@/components/dashboard/SendEmail";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MessageSquare,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Mic,
  GitBranch,
  Mail,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);

  // 🔴 Auth check - Preserved as is
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // 🟢 Enhanced Backend health check
  useEffect(() => {
    const checkBackend = async () => {
      // Logic start hone par loading true
      setLoading(true); 
      try {
        console.log("Dashboard: Attempting to connect to backend...");
        
        // Hum simple API call kar rahe hain connection test karne ke liye
        const data = await api.getInbox(); 
        console.log("Dashboard: Backend connected successfully", data);

        setBackendStatus("Connected 🚀");
      } catch (err) {
        console.error("Dashboard: Backend connection failed", err);
        setBackendStatus("❌ Backend not connected");
      } finally {
        // Success ho ya Error, loading khatam honi chahiye
        setLoading(false);
      }
    };

    if (user) {
      checkBackend();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">

        {/* 🔥 UPDATED BACKEND STATUS UI */}
        <div className={`mb-4 p-3 rounded-lg border ${loading ? 'bg-muted' : backendStatus.includes('Connected') ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm font-medium">🔄 Connecting to backend...</p>
            </div>
          ) : (
            <p className="text-sm">
              Backend status:{" "}
              <span className={`font-bold ${backendStatus.includes('Connected') ? 'text-green-600' : 'text-destructive'}`}>
                {backendStatus}
              </span>
            </p>
          )}
        </div>

        {/* HEADER - No changes */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's your autonomous meeting command center.
          </p>
        </div>

        {/* TABS - All original tabs preserved */}
        <Tabs defaultValue="overview" className="space-y-6">

          <TabsList className="bg-muted flex flex-wrap gap-2">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-1" /> Overview
            </TabsTrigger>

            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-1" /> Calendar
            </TabsTrigger>

            <TabsTrigger value="negotiations">
              <MessageSquare className="h-4 w-4 mr-1" /> Negotiations
            </TabsTrigger>

            <TabsTrigger value="actions">
              <CheckSquare className="h-4 w-4 mr-1" /> Actions
            </TabsTrigger>

            <TabsTrigger value="briefs">
              <FileText className="h-4 w-4 mr-1" /> Briefs
            </TabsTrigger>

            <TabsTrigger value="whisper">
              <Mic className="h-4 w-4 mr-1" /> Whisper
            </TabsTrigger>

            <TabsTrigger value="pipeline">
              <GitBranch className="h-4 w-4 mr-1" /> Pipeline
            </TabsTrigger>

            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-1" /> Email
            </TabsTrigger>
          </TabsList>

          {/* CONTENT - Components preserved */}
          <TabsContent value="overview">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView />
          </TabsContent>

          <TabsContent value="negotiations">
            <NegotiationsPanel />
          </TabsContent>

          <TabsContent value="actions">
            <ActionItems />
          </TabsContent>

          <TabsContent value="briefs">
            <MeetingBriefs />
          </TabsContent>

          <TabsContent value="whisper">
            <AudioWhisper />
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineView />
          </TabsContent>

          <TabsContent value="email">
            <SendEmail />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;