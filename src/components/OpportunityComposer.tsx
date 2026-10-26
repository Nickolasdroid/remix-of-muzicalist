import { ReactNode, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, ChevronDown, Info, Loader2, Megaphone, Moon, Pencil, RotateCcw, X } from "lucide-react";
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


const MISSING_LABEL: Record<string, [en: string, ro: string]> = {
  seeking: ["who you're looking for", "pe cine cauți"],
  instrument: ["instrument", "instrumentul"],
  eventType: ["event type", "tipul evenimentului"],
  date: ["date", "data"],
  place: ["place", "localitatea"],
  times: ["hours", "intervalul orar"],
  title: ["title", "titlul"],
};

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
}

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={cn(
      "rounded-full border px-3 py-1.5 text-sm transition-colors",
      on
        ? "border-accent bg-accent/15 text-accent font-medium"
        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
    )}
  >
    {children}
  </button>
);

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const amountOrNull = (s: string) => {
  const n = Number(s.replace(",", "."));
  return s.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/**
 * "New announcement": structured opportunity.
 *   Looking for an artist (event) -> artists answer with a priced offer
 *   Looking for a collaborator (artists only) -> answered by message
 */
const OpportunityComposer = ({ open, onOpenChange, isArtist, meta, blockedReason, onPublished }: OpportunityComposerProps) => {
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
  const [editingTitle, setEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setSeeking(null);
    setRoleDetail("");
    setOtherInstrument(false);
    setEventType("");
    setEventOn(undefined);
    setEventEndOn(undefined);
    setPlaceLabel("");
    setStartTime("");
    setEndTime("");
    setBudgetMode("range");
    setBudgetRange(false);
    setBudgetMin("");
    setBudgetMax("");
    setCurrency("RON");
    setTitle("");
    setTitleEdited(false);
    setEditingTitle(false);
  }, [open]);

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
  const budgetInvalid = budgetReversed || budgetTooWide;
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
  const canSubmit = missing.length === 0 && !budgetInvalid && !timesHalf && !saving && !blockedReason;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePublish = async () => {
    if (!canSubmit || !seeking) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const budget = {
        budget_mode: budgetMode,
        budget_min: budgetMode === "range" ? minN : null,
        budget_max: budgetMode === "range" ? maxN : null,
        budget_currency: budgetMode === "range" ? currency : null,
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

      const { data, error } = await (supabase as any).from("announcements").insert(row).select("id").single();
      if (error) throw error;
      await onPublished({ id: data.id, kind });
      toast({ title: "Announcement published" });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Announcement not published",
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

  const placeText = formatPlace(place.city, place.county);
  const previewLine = [
    eventOn ? (multiDay ? `${dayLabel(eventOn)} – ${dayLabel(eventEndOn!)}` : dayLabel(eventOn)) : null,
    startTime && endTime ? `${startTime} – ${endTime}` : null,
    placeText || null,
  ]
    .filter(Boolean)
    .join(" · ");
  const smallLabel = "flex h-5 items-center gap-1 text-xs font-normal text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] w-[calc(100%-1.5rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header, as in the booking request */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 pr-12">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-accent/60 bg-accent/10 text-accent">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[17px] font-semibold leading-tight">
              {isGig ? "Looking for an artist" : "Looking for a collaborator"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <span>{isGig ? "You receive priced offers from available artists." : "Find musicians for your event."}</span>
                {meta && <div className="mt-0.5 flex items-center gap-1 text-xs">{meta}</div>}
              </div>
            </DialogDescription>
          </div>
        </div>

        {/* Remount per kind: the page translator keeps translations per text node,
            so reused nodes would keep the other form's labels */}
        <div key={kind} className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Who */}
          <div className="space-y-1.5">
            <Label>{isGig ? "What are you looking for" : "Who are you looking for"}</Label>
            <div className="flex flex-wrap gap-1.5">
              {seekingOptions.map((s) => (
                <Chip
                  key={s}
                  on={seeking === s}
                  onClick={() => {
                    setSeeking(s);
                    if (s !== "Instrumentalist") {
                      setRoleDetail("");
                      setOtherInstrument(false);
                    }
                  }}
                >
                  {SEEKING_LABEL[s]}
                </Chip>
              ))}
            </div>
          </div>

          {showRole && (
            <div className="space-y-1.5">
              <Label htmlFor="opp-role">Instrument</Label>
              <Select
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
                <SelectTrigger id="opp-role">
                  <SelectValue placeholder="Choose the instrument" />
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
                  maxLength={80}
                  value={roleDetail}
                  onChange={(e) => setRoleDetail(e.target.value)}
                  placeholder="Which instrument?"
                />
              )}
            </div>
          )}

          {/* When and where: the same card as in the booking request */}
          <div className="rounded-xl bg-card px-3.5 py-3 space-y-3">
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button id="opp-date" type="button" className="flex w-full items-center gap-3 text-left">
                  <CalendarDays className="h-[18px] w-[18px] shrink-0 text-accent" />
                  {longDate ? (
                    <span className="flex-1 text-[15px] text-foreground notranslate" translate="no">
                      {longDate}
                      {multiDay && <> – {dayLabel(eventEndOn!)}</>}
                    </span>
                  ) : (
                    <span className="flex-1 text-[15px] text-muted-foreground">Choose a date</span>
                  )}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="opp-start" className={smallLabel}>
                  <span>{multiDay ? "Starts" : "From"}</span>
                </Label>
                <TimeSelector id="opp-start" value={startTime} onChange={setStartTime} placeholder="--:--" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="opp-end" className={smallLabel}>
                  <span>{multiDay ? "Ends" : "Until"}</span>
                </Label>
                <TimeSelector id="opp-end" value={endTime} onChange={setEndTime} placeholder="--:--" />
              </div>
            </div>

            {timesHalf ? (
              <p className="text-xs text-destructive">Choose both the start and the end time.</p>
            ) : overnight ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Moon className="h-3.5 w-3.5 shrink-0" />
                <span>Ends the next day</span>
              </p>
            ) : null}

            {multiDay ? (
              <div className="rounded-lg border border-accent/30 bg-accent/[0.07] px-3 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="font-semibold text-foreground">
                    <span>Multi-day event</span>
                    <span className="notranslate" translate="no"> · {dayCount}</span> <span>days</span>
                  </span>
                  <button
                    type="button"
                    className="ml-auto inline-flex shrink-0 whitespace-nowrap items-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setEventEndOn(undefined)}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Single day</span>
                  </button>
                </div>
                <p className="mt-1.5 pl-[22px] text-muted-foreground notranslate tabular-nums" translate="no">
                  {dayLabel(eventOn!)}, {startTime || "--:--"} → {dayLabel(eventEndOn!)}, {endTime || "--:--"}
                </p>
                <Popover open={endDayOpen} onOpenChange={setEndDayOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className="mt-1.5 pl-[22px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
                      Change the end day
                    </button>
                  </PopoverTrigger>
                  {endDayPicker}
                </Popover>
              </div>
            ) : (
              eventOn &&
              startTime &&
              endTime && (
                <Popover open={endDayOpen} onOpenChange={setEndDayOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                    >
                      <CalendarRange className="h-3.5 w-3.5" />
                      <span>Spans several days? Choose the end day</span>
                    </button>
                  </PopoverTrigger>
                  {endDayPicker}
                </Popover>
              )
            )}

            <div className="space-y-1">
              <Label htmlFor="opp-place" className={smallLabel}>
                <span>Locality</span>
              </Label>
              <LocationAutocomplete
                id="opp-place"
                value={placeLabel}
                onChange={setPlaceLabel}
                country="Romania"
                placeholder="Search a town..."
              />
            </div>
          </div>

          {/* Event type */}
          <div className="space-y-1.5">
            <Label htmlFor="opp-event-type">Event type</Label>
            <EventTypePicker id="opp-event-type" value={eventType} onChange={setEventType} triggerClassName="rounded-md" />
          </div>

          {/* Money */}
          <div className="space-y-1.5">
            <Label>
              {isGig ? "Budget" : "Fee"} <span className="font-normal text-muted-foreground">(<span>optional</span>)</span>
            </Label>
            {budgetMode === "range" ? (
              <div className={cn("grid gap-2", budgetRange ? "grid-cols-[1fr_1fr_88px]" : "grid-cols-[1fr_88px]")}>
                <Input
                  inputMode="decimal"
                  aria-label={budgetRange ? "Minimum" : "Amount"}
                  placeholder={budgetRange ? "Min." : "Amount"}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
                />
                {budgetRange && (
                  <Input
                    inputMode="decimal"
                    aria-label="Maximum"
                    placeholder="Max."
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
                  />
                )}
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger aria-label="Currency">
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
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {budgetMode === "range" && (
                <Chip
                  on={budgetRange}
                  onClick={() => {
                    setBudgetRange(!budgetRange);
                    setBudgetMax("");
                  }}
                >
                  {budgetRange ? "Single amount" : "+ Range"}
                </Chip>
              )}
              <Chip on={budgetMode === "negotiable"} onClick={() => setBudgetMode(budgetMode === "negotiable" ? "range" : "negotiable")}>
                Negotiable
              </Chip>
            </div>
            {budgetReversed && <p className="text-xs text-destructive">The minimum budget can't be higher than the maximum.</p>}
            {budgetTooWide && (
              <p className="text-xs text-destructive">The maximum can be at most 20 times the minimum. Check the amounts.</p>
            )}
          </div>

          {/* How it will appear (the title, editable) */}
          <div className="rounded-xl border border-dashed border-accent/40 bg-accent/[0.04] px-3.5 py-3">
            <p className="mb-1 text-xs text-muted-foreground">How it will appear</p>
            {editingTitle ? (
              <Input
                id="opp-title"
                autoFocus
                maxLength={120}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleEdited(true);
                }}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                className="h-9 text-[15px] font-semibold notranslate"
                translate="no"
              />
            ) : (
              <div className="flex items-start gap-2">
                <p
                  className={cn(
                    "min-w-0 flex-1 leading-snug",
                    title ? "text-[15px] font-semibold text-foreground notranslate" : "text-sm text-muted-foreground",
                  )}
                  translate={title ? "no" : undefined}
                >
                  {title || "Choose who you're looking for and the event type"}
                </p>
                {title && (
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
            )}
            {previewLine && (
              <p className="mt-1 text-[12.5px] text-muted-foreground notranslate tabular-nums" translate="no">
                {previewLine}
              </p>
            )}
            {titleEdited && suggestedTitle && title !== suggestedTitle && !editingTitle && (
              <button
                type="button"
                onClick={() => setTitleEdited(false)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Use the suggested title
              </button>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-card px-3 py-2.5 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {isGig
                ? "Artists reply with a price offer. The announcement stays open until the event date or until you accept one."
                : "Musicians answer you by message. It uses 1 announcement from your plan."}
            </span>
          </div>

          <Button
            onClick={handlePublish}
            disabled={!canSubmit}
            className="w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publish announcement
          </Button>
          {blockedReason ? (
            <p className="-mt-2 text-center text-xs text-destructive">{blockedReason}</p>
          ) : (
            missing.length > 0 && (
              <p className="-mt-2 text-center text-xs text-muted-foreground">
                <span>Still to fill in:</span>{" "}
                <span className="notranslate" translate="no">
                  {missing.map((m) => MISSING_LABEL[m][lang.startsWith("ro") ? 1 : 0]).join(", ")}
                </span>
              </p>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpportunityComposer;
