import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";

const BookingRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const { data } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    load();
  }, [navigate]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Navigation mobileTitle="Booking Requests" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="hidden md:flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard?tab=profile")}
              className="rounded-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-accent" />
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Booking Requests
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <Card className="border-2 border-dashed border-border/50 rounded-lg">
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No booking requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="border-border/50 rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground truncate">
                        {request.requester_name}
                      </p>
                      <Badge
                        className={
                          request.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 rounded-lg"
                            : request.status === "accepted"
                            ? "bg-green-500/20 text-green-600 border-green-500/30 rounded-lg"
                            : "bg-destructive/20 text-destructive border-destructive/30 rounded-lg"
                        }
                      >
                        {request.status === "pending"
                          ? "Pending"
                          : request.status === "accepted"
                          ? "Accepted"
                          : "Declined"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(request.event_date)}</span>
                      {request.event_type && (
                        <>
                          <span>·</span>
                          <span>{request.event_type}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default BookingRequests;
