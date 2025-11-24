import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft,
  Images,
  Play,
  DollarSign,
  Megaphone,
  Video,
  Disc3
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock data - will be replaced with real data from backend
const mockArtists: Record<string, any> = {
  "1": {
    id: "1",
    fullName: "Maria Popescu",
    stageName: "Maria P.",
    email: "maria.p@example.com",
    phone: "+40 712 345 678",
    county: "București",
    specialization: "Singer",
    genres: ["Pop", "Jazz", "Soul"],
    experienceYears: 8,
    eventsPerformed: 150,
    description: "Professional vocalist with 8 years of experience performing at weddings, corporate events, and concerts. Specializing in pop, jazz, and soul music with a unique voice that captivates audiences.",
    imageUrl: "",
    rating: 4.9,
    isPremium: true,
    socialMedia: {
      instagram: "https://instagram.com/mariap",
      facebook: "https://facebook.com/mariap",
      youtube: "https://youtube.com/mariap",
      tiktok: "https://tiktok.com/@mariap",
      spotify: "https://open.spotify.com/artist/mariap"
    },
    gallery: {
      images: [
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800",
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800",
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
        "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800",
        "https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=800",
        "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800"
      ],
      videos: [
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/9bZkp7q19f0"
      ]
    },
    busyDates: [
      new Date(2025, 10, 15),
      new Date(2025, 10, 16),
      new Date(2025, 10, 22),
      new Date(2025, 10, 23),
      new Date(2025, 10, 30),
      new Date(2025, 11, 5),
      new Date(2025, 11, 12),
      new Date(2025, 11, 24),
      new Date(2025, 11, 25),
      new Date(2025, 11, 31),
    ],
    blockedDates: [
      new Date(2025, 10, 19),
      new Date(2025, 11, 8),
      new Date(2025, 11, 18),
    ],
    pricing: [
      { eventType: "Wedding", price: "2500-3500 RON" },
      { eventType: "Corporate Event", price: "3000-4000 RON" },
      { eventType: "Birthday Party", price: "1500-2000 RON" },
      { eventType: "Concert", price: "4000-5000 RON" },
      { eventType: "Private Event", price: "2000-3000 RON" }
    ],
    announcements: [
      {
        id: "1",
        title: "Available for Summer Festivals",
        date: "2025-06-15",
        description: "Booking slots available for summer festival season! Special rates for multi-day events."
      },
      {
        id: "2",
        title: "New Setlist Available",
        date: "2025-05-20",
        description: "Just released a new performance setlist featuring latest hits and classics. Perfect for wedding receptions!"
      }
    ]
  },
  "2": {
    id: "2",
    fullName: "Ion Georgescu",
    stageName: "Johnny G",
    email: "johnny.g@example.com",
    phone: "+40 723 456 789",
    county: "Cluj",
    specialization: "Singer",
    genres: ["Rock", "Blues", "Pop"],
    experienceYears: 12,
    eventsPerformed: 200,
    description: "Experienced rock and blues singer with powerful vocals and stage presence. Available for concerts, festivals, and private events.",
    imageUrl: "",
    rating: 4.8,
    isPremium: false,
    socialMedia: {
      instagram: "https://instagram.com/johnnyg",
      facebook: "https://facebook.com/johnnyg",
      youtube: "https://youtube.com/johnnyg",
      tiktok: "https://tiktok.com/@johnnyg",
      spotify: "https://open.spotify.com/artist/johnnyg"
    },
    gallery: {
      images: [
        "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800",
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
        "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800",
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800",
        "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
      ],
      videos: [
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/9bZkp7q19f0"
      ]
    },
    busyDates: [
      new Date(2025, 10, 18),
      new Date(2025, 10, 25),
      new Date(2025, 11, 2),
      new Date(2025, 11, 10),
      new Date(2025, 11, 20),
      new Date(2025, 11, 28),
    ],
    blockedDates: [
      new Date(2025, 10, 21),
      new Date(2025, 11, 7),
      new Date(2025, 11, 14),
    ],
    pricing: [
      { eventType: "Wedding", price: "3000-4000 RON" },
      { eventType: "Festival", price: "5000-6000 RON" },
      { eventType: "Bar/Club Performance", price: "2000-2500 RON" },
      { eventType: "Corporate Event", price: "3500-4500 RON" },
      { eventType: "Private Concert", price: "4000-5000 RON" }
    ],
    announcements: [
      {
        id: "1",
        title: "Performing at Blues Night Cluj",
        date: "2025-07-10",
        description: "Join me for a special blues night performance at Club Blue. Tickets available at the venue!"
      },
      {
        id: "2",
        title: "Holiday Season Bookings Open",
        date: "2025-06-01",
        description: "Now accepting bookings for December holiday events. Early bird discounts available!"
      }
    ]
  },
  "3": {
    id: "3",
    fullName: "Ana Marin",
    stageName: "Ana M",
    email: "ana.m@example.com",
    phone: "+40 734 567 890",
    county: "Timiș",
    specialization: "Singer",
    genres: ["Classical", "Opera", "Musical Theatre"],
    experienceYears: 6,
    eventsPerformed: 80,
    description: "Classically trained soprano with experience in opera and musical theatre. Perfect for elegant events and concerts.",
    imageUrl: "",
    rating: 4.7,
    isPremium: true,
    socialMedia: {
      instagram: "https://instagram.com/anam",
      facebook: "https://facebook.com/anam",
      youtube: "https://youtube.com/anam",
      tiktok: "https://tiktok.com/@anam",
      spotify: "https://open.spotify.com/artist/anam"
    },
    gallery: {
      images: [
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800",
        "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800",
        "https://images.unsplash.com/photo-1519683109079-d5f539e1542f?w=800",
        "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800",
        "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800",
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800",
        "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=800"
      ],
      videos: [
        "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "https://www.youtube.com/embed/9bZkp7q19f0"
      ]
    },
    busyDates: [
      new Date(2025, 10, 20),
      new Date(2025, 10, 27),
      new Date(2025, 11, 4),
      new Date(2025, 11, 15),
      new Date(2025, 11, 22),
    ],
    blockedDates: [
      new Date(2025, 10, 24),
      new Date(2025, 11, 9),
      new Date(2025, 11, 17),
    ],
    pricing: [
      { eventType: "Opera Performance", price: "4000-5500 RON" },
      { eventType: "Wedding Ceremony", price: "2500-3500 RON" },
      { eventType: "Classical Concert", price: "3500-4500 RON" },
      { eventType: "Corporate Gala", price: "4500-5500 RON" },
      { eventType: "Private Event", price: "2000-3000 RON" }
    ],
    announcements: [
      {
        id: "1",
        title: "Opera Gala at National Theatre",
        date: "2025-08-20",
        description: "Performing arias from La Traviata and Carmen at the National Theatre. Limited seats available!"
      },
      {
        id: "2",
        title: "Wedding Season Special Offer",
        date: "2025-05-15",
        description: "Exclusive package for couples booking ceremony and reception performances together."
      }
    ]
  }
};

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const artist = id ? mockArtists[id] : null;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    message: ""
  });
  const { toast } = useToast();

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
    
    if (!selectedDate || !id) return;

    try {
      const { error } = await supabase.from('booking_requests').insert({
        profile_id: id,
        requester_name: bookingForm.name,
        requester_email: bookingForm.email,
        requester_phone: bookingForm.phone,
        event_date: selectedDate.toISOString().split('T')[0],
        event_type: bookingForm.eventType,
        message: bookingForm.message,
        status: 'pending'
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
        message: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!artist) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-32 pb-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-display font-bold mb-4">Artist Not Found</h1>
            <Link to="/">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link to="/leaderboard">
            <Button variant="ghost" className="mb-6 hover:text-accent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Artists
            </Button>
          </Link>

          <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
            <CardContent className="p-8">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-shrink-0">
                  <Avatar className={`w-40 h-40 border-4 shadow-lg ${artist.isPremium ? 'border-accent' : 'border-burgundy'}`}>
                    <AvatarImage src={artist.imageUrl} alt={artist.stageName} />
                    <AvatarFallback className={`bg-gradient-to-br ${artist.isPremium ? 'from-accent/30 to-accent/10' : 'from-burgundy/30 to-burgundy/10'}`}>
                      <User className={`h-20 w-20 ${artist.isPremium ? 'text-accent' : 'text-burgundy'}`} />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                        {artist.stageName}
                      </h1>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Badge className="bg-accent text-accent-foreground px-4 py-2 text-base">
                          {artist.specialization}
                        </Badge>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-5 w-5" />
                          <span className="text-base">{artist.county}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground shadow-lg">
                      <Star className="h-6 w-6 fill-current" />
                      <span className="text-2xl font-bold">{artist.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Tabs Section */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="announcements">Announcements</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-8">
                  {/* Description */}
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                      <User className="h-6 w-6 text-accent" />
                      About
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {artist.description}
                    </p>
                  </div>

                  <Separator />

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Music Genres */}
                    <div>
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <Music className="h-5 w-5 text-accent" />
                        Music Genres
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {artist.genres.map((genre: string) => (
                          <Badge key={genre} variant="outline" className="border-accent/50 text-accent px-3 py-1">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-accent" />
                        Experience
                      </h3>
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{artist.experienceYears} years</span> of professional experience
                        </p>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Award className="h-4 w-4 text-accent" />
                          <span className="font-semibold text-foreground">{artist.eventsPerformed}+</span> events performed
                        </p>
                      </div>
                    </div>

                    {/* Estimated Prices */}
                    <div>
                      <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-accent" />
                        Estimated Prices
                      </h3>
                      <div className="space-y-2">
                        {artist.pricing?.slice(0, 3).map((price: { eventType: string; price: string }, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{price.eventType}</span>
                            <Badge variant="outline" className="border-accent/50 text-accent text-xs px-2 py-0.5">
                              {price.price}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Announcements Tab */}
                <TabsContent value="announcements" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                      <Megaphone className="h-6 w-6 text-accent" />
                      Latest Announcements
                    </h2>
                    <div className="space-y-4">
                      {artist.announcements?.map((announcement: any) => (
                        <Card key={announcement.id} className="border-accent/20">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h3 className="text-xl font-semibold text-foreground">{announcement.title}</h3>
                              <Badge variant="outline" className="border-accent/50 text-accent whitespace-nowrap">
                                {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">{announcement.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                      <Images className="h-6 w-6 text-accent" />
                      Gallery
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Images */}
                      {artist.gallery.images.map((image: string, index: number) => (
                        <Dialog key={`image-${index}`}>
                          <DialogTrigger asChild>
                            <div className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors">
                              <img 
                                src={image} 
                                alt={`Gallery image ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <img 
                              src={image} 
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-auto rounded-lg"
                            />
                          </DialogContent>
                        </Dialog>
                      ))}
                      
                      {/* Videos */}
                      {artist.gallery.videos.map((video: string, index: number) => (
                        <Dialog key={`video-${index}`}>
                          <DialogTrigger asChild>
                            <div className="aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors bg-black/80 flex items-center justify-center">
                              <Play className="h-12 w-12 text-accent" />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <div className="aspect-video">
                              <iframe
                                src={video}
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Calendar Tab */}
                <TabsContent value="calendar">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-accent" />
                      Availability Calendar
                    </h2>
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          className="rounded-lg border border-border shadow-sm"
                          modifiers={{
                            busy: artist.busyDates || [],
                            blocked: artist.blockedDates || []
                          }}
                          modifiersClassNames={{
                            busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                            blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80"
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </div>
                      <div className="lg:w-64 space-y-4">
                        <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
                          <h4 className="font-semibold text-foreground">Legend</h4>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-destructive/70"></div>
                            <span className="text-sm text-muted-foreground">Busy / Booked</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-muted/80"></div>
                            <span className="text-sm text-muted-foreground">Unavailable</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-accent"></div>
                            <span className="text-sm text-muted-foreground">Available</span>
                          </div>
                        </div>
                        {selectedDate && (
                          <div className="p-4 rounded-lg border border-border bg-card">
                            <h4 className="font-semibold text-foreground mb-2">Selected Date</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {selectedDate.toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <Badge 
                              className={
                                isBlockedDate(selectedDate)
                                  ? "bg-muted text-muted-foreground"
                                  : isBusyDate(selectedDate) 
                                    ? "bg-destructive text-destructive-foreground" 
                                    : "bg-accent text-accent-foreground"
                              }
                            >
                              {isBlockedDate(selectedDate) 
                                ? "Unavailable" 
                                : isBusyDate(selectedDate) 
                                  ? "Busy" 
                                  : "Available"
                              }
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-8" />

              {/* Booking Dialog */}
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-display">Book {artist.stageName}</DialogTitle>
                    <DialogDescription>
                      {selectedDate && `Selected date: ${selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+40 712 345 678"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventType">Event Type</Label>
                      <Input
                        id="eventType"
                        placeholder="e.g., Wedding, Corporate Event, Birthday"
                        value={bookingForm.eventType}
                        onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Details</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your event..."
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      Send Booking Request
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-xl font-display font-bold mb-4">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                    <Mail className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${artist.email}`} className="text-foreground hover:text-accent transition-colors">
                        {artist.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                    <Phone className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a href={`tel:${artist.phone}`} className="text-foreground hover:text-accent transition-colors">
                        {artist.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Social Media */}
              <div>
                <h3 className="text-xl font-display font-bold mb-4">Follow on Social Media</h3>
                <div className="flex flex-wrap gap-4">
                  {artist.socialMedia.instagram && (
                    <a 
                      href={artist.socialMedia.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all"
                    >
                      <Instagram className="h-5 w-5" />
                      Instagram
                    </a>
                  )}
                  {artist.socialMedia.facebook && (
                    <a 
                      href={artist.socialMedia.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1877F2] text-white hover:shadow-lg transition-all"
                    >
                      <Facebook className="h-5 w-5" />
                      Facebook
                    </a>
                  )}
                  {artist.socialMedia.youtube && (
                    <a 
                      href={artist.socialMedia.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FF0000] text-white hover:shadow-lg transition-all"
                    >
                      <Youtube className="h-5 w-5" />
                      YouTube
                    </a>
                  )}
                  {artist.socialMedia.tiktok && (
                    <a 
                      href={artist.socialMedia.tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#000000] text-white hover:shadow-lg transition-all"
                    >
                      <Video className="h-5 w-5" />
                      TikTok
                    </a>
                  )}
                  {artist.socialMedia.spotify && (
                    <a 
                      href={artist.socialMedia.spotify} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1DB954] text-white hover:shadow-lg transition-all"
                    >
                      <Disc3 className="h-5 w-5" />
                      Spotify
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfile;
