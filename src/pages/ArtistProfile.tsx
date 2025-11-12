import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Star, 
  Music, 
  Calendar, 
  Award,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  ArrowLeft
} from "lucide-react";

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
    socialMedia: {
      instagram: "https://instagram.com/mariap",
      facebook: "https://facebook.com/mariap",
      youtube: "https://youtube.com/mariap"
    }
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
    socialMedia: {
      instagram: "https://instagram.com/johnnyg",
      facebook: "https://facebook.com/johnnyg",
      youtube: "https://youtube.com/johnnyg"
    }
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
    socialMedia: {
      instagram: "https://instagram.com/anam",
      facebook: "https://facebook.com/anam",
      youtube: "https://youtube.com/anam"
    }
  }
};

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const artist = id ? mockArtists[id] : null;

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
                  <Avatar className="w-40 h-40 border-4 border-accent shadow-lg">
                    <AvatarImage src={artist.imageUrl} alt={artist.stageName} />
                    <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                      <User className="h-20 w-20 text-accent" />
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                        {artist.stageName}
                      </h1>
                      <p className="text-xl text-muted-foreground mb-4">{artist.fullName}</p>
                      
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
                      Contact Artist
                    </Button>
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <User className="h-6 w-6 text-accent" />
                  About
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {artist.description}
                </p>
              </div>

              <Separator className="my-8" />

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
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
                    <Calendar className="h-5 w-5 text-accent" />
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
              </div>

              <Separator className="my-8" />

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
