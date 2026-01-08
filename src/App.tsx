import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import React, { Suspense, lazy } from "react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Connect = lazy(() => import("./pages/Connect"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Profile = lazy(() => import("./pages/Profile"));
const Matches = lazy(() => import("./pages/Matches"));
const Messages = lazy(() => import("./pages/Messages"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { AuthProvider } from "@/hooks/useAuth";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { useTheme } from "@/hooks/useTheme";

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useTheme(); // Initialize theme on mount
  return <>{children}</>;
}

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

      // Handle dynamic import failures (stale cache)
      if (msg.includes("Failed to fetch dynamically imported module")) {
        // Reload the page to get fresh assets
        window.location.reload();
        event.preventDefault();
        return;
      }

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
          <ThemeWrapper>
            <NotificationProvider>
              <div>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/connect/:token" element={<Connect />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </div>
          </NotificationProvider>
        </ThemeWrapper>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
}
