import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  MapPin,
  Star,
  Music,
  Calendar as CalendarIcon,
  Award,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  DollarSign,
  Megaphone,
  Images,
  Video,
  Disc3,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ArtistData {
  id: string;
  fullName?: string;
  stageName: string;
  email?: string;
  phone?: string;
  county: string;
  specialization?: string;
  genres?: string[];
  experienceYears?: number;
  eventsPerformed?: number;
  description?: string;
  imageUrl?: string;
  rating?: number;
  isPremium: boolean;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    spotify?: string;
  };
  gallery?: {
    images?: string[];
    videos?: string[];
  };
  busyDates?: Date[];
  blockedDates?: Date[];
  pricing?: Array<{ eventType: string; price: string }>;
  announcements?: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
  }>;
}

interface ArtistProfileDrawerProps {
  artist: ArtistData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtistProfileDrawer({ artist, open, onOpenChange }: ArtistProfileDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    message: "",
  });
  const { toast } = useToast();

  if (!artist) return null;

  const isBusyDate = (date: Date) => {
    if (!artist?.busyDates) return false;
    return artist.busyDates.some(
      (busyDate: Date) =>
        busyDate.getDate() === date.getDate() &&
        busyDate.getMonth() === date.getMonth() &&
        busyDate.getFullYear() === date.getFullYear()
    );
  };

  const isBlockedDate = (date: Date) => {
    if (!artist?.blockedDates) return false;
    return artist.blockedDates.some(
      (blockedDate: Date) =>
        blockedDate.getDate() === date.getDate() &&
        blockedDate.getMonth() === date.getMonth() &&
        blockedDate.getFullYear() === date.getFullYear()
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && !isBusyDate(date) && !isBlockedDate(date)) {
      setBookingDialogOpen(true);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !artist.id) return;

    try {
      const { error } = await supabase.from("booking_requests").insert({
        profile_id: artist.id,
        requester_name: bookingForm.name,
        requester_email: bookingForm.email,
        requester_phone: bookingForm.phone,
        event_date: selectedDate.toISOString().split("T")[0],
        event_type: bookingForm.eventType,
        message: bookingForm.message,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Booking Request Sent!",
        description: `Your booking request for ${selectedDate?.toLocaleDateString()} has been sent to ${artist?.stageName}.`,
      });

      setBookingDialogOpen(false);
      setBookingForm({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-3xl font-display">Artist Profile</SheetTitle>
        </SheetHeader>

        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex items-start gap-4">
            <Avatar className={`w-24 h-24 border-4 shadow-lg ${artist.isPremium ? "border-accent" : "border-burgundy"}`}>
              <AvatarImage src={artist.imageUrl} alt={artist.stageName} />
              <AvatarFallback className={`bg-gradient-to-br ${artist.isPremium ? "from-accent/30 to-accent/10" : "from-burgundy/30 to-burgundy/10"}`}>
                <User className={`h-12 w-12 ${artist.isPremium ? "text-accent" : "text-burgundy"}`} />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">{artist.stageName}</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-accent text-accent-foreground">{artist.specialization || "Artist"}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{artist.county}</span>
                </div>
              </div>
              {artist.rating && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 w-fit">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="text-lg font-bold text-accent">{artist.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Mail className="mr-2 h-4 w-4" />
              Contact
            </Button>
            {artist.phone && (
              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Phone className="mr-2 h-4 w-4" />
                Call Now
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="announcements">News</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {artist.description && (
              <div>
                <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  About
                </h3>
                <p className="text-muted-foreground leading-relaxed">{artist.description}</p>
              </div>
            )}

            {artist.genres && artist.genres.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                    <Music className="h-5 w-5 text-accent" />
                    Music Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.map((genre: string) => (
                      <Badge key={genre} variant="outline" className="border-accent/50 text-accent">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(artist.experienceYears || artist.eventsPerformed) && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  {artist.experienceYears && (
                    <div>
                      <h3 className="text-lg font-display font-bold mb-2 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-accent" />
                        Experience
                      </h3>
                      <p className="text-2xl font-bold text-accent">{artist.experienceYears} years</p>
                    </div>
                  )}
                  {artist.eventsPerformed && (
                    <div>
                      <h3 className="text-lg font-display font-bold mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5 text-accent" />
                        Events
                      </h3>
                      <p className="text-2xl font-bold text-accent">{artist.eventsPerformed}+</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {artist.pricing && artist.pricing.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-accent" />
                    Pricing
                  </h3>
                  <div className="space-y-2">
                    {artist.pricing.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="font-medium">{item.eventType}</span>
                        <span className="text-accent font-bold">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {artist.socialMedia && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-display font-bold mb-3">Social Media</h3>
                  <div className="flex flex-wrap gap-2">
                    {artist.socialMedia.instagram && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={artist.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.socialMedia.facebook && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={artist.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.socialMedia.youtube && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={artist.socialMedia.youtube} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {artist.socialMedia.spotify && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={artist.socialMedia.spotify} target="_blank" rel="noopener noreferrer">
                          <Disc3 className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            {artist.announcements && artist.announcements.length > 0 ? (
              <div className="space-y-4">
                {artist.announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 rounded-lg bg-muted/50 border border-accent/20">
                    <div className="flex items-start gap-3">
                      <Megaphone className="h-5 w-5 text-accent mt-1" />
                      <div className="flex-1">
                        <h4 className="font-display font-bold text-lg mb-1">{announcement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{new Date(announcement.date).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">{announcement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No announcements yet</p>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            {artist.gallery && (artist.gallery.images?.length || artist.gallery.videos?.length) ? (
              <div className="space-y-6">
                {artist.gallery.images && artist.gallery.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                      <Images className="h-5 w-5 text-accent" />
                      Photos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {artist.gallery.images.map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                          <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {artist.gallery.videos && artist.gallery.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                      <Video className="h-5 w-5 text-accent" />
                      Videos
                    </h3>
                    <div className="space-y-3">
                      {artist.gallery.videos.map((video, index) => (
                        <div key={index} className="aspect-video rounded-lg overflow-hidden">
                          <iframe src={video} className="w-full h-full" title={`Video ${index + 1}`} allowFullScreen />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No gallery items yet</p>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                modifiers={{
                  busy: artist.busyDates || [],
                  blocked: artist.blockedDates || [],
                }}
                modifiersStyles={{
                  busy: { backgroundColor: "hsl(var(--burgundy) / 0.3)", color: "hsl(var(--foreground))" },
                  blocked: { backgroundColor: "hsl(var(--destructive) / 0.3)", textDecoration: "line-through" },
                }}
              />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--burgundy) / 0.3)" }} />
                  <span>Busy dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--destructive) / 0.3)" }} />
                  <span>Blocked dates</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book for {selectedDate?.toLocaleDateString()}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  value={bookingForm.eventType}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                  placeholder="e.g., Wedding, Corporate Event"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={bookingForm.message}
                  onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                  placeholder="Additional details about your event..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Send Booking Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
