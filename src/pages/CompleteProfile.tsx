import { useCallback, useEffect, useRef, useState } from "react";
import { takePlanIntent } from "@/lib/planIntent";
import { startCheckout } from "@/lib/checkout";
import { useNavigate } from "react-router-dom";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import AuthShell, { authButtonClass, authInputClass } from "@/components/AuthShell";
import CountrySelector, { getCountryCodeByName, getCountryNameByCode } from "@/components/CountrySelector";
import SEO from "@/components/SEO";
import { getMaxPhoneLength, getPhonePrefix, validatePhoneNumber } from "@/lib/countryPhoneCodes";
import { getCountryRegions, getDivisionName } from "@/lib/countryAdminDivisions";
import { getOnboardingState } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

const SPECIALIZATIONS = [
  { value: "Singer", label: "Singer" },
  { value: "Instrumentalist", label: "Instrumentalist" },
  { value: "DJ", label: "DJ" },
  { value: "Band", label: "Band" },
];

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1950 + 1 }, (_, i) => String(THIS_YEAR - i));

const selectClass = "h-10 rounded-full border-[#727272] bg-[#121212] px-4 text-sm hover:border-foreground focus:ring-2 focus:ring-white/70";

const cropToBlob = async (src: string, area: Area | null): Promise<Blob> => {
  const image = new Image();
  image.src = src;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Failed to load image"));
  });
  const crop = area ?? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
  const size = Math.min(crop.width, 1200);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = Math.round((crop.height / crop.width) * size);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to process image");
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to process image"))), "image/jpeg", 0.92),
  );
};

/**
 * What a new artist fills in before appearing in the lists: stage name and type,
 * where they perform, a photo and a phone number. Saved together, in one go.
 */
