import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import TimeSelector from "@/components/TimeSelector";
import { useToast } from "@/hooks/use-toast";
import { parseYMDToLocalDate, formatLocalDateToYMD } from "@/lib/utils";
import { canUseTimeIntervals } from "@/lib/planLimits";

interface ArtistLite {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan: string | null;
}

interface CalendarEvent {
  id: string;
  event_date: string;
  status: string;
  notes: string | null;
}

const extractAllTimeSlotsFromNotes = (notes: string | null) => {
  if (!notes) return [] as { startTime: string; endTime: string }[];
  const entries = notes.split(/\n\n---\n\n/);
  const slots: { startTime: string; endTime: string }[] = [];
  for (const entry of entries) {
    const m = entry.match(/Time:\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})\s*-\s*(?:[\w\s,]+\s+)?(\d{1,2}:\d{2})/i);
    if (m) slots.push({ startTime: m[1], endTime: m[2] });
  }
  return slots;
};

const doTimeSlotsOverlap = (s1: string, e1: string, s2: string, e2: string) => {
  const m = (t: string) => {
    const [h, mi] = t.split(":").map(Number);
    return h * 60 + mi;
  };
  return m(s1) < m(e2) && m(e1) > m(s2);
};

const BookArtist = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [artist, setArtist] = useState<ArtistLite | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    first_name: string; last_name: string; email: string; phone: string;
  } | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [form, setForm] = useState({
    startTime: "",
    endTime: "",
    endDate: null as Date | null,
    eventType: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      if (!mounted) return;
      setCurrentUserId(user.id);

      const [{ data: artistData }, { data: eventData }, { data: prof }] = await Promise.all([
        supabase.from("profiles").select("id, stage_name, avatar_url, plan").eq("id", id).maybeSingle(),
        supabase.from("calendar_events").select("id, event_date, status, notes").eq("profile_id", id),
        supabase.from("profiles").select("first_name, last_name, email, phone").eq("id", user.id).maybeSingle(),
      ]);

      if (!mounted) return;
      if (!artistData) {
        toast({ title: "Artist not found", variant: "destructive" });
        navigate(-1);
        return;
      }
      setArtist(artistData as ArtistLite);
      setEvents((eventData as CalendarEvent[]) || []);
      if (prof) setCurrentUserProfile(prof as any);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id, navigate, toast]);

  const busyDates = useMemo(
    () => events.filter((e) => e.status === "busy" || e.status === "booked").map((e) => parseYMDToLocalDate(e.event_date)),
    [events]
  );
  const blockedDates = useMemo(
    () => events.filter((e) => e.status === "blocked" || e.status === "unavailable").map((e) => parseYMDToLocalDate(e.event_date)),
    [events]
  );

  const isBusyDate = (d: Date) => busyDates.some((b) => b.toDateString() === d.toDateString());
  const isBlockedDate = (d: Date) => blockedDates.some((b) => b.toDateString() === d.toDateString());
  const getEventForDate = (d: Date) =>
    events.find((e) => parseYMDToLocalDate(e.event_date).toDateString() === d.toDateString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !id || !artist) return;
    if (isBlockedDate(selectedDate)) {
      toast({ title: "Date Unavailable", description: "The artist marked this day as unavailable.", variant: "destructive" });
      return;
    }
    const endDate = form.endDate || selectedDate;
    const sameDay = endDate.toDateString() === selectedDate.toDateString();

    if (form.startTime && form.endTime && sameDay) {
      const [sh, sm] = form.startTime.split(":").map(Number);
      const [eh, em] = form.endTime.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) {
        toast({ title: "Invalid Time", description: "End time must be after start time.", variant: "destructive" });
        return;
      }
    }

    if (form.startTime && form.endTime) {
      const ev = getEventForDate(selectedDate);
      if (ev && (ev.status === "busy" || ev.status === "booked")) {
        const slots = extractAllTimeSlotsFromNotes(ev.notes);
        if (slots.length === 0) {
          toast({ title: "Date Unavailable", description: "This date is fully booked.", variant: "destructive" });
          return;
        }
        for (const s of slots) {
          if (doTimeSlotsOverlap(form.startTime, form.endTime, s.startTime, s.endTime)) {
            toast({
              title: "Time Slot Conflict",
              description: `Overlaps with existing booking (${s.startTime} - ${s.endTime}).`,
              variant: "destructive",
            });
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const startStr = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      let timeInfo = "";
      if (form.startTime && form.endTime) {
        timeInfo = sameDay
          ? `Time: ${form.startTime} - ${form.endTime}\n`
          : `Time: ${startStr} ${form.startTime} - ${endStr} ${form.endTime}\n`;
      }
      const fullMessage = (timeInfo + (form.message || "")).trim();

      const name = currentUserProfile
        ? `${currentUserProfile.first_name} ${currentUserProfile.last_name}`.trim()
        : "";

      const { error } = await supabase.from("booking_requests").insert({
        profile_id: id,
        requester_name: name,
        requester_email: currentUserProfile?.email || "",
        requester_phone: currentUserProfile?.phone || "",
        requester_user_id: currentUserId,
        event_date: formatLocalDateToYMD(selectedDate),
        event_end_date: formatLocalDateToYMD(endDate),
        event_type: form.eventType,
        message: fullMessage,
        status: "pending",
      });
      if (error) throw error;
      toast({
        title: "Booking Request Sent!",
        description: `Your request for ${selectedDate.toLocaleDateString()} has been sent to ${artist.stage_name}.`,
      });
      navigate(`/artist/${id}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to send booking request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !artist) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const selectedEvent = selectedDate ? getEventForDate(selectedDate) : null;
  const selectedSlots = selectedEvent ? extractAllTimeSlotsFromNotes(selectedEvent.notes) : [];
  const supportsTimeIntervals = canUseTimeIntervals(artist.plan);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 pb-32 md:pb-12 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Link to={`/artist/${artist.id}`}>
            <Avatar className="h-14 w-14">
              <AvatarImage src={artist.avatar_url || undefined} />
              <AvatarFallback>{artist.stage_name?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <p className="text-xs text-muted-foreground">Book Artist</p>
            <Link to={`/artist/${artist.id}`} className="text-xl font-display font-bold hover:text-accent">
              {artist.stage_name}
            </Link>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="rounded-lg border border-border bg-card p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-accent" />
            Select Availability
          </h2>

          <div className="flex flex-col items-center gap-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg border border-border shadow-sm pointer-events-auto"
              classNames={{
                day_selected:
                  "bg-emerald-500 text-white hover:bg-emerald-500 hover:text-white focus:bg-emerald-500 focus:text-white",
                day_today: "bg-emerald-500/30 text-foreground",
              }}
              modifiers={{ busy: busyDates, blocked: blockedDates }}
              modifiersClassNames={{
                busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80",
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />

            <div className="w-full flex flex-wrap justify-center gap-3 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />Available</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/70" />Booked</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/80" />Unavailable</div>
            </div>

            {selectedDate && (
              <div className="w-full p-3 rounded-lg border border-border bg-secondary/30">
                <p className="text-sm font-medium">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
                <div className="mt-2">
                  <Badge
                    className={
                      isBlockedDate(selectedDate)
                        ? "bg-muted text-muted-foreground"
                        : isBusyDate(selectedDate)
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-emerald-500 text-white"
                    }
                  >
                    {isBlockedDate(selectedDate)
                      ? "Unavailable"
                      : isBusyDate(selectedDate)
                      ? selectedSlots.length > 0 && supportsTimeIntervals
                        ? `Partially booked · ${selectedSlots.length} slot${selectedSlots.length > 1 ? "s" : ""}`
                        : "Fully booked"
                      : "Available"}
                  </Badge>
                </div>
                {selectedSlots.length > 0 && supportsTimeIntervals && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs text-muted-foreground">Booked slots:</p>
                    {selectedSlots.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                        <Clock className="h-3.5 w-3.5" />
                        {s.startTime} — {s.endTime}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-4 space-y-4"
        >
          <h2 className="text-lg font-semibold">Booking Details</h2>

          {!selectedDate && (
            <p className="text-sm text-muted-foreground">
              Pick a date above to enable the booking form.
            </p>
          )}

          {supportsTimeIntervals && (
            <>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {selectedDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "—"}
                  </div>
                  <div className="flex-1">
                    <TimeSelector
                      id="startTime"
                      value={form.startTime}
                      onChange={(v) => setForm({ ...form, startTime: v })}
                      placeholder="Start time"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 justify-start text-left font-normal"
                        disabled={!selectedDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(form.endDate || selectedDate)?.toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        }) || "—"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.endDate || selectedDate}
                        onSelect={(date) => setForm({ ...form, endDate: date || null })}
                        disabled={(date) => date < (selectedDate || new Date())}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex-1">
                    <TimeSelector
                      id="endTime"
                      value={form.endTime}
                      onChange={(v) => setForm({ ...form, endTime: v })}
                      placeholder="End time"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select a different date if the event extends to the next day.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Input
              id="eventType"
              placeholder="e.g., Wedding, Corporate Event, Birthday"
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Additional Details</Label>
            <Textarea
              id="message"
              placeholder="Tell us more about your event..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={!selectedDate || submitting}
          >
            {submitting ? "Sending..." : "Send Booking Request"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BookArtist;
