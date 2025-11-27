import { useNavigate } from "react-router-dom";
import { User, MessageSquare, Megaphone, FileText, Settings, LogOut, Images, Calendar, Mail } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface ArtistSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onLogout: () => void;
}

const ArtistSidebar = ({ open, onOpenChange, profile, onLogout }: ArtistSidebarProps) => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: "My Profile", tab: "profile" },
    { icon: MessageSquare, label: "Messages", tab: "messages" },
    { icon: Mail, label: "Booking Requests", tab: "bookings" },
    { icon: Megaphone, label: "Announcements", tab: "announcements" },
    { icon: Images, label: "Gallery", tab: "gallery" },
    { icon: Calendar, label: "Calendar", tab: "calendar" },
    { icon: FileText, label: "My Posts", tab: "posts" },
    { icon: Settings, label: "Settings", tab: "settings" },
  ];

  const handleMenuClick = (tab: string) => {
    navigate(`/dashboard?tab=${tab}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 bg-background border-l border-accent/20">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-accent">Artist Dashboard</SheetTitle>
          
          <div className="flex flex-col items-center gap-3 py-4">
            <Avatar className="h-20 w-20 ring-4 ring-accent/30">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
                {profile?.stage_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h3 className="font-semibold text-lg text-foreground">
                {profile?.stage_name}
              </h3>
              {profile?.specialization && (
                <p className="text-sm text-muted-foreground">{profile.specialization}</p>
              )}
            </div>

            {profile?.plan && (
              <Badge variant="secondary" className="bg-accent/20 text-accent">
                {profile.plan} Plan
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-4 bg-accent/20" />

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.tab}
              variant="ghost"
              className="w-full justify-start text-left hover:bg-accent/10 hover:text-accent"
              onClick={() => handleMenuClick(item.tab)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <Separator className="my-4 bg-accent/20" />

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            onLogout();
            onOpenChange(false);
          }}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default ArtistSidebar;
