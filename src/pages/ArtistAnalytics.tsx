import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Calendar, CheckCircle, XCircle, Clock, Ban } from "lucide-react";

const ArtistAnalytics = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    rejectedRequests: 0,
    bookedEvents: 0,
    blockedDates: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const userId = session.user.id;

      // Load booking requests
      const { data: requests } = await supabase
        .from("booking_requests")
        .select("status")
        .eq("profile_id", userId);

      // Load calendar events
      const { data: calendarEvents } = await supabase
        .from("calendar_events")
        .select("status")
        .eq("profile_id", userId);

      const totalRequests = requests?.length || 0;
      const pendingRequests = requests?.filter((r) => r.status === "pending").length || 0;
      const acceptedRequests = requests?.filter((r) => r.status === "accepted").length || 0;
      const rejectedRequests = requests?.filter((r) => r.status === "rejected").length || 0;

      const bookedEvents = calendarEvents?.filter((e) => e.status === "booked").length || 0;
      const blockedDates = calendarEvents?.filter((e) => e.status === "blocked").length || 0;

      setStats({
        totalRequests,
        pendingRequests,
        acceptedRequests,
        rejectedRequests,
        bookedEvents,
        blockedDates,
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Requests",
      value: stats.totalRequests,
      icon: BarChart3,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Accepted Requests",
      value: stats.acceptedRequests,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Rejected Requests",
      value: stats.rejectedRequests,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Booked Events",
      value: stats.bookedEvents,
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Unavailable Dates",
      value: stats.blockedDates,
      icon: Ban,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard?tab=calendar")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-accent" />
            Calendar Analytics
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtistAnalytics;
