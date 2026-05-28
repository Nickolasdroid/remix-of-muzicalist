import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Send, ArrowLeft, MessageCircle, Trash2, MoreVertical, Megaphone, MapPin, Calendar, Euro, X } from "lucide-react";
import { formatDateNoYear } from "@/lib/utils";
import { isAdExpired } from "@/lib/adExpiration";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { getAvatarRingClasses } from "@/lib/subscriptionStyles";
interface Conversation {
  id: string;
  artist_id: string;
  participant_id: string;
  updated_at: string;
  announcement_id?: string | null;
  deleted_at_by_artist?: string | null;
  deleted_at_by_participant?: string | null;
  artist_profile?: {
    stage_name: string;
    avatar_url: string | null;
    plan?: string;
    specialization?: string;
  };
  participant_profile?: {
    stage_name: string;
    avatar_url: string | null;
    plan?: string;
    specialization?: string;
  };
  other_profile?: {
    stage_name: string;
    avatar_url: string | null;
    plan?: string;
    specialization?: string;
  };
  announcement_context?: AnnouncementContext | null;
}
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}
interface PendingArtist {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  plan?: string;
  specialization?: string;
}

interface AnnouncementContext {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  event_date?: string | null;
  budget?: string | null;
  profile_id?: string;
  date?: string;
  is_premium?: boolean;
}

