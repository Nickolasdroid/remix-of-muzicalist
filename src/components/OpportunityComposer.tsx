import { ReactNode, useEffect, useMemo, useState } from "react";
import { CalendarDays, Info, Loader2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreationModalShell, FieldLabel } from "@/components/dashboard/CreationModal";
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
  COLLAB_TYPE_LABEL,
  COLLAB_TYPES,
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

const DETAILS_MAX = 1000;

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

  const [kind, setKind] = useState<OpportunityKind>("gig");
  const [seeking, setSeeking] = useState<OpportunitySeeking | null>(null);
  const [roleDetail, setRoleDetail] = useState("");
  const [otherInstrument, setOtherInstrument] = useState(false);
  const [collabType, setCollabType] = useState<CollabType>("one_event");
  const [eventType, setEventType] = useState("");
  const [eventOn, setEventOn] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [placeLabel, setPlaceLabel] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("range");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [details, setDetails] = useState("");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setKind("gig");
    setSeeking(null);
    setRoleDetail("");
    setOtherInstrument(false);
    setCollabType("one_event");
    setEventType("");
    setEventOn(undefined);
    setPlaceLabel("");
    setStartTime("");
    setEndTime("");
    setBudgetMode("range");
    setBudgetMin("");
    setBudgetMax("");
    setCurrency("RON");
    setDetails("");
    setTitle("");
    setTitleEdited(false);
  }, [open]);

  const place = useMemo(() => parseRomanianPlace(placeLabel), [placeLabel]);
  const isGig = kind === "gig";
  const seekingOptions = isGig ? GIG_SEEKING : COLLAB_SEEKING;
  // The instrument is asked only for instrumentalists
  const showRole = seeking === "Instrumentalist";
  // Event type: always for events; for collaborations unless it's a permanent place in the band
  const showEventType = isGig || collabType !== "permanent";
  const eventOnYmd = eventOn ? toYMD(eventOn) : null;

  const suggestedTitle = buildOpportunityTitle(
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

  const switchKind = (k: OpportunityKind) => {
    setKind(k);
    const options = k === "gig" ? GIG_SEEKING : COLLAB_SEEKING;
    if (seeking && !options.includes(seeking)) setSeeking(null);
  };

  const minN = amountOrNull(budgetMin);
  const maxN = amountOrNull(budgetMax);
  const budgetInvalid = budgetMode === "range" && minN != null && maxN != null && minN > maxN;
  const timesHalf = !!startTime !== !!endTime;

  const missing: string[] = [];
  if (!seeking) missing.push("seeking");
  if (!place.county) missing.push("place");
  if (showEventType && !eventType.trim()) missing.push("eventType");
  if (showRole && !roleDetail.trim()) missing.push("instrument");
  if (isGig && !eventOn) missing.push("date");
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
        description: details.trim(),
        is_premium: false,
        kind,
        seeking,
        role_detail: showRole ? roleDetail.trim() || null : null,
        collab_type: isGig ? null : collabType,
        event_type: showEventType ? eventType.trim() : null,
        county: place.county,
        city: place.city,
        event_on: eventOnYmd,
        start_time: startTime && endTime ? startTime : null,
        end_time: startTime && endTime ? endTime : null,
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

  const datePicker = (
    <Popover open={dateOpen} onOpenChange={setDateOpen}>
      <PopoverTrigger asChild>
        <button
          id="opp-date"
          type="button"
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {longDate ? (
            <span className="truncate notranslate" translate="no">
              {longDate}
            </span>
          ) : (
            <span className="text-muted-foreground">Choose a date</span>
          )}
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={eventOn}
          onSelect={(d) => {
            setEventOn(d || undefined);
            setDateOpen(false);
          }}
          disabled={(d) => d < today}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  const placePicker = (
    <LocationAutocomplete
      id="opp-place"
      value={placeLabel}
      onChange={setPlaceLabel}
      country="Romania"
      placeholder="Search a town..."
      className="[&_input]:h-10 [&_input]:rounded-lg"
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CreationModalShell
        title="New announcement"
        bodyClassName="space-y-5 py-4"
        meta={
          <div className="w-full space-y-2">
            <p className="text-sm text-muted-foreground">
              {isGig ? "You receive priced offers from available artists." : "Find musicians for your projects."}
            </p>
            {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        }
        footer={
          <div className="space-y-2">
            <Button
              onClick={handlePublish}
              disabled={!canSubmit}
              className="w-full h-11 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish announcement
            </Button>
            {blockedReason && <p className="text-xs text-center text-destructive">{blockedReason}</p>}
          </div>
        }
      >
        {isArtist && (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-card p-1" role="tablist">
            {(["gig", "collab"] as OpportunityKind[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                onClick={() => switchKind(k)}
                className={cn(
                  "rounded-lg px-2 py-2 text-sm leading-tight transition-colors",
                  kind === k
                    ? "bg-accent/15 text-accent font-semibold ring-1 ring-accent/40"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {k === "gig" ? "Looking for an artist" : "Looking for a collaborator"}
                <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                  {k === "gig" ? "for an event" : "artists only"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Remount per kind: the page translator keeps translations per text node,
            so reused nodes would keep the other form's labels */}
        <div key={kind} className="space-y-5">
        <div>
          <FieldLabel>{isGig ? "What are you looking for" : "Who are you looking for"}</FieldLabel>
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
          <div>
            <FieldLabel htmlFor="opp-role">Instrument</FieldLabel>
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
              <SelectTrigger id="opp-role" className="h-10 rounded-lg">
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
                className="mt-2 h-10 rounded-lg"
              />
            )}
          </div>
        )}

        {isGig ? (
          <>
            <div>
              <FieldLabel htmlFor="opp-event-type">Event type</FieldLabel>
              <EventTypePicker id="opp-event-type" value={eventType} onChange={setEventType} />
            </div>

            <div className="rounded-xl bg-card p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="opp-date">Date</FieldLabel>
                  {datePicker}
                </div>
                <div>
                  <FieldLabel htmlFor="opp-place">County / town</FieldLabel>
                  {placePicker}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="opp-start" optional optionalLabel="Optional">
                    From
                  </FieldLabel>
                  <TimeSelector id="opp-start" value={startTime} onChange={setStartTime} placeholder="--:--" />
                </div>
                <div>
                  <FieldLabel htmlFor="opp-end" optional optionalLabel="Optional">
                    Until
                  </FieldLabel>
                  <TimeSelector id="opp-end" value={endTime} onChange={setEndTime} placeholder="--:--" />
                </div>
              </div>
              {timesHalf && <p className="text-xs text-destructive">Choose both the start and the end time.</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <FieldLabel>Collaboration type</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {COLLAB_TYPES.map((c) => (
                  <Chip key={c} on={collabType === c} onClick={() => setCollabType(c)}>
                    {COLLAB_TYPE_LABEL[c]}
                  </Chip>
                ))}
              </div>
            </div>
            {showEventType && (
              <div>
                <FieldLabel htmlFor="opp-event-type">Event type</FieldLabel>
                <EventTypePicker id="opp-event-type" value={eventType} onChange={setEventType} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="opp-date" optional optionalLabel="Optional">
                  Date
                </FieldLabel>
                {datePicker}
              </div>
              <div>
                <FieldLabel htmlFor="opp-place">Area</FieldLabel>
                {placePicker}
              </div>
            </div>
          </>
        )}

        <div>
          <FieldLabel optional optionalLabel="Optional">
            {isGig ? "Budget" : "Fee"}
          </FieldLabel>
          {budgetMode === "range" && (
            <div className="grid grid-cols-[1fr_1fr_88px] gap-2">
              <Input
                inputMode="decimal"
                aria-label="Minimum"
                placeholder={isGig ? "Min." : "Amount"}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
                className="h-10 rounded-lg"
              />
              <Input
                inputMode="decimal"
                aria-label="Maximum"
                placeholder="Max."
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
                className="h-10 rounded-lg"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-10 rounded-lg" aria-label="Currency">
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
          )}
          <div className={cn("flex flex-wrap gap-1.5", budgetMode === "range" && "mt-2")}>
            {budgetMode !== "range" && (
              <Chip on={false} onClick={() => setBudgetMode("range")}>
                Set an amount
              </Chip>
            )}
            <Chip on={budgetMode === "negotiable"} onClick={() => setBudgetMode(budgetMode === "negotiable" ? "range" : "negotiable")}>
              Negotiable
            </Chip>
            <Chip on={budgetMode === "none"} onClick={() => setBudgetMode(budgetMode === "none" ? "range" : "none")}>
              No budget
            </Chip>
          </div>
          {budgetInvalid && (
            <p className="mt-1.5 text-xs text-destructive">The minimum budget can't be higher than the maximum.</p>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <label htmlFor="opp-details" className="text-sm font-medium text-foreground">
              Details
            </label>
            <span className="text-[11px] text-muted-foreground/70 tabular-nums">
              {details.length}/{DETAILS_MAX}
            </span>
          </div>
          <Textarea
            id="opp-details"
            rows={3}
            maxLength={DETAILS_MAX}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              isGig
                ? "Number of guests, music style, equipment available at the venue…"
                : "Repertoire, rehearsals, what equipment they should bring…"
            }
            className="resize-none rounded-lg"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <label htmlFor="opp-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            {titleEdited && suggestedTitle && (
              <button
                type="button"
                onClick={() => setTitleEdited(false)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Use the suggested title
              </button>
            )}
          </div>
          <Input
            id="opp-title"
            maxLength={120}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleEdited(true);
            }}
            placeholder="Filled in from your choices"
            className="h-10 rounded-lg notranslate"
            translate="no"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Filled in from your choices. You can change it.</p>
        </div>

        </div>

        <div className="flex gap-2 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground leading-relaxed">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <span>
              {isGig
                ? "The announcement stays open until the event date or until you accept an offer."
                : "Musicians answer you by message."}
            </span>
            {isArtist && (
              <>
                {" "}
                <span>It uses 1 announcement from your plan.</span>
              </>
            )}
          </span>
        </div>
      </CreationModalShell>
    </Dialog>
  );
};

export default OpportunityComposer;
