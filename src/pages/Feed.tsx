import { useState } from "react";
import { Heart, Bookmark, Mail, Play } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PostType = "post" | "standard-ad" | "premium-ad";
type ArtistType = "Soloist" | "Instrumentalist" | "DJ" | "Band";

interface FeedItem {
  id: string;
  artistName: string;
  artistType: ArtistType;
  postType: PostType;
  content: {
    text: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
  };
  likes: number;
  isLiked: boolean;
  isSaved: boolean;
}

const Feed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: "1",
      artistName: "Maria Popescu",
      artistType: "Soloist",
      postType: "post",
      content: {
        text: "Excited to share my performance from last night! 🎤",
        mediaUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800",
        mediaType: "image"
      },
      likes: 124,
      isLiked: false,
      isSaved: false
    },
    {
      id: "2",
      artistName: "Alex Ionescu",
      artistType: "DJ",
      postType: "premium-ad",
      content: {
        text: "Book me for your next event! Specializing in weddings and corporate parties. Professional equipment included. Contact for pricing.",
        mediaUrl: "https://images.unsplash.com/photo-1571266028243-d220c6e8d2fa?w=800",
        mediaType: "image"
      },
      likes: 89,
      isLiked: false,
      isSaved: false
    },
    {
      id: "3",
      artistName: "Bucharest Strings",
      artistType: "Band",
      postType: "standard-ad",
      content: {
        text: "Professional string quartet available for weddings, corporate events, and special occasions. Over 10 years of experience. Competitive rates!"
      },
      likes: 45,
      isLiked: false,
      isSaved: false
    },
    {
      id: "4",
      artistName: "Andrei Violin",
      artistType: "Instrumentalist",
      postType: "post",
      content: {
        text: "New video from today's rehearsal 🎻",
        mediaUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
        mediaType: "video"
      },
      likes: 203,
      isLiked: false,
      isSaved: false
    }
  ]);

  const handleLike = (id: string) => {
    setFeedItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const handleSave = (id: string) => {
    setFeedItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isSaved: !item.isSaved } : item
      )
    );
  };

  const getPostTypeLabel = (type: PostType) => {
    switch (type) {
      case "post":
        return "Post";
      case "standard-ad":
        return "Ad";
      case "premium-ad":
        return "Premium Ad";
    }
  };

  const getPostTypeColor = (type: PostType) => {
    switch (type) {
      case "post":
        return "bg-primary/10 text-primary border-primary/20";
      case "standard-ad":
        return "bg-secondary/10 text-secondary-foreground border-secondary/20";
      case "premium-ad":
        return "bg-accent/10 text-accent-foreground border-accent/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl font-display font-bold text-foreground mb-8">Feed</h1>
          
          {feedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/40">
              <CardContent className="p-6">
                {/* Artist Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent font-semibold">
                        {item.artistName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.artistName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.artistType}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPostTypeColor(item.postType)}`}>
                          {getPostTypeLabel(item.postType)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-foreground mb-4">{item.content.text}</p>
                
                {/* Media */}
                {item.content.mediaUrl && (
                  <div className="relative rounded-lg overflow-hidden mb-4">
                    {item.content.mediaType === "video" ? (
                      <div className="relative aspect-video bg-muted flex items-center justify-center">
                        <img 
                          src={item.content.mediaUrl} 
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center">
                            <Play className="w-8 h-8 text-accent-foreground ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={item.content.mediaUrl} 
                        alt="Post content"
                        className="w-full h-auto rounded-lg"
                      />
                    )}
                  </div>
                )}
              </CardContent>

              {/* Actions */}
              <CardFooter className="p-6 pt-0 flex items-center justify-between border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(item.id)}
                    className={item.isLiked ? "text-accent" : ""}
                  >
                    <Heart className={`w-5 h-5 ${item.isLiked ? "fill-current" : ""}`} />
                    <span className="ml-2">{item.likes}</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSave(item.id)}
                    className={item.isSaved ? "text-accent" : ""}
                  >
                    <Bookmark className={`w-5 h-5 ${item.isSaved ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <Button size="sm" variant="outline" className="border-accent/20">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feed;