const CompleteProfile = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stageName, setStageName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [careerStart, setCareerStart] = useState("");
  const [country, setCountry] = useState("RO");
  const [county, setCounty] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const state = await getOnboardingState(session.user.id, true);
      if (state.role !== "artist" || state.artistComplete) {
        navigate("/", { replace: true });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("stage_name, first_name, last_name, phone, country, county, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();
      const code = getCountryCodeByName(p?.country) || "RO";
      setCountry(code);
      setCounty(p?.county || "");
      setStageName(p?.stage_name || [p?.first_name, p?.last_name].filter(Boolean).join(" "));
      setPhone(p?.phone && p.phone.startsWith(getPhonePrefix(code)) ? p.phone : getPhonePrefix(code));
      setAvatarUrl(p?.avatar_url || null);
      setUserId(session.user.id);
    });
  }, [navigate]);

  const onCropComplete = useCallback((_: Area, px: Area) => setCropArea(px), []);

  if (!userId) return null;

  const regions = country ? getCountryRegions(country) : [];
  const divisionLabel = (country ? getDivisionName(country) : "County").replace(/ies$/i, "y").replace(/s$/i, "");
  const phoneCheck = validatePhoneNumber(phone, country);
  const shownPhoto = photoPreview || avatarUrl;

  const items = [
    { label: "Stage name and type", done: stageName.trim().length >= 2 && !!specialization && !!careerStart },
    { label: "Location", done: !!country && (regions.length === 0 || !!county) },
    { label: "Profile photo", done: !!shownPhoto },
    { label: "Phone", done: phoneCheck.valid },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const confirmCrop = async () => {
    if (!cropSrc) return;
    try {
      const blob = await cropToBlob(cropSrc, cropArea);
      setPhotoBlob(blob);
      setPhotoPreview(URL.createObjectURL(blob));
      setCropSrc(null);
    } catch {
      toast.error("Couldn't process this image. Try another one.");
    }
  };

  const save = async () => {
    if (!allDone || saving) return;
    setSaving(true);
    try {
      let finalAvatar = avatarUrl;
      if (photoBlob) {
        const path = `${userId}/avatar.jpg`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, photoBlob, { contentType: "image/jpeg", cacheControl: "0", upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        finalAvatar = `${data.publicUrl}?v=${Date.now()}`;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          stage_name: stageName.trim(),
          specialization: specialization as any,
          career_start_year: Number(careerStart),
          country: getCountryNameByCode(country) || country,
          county: county || "",
          phone,
          avatar_url: finalAvatar,
        })
        .eq("id", userId);
      if (error) throw error;
      await getOnboardingState(userId, true);
      toast.success("Your profile is live. Clients can now find you.");
      // A paid plan picked before signing up: go straight to payment
      const intent = takePlanIntent();
      if (intent) {
        const origin = window.location.origin;
        const ok = await startCheckout({
          plan: intent.plan,
          billing: intent.billing,
          successUrl: `${origin}/dashboard?checkout=success`,
          cancelUrl: `${origin}/plans?checkout=cancelled`,
        });
        if (ok) return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Couldn't save your profile. Please try again.");
      setSaving(false);
    }
  };

  return (
    <>
      <SEO title="Complete your profile | Muzicalist" description="Finish your artist profile on Muzicalist." path="/complete-profile" noindex />
      <AuthShell title="Complete your artist profile" signedIn wide>
        <p className="-mt-6 mb-6 text-center text-sm text-muted-foreground">
          <span>Clients will find you once these are filled in.</span>
        </p>

        {/* Checklist */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full bg-accent transition-all" style={{ width: `${(doneCount / items.length) * 100}%` }} />
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {doneCount}/{items.length}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 md:flex md:flex-wrap md:justify-between">
            {items.map((i) => (
              <li key={i.label} className="flex items-center gap-2 whitespace-nowrap text-sm">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                    i.done ? "bg-accent text-black" : "border border-[#727272]",
                  )}
                  aria-hidden="true"
                >
                  {i.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
                <span className={i.done ? "text-muted-foreground" : "text-foreground"}>{i.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-foreground/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Choose a photo"
            >
              {shownPhoto ? (
                <img src={shownPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="mx-auto h-8 w-8 text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Profile photo</p>
              <p className="mb-2 text-xs text-muted-foreground">A clear photo of you or your band.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <Camera className="mr-1.5 h-4 w-4" />
                {shownPhoto ? <span>Change photo</span> : <span>Add photo</span>}
              </Button>
            </div>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </div>

          <div className="grid gap-x-4 gap-y-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stageName" className="text-sm font-bold text-foreground">Stage name</Label>
            <Input id="stageName" value={stageName} onChange={(e) => setStageName(e.target.value)} maxLength={80} className={authInputClass} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-foreground">You are</Label>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger className={selectClass} aria-label="Artist type">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-foreground">Performing since</Label>
            <Select value={careerStart} onValueChange={setCareerStart}>
              <SelectTrigger className={selectClass} aria-label="Performing since">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent side="bottom" className="max-h-72">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-bold text-foreground">Phone</Label>
                        <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                const v = e.target.value;
                const prefix = getPhonePrefix(country);
                if (prefix && !v.startsWith(prefix)) return;
                if (!/^\d*$/.test(v.slice(prefix.length))) return;
                if (v.length <= getMaxPhoneLength(country)) setPhone(v);
              }}
              className={authInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-foreground">Country of residence</Label>
            <CountrySelector
              triggerClassName="h-10 rounded-full border-[#727272] bg-[#121212] pl-10 text-sm font-normal hover:border-foreground hover:bg-[#121212]"
              value={country}
              onChange={(v) => {
                setCountry(v);
                setCounty("");
                setPhone(getPhonePrefix(v));
              }}
            />
          </div>

          {regions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-foreground">{divisionLabel}</Label>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger className={selectClass} aria-label={divisionLabel}>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent side="bottom" className="max-h-72">
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="notranslate" translate="no">{r}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          </div>

          <Button type="button" onClick={save} disabled={!allDone || saving} className={`${authButtonClass} !mt-8 md:mx-auto md:block md:max-w-[324px]`}>
            {saving ? "Saving…" : "Publish my profile"}
          </Button>
        </div>
      </AuthShell>

      <Dialog open={!!cropSrc} onOpenChange={(o) => !o && setCropSrc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust your photo</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 overflow-hidden rounded-md bg-black">
            {cropSrc && (
              <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} showGrid={false} />
            )}
          </div>
          <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={([z]) => setZoom(z)} aria-label="Zoom" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCropSrc(null)}>Cancel</Button>
            <Button onClick={confirmCrop}>Use photo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompleteProfile;
