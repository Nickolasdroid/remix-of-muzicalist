import { ReactNode, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, Loader2, Moon, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EventTypePicker from "@/components/EventTypePicker";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import TimeSelector from "@/components/TimeSelector";
import { INSTRUMENTS } from "@/components/InstrumentSelector";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import MobileComposerHeader, { FULLSCREEN_ON_MOBILE } from "@/components/composer/MobileComposerHeader";
import DiscardDraftDialog from "@/components/composer/DiscardDraftDialog";
import { useCloseOnBack } from "@/hooks/useCloseOnBack";
import {
  BudgetMode,
  COLLAB_SEEKING,
  CollabType,
  GIG_SEEKING,
  OpportunityKind,
  OpportunitySeeking,
  SEEKING_LABEL,
  buildOpportunityTitle,
  formatOpportunityBudget,
  formatPlace,
  instrumentLabel,
  opportunityErrorText,
  parseRomanianPlace,
} from "@/lib/opportunities";



interface OpportunityComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Artists can also look for collaborators; organizers only post events. */
  isArtist: boolean;
  /** Usage pills under the title */
  meta?: ReactNode;
  /** Blocks publishing (e.g. quota used) with this reason under the button */
  blockedReason?: string | null;
  onPublished: (announcement: { id: string; kind: OpportunityKind }) => void | Promise<void>;
  /**
   * Edit an existing event / collaboration instead of creating one. When it already
   * got offers or messages (lockCore), what is sought and the date can't change.
   */
  editing?: { row: any; lockCore: boolean } | null;
  onUpdated?: (id: string) => void | Promise<void>;
}


