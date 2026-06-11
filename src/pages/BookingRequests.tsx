import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Trash2,
} from "lucide-react";

const BookingRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  useEffect(() => {
    load();
  }, []);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const updateStatus = async (id: string, status: "accepted" | "rejected") => {
    setIsSaving(true);
    const { error } = await supabase
      .from("booking_requests")
      .update({ status })
      .eq("id", id);
    setIsSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "accepted" ? "Booking accepted" : "Booking declined" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from("booking_requests").delete().eq("id", id);
    setIsSaving(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Booking request deleted" });
    setOpen(false);
    load();
  };

  const statusBadgeClass = (status: string) =>
    status === "pending"
      ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30 rounded-lg"
      : status === "accepted"
      ? "bg-green-500/20 text-green-600 border-green-500/30 rounded-lg"
      : "bg-destructive/20 text-destructive border-destructive/30 rounded-lg";

  const statusLabel = (status: string) =>
    status === "pending" ? "Pending" : status === "accepted" ? "Accepted" : "Declined";

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
                <Card
                  key={request.id}
                  className="border-border/50 hover:border-accent/50 transition-colors cursor-pointer rounded-lg"
                  onClick={() => {
                    setSelected(request);
                    setOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground truncate">
                        {request.requester_name}
                      </p>
                      <Badge className={statusBadgeClass(request.status)}>
                        {statusLabel(request.status)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-accent" />
              Booking Request Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <Badge className={statusBadgeClass(selected.status)}>
                  {statusLabel(selected.status)}
                </Badge>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Booking Request</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this booking request? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selected.id)}
                        className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Requester
                  </Label>
                  <p className="font-semibold text-foreground mt-1">{selected.requester_name}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Email
                    </Label>
                    <p className="text-sm text-foreground mt-1 flex items-center gap-1 break-all">
                      <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {selected.requester_email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Phone
                    </Label>
                    <p className="text-sm text-foreground mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      {selected.requester_phone}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Event Date
                  </Label>
                  <p className="text-foreground mt-1 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-accent" />
                    {(() => {
                      const [year, month, day] = selected.event_date.split("-").map(Number);
                      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                    })()}
                  </p>
                </div>

                {selected.message && selected.message.startsWith("Time:") && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Time Interval
                    </Label>
                    <p className="text-foreground mt-1 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-accent" />
                      {selected.message.split("\n")[0].replace("Time: ", "")}
                    </p>
                  </div>
                )}

                {selected.event_type && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Event Type
                    </Label>
                    <p className="text-foreground mt-1">{selected.event_type}</p>
                  </div>
                )}

                {selected.message && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Message
                    </Label>
                    <p className="text-foreground mt-1 p-3 bg-muted/50 rounded-lg italic">
                      "
                      {selected.message.startsWith("Time:")
                        ? selected.message.split("\n").slice(1).join("\n").trim() ||
                          "No additional message"
                        : selected.message}
                      "
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Received
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(selected.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => updateStatus(selected.id, "accepted")}
                    disabled={isSaving}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => updateStatus(selected.id, "rejected")}
                    disabled={isSaving}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingRequests;
