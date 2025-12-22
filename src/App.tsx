import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Schedule from "./pages/Schedule";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/hooks/useAuth";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

function NotificationProvider({ children }: { children: React.ReactNode }) {
  useMessageNotifications();
  return <>{children}</>;
}

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg =
        (event.reason instanceof Error ? event.reason.message : String(event.reason)) ||
        "Unexpected error";

      // Most common user-facing issue: AI rate limiting
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        toast({
          title: "Service Busy",
          description: "AI is temporarily rate-limited. Please wait a moment and try again.",
          variant: "destructive",
        });
        event.preventDefault();
        return;
      }

      toast({
        title: "Something went wrong",
        description: msg,
        variant: "destructive",
      });
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <div className="dark">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/profile-setup" element={<ProfileSetup />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/matches" element={<Matches />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