const MAX_AMOUNT = 100_000;

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const amountOrNull = (s: string) => {
  const n = Number(s.replace(",", "."));
  return s.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/**
 * "New event" (organizers: artists answer with a priced offer) or
 * "New collaboration" (artists: answered by message). Same names as the feed filters and card tags.
 */
const OpportunityComposer = ({ open, onOpenChange, isArtist, meta, blockedReason, onPublished, editing, onUpdated }: OpportunityComposerProps) => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const lang = i18n.language || i18n.resolvedLanguage || "ro";
  const locale = lang.startsWith("ro") ? "ro-RO" : "en-GB";

  // The account decides the kind: organizers look for an artist (priced offers),
  // artists look for a collaborator (answered by message)
  const kind: OpportunityKind = isArtist ? "collab" : "gig";
  const [seeking, setSeeking] = useState<OpportunitySeeking | null>(null);
  const [roleDetail, setRoleDetail] = useState("");
  const [otherInstrument, setOtherInstrument] = useState(false);
  // Collaborations are always for one event (a stand-in or a band place is said in the title)
  const collabType: CollabType = "one_event";
  const [eventType, setEventType] = useState("");
  const [eventOn, setEventOn] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  // Last day of an event that lasts several days (undefined = a single day)
  const [eventEndOn, setEventEndOn] = useState<Date | undefined>();
  const [endDayOpen, setEndDayOpen] = useState(false);
  const [placeLabel, setPlaceLabel] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("range");
  // One amount by default; "+ range" shows min and max
  const [budgetRange, setBudgetRange] = useState(false);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fresh form every time the dialog opens (or the row being edited)
  const editRow = editing?.row ?? null;
  const lockCore = !!editing?.lockCore;
  useEffect(() => {
    if (!open) return;
    const ymd = (v?: string | null) => {
      if (!v) return undefined;
      const [y, m, d] = v.split("-").map(Number);
      return new Date(y, m - 1, d);
    };
    const hm = (v?: string | null) => (v ? String(v).slice(0, 5) : "");
    const role = editRow?.role_detail || "";
    setSeeking((editRow?.seeking as OpportunitySeeking) ?? null);
    setRoleDetail(role);
    setOtherInstrument(!!role && !(INSTRUMENTS as readonly string[]).includes(role));
    setEventType(editRow?.event_type || "");
    setEventOn(ymd(editRow?.event_on));
    setEventEndOn(editRow?.event_end_on && editRow.event_end_on > editRow.event_on ? ymd(editRow.event_end_on) : undefined);
    setPlaceLabel(editRow ? formatPlace(editRow.city, editRow.county) : "");
    setStartTime(hm(editRow?.start_time));
    setEndTime(hm(editRow?.end_time));
    setBudgetMode("range");
    setBudgetRange(false);
    setBudgetMin(editRow?.budget_min != null ? String(Number(editRow.budget_min)) : "");
    setBudgetMax("");
    setCurrency(editRow?.budget_currency || "RON");
    setTitle("");
    setTitleEdited(false);
  }, [open, editRow]);

  const place = useMemo(() => parseRomanianPlace(placeLabel), [placeLabel]);
  const isGig = kind === "gig";
  const seekingOptions = isGig ? GIG_SEEKING : COLLAB_SEEKING;
  // The instrument is asked only for instrumentalists
  const showRole = seeking === "Instrumentalist";
  // Every announcement is for an event: type, date, place and hours
  const showEventType = true;
  const needsSchedule = true;
  const eventOnYmd = eventOn ? toYMD(eventOn) : null;

  // Suggest a title only once it can say something useful ("Solist pentru nuntă", not "Solist pentru un eveniment")
  const titleReady =
    !!seeking &&
    (!showRole || !!roleDetail.trim()) &&
    (showEventType ? !!eventType.trim() : true);
  const suggestedTitle = !titleReady ? "" : buildOpportunityTitle(
    {
      kind,
      seeking,
      roleDetail: showRole ? roleDetail : null,
      eventType: showEventType ? eventType : null,
      city: place.city,
      county: place.county,
      eventOn: eventOnYmd,
      collabType: isGig ? null : collabType,
    },
    lang,
  );

  useEffect(() => {
    if (!titleEdited) setTitle(suggestedTitle);
  }, [suggestedTitle, titleEdited]);

  const minN = amountOrNull(budgetMin);
  // A single amount is stored as min = max
  const maxN = budgetRange ? amountOrNull(budgetMax) : minN;
  const budgetReversed = budgetMode === "range" && minN != null && maxN != null && minN > maxN;
  // A range that wide is almost always a typo (e.g. 1.800 typed as 180.000)
  const budgetTooWide = budgetMode === "range" && !!minN && maxN != null && maxN > minN * 20;
  // A realistic ceiling for one event (also keeps the value inside the database column)
  const amountTooHigh = minN != null && minN > MAX_AMOUNT;
  const budgetInvalid = budgetReversed || budgetTooWide || amountTooHigh;
  const timesHalf = !!startTime !== !!endTime;
  const multiDay = !!eventOn && !!eventEndOn && eventEndOn > eventOn;
  const overnight = !multiDay && !!startTime && !!endTime && endTime <= startTime;
  const dayCount = multiDay
    ? Math.round((new Date(eventEndOn!).setHours(0, 0, 0, 0) - new Date(eventOn!).setHours(0, 0, 0, 0)) / 86400000) + 1
    : 1;

  const missing: string[] = [];
  // Same order as the form
  if (!seeking) missing.push("seeking");
  if (showRole && !roleDetail.trim()) missing.push("instrument");
  if (showEventType && !eventType.trim()) missing.push("eventType");
  if (needsSchedule && !eventOn) missing.push("date");
  if (needsSchedule && (!startTime || !endTime)) missing.push("times");
  if (!place.county) missing.push("place");
  if (title.trim().length < 3) missing.push("title");
  const canSubmitBase = missing.length === 0 && !budgetInvalid && !timesHalf && !saving && (!!editRow || !blockedReason);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Full-screen on phones: Back / Cancel close it, asking first when something was filled in
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const snapshot = [seeking, roleDetail.trim(), eventType.trim(), eventOnYmd, eventEndOn ? toYMD(eventEndOn) : null, placeLabel.trim(), startTime, endTime, budgetMin, currency].join("|");
  const editSnapshot = editRow
    ? [
        editRow.seeking ?? null,
        (editRow.role_detail || "").trim(),
        (editRow.event_type || "").trim(),
        editRow.event_on ?? null,
        editRow.event_end_on && editRow.event_end_on > editRow.event_on ? editRow.event_end_on : null,
        formatPlace(editRow.city, editRow.county),
        editRow.start_time ? String(editRow.start_time).slice(0, 5) : "",
        editRow.end_time ? String(editRow.end_time).slice(0, 5) : "",
        editRow.budget_min != null ? String(Number(editRow.budget_min)) : "",
        editRow.budget_currency || "RON",
      ].join("|")
    : null;
  const isDirty = editRow
    ? snapshot !== editSnapshot
    : !!(seeking || roleDetail.trim() || eventType.trim() || eventOn || placeLabel.trim() || startTime || endTime || budgetMin || budgetMax || (titleEdited && title.trim()));
  // Editing: Save only once something changed
  const canSubmit = canSubmitBase && (!editRow || isDirty);
  const releaseHistory = useCloseOnBack(open, () => {
    if (saving) return false;
    if (isDirty) {
      setConfirmDiscard(true);
      return false;
    }
    onOpenChange(false);
    return true;
  });
  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (saving) return;
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    releaseHistory();
    onOpenChange(false);
  };

  const handlePublish = async () => {
    if (!canSubmit || !seeking) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const budget = {
        // One amount, or negotiable when left empty
        budget_mode: minN != null ? "range" : "negotiable",
        budget_min: minN,
        budget_max: minN,
        budget_currency: minN != null ? currency : null,
      };
      const row = {
        profile_id: user.id,
        title: title.trim(),
        date: toYMD(new Date()),
        description: "",
        is_premium: false,
        kind,
        seeking,
        role_detail: showRole ? roleDetail.trim() || null : null,
        collab_type: isGig ? null : collabType,
        event_type: showEventType ? eventType.trim() : null,
        county: place.county,
        city: place.city,
        event_on: eventOnYmd,
        event_end_on: needsSchedule && multiDay ? toYMD(eventEndOn!) : null,
        start_time: needsSchedule && startTime && endTime ? startTime : null,
        end_time: needsSchedule && startTime && endTime ? endTime : null,
        ...budget,
        // Legacy columns, still read by older views of announcements
        location: formatPlace(place.city, place.county) || null,
        event_date: eventOnYmd,
        budget: formatOpportunityBudget(budget, lang),
      };

      if (editRow) {
        const { profile_id: _p, date: _d, is_premium: _i, kind: _k, ...changes } = row;
        // Answers stay valid: once offers / messages came in, the role and the date are kept
        const patch: Record<string, unknown> = lockCore
          ? (({ seeking: _s, role_detail: _r, event_on: _e, event_end_on: _ee, event_date: _ed, ...rest }) => rest)(changes as any)
          : changes;
        if (!lockCore && eventOnYmd) {
          // Takes answers until the night after the last day
          const last = multiDay ? eventEndOn! : eventOn!;
          const exp = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
          patch.expires_at = exp.toISOString();
        }
        const { error } = await (supabase as any).from("announcements").update(patch).eq("id", editRow.id);
        if (error) throw error;
        await onUpdated?.(editRow.id);
        toast({ title: isGig ? "Event updated" : "Collaboration updated" });
        releaseHistory();
        onOpenChange(false);
        return;
      }
      const { data, error } = await (supabase as any).from("announcements").insert(row).select("id").single();
      if (error) throw error;
      await onPublished({ id: data.id, kind });
      toast({ title: isGig ? "Event published" : "Collaboration published" });
      releaseHistory();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: editRow ? "Changes not saved" : isGig ? "Event not published" : "Collaboration not published",
        description: opportunityErrorText(error) || (error as Error)?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const longDate = eventOn
    ? (() => {
        const s = eventOn.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        return s.charAt(0).toUpperCase() + s.slice(1);
      })()
    : null;

  const dayLabel = (d: Date) => {
    const t = d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  const endDayPicker = (
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={eventEndOn}
        defaultMonth={eventEndOn || eventOn}
        onSelect={(d) => {
          setEventEndOn(d || undefined);
          setEndDayOpen(false);
        }}
        disabled={(d) => !eventOn || d <= eventOn || d.getTime() > eventOn.getTime() + 30 * 86400000}
        initialFocus
        className="p-3 pointer-events-auto"
      />
    </PopoverContent>
  );

  const FIELD = "h-11 rounded-lg bg-card data-[placeholder]:text-muted-foreground";
  const labelCls = "text-[13.5px] font-semibold text-foreground";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} manageHistory={false}>
      <DialogContent className={cn("max-w-[440px] w-[calc(100%-1.5rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col", FULLSCREEN_ON_MOBILE)}>
        <MobileComposerHeader
          title={editRow ? (isGig ? "Edit event" : "Edit collaboration") : isGig ? "New event" : "New collaboration"}
          onCancel={() => handleOpenChange(false)}
          actionLabel={editRow ? "Save" : "Publish"}
          onAction={handlePublish}
          disabled={!canSubmit}
          busy={saving}
        />
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 pr-12 max-md:sr-only">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/60 bg-accent/10 text-accent">
            {isGig ? <CalendarDays className="h-5 w-5" /> : <Users className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[17px] font-semibold leading-tight">
              {editRow ? (isGig ? "Edit event" : "Edit collaboration") : isGig ? "New event" : "New collaboration"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <span>{isGig ? "Looking for an artist. Available artists send you priced offers." : "Looking for musicians to play with. They answer by message."}</span>
                {meta && <div className="mt-0.5 flex items-center gap-1 text-xs text-accent">{meta}</div>}
              </div>
            </DialogDescription>
          </div>
        </div>

        {/* Every field the same: label above, same height, same spacing */}
        <div key={kind} className="flex-1 overflow-y-auto px-5 pt-2 max-md:pt-4 pb-5 max-md:pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-3.5">
          {lockCore && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {isGig
                ? "Offers already came in, so what you're looking for and the date can't change."
                : "Messages already came in, so who you're looking for and the date can't change."}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="opp-seeking" className={labelCls}>
              {isGig ? "What are you looking for" : "Who are you looking for"}
            </Label>
            <Select
              disabled={lockCore}
              value={seeking ?? undefined}
              onValueChange={(v) => {
                setSeeking(v as OpportunitySeeking);
                if (v !== "Instrumentalist") {
                  setRoleDetail("");
                  setOtherInstrument(false);
                }
              }}
            >
              <SelectTrigger id="opp-seeking" className={FIELD}>
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                {seekingOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {SEEKING_LABEL[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showRole && (
            <div className="space-y-1.5">
              <Label htmlFor="opp-role" className={labelCls}>
                Instrument
              </Label>
              <Select
                disabled={lockCore}
                value={otherInstrument ? "__other" : roleDetail || undefined}
                onValueChange={(v) => {
                  if (v === "__other") {
                    setOtherInstrument(true);
                    setRoleDetail("");
                  } else {
                    setOtherInstrument(false);
                    setRoleDetail(v);
                  }
                }}
              >
                <SelectTrigger id="opp-role" className={FIELD}>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {INSTRUMENTS.map((i) => (
                    <SelectItem key={i} value={i}>
                      <span className="notranslate" translate="no">
                        {instrumentLabel(i, lang)}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="__other">Other</SelectItem>
                </SelectContent>
              </Select>
              {otherInstrument && (
                <Input
                  autoFocus
                  disabled={lockCore}
                  maxLength={80}
                  value={roleDetail}
                  onChange={(e) => setRoleDetail(e.target.value)}
                  placeholder="Which instrument?"
                  className={FIELD}
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="opp-event-type" className={labelCls}>
              Event type
            </Label>
            <EventTypePicker id="opp-event-type" value={eventType} onChange={setEventType} triggerClassName={FIELD} otherInputClassName={FIELD} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-date" className={labelCls}>
              Date
            </Label>
            <Popover open={dateOpen} onOpenChange={(o) => !lockCore && setDateOpen(o)}>
              <PopoverTrigger asChild>
                <button
                  id="opp-date"
                  type="button"
                  disabled={lockCore}
                  className={cn(FIELD, "flex w-full items-center gap-2.5 border border-input px-3 text-left text-sm")}
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
                  {longDate ? (
                    <span className="truncate notranslate" translate="no">
                      {longDate}
                      {multiDay && <> – {dayLabel(eventEndOn!)}</>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Choose a date</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventOn}
                  onSelect={(d) => {
                    setEventOn(d || undefined);
                    if (!d || (eventEndOn && eventEndOn <= d)) setEventEndOn(undefined);
                    setDateOpen(false);
                  }}
                  disabled={(d) => d < today}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="opp-start" className={labelCls}>
                {multiDay ? "Starts" : "From"}
              </Label>
              <TimeSelector id="opp-start" value={startTime} onChange={setStartTime} placeholder="--:--" triggerClassName={cn(FIELD, "w-full")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-end" className={labelCls}>
                {multiDay ? "Ends" : "Until"}
              </Label>
              <TimeSelector id="opp-end" value={endTime} onChange={setEndTime} placeholder="--:--" triggerClassName={cn(FIELD, "w-full")} />
            </div>
          </div>

          {(timesHalf || overnight || multiDay || (eventOn && startTime && endTime)) && (
            <div className="-mt-1 space-y-1 text-xs text-muted-foreground">
              {timesHalf && <p className="text-destructive">Choose both the start and the end time.</p>}
              {overnight && (
                <p className="flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 shrink-0" />
                  <span>Ends the next day</span>
                </p>
              )}
              {lockCore ? null : multiDay ? (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <CalendarRange className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="text-foreground">
                    <span>Multi-day event</span>
                    <span className="notranslate" translate="no"> · {dayCount}</span> <span>days</span>
                  </span>
                  <Popover open={endDayOpen} onOpenChange={setEndDayOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="underline-offset-2 hover:text-foreground hover:underline">
                        Change the end day
                      </button>
                    </PopoverTrigger>
                    {endDayPicker}
                  </Popover>
                  <button type="button" className="hover:text-foreground hover:underline underline-offset-2" onClick={() => setEventEndOn(undefined)}>
                    Single day
                  </button>
                </p>
              ) : (
                eventOn &&
                startTime &&
                endTime && (
                  <Popover open={endDayOpen} onOpenChange={setEndDayOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="flex items-center gap-1.5 hover:text-foreground hover:underline underline-offset-2">
                        <CalendarRange className="h-3.5 w-3.5" />
                        <span>Spans several days? Choose the end day</span>
                      </button>
                    </PopoverTrigger>
                    {endDayPicker}
                  </Popover>
                )
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="opp-place" className={labelCls}>
              Locality
            </Label>
            <LocationAutocomplete
              id="opp-place"
              value={placeLabel}
              onChange={setPlaceLabel}
              country="Romania"
              placeholder="Search a town..."
              className="[&_input]:h-11 [&_input]:rounded-lg [&_input]:bg-card [&_.lucide-map-pin]:text-accent"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="opp-amount" className={labelCls}>
                {isGig ? "Budget" : "Fee"}
              </Label>
              <span className="text-xs text-muted-foreground">optional</span>
            </div>
            <div className="grid grid-cols-[1fr_92px] gap-2.5">
              <Input
                id="opp-amount"
                inputMode="decimal"
                placeholder="Amount"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
                className={FIELD}
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className={FIELD} aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {amountTooHigh && (
              <p className="text-xs text-destructive">
                <span>The amount can be at most</span>{" "}
                <span className="notranslate" translate="no">{MAX_AMOUNT.toLocaleString(locale)}</span>.
              </p>
            )}
          </div>

          <div className="pt-1.5 max-md:hidden">
            <Button
              onClick={handlePublish}
              disabled={!canSubmit}
              className="h-12 w-full rounded-xl bg-accent text-[15px] font-bold text-accent-foreground hover:bg-accent/90"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editRow ? "Save" : "Publish"}
            </Button>
          </div>

          {blockedReason && <p className="text-center text-xs text-destructive">{blockedReason}</p>}
        </div>
      </DialogContent>
      <DiscardDraftDialog
        open={confirmDiscard}
        title={editRow ? "Discard your changes?" : isGig ? "Discard this event?" : "Discard this collaboration?"}
        onKeep={() => setConfirmDiscard(false)}
        onDiscard={() => {
          setConfirmDiscard(false);
          releaseHistory();
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
};

export default OpportunityComposer;
