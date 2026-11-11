import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { goBack } from "@/lib/backNavigation";
import { trackActivityEvent } from "@/lib/activityTracker";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArtistAvailabilityCalendar } from "@/components/ArtistAvailabilityCalendar";
import { useToast } from "@/hooks/use-toast";
import { parseYMDToLocalDate, formatLocalDateToYMD } from "@/lib/utils";
import { isDayFullyBooked } from "@/lib/calendarSlots";
import { BookingRequestFields, findSlotClash, resolveBookingEndDate, type BookingRequestForm } from "@/components/BookingRequestDialog";

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

const BookArtist = () => {
  usePageTitle("Availability");
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

  // "?date=YYYY-MM-DD" (e.g. from an availability post) pre-selects that day, if it isn't past
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const raw = searchParams.get("date");
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
    const d = parseYMDToLocalDate(raw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Number.isNaN(d.getTime()) || d < today ? undefined : d;
  });
  const [form, setForm] = useState<BookingRequestForm>({
    name: "",
    email: "",
    phone: "",
    // "?from=HH:MM&until=HH:MM" (availability post) pre-fills the hours
    startTime: /^\d{2}:\d{2}$/.test(searchParams.get("from") || "") ? searchParams.get("from")! : "",
    endTime: /^\d{2}:\d{2}$/.test(searchParams.get("until") || "") ? searchParams.get("until")! : "",
    endDate: null,
    eventType: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { trackActivityEvent("booking_started"); }, []);

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

      const [{ data: artistData }, { data: eventData }, { data: profRows }] = await Promise.all([
        supabase.from("profiles").select("id, stage_name, avatar_url, plan").eq("id", id).maybeSingle(),
        (supabase as any).rpc("get_public_calendar", { _profile_id: id }),
        (supabase as any).rpc("get_my_full_profile"),
      ]);

      if (!mounted) return;
      if (!artistData) {
        toast({ title: "Artist not found", variant: "destructive" });
        goBack(navigate, "/artists");
        return;
      }
      setArtist(artistData as ArtistLite);
      setEvents(
        ((eventData as Array<{ event_date: string; status: string; slots: Array<{ startTime: string; endTime: string }> }>) || []).map((row) => ({
          id: row.event_date,
          event_date: row.event_date,
          status: row.status,
          notes: (row.slots || []).length
            ? (row.slots || []).map((s) => `Time: ${s.startTime} - ${s.endTime}`).join("\n\n---\n\n")
            : null,
        }))
      );
      const prof = Array.isArray(profRows) ? profRows[0] : profRows;
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
  const hasFreeHours = (d: Date) => {
    const ev = events.find((e) => parseYMDToLocalDate(e.event_date).toDateString() === d.toDateString());
    return !!ev && !isDayFullyBooked(extractAllTimeSlotsFromNotes(ev.notes));
  };
  const getEventForDate = (d: Date) =>
    events.find((e) => parseYMDToLocalDate(e.event_date).toDateString() === d.toDateString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !id || !artist) return;
    if (isBlockedDate(selectedDate)) {
      toast({ title: "Date Unavailable", description: "The artist marked this day as unavailable.", variant: "destructive" });
      return;
    }
    // Start and end time are required: they go into the offer and the contract
    if (!form.startTime || !form.endTime) {
      toast({ title: "Invalid Time", description: "Choose the start and end time of the event.", variant: "destructive" });
      return;
    }
    // Overnight events (end time before start time) end the next day automatically
    const endDate = resolveBookingEndDate(selectedDate, form);
    const sameDay = endDate.toDateString() === selectedDate.toDateString();

    const ev = getEventForDate(selectedDate);
    if (ev && (ev.status === "busy" || ev.status === "booked")) {
      const slots = extractAllTimeSlotsFromNotes(ev.notes);
      if (slots.length === 0) {
        toast({ title: "Date Unavailable", description: "This date is fully booked.", variant: "destructive" });
        return;
      }
      if (findSlotClash(selectedDate, form, slots)) {
        toast({
          title: "Time Slot Conflict",
          description: "This time overlaps with a booking. Choose another time.",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const startStr = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeInfo = sameDay
        ? `Time: ${form.startTime} - ${form.endTime}\n`
        : `Time: ${startStr} ${form.startTime} - ${endStr} ${form.endTime}\n`;
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
      <div className="min-h-screen bg-background md:ml-[316px] lg:ml-[356px]">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="h-64 animate-pulse bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const selectedEvent = selectedDate ? getEventForDate(selectedDate) : null;
  const selectedSlots = selectedEvent ? extractAllTimeSlotsFromNotes(selectedEvent.notes) : [];
  const selectedBlocked = !!selectedDate && isBlockedDate(selectedDate);
  const selectedFullyBooked = !!selectedDate && isBusyDate(selectedDate) && isDayFullyBooked(selectedSlots);

  return (
    <div className="min-h-screen bg-background md:ml-[316px] lg:ml-[356px]">
      <Navigation mobileTitle="Calendar" mobileBackPath={`/artist/${id}`} hideMobileNotifications />
      <div className="container mx-auto px-4 pt-20 md:pt-6 py-6 pb-32 md:pb-12 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => goBack(navigate, `/artist/${id}`)} className="mb-4 -ml-2 hidden md:inline-flex">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <h1 className="mb-4 hidden text-3xl font-bold tracking-[-0.02em] text-foreground md:block md:text-4xl">Calendar</h1>
        <Link to={`/artist/${artist.id}`} className="group mb-6 flex w-fit max-w-full items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={artist.avatar_url || undefined} />
            <AvatarFallback>{artist.stage_name?.[0]}</AvatarFallback>
          </Avatar>
          <span className="truncate text-base font-bold text-foreground group-hover:underline notranslate" data-user-content="true" data-no-translate="true" translate="no">
            {artist.stage_name}
          </span>
        </Link>

        {/* Calendar Section: the same calendar as on the profile and in the artist's dashboard */}
        <div className="mb-4 rounded-lg bg-foreground/[0.05] p-4 md:p-6">
          <ArtistAvailabilityCalendar
            large
            selected={selectedDate}
            onSelect={setSelectedDate}
            busyDates={busyDates.filter((d) => !hasFreeHours(d))}
            partialDates={busyDates.filter((d) => hasFreeHours(d))}
            blockedDates={blockedDates}
            disablePastDates
          />
        </div>

        {/* Booking form */}
        {selectedDate && <div className="rounded-lg bg-foreground/[0.05] p-4 md:p-6">
          {selectedBlocked ? (
            <p className="text-sm text-muted-foreground">The artist has marked this day as unavailable. Choose another date.</p>
          ) : selectedFullyBooked ? (
            <p className="text-sm text-muted-foreground">The artist is booked for the whole day. Choose another date.</p>
          ) : (
            <>
            <h2 className="mb-4 text-xl font-bold tracking-[-0.01em] text-foreground">Booking request</h2>
            <BookingRequestFields
              date={selectedDate}
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              submitting={submitting}
              busySlots={isBusyDate(selectedDate) ? selectedSlots : []}
            />
            </>
          )}
        </div>}
      </div>
    </div>
  );
};

export default BookArtist;
