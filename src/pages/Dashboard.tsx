import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  LogOut, 
  Camera, 
  Save, 
  User, 
  MapPin, 
  Star, 
  Music, 
  Calendar as CalendarIcon, 
  Award,
  Phone,
  Mail,
  Edit2,
  X,
  Megaphone,
  Plus,
  Trash2,
  Images,
  Play,
  Upload,
  MessageSquare,
  FileText,
  Settings as SettingsIcon
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "profile");

  // Update active tab when URL params change
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    stageName: "",
    email: "",
    phone: "",
    county: "",
    specialization: "",
    musicGenres: "",
    experienceLevel: "",
    numberOfEvents: "",
    careerStartYear: ""
  });

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", date: "", description: "" });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [galleryUploadType, setGalleryUploadType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState("");

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [eventStatus, setEventStatus] = useState<'busy' | 'blocked' | 'available'>('busy');
  const [eventNotes, setEventNotes] = useState("");

  const romanianCounties = [
    "București", "Cluj", "Timiș", "Iași", "Constanța", "Brașov", 
    "Prahova", "Dolj", "Galați", "Argeș", "Sibiu", "Bacău"
  ];

  // Data loading functions (defined early to avoid hoisting issues)
  const loadAnnouncements = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('profile_id', user.id)
      .order('date', { ascending: false });
    if (data) setAnnouncements(data);
  };

  const loadGalleryItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setGalleryItems(data);
  };

  const loadCalendarEvents = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('profile_id', user.id);
    if (data) setCalendarEvents(data);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnnouncements();
      loadGalleryItems();
      loadCalendarEvents();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setFormData({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        stageName: profileData.stage_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        county: profileData.county || "",
        specialization: profileData.specialization || "",
        musicGenres: profileData.music_genres || "",
        experienceLevel: profileData.experience_level || "",
        numberOfEvents: profileData.number_of_events?.toString() || "",
        careerStartYear: profileData.career_start_year?.toString() || ""
      });
    } catch (error: any) {
      console.error('Auth check error:', error);
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSaveAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;

    setIsSaving(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const fileName = `${user.id}/avatar.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      setShowCropper(false);
      setImageSrc(null);

      toast({
        title: "Success",
        description: "Profile picture updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (field: string) => {
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
    checkAuth();
  };

  const saveField = async (field: string) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updateData: any = {};
      
      switch(field) {
        case 'names':
          updateData.first_name = formData.firstName;
          updateData.last_name = formData.lastName;
          updateData.stage_name = formData.stageName;
          break;
        case 'contact':
          updateData.phone = formData.phone;
          break;
        case 'location':
          updateData.county = formData.county;
          break;
        case 'specialization':
          updateData.specialization = formData.specialization as any;
          break;
        case 'genres':
          updateData.music_genres = formData.musicGenres;
          break;
        case 'experience':
          updateData.experience_level = formData.experienceLevel as any;
          updateData.number_of_events = parseInt(formData.numberOfEvents);
          updateData.career_start_year = parseInt(formData.careerStartYear);
          break;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await checkAuth();
      setEditingField(null);

      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Announcements functions
  const handleAddAnnouncement = async () => {
    if (!user || !newAnnouncement.title || !newAnnouncement.date) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          profile_id: user.id,
          title: newAnnouncement.title,
          date: newAnnouncement.date,
          description: newAnnouncement.description
        });

      if (error) throw error;

      await loadAnnouncements();
      setNewAnnouncement({ title: "", date: "", description: "" });
      setShowAnnouncementDialog(false);

      toast({ title: "Success", description: "Announcement added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadAnnouncements();
      toast({ title: "Success", description: "Announcement deleted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Gallery functions
  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSaving(true);
    try {
      const fileName = `${user.id}/gallery/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('gallery_items')
        .insert({
          profile_id: user.id,
          type: 'image',
          url: publicUrl
        });

      if (insertError) throw insertError;

      await loadGalleryItems();
      setShowGalleryDialog(false);
      toast({ title: "Success", description: "Image uploaded!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideo = async () => {
    if (!user || !videoUrl) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('gallery_items')
        .insert({
          profile_id: user.id,
          type: 'video',
          url: videoUrl
        });

      if (error) throw error;

      await loadGalleryItems();
      setVideoUrl("");
      setShowGalleryDialog(false);
      toast({ title: "Success", description: "Video added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string, url: string, type: string) => {
    setIsSaving(true);
    try {
      if (type === 'image') {
        const filePath = url.split('/').slice(-3).join('/');
        await supabase.storage.from('avatars').remove([filePath]);
      }

      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadGalleryItems();
      toast({ title: "Success", description: "Item deleted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Calendar functions
  const handleSaveCalendarEvent = async () => {
    if (!user || !selectedDate) return;

    setIsSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('calendar_events')
        .upsert({
          profile_id: user.id,
          event_date: dateStr,
          status: eventStatus,
          notes: eventNotes
        }, {
          onConflict: 'profile_id,event_date'
        });

      if (error) throw error;

      await loadCalendarEvents();
      setEventNotes("");
      toast({ title: "Success", description: "Calendar updated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCalendarEvent = async () => {
    if (!user || !selectedDate) return;

    setIsSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('profile_id', user.id)
        .eq('event_date', dateStr);

      if (error) throw error;

      await loadCalendarEvents();
      setSelectedDate(undefined);
      toast({ title: "Success", description: "Event deleted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const getEventForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.find(event => event.event_date === dateStr);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-bold text-foreground">
              {activeTab === "profile" && "My Profile"}
              {activeTab === "messages" && "My Messages"}
              {activeTab === "announcements" && "My Announcements"}
              {activeTab === "posts" && "My Posts"}
              {activeTab === "settings" && "Settings"}
            </h1>
          </div>
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
                  <CardContent className="p-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                      <div className="flex-shrink-0 relative group">
                        <Avatar className="w-40 h-40 border-4 border-accent shadow-lg">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-accent/30 to-accent/10">
                            <User className="h-20 w-20 text-accent" />
                          </AvatarFallback>
                        </Avatar>
                        <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="h-8 w-8 text-white" />
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            {editingField === 'names' ? (
                              <div className="space-y-3">
                                <Input
                                  value={formData.stageName}
                                  onChange={(e) => setFormData({...formData, stageName: e.target.value})}
                                  placeholder="Stage Name"
                                  className="text-2xl font-display font-bold"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                    placeholder="First Name"
                                  />
                                  <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                    placeholder="Last Name"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveField('names')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="group">
                                <div className="flex items-center gap-2">
                                  <h1 className="text-4xl font-display font-bold text-foreground">
                                    {formData.stageName}
                                  </h1>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => startEditing('names')}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xl text-muted-foreground mb-4">
                                  {formData.firstName} {formData.lastName}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-3 mb-4">
                              {editingField === 'specialization' ? (
                                <div className="flex items-center gap-2">
                                  <Select value={formData.specialization} onValueChange={(value) => setFormData({...formData, specialization: value})}>
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Singer">Singer</SelectItem>
                                      <SelectItem value="Instrumentalist">Instrumentalist</SelectItem>
                                      <SelectItem value="DJ">DJ</SelectItem>
                                      <SelectItem value="Band">Band</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" onClick={() => saveField('specialization')} disabled={isSaving}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="group flex items-center gap-2">
                                  <Badge className="bg-accent text-accent-foreground px-4 py-2 text-base">
                                    {formData.specialization}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                    onClick={() => startEditing('specialization')}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              
                              {editingField === 'location' ? (
                                <div className="flex items-center gap-2">
                                  <Select value={formData.county} onValueChange={(value) => setFormData({...formData, county: value})}>
                                    <SelectTrigger className="w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {romanianCounties.map(county => (
                                        <SelectItem key={county} value={county}>{county}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" onClick={() => saveField('location')} disabled={isSaving}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="group flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-5 w-5" />
                                  <span className="text-base">{formData.county}</span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                    onClick={() => startEditing('location')}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground shadow-lg">
                            <Star className="h-6 w-6 fill-current" />
                            <span className="text-2xl font-bold">New</span>
                          </div>
                        </div>

                        {/* Contact Buttons */}
                        <div className="flex flex-wrap gap-3 mt-6">
                          {editingField === 'contact' ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                placeholder="Phone Number"
                                className="flex-1"
                              />
                              <Button size="sm" onClick={() => saveField('contact')} disabled={isSaving}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEditing}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Mail className="mr-2 h-4 w-4" />
                                {formData.email}
                              </Button>
                              <div className="group flex items-center gap-2">
                                <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                                  <Phone className="mr-2 h-4 w-4" />
                                  {formData.phone || 'Add Phone'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                  onClick={() => startEditing('contact')}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-8" />

                    {/* Tabs Section */}
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar</TabsTrigger>
                      </TabsList>

                      {/* Details Tab */}
                      <TabsContent value="details" className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          {/* Music Genres */}
                          <div>
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <Music className="h-5 w-5 text-accent" />
                              Music Genres
                            </h3>
                            {editingField === 'genres' ? (
                              <div className="space-y-2">
                                <Input
                                  value={formData.musicGenres}
                                  onChange={(e) => setFormData({...formData, musicGenres: e.target.value})}
                                  placeholder="e.g., Pop, Rock, Jazz"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveField('genres')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="group">
                                <div className="flex flex-wrap gap-2">
                                  {formData.musicGenres?.split(',').map((genre: string) => (
                                    <Badge key={genre.trim()} variant="outline" className="border-accent/50 text-accent px-3 py-1">
                                      {genre.trim()}
                                    </Badge>
                                  ))}
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                                  onClick={() => startEditing('genres')}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Genres
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Experience */}
                          <div>
                            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-accent" />
                              Experience
                            </h3>
                            {editingField === 'experience' ? (
                              <div className="space-y-3">
                                <Select value={formData.experienceLevel} onValueChange={(value) => setFormData({...formData, experienceLevel: value})}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Experience Level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Advanced">Advanced</SelectItem>
                                    <SelectItem value="Professional">Professional</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  value={formData.numberOfEvents}
                                  onChange={(e) => setFormData({...formData, numberOfEvents: e.target.value})}
                                  placeholder="Number of Events"
                                />
                                <Input
                                  type="number"
                                  value={formData.careerStartYear}
                                  onChange={(e) => setFormData({...formData, careerStartYear: e.target.value})}
                                  placeholder="Career Start Year"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveField('experience')} disabled={isSaving}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="group">
                                <div className="space-y-2">
                                  <p className="text-muted-foreground">
                                    Experience Level: <span className="font-semibold text-foreground">{formData.experienceLevel}</span>
                                  </p>
                                  <p className="text-muted-foreground flex items-center gap-2">
                                    <Award className="h-4 w-4 text-accent" />
                                    <span className="font-semibold text-foreground">{formData.numberOfEvents}+</span> events performed
                                  </p>
                                  <p className="text-muted-foreground">
                                    Career started in <span className="font-semibold text-foreground">{formData.careerStartYear}</span>
                                  </p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                                  onClick={() => startEditing('experience')}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Experience
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Gallery Tab */}
                      <TabsContent value="gallery">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                            <Images className="h-6 w-6 text-accent" />
                            My Gallery
                          </h2>
                          <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                            <DialogTrigger asChild>
                              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Media
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Media</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <Tabs value={galleryUploadType} onValueChange={(v) => setGalleryUploadType(v as 'image' | 'video')}>
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="image">Image</TabsTrigger>
                                    <TabsTrigger value="video">Video</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="image" className="space-y-4">
                                    <Label htmlFor="gallery-upload" className="cursor-pointer">
                                      <div className="border-2 border-dashed border-accent/50 rounded-lg p-8 text-center hover:border-accent transition-colors">
                                        <Upload className="h-12 w-12 mx-auto mb-2 text-accent" />
                                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                                      </div>
                                    </Label>
                                    <Input
                                      id="gallery-upload"
                                      type="file"
                                      accept="image/*"
                                      onChange={handleGalleryImageUpload}
                                      className="hidden"
                                    />
                                  </TabsContent>
                                  <TabsContent value="video" className="space-y-4">
                                    <div>
                                      <Label>YouTube/Video URL</Label>
                                      <Input
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/embed/..."
                                      />
                                    </div>
                                    <Button onClick={handleAddVideo} disabled={isSaving} className="w-full bg-accent text-accent-foreground">
                                      {isSaving ? "Adding..." : "Add Video"}
                                    </Button>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {galleryItems.map((item) => (
                            <div key={item.id} className="relative group">
                              {item.type === 'image' ? (
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-accent/20">
                                  <img 
                                    src={item.url} 
                                    alt="Gallery item"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-accent/20 bg-black/80 flex items-center justify-center">
                                  <Play className="h-12 w-12 text-accent" />
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteGalleryItem(item.id, item.url, item.type)}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {galleryItems.length === 0 && (
                            <div className="col-span-full text-center text-muted-foreground py-8">
                              No media yet. Add your first image or video!
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Calendar Tab */}
                      <TabsContent value="calendar">
                        <div>
                          <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6 text-accent" />
                            My Availability Calendar
                          </h2>
                          <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  setSelectedDate(date);
                                  if (date) {
                                    const event = getEventForDate(date);
                                    if (event) {
                                      setEventStatus(event.status);
                                      setEventNotes(event.notes || "");
                                    } else {
                                      setEventStatus('busy');
                                      setEventNotes("");
                                    }
                                  }
                                }}
                                className="rounded-lg border border-border shadow-sm"
                                modifiers={{
                                  busy: calendarEvents.filter(e => e.status === 'busy').map(e => new Date(e.event_date)),
                                  blocked: calendarEvents.filter(e => e.status === 'blocked').map(e => new Date(e.event_date))
                                }}
                                modifiersClassNames={{
                                  busy: "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground opacity-70",
                                  blocked: "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground opacity-80"
                                }}
                              />
                            </div>
                            <div className="lg:w-80 space-y-4">
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
                                <Card className="p-4">
                                  <h4 className="font-semibold text-foreground mb-3">
                                    {selectedDate.toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <Label>Status</Label>
                                      <Select value={eventStatus} onValueChange={(v) => setEventStatus(v as any)}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="available">Available</SelectItem>
                                          <SelectItem value="busy">Busy / Booked</SelectItem>
                                          <SelectItem value="blocked">Unavailable</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>Notes (optional)</Label>
                                      <Textarea
                                        value={eventNotes}
                                        onChange={(e) => setEventNotes(e.target.value)}
                                        placeholder="Event details..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={handleSaveCalendarEvent} disabled={isSaving} className="flex-1 bg-accent text-accent-foreground">
                                        {isSaving ? "Saving..." : "Save"}
                                      </Button>
                                      {getEventForDate(selectedDate) && (
                                        <Button variant="outline" onClick={handleDeleteCalendarEvent} disabled={isSaving}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Messages Tab */}
              {activeTab === "messages" && (
                <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
                  <CardContent className="p-8">
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h2 className="text-2xl font-display font-bold mb-2">Messages</h2>
                      <p className="text-muted-foreground">Coming soon - message system for booking inquiries</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Announcements Tab */}
              {activeTab === "announcements" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>New Announcement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Title</Label>
                            <Input
                              value={newAnnouncement.title}
                              onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                              placeholder="Announcement title"
                            />
                          </div>
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={newAnnouncement.date}
                              onChange={(e) => setNewAnnouncement({...newAnnouncement, date: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newAnnouncement.description}
                              onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})}
                              placeholder="Announcement details..."
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleAddAnnouncement} disabled={isSaving} className="w-full bg-accent text-accent-foreground">
                            {isSaving ? "Adding..." : "Add Announcement"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id} className="border-accent/20">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-xl font-semibold text-foreground">{announcement.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-accent/50 text-accent whitespace-nowrap">
                                {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                disabled={isSaving}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{announcement.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {announcements.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No announcements yet. Add your first one!</p>
                    )}
                  </div>
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === "posts" && (
                <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
                  <CardContent className="p-8">
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h2 className="text-2xl font-display font-bold mb-2">Posts</h2>
                      <p className="text-muted-foreground">Coming soon - blog/news posts feature</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <Card className="border-2 border-accent/30 shadow-[var(--shadow-gold)]">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-display font-bold mb-4">Account Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Email (Cannot be changed)</Label>
                        <Input
                          value={formData.email}
                          disabled
                          className="mt-2 bg-muted/50"
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={handleLogout}
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-foreground mb-4">Crop Profile Picture</h3>
            
            <div className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden mb-4">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>
            
            <div className="space-y-2 mb-4">
              <Label>Zoom: {zoom.toFixed(1)}x</Label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowCropper(false); setImageSrc(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveAvatar} disabled={isSaving} className="bg-accent text-accent-foreground">
                {isSaving ? "Saving..." : "Save Picture"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