const AnnouncementHeader = ({ ad }: { ad: AnnouncementContext; onDismiss?: () => void }) => (
  <div className="mx-4 mt-3 mb-1 rounded-lg border border-accent/30 bg-accent/5 p-3 relative">
    <p className="text-xs font-semibold text-accent mb-1">Regarding Announcement</p>
    <p className="text-sm font-medium text-foreground pr-4">{ad.title}</p>
    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ad.description}</p>
    {(ad.location || ad.event_date || ad.budget) && (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
        {ad.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ad.location}</span>}
        {ad.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateNoYear(ad.event_date)}</span>}
        {ad.budget && <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{ad.budget}</span>}
      </div>
    )}
  </div>
);

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pendingArtist, setPendingArtist] = useState<PendingArtist | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conversations' | 'announcements'>('conversations');
  const [adsSubTab, setAdsSubTab] = useState<'requests' | 'applications'>('requests');
  const [announcementContext, setAnnouncementContext] = useState<AnnouncementContext | null>(null);
  const messagesCache = useRef<Record<string, Message[]>>({});
  const artistId = searchParams.get("artistId");
  const adId = searchParams.get("adId");
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  // Fetch announcement context if adId is present
  useEffect(() => {
    if (!adId) return;
    const fetchAd = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, description, location, event_date, budget, profile_id, date, is_premium')
        .eq('id', adId)
        .maybeSingle();
      if (data) {
        setAnnouncementContext(data);
      }
    };
    fetchAd();
  }, [adId]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    fetchUnreadCounts();
  }, [user]);

  // Separate effect for realtime subscription to handle selectedConversation changes
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages across all conversations for notifications
    const channel = supabase.channel('all-messages-notifications').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, payload => {
      const newMsg = payload.new as Message;
      // Only count as unread if not from current user and not in currently selected conversation
      if (newMsg.sender_id !== user.id && newMsg.conversation_id !== selectedConversation?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1
        }));
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation?.id]);
  useEffect(() => {
    if (!user || !artistId || loading) return;
    // If coming from an ad, switch to ads tab
    if (adId) {
      setActiveTab('announcements');
    }
    handleArtistContact();
  }, [user, artistId, loading, conversations]);
  useEffect(() => {
    if (!selectedConversation || !user) return;
    fetchMessages(selectedConversation.id);
    markMessagesAsRead(selectedConversation.id);

    // Clear unread count for selected conversation
    setUnreadCounts(prev => {
      const updated = {
        ...prev
      };
      delete updated[selectedConversation.id];
      return updated;
    });

    // Subscribe to new messages
    const channel = supabase.channel(`messages-${selectedConversation.id}`).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${selectedConversation.id}`
    }, payload => {
      const newMsg = payload.new as Message;
      setMessages(prev => [...prev, newMsg]);
      // Mark as read immediately if it's from the other user
      if (newMsg.sender_id !== user.id) {
        markMessagesAsRead(selectedConversation.id);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);
  const fetchConversations = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('conversations').select('*, deleted_at_by_artist, deleted_at_by_participant').order('updated_at', {
      ascending: false
    });
    if (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    // Fetch profile info and announcement context for each conversation
    const conversationsWithProfiles = await Promise.all((data || []).map(async conv => {
      const otherUserId = conv.artist_id === user.id ? conv.participant_id : conv.artist_id;

      // Fetch other user's profile
      const {
        data: otherProfile
      } = await supabase.from('profiles').select('stage_name, avatar_url, plan, specialization').eq('id', otherUserId).maybeSingle();

      // Fetch artist's profile for specialization
      const {
        data: artistProfile
      } = await supabase.from('profiles').select('stage_name, avatar_url, plan, specialization').eq('id', conv.artist_id).maybeSingle();

      // Fetch announcement context if this is an ad conversation
      let announcement_context: AnnouncementContext | null = null;
      if (conv.announcement_id) {
        const { data: adData } = await supabase
          .from('announcements')
          .select('id, title, description, location, event_date, budget, profile_id, date, is_premium')
          .eq('id', conv.announcement_id)
          .maybeSingle();
        announcement_context = adData;
      }

      return {
        ...conv,
        other_profile: otherProfile,
        artist_profile: artistProfile,
        announcement_context
      };
    }));
    setConversations(conversationsWithProfiles);
    setLoading(false);
  };
  const fetchUnreadCounts = async () => {
    if (!user) return;

    // Get all unread messages (not sent by current user and not read)
    const {
      data: unreadMessages,
      error
    } = await supabase.from('messages').select('conversation_id').neq('sender_id', user.id).is('read_at', null);
    if (error) {
      console.error('Error fetching unread counts:', error);
      return;
    }

    // Count unread messages per conversation
    const counts: Record<string, number> = {};
    (unreadMessages || []).forEach(msg => {
      counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
    });
    setUnreadCounts(counts);
  };
  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;
    await supabase.from('messages').update({
      read_at: new Date().toISOString()
    }).eq('conversation_id', conversationId).neq('sender_id', user.id).is('read_at', null);
  };
  const handleArtistContact = async () => {
    if (!artistId || !user || artistId === user.id) return;

    // For ad conversations, look for existing conversation with same ad
    if (adId) {
      const existingAdConv = conversations.find(c => c.announcement_id === adId);
      if (existingAdConv) {
        setSelectedConversation(existingAdConv);
        setActiveTab('announcements');
        setPendingArtist(null);
        return;
      }
    }

    // For regular conversations (no ad), find existing one without announcement
    if (!adId) {
      const existingConv = conversations.find(c => 
        !c.announcement_id &&
        ((c.artist_id === artistId && c.participant_id === user.id) || 
         (c.participant_id === artistId && c.artist_id === user.id))
      );
      if (existingConv) {
        setSelectedConversation(existingConv);
        setPendingArtist(null);
        return;
      }
    }

    // No existing conversation - set up pending artist view
    const {
      data: profile
    } = await supabase.from('profiles').select('stage_name, avatar_url, plan, specialization').eq('id', artistId).maybeSingle();
    if (profile) {
      setPendingArtist({
        id: artistId,
        stage_name: profile.stage_name,
        avatar_url: profile.avatar_url,
        plan: profile.plan,
        specialization: profile.specialization
      });
      setSelectedConversation(null);
      setMessages([]);
    }
  };
  const fetchMessages = async (conversationId: string) => {
    // Get the conversation to check deletion timestamp
    const conversation = conversations.find(c => c.id === conversationId) || selectedConversation;
    let query = supabase.from('messages').select('*').eq('conversation_id', conversationId);

    // Filter messages by deletion timestamp if applicable
    if (conversation && user) {
      const isArtist = conversation.artist_id === user.id;
      const deletedAt = isArtist ? conversation.deleted_at_by_artist : conversation.deleted_at_by_participant;
      if (deletedAt) {
        // Only show messages created after the deletion timestamp
        query = query.gt('created_at', deletedAt);
      }
    }
    const {
      data,
      error
    } = await query.order('created_at', {
      ascending: true
    });
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    setMessages(data || []);
  };
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Check if we have either a selected conversation or a pending artist
    if (!selectedConversation && !pendingArtist) return;
    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update - add message immediately to UI
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: selectedConversation?.id || 'pending',
      sender_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      read_at: null
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setSending(true);
    let conversationId = selectedConversation?.id;

    // If we have a pending artist, create the conversation first
    if (pendingArtist && !selectedConversation) {
      const rpcParams: any = {
        _artist_id: pendingArtist.id,
        _participant_id: user.id
      };
      if (adId) {
        rpcParams._announcement_id = adId;
      }
      const {
        data: newConvId,
        error: rpcError
      } = await supabase.rpc('get_or_create_conversation', rpcParams);
      if (rpcError || !newConvId) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setNewMessage(messageContent);
        toast({
          title: "Error",
          description: "Could not start conversation",
          variant: "destructive"
        });
        setSending(false);
        return;
      }
      conversationId = newConvId;

      // Fetch the new conversation and add to list
      const {
        data: conv
      } = await supabase.from('conversations').select('*').eq('id', newConvId).single();
      const convWithProfile: Conversation = {
        ...conv,
        other_profile: {
          stage_name: pendingArtist.stage_name,
          avatar_url: pendingArtist.avatar_url,
          plan: pendingArtist.plan,
          specialization: pendingArtist.specialization
        },
        artist_profile: {
          stage_name: pendingArtist.stage_name,
          avatar_url: pendingArtist.avatar_url,
          plan: pendingArtist.plan,
          specialization: pendingArtist.specialization
        },
        announcement_context: announcementContext || null
      };
      setConversations(prev => [convWithProfile, ...prev]);
      setSelectedConversation(convWithProfile);
      setPendingArtist(null);
    }
    const {
      data,
      error
    } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: messageContent
    }).select().single();
    if (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageContent);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
    } else {
      // Replace optimistic message with real one (to avoid duplicates from realtime)
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      // Update conversation's updated_at
      await supabase.from('conversations').update({
        updated_at: new Date().toISOString()
      }).eq('id', conversationId);
    }
    setSending(false);
  };
  const getOtherProfile = (conv: Conversation | null | undefined) => {
    return conv?.other_profile ?? {
      stage_name: "Unknown",
      avatar_url: null,
      plan: "Free",
      specialization: null
    };
  };
  const getOtherSpecialization = (conv: Conversation) => {
    const profile = getOtherProfile(conv);
    return profile.specialization || "User";
  };
  const formatMessageDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d, yyyy");
  };
  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at);
    const prevDate = new Date(prevMsg.created_at);
    return !isSameDay(currentDate, prevDate);
  };
  const getPlanRingColor = (plan?: string) => getAvatarRingClasses(plan);

  // Compute unread counts for Announcements tab and sub-tabs
  const adConvsAll = conversations.filter(c => !!c.announcement_id);
  const adsUnreadTotal = adConvsAll.reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);
  const requestsUnreadTotal = adConvsAll
    .filter(c => c.announcement_context?.profile_id === user?.id)
    .reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);
  const applicationsUnreadTotal = adConvsAll
    .filter(c => c.announcement_context?.profile_id !== user?.id)
    .reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);
  const conversationsUnreadTotal = conversations
    .filter(c => !c.announcement_id)
    .reduce((sum, c) => sum + (unreadCounts[c.id] || 0), 0);

  // Check if ad conversation is locked (ad deleted or expired)
  const isAdConversationLocked = (() => {
    const conv = selectedConversation;
    if (!conv?.announcement_id) return false;
    // Ad was deleted (no context found)
    if (!conv.announcement_context) return true;
    // Ad is expired
    const adDate = conv.announcement_context.date;
    if (!adDate) return false;
    return isAdExpired({ date: adDate, is_premium: !!conv.announcement_context.is_premium });
  })();

  const UnreadBadge = ({ count }: { count: number }) => count > 0 ? (
    <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 inline-flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    const {
      error
    } = await supabase.rpc('soft_delete_conversation', {
      _conversation_id: conversationToDelete
    });
    if (error) {
      toast({
        title: "Error",
        description: "Could not delete conversation",
        variant: "destructive"
      });
    } else {
      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationToDelete));
      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null);
        setMessages([]);
      }
      toast({
        title: "Deleted",
        description: "Conversation deleted"
      });
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };
  const openDeleteDialog = (conversationId: string) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };
  if (loading && !user) {
    return <div className="min-h-screen md:ml-64 bg-background">
        <Navigation />
        <div className="pt-20 md:pt-8 text-center text-muted-foreground">Loading...</div>
      </div>;
  }
  return <div className="min-h-screen md:ml-64 bg-background">
      <Navigation />
      
      <div className="px-0 pt-14 md:pt-0 pb-16 md:pb-0 h-screen">
        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 h-screen">
          {/* Conversations List */}
          <div className="md:col-span-1 p-0 overflow-hidden bg-card border-r border-border">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${activeTab === 'conversations' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Conversations<UnreadBadge count={conversationsUnreadTotal} />
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${activeTab === 'announcements' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Announcements<UnreadBadge count={adsUnreadTotal} />
              </button>
            </div>
            <ScrollArea className="h-[calc(100%-45px)]">
              {activeTab === 'conversations' ? (
                (() => {
                  const regularConvs = conversations.filter(c => !c.announcement_id);
                  return regularConvs.length === 0 ? <div className="p-4 text-center text-muted-foreground">
                  No conversations yet
                </div> : regularConvs.map(conv => {
                  const profile = getOtherProfile(conv);
                  return <div key={conv.id} className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-accent/10' : ''}`} onClick={() => { setSelectedConversation(conv); setAnnouncementContext(null); }}>
                    <Avatar className={`h-10 w-10 ${getPlanRingColor(profile.plan)}`}>
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{profile.stage_name}</p>
                        {unreadCounts[conv.id] > 0 && <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                          {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                        </span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>;
                });
                })()
              ) : activeTab === 'announcements' ? (
                (() => {
                  const adConvs = conversations.filter(c => !!c.announcement_id);
                  // Requests: ads I posted, others applied to
                  const requestConvs = adConvs.filter(c => c.announcement_context?.profile_id === user?.id);
                  // Applications: ads others posted, I applied to
                  const applicationConvs = adConvs.filter(c => c.announcement_context?.profile_id !== user?.id);
                  const currentList = adsSubTab === 'requests' ? requestConvs : applicationConvs;

                  return <>
                    <div className="flex border-b border-border/50 bg-muted/30">
                      <button
                        onClick={() => setAdsSubTab('requests')}
                        className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${adsSubTab === 'requests' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Requests<UnreadBadge count={requestsUnreadTotal} />
                      </button>
                      <button
                        onClick={() => setAdsSubTab('applications')}
                        className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${adsSubTab === 'applications' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Applications<UnreadBadge count={applicationsUnreadTotal} />
                      </button>
                    </div>
                    {currentList.length === 0 ? <div className="p-4 text-center text-muted-foreground">
                      <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p>{adsSubTab === 'requests' ? 'No requests yet' : 'No applications yet'}</p>
                      <p className="text-xs mt-1">{adsSubTab === 'requests' ? 'When someone applies to your ad, it will appear here' : 'When you apply to an ad, it will appear here'}</p>
                    </div> : currentList.map(conv => {
                      const profile = getOtherProfile(conv);
                      return <div key={conv.id} className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-accent/10' : ''}`} onClick={() => { setSelectedConversation(conv); setAnnouncementContext(conv.announcement_context || null); }}>
                        <Avatar className={`h-10 w-10 ${getPlanRingColor(profile.plan)}`}>
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{profile.stage_name}</p>
                            {unreadCounts[conv.id] > 0 && <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                              {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                            </span>}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {conv.announcement_context?.title || "Ad conversation"}
                          </p>
                        </div>
                      </div>;
                    })}
                    </>;
                  })()
                ) : null}
              </ScrollArea>
            </div>

          {/* Messages Area */}
          <div className="md:col-span-2 p-0 overflow-hidden flex flex-col bg-card">
            {selectedConversation || pendingArtist ? <>
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Avatar className={`h-10 w-10 ${getPlanRingColor(selectedConversation ? getOtherProfile(selectedConversation).plan : pendingArtist?.plan)}`}>
                    <AvatarImage src={selectedConversation ? getOtherProfile(selectedConversation).avatar_url || undefined : pendingArtist?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold">
                      {selectedConversation ? getOtherProfile(selectedConversation).stage_name : pendingArtist?.stage_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedConversation ? getOtherSpecialization(selectedConversation) : pendingArtist?.specialization || "User"}
                    </span>
                  </div>
                  {selectedConversation && <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(selectedConversation.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>}
                </div>

                {/* Announcement context header */}
                {announcementContext && <AnnouncementHeader ad={announcementContext} onDismiss={() => setAnnouncementContext(null)} />}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && pendingArtist && <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Send a message to start the conversation
                      </div>}
                    {messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                  return <div key={msg.id}>
                          {showDateSeparator && <div className="flex items-center justify-center my-4">
                              <div className="bg-muted px-3 py-1 rounded-full">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatMessageDate(new Date(msg.created_at))}
                                </span>
                              </div>
                            </div>}
                          <div className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender_id === user?.id ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                              <p>{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                                </span>
                                {msg.sender_id === user?.id && <span className={`text-xs ${msg.read_at ? 'text-blue-400' : 'opacity-50'}`}>
                                    {msg.read_at ? '✓✓' : '✓'}
                                  </span>}
                              </div>
                            </div>
                          </div>
                        </div>;
                })}
                  </div>
                </ScrollArea>

                {/* Input */}
                {isAdConversationLocked ? (
                  <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
                    This ad has been deleted or has expired. You can no longer send messages.
                  </div>
                ) : (
                <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sending} />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                )}
              </> : <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>}
          </div>
        </div>

        {/* Mobile: Full-width conversation list */}
        <div className="md:hidden h-full">
          <div className="p-0 overflow-hidden bg-card h-full border-t border-border">
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${activeTab === 'conversations' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Conversations<UnreadBadge count={conversationsUnreadTotal} />
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${activeTab === 'announcements' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Announcements<UnreadBadge count={adsUnreadTotal} />
              </button>
            </div>
            <div className="overflow-hidden h-[calc(100%-45px)]">
              {activeTab === 'conversations' ? (
                (() => {
                  const regularConvs = conversations.filter(c => !c.announcement_id);
                  return regularConvs.length === 0 ? <div className="p-4 text-center text-muted-foreground">
                  No conversations yet
                </div> : regularConvs.map(conv => {
                  const profile = getOtherProfile(conv);
                  return <div key={conv.id} className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-accent/10' : ''}`} onClick={() => { setSelectedConversation(conv); setAnnouncementContext(null); }}>
                    <Avatar className={`h-10 w-10 ${getPlanRingColor(profile.plan)}`}>
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{profile.stage_name}</p>
                        {unreadCounts[conv.id] > 0 && <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                          {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                        </span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>;
                });
                })()
              ) : activeTab === 'announcements' ? (
                (() => {
                  const adConvs = conversations.filter(c => !!c.announcement_id);
                  const requestConvs = adConvs.filter(c => c.announcement_context?.profile_id === user?.id);
                  const applicationConvs = adConvs.filter(c => c.announcement_context?.profile_id !== user?.id);
                  const currentList = adsSubTab === 'requests' ? requestConvs : applicationConvs;

                  return <>
                    <div className="flex border-b border-border/50 bg-muted/30">
                      <button
                        onClick={() => setAdsSubTab('requests')}
                        className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${adsSubTab === 'requests' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Requests<UnreadBadge count={requestsUnreadTotal} />
                      </button>
                      <button
                        onClick={() => setAdsSubTab('applications')}
                        className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${adsSubTab === 'applications' ? 'text-foreground border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Applications<UnreadBadge count={applicationsUnreadTotal} />
                      </button>
                    </div>
                    {currentList.length === 0 ? <div className="p-4 text-center text-muted-foreground">
                      <p>{adsSubTab === 'requests' ? 'No requests yet' : 'No applications yet'}</p>
                      <p className="text-xs mt-1">{adsSubTab === 'requests' ? 'When someone applies to your ad, it will appear here' : 'When you apply to an ad, it will appear here'}</p>
                    </div> : currentList.map(conv => {
                      const profile = getOtherProfile(conv);
                      return <div key={conv.id} className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-accent/10' : ''}`} onClick={() => { setSelectedConversation(conv); setAnnouncementContext(conv.announcement_context || null); }}>
                        <Avatar className={`h-10 w-10 ${getPlanRingColor(profile.plan)}`}>
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{profile.stage_name}</p>
                            {unreadCounts[conv.id] > 0 && <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                              {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                            </span>}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {conv.announcement_context?.title || "Ad conversation"}
                          </p>
                        </div>
                      </div>;
                    })}
                    </>;
                  })()
                ) : null}
            </div>
          </div>


          {/* Mobile: Chat overlay */}
          {(selectedConversation || pendingArtist) && <div className="fixed top-14 bottom-16 left-0 right-0 z-40 bg-background">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-3 border-b border-border flex items-center gap-3 bg-card">
                  <Button variant="ghost" size="icon" onClick={() => {
                setSelectedConversation(null);
                setPendingArtist(null);
              }}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className={`h-9 w-9 ${getPlanRingColor(selectedConversation ? getOtherProfile(selectedConversation).plan : pendingArtist?.plan)}`}>
                    <AvatarImage src={selectedConversation ? getOtherProfile(selectedConversation).avatar_url || undefined : pendingArtist?.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {selectedConversation ? getOtherProfile(selectedConversation).stage_name : pendingArtist?.stage_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedConversation ? getOtherSpecialization(selectedConversation) : pendingArtist?.specialization || "User"}
                    </span>
                  </div>
                  {selectedConversation && <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(selectedConversation.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete conversation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>}
                </div>

                {/* Announcement context header */}
                {announcementContext && <AnnouncementHeader ad={announcementContext} onDismiss={() => setAnnouncementContext(null)} />}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-card">
                  <div className="space-y-4">
                    {messages.length === 0 && pendingArtist && <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        Send a message to start the conversation
                      </div>}
                    {messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                  return <div key={msg.id}>
                          {showDateSeparator && <div className="flex items-center justify-center my-4">
                              <div className="bg-muted px-3 py-1 rounded-full">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatMessageDate(new Date(msg.created_at))}
                                </span>
                              </div>
                            </div>}
                          <div className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender_id === user?.id ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                              <p className="text-sm">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                                </span>
                                {msg.sender_id === user?.id && <span className={`text-xs ${msg.read_at ? 'text-blue-400' : 'opacity-50'}`}>
                                    {msg.read_at ? '✓✓' : '✓'}
                                  </span>}
                              </div>
                            </div>
                          </div>
                        </div>;
                })}
                  </div>
                </ScrollArea>

                {/* Input */}
                {isAdConversationLocked ? (
                  <div className="p-3 border-t border-border text-center text-sm text-muted-foreground bg-card">
                    This ad has been deleted or has expired. You can no longer send messages.
                  </div>
                ) : (
                <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2 bg-card">
                  <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sending} className="text-base" />
                  <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                )}
              </div>
            </div>}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from your inbox. The other person will still be able to see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Messages;