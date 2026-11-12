import { useState, useEffect, useRef } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { opportunityDisplayTitle } from "@/lib/opportunities";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCloseOnBack } from "@/lib/modalHistory";
import { goBack } from "@/lib/backNavigation";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { knownUser } from "@/lib/knownUser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Send, ArrowLeft, MessageCircle, Trash2, MoreHorizontal, Megaphone, MapPin, Calendar, Euro, X, Check, CheckCheck } from "lucide-react";
import { formatDateNoYear } from "@/lib/utils";
import { isAdExpired } from "@/lib/adExpiration";
import { translateSpecialization } from "@/lib/specializationLabel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
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
  /** Opportunities: own expiry (event day / 30 days for collaborations) */
  kind?: string | null;
  /** Collaborations: the artist the author chose */
  chosen_profile_id?: string | null;
  expires_at?: string | null;
}

const AnnouncementHeader = ({ ad, viewerId, otherId, rejected }: { ad: AnnouncementContext; viewerId?: string | null; otherId?: string | null; rejected?: boolean; onDismiss?: () => void }) => {
  const { i18n } = useTranslation();
  // Collaborations: who was chosen, seen from this conversation
  const chosen = ad.kind === "collab" ? ad.chosen_profile_id : null;
  const chosenLine = ad.kind === "collab" && rejected && chosen !== otherId && chosen !== viewerId
    ? { ok: false, text: ad.profile_id === viewerId ? "You rejected this artist" : "You weren't chosen for this collaboration" }
    : !chosen
    ? null
    : chosen === viewerId
      ? { ok: true, text: "You were chosen for this collaboration. Send your offer from Bookings" }
      : chosen === otherId && ad.profile_id === viewerId
        ? { ok: true, text: "You chose this artist" }
        : { ok: false, text: "This collaboration has been filled" };
  return (
  <div className="mx-4 mt-3 mb-1 rounded-lg border border-accent/30 bg-accent/5 p-3 relative">
    <p className="text-xs font-semibold text-accent mb-1 flex items-center gap-1"><Megaphone className="h-3 w-3" /><span>{ad.kind === "gig" ? "About the event" : "About the collaboration"}</span></p>
    <p className="text-sm font-medium text-foreground pr-4 notranslate" data-user-content="true" data-no-translate="true" translate="no">{opportunityDisplayTitle(ad as any, i18n.language || "ro")}</p>
    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 notranslate" data-user-content="true" data-no-translate="true" translate="no">{ad.description}</p>
    {chosenLine && (
      <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${chosenLine.ok ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"}`}>
        {chosenLine.ok && <span aria-hidden="true">✓</span>}
        <span>{chosenLine.text}</span>
      </p>
    )}
    {(ad.location || ad.event_date || ad.budget) && (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
        {ad.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span className="notranslate" data-user-content="true" data-no-translate="true" translate="no">{ad.location}</span></span>}
        {ad.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateNoYear(ad.event_date)}</span>}
        {ad.budget && <span className="flex items-center gap-1"><Euro className="h-3 w-3" /><span className="notranslate" data-user-content="true" data-no-translate="true" translate="no">{ad.budget}</span></span>}
      </div>
    )}
  </div>
  );
};

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    t,
    i18n
  } = useTranslation();
  const adTitle = (ad?: AnnouncementContext | null) => (ad ? opportunityDisplayTitle(ad as any, i18n.language || "ro") : "");
  usePageTitle("Messages");
  const [user, setUser] = useState<any>(knownUser);
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
  const [announcementContext, setAnnouncementContext] = useState<AnnouncementContext | null>(null);
  const messagesCache = useRef<Record<string, Message[]>>({});
  const artistId = searchParams.get("artistId");
  const adId = searchParams.get("adId");
  // ?c=<conversation id>: open that conversation (e.g. a reply on a collaboration card)
  const convParam = searchParams.get("c") || searchParams.get("conversation");
  // Opened from a dashboard announcement: show only the replies to that announcement
  const [forAd, setForAd] = useState<string | null>(searchParams.get("forAd"));
  // Title of the filtered event / collaboration when no conversation about it exists yet
  const [forAdFallback, setForAdFallback] = useState<AnnouncementContext | null>(null);
  useEffect(() => {
    if (!forAd) return;
    let active = true;
    supabase.from("announcements").select("*").eq("id", forAd).maybeSingle().then(({ data }) => {
      if (active) setForAdFallback((data as AnnouncementContext) ?? null);
    });
    return () => {
      active = false;
    };
  }, [forAd]);

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
        .select('*')
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
    handleArtistContact();
  }, [user, artistId, loading, conversations]);
  useEffect(() => {
    if (!selectedConversation || !user) return;
    // Instant: show cached messages immediately (empty array if none) so the panel switches without delay
    const cached = messagesCache.current[selectedConversation.id];
    setMessages(cached || []);
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
      setMessages(prev => {
        const next = [...prev, newMsg];
        messagesCache.current[selectedConversation.id] = next;
        return next;
      });
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
          .select('*')
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
    const list = data || [];
    messagesCache.current[conversationId] = list;
    setMessages(list);
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
    return translateSpecialization(profile.specialization) || t('common.user', 'User');
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

  const convParamDoneRef = useRef(false);
  useEffect(() => {
    if (!convParam || convParamDoneRef.current) return;
    const conv = conversations.find((x) => x.id === convParam);
    if (!conv) return;
    convParamDoneRef.current = true;
    setSelectedConversation(conv);
    setAnnouncementContext(conv.announcement_context || null);
  }, [convParam, conversations]);

  // One inbox, like Facebook / Instagram. Conversations about an event or collaboration
  // carry a megaphone line with its title; ?forAd= narrows the list to the replies to one.
  const renderConversationList = () => {
    const forAdContext = forAd ? conversations.find(c => c.announcement_id === forAd)?.announcement_context ?? forAdFallback : null;
    const list = forAd ? conversations.filter(c => c.announcement_id === forAd) : conversations;
    return <>
      {forAd && (
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 py-1 pl-2.5 pr-1 text-xs text-accent">
            <Megaphone className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 truncate">
              <span>{forAdContext?.kind === "gig" ? "Event" : "Collaboration"}</span>
              <span>: </span>
              <span className="font-medium notranslate" translate="no">{adTitle(forAdContext)}</span>
            </span>
            <button type="button" onClick={() => setForAd(null)} aria-label="Show all conversations" className="grid h-5 w-5 shrink-0 place-items-center rounded-full hover:bg-accent/20">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      )}
      {list.length === 0 && loading ? null : list.length === 0 ? (forAd ? <div className="p-4 text-center text-sm text-muted-foreground">No replies yet</div> : (
        // Empty inbox: say what will show up here and give a way to start
        <div className="flex flex-col items-center px-6 pb-10 pt-16 text-center md:pt-20">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/[0.07]">
            <MessageCircle className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          </span>
          <p className="text-lg font-bold text-foreground">No messages yet</p>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">When you write to an artist or someone writes to you, the conversation shows up here.</p>
          <Link
            to="/artists"
            className="mt-6 inline-flex h-10 items-center rounded-full border border-foreground/40 px-6 text-sm font-bold text-foreground transition-colors hover:border-foreground"
          >
            Browse artists
          </Link>
        </div>
      )) : list.map(conv => {
        const profile = getOtherProfile(conv);
        const isAd = !!conv.announcement_id;
        return <div key={conv.id} className={`mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors ${selectedConversation?.id === conv.id ? 'bg-foreground/[0.1]' : 'hover:bg-foreground/[0.07]'}`} onClick={() => { setSelectedConversation(conv); setAnnouncementContext(isAd ? conv.announcement_context || null : null); }}>
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="text-left flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate notranslate" data-user-content="true" data-no-translate="true" translate="no">{profile.stage_name}</p>
                {unreadCounts[conv.id] > 0 && <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                  {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                </span>}
                <span className="ml-auto shrink-0 text-xs text-muted-foreground notranslate" translate="no">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </span>
              </div>
              {isAd && (
                <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Megaphone className="h-3.5 w-3.5 shrink-0 text-accent" aria-label={conv.announcement_context?.kind === "gig" ? "Event" : "Collaboration"} />
                  <span className="truncate notranslate" data-user-content="true" data-no-translate="true" translate="no">
                    {adTitle(conv.announcement_context) || (conv.announcement_context?.kind === "gig" ? "Event" : "Collaboration")}
                  </span>
                </p>
              )}
            </div>
          </div>;
      })}
    </>;
  };

  /** The open conversation, the same on phones (full screen) and desktop (right panel). */
  const renderChat = (mobile: boolean) => {
    const other = selectedConversation ? getOtherProfile(selectedConversation) : null;
    const name = other ? other.stage_name : pendingArtist?.stage_name;
    const avatar = (other ? other.avatar_url : pendingArtist?.avatar_url) || undefined;
    const spec = other ? other.specialization : pendingArtist?.specialization;
    const otherId = selectedConversation
      ? (selectedConversation.artist_id === user?.id ? selectedConversation.participant_id : selectedConversation.artist_id)
      : pendingArtist?.id;
    const subtitle = translateSpecialization(spec) || t('common.user', 'User');
    // Only artists have a public profile to open
    const profileHref = spec && otherId ? `/artist/${otherId}` : null;
    const who = <>
      <Avatar className="h-9 w-9 shrink-0 md:h-10 md:w-10">
        <AvatarImage src={avatar} className="object-cover" />
        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold text-foreground notranslate" data-user-content="true" data-no-translate="true" translate="no">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </>;
    return <div className="flex h-full min-h-0 flex-col">
      {/* Header: on phones the same black bar as the site header */}
      <div className={`flex h-14 shrink-0 items-center gap-2 px-4 ${mobile ? 'bg-black' : 'md:h-16 border-b border-foreground/10'}`}>
        {mobile && <button type="button" aria-label="Back" className="-ml-1 shrink-0 p-2 text-foreground/80 transition-colors hover:text-foreground" onClick={() => {
          setSelectedConversation(null);
          setPendingArtist(null);
        }}>
            <ArrowLeft className="h-6 w-6" />
          </button>}
        {profileHref
          ? <Link to={profileHref} className="flex min-w-0 flex-1 items-center gap-3">{who}</Link>
          : <div className="flex min-w-0 flex-1 items-center gap-3">{who}</div>}
        {selectedConversation ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full" aria-label="Conversation options">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(selectedConversation.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <div className="w-10 shrink-0" />}
      </div>

      {/* Announcement context header */}
      {announcementContext && <AnnouncementHeader ad={announcementContext} viewerId={user?.id} otherId={selectedConversation ? (selectedConversation.artist_id === user?.id ? selectedConversation.participant_id : selectedConversation.artist_id) : null} rejected={!!(selectedConversation as any)?.collab_rejected_at} onDismiss={() => setAnnouncementContext(null)} />}

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1 px-3 md:px-5">
        <div className="py-4">
          {/* New conversation: who you're writing to, Instagram style */}
          {messages.length === 0 && <div className="flex flex-col items-center pb-6 pt-8 text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatar} className="object-cover" />
                <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <p className="mt-3 text-xl font-bold text-foreground notranslate" translate="no">{name}</p>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
              {profileHref && <Link to={profileHref} className="mt-4 inline-flex h-9 items-center rounded-full bg-foreground/[0.07] px-5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/[0.12]">
                  View profile
                </Link>}
              <p className="mt-6 text-sm text-muted-foreground">Send a message to start the conversation</p>
            </div>}
          {messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
            const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
            const mine = msg.sender_id === user?.id;
            // Consecutive messages from the same person sit closer together
            const sameAsNext = !!nextMsg && nextMsg.sender_id === msg.sender_id && !shouldShowDateSeparator(nextMsg, msg);
            return <div key={msg.id}>
                {showDateSeparator && <p className="my-4 text-center text-xs font-medium text-muted-foreground">
                    {formatMessageDate(new Date(msg.created_at))}
                  </p>}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${sameAsNext ? 'mb-0.5' : 'mb-2.5'}`}>
                  <div className={`max-w-[78%] px-3.5 py-2 md:max-w-[65%] ${mine ? 'rounded-[20px] rounded-br-md bg-foreground text-background' : 'rounded-[20px] rounded-bl-md bg-foreground/[0.1] text-foreground'}`}>
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-snug notranslate" data-user-content="true" data-no-translate="true" translate="no">{msg.content}</p>
                    <div className="mt-0.5 flex items-center justify-end gap-1">
                      <span className="text-[11px] opacity-60 tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString((i18n.language || 'ro').startsWith('ro') ? 'ro-RO' : 'en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {mine && <span className={`inline-flex ${msg.read_at ? 'text-sky-600' : 'opacity-50'}`} aria-label={msg.read_at ? t('messages.read', 'Read') : t('messages.sent', 'Sent')}>
                          {msg.read_at ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                        </span>}
                    </div>
                  </div>
                </div>
              </div>;
          })}
          <div data-chat-end="" />
        </div>
      </ScrollArea>

      {/* Input: a round field and a send button that lights up once there is text */}
      {isAdConversationLocked ? (
        <div className="shrink-0 px-4 py-4 text-center text-sm text-muted-foreground">
          {selectedConversation?.announcement_context?.kind === "gig" ? "This event has ended or was deleted. You can no longer send messages." : "This collaboration has ended or was deleted. You can no longer send messages."}
        </div>
      ) : (
      <form onSubmit={sendMessage} className="flex shrink-0 items-center gap-2 px-3 pb-3 pt-2 md:px-4 md:pb-4">
        <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." disabled={sending} className="h-11 rounded-full border-0 bg-foreground/[0.07] px-4 text-base focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-offset-0 md:text-sm" />
        <Button type="submit" disabled={sending || !newMessage.trim()} size="icon" aria-label="Send" className={`h-11 w-11 shrink-0 rounded-full transition-colors disabled:opacity-100 ${newMessage.trim() ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-foreground/[0.07] text-muted-foreground hover:bg-foreground/[0.07]'}`}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      )}
    </div>;
  };

  // Check if ad conversation is locked (ad deleted or expired)
  const isAdConversationLocked = (() => {
    const conv = selectedConversation;
    if (!conv?.announcement_id) return false;
    // Ad was deleted (no context found)
    if (!conv.announcement_context) return true;
    // Ad is expired
    const adDate = conv.announcement_context.date;
    if (!adDate) return false;
    // Opportunities stay open for chat until they expire, even after an artist is chosen
    return isAdExpired({
      date: adDate,
      is_premium: !!conv.announcement_context.is_premium,
      kind: conv.announcement_context.kind,
      expires_at: conv.announcement_context.expires_at,
    });
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
  const handleMobileBack = () => {
    goBack(navigate, user ? "/feed" : "/");
  };
  const conversationActive = !!(selectedConversation || pendingArtist);
  // Phone back closes the open chat and returns to the list (like the arrow in the chat header).
  // A chat opened straight from a profile/announcement ("Message" button) goes
  // back to that page instead, as before.
  const isMobile = useIsMobile();
  const [openedDirectly, setOpenedDirectly] = useState(!!(artistId || adId || convParam));
  const wasActiveRef = useRef(conversationActive);
  useEffect(() => {
    if (wasActiveRef.current && !conversationActive) setOpenedDirectly(false);
    wasActiveRef.current = conversationActive;
  }, [conversationActive]);
  useCloseOnBack(isMobile && conversationActive && !openedDirectly, () => {
    setSelectedConversation(null);
    setPendingArtist(null);
  });
  // Open on the latest message, and follow new ones
  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('[data-chat-end]').forEach((el) => el.scrollIntoView({ block: 'end' }));
    });
  }, [messages.length, selectedConversation?.id]);
  if (loading && !user) {
    return <div className="min-h-screen md:ml-[316px] lg:ml-[356px] bg-background">
        <Navigation mobileTitle="Messages" onMobileBack={handleMobileBack} />
        <div className="pt-20 md:pt-8 text-center text-muted-foreground">Loading...</div>
      </div>;
  }
  return <div className="min-h-screen bg-background md:ml-[316px] md:bg-black md:py-2 md:pr-2 lg:ml-[356px]">
      <Navigation mobileTitle="Messages" onMobileBack={handleMobileBack} hideMobileHeader={conversationActive} />
      
      <div className="px-0 pt-14 md:pt-0 pb-16 md:pb-0 h-screen md:h-[calc(100vh-80px)]">
        {/* Desktop: two panels side by side, like the rest of the app */}
        <div className="hidden md:flex md:h-full md:gap-2">
          {/* Conversations List */}
          <div className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-lg bg-background lg:w-[380px]">
            <h1 className="px-4 pb-3 pt-5 font-figtree text-2xl font-bold tracking-[-0.01em] text-foreground">Messages</h1>
            <ScrollArea className="flex-1 pb-2">
              {renderConversationList()}
            </ScrollArea>
            </div>

          {/* Messages Area */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
            {selectedConversation || pendingArtist ? renderChat(false) : <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/[0.07]">
                  <MessageCircle className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                </span>
                <p className="text-lg font-bold text-foreground">Your messages</p>
                <p className="mt-1.5 text-sm text-muted-foreground">Select a conversation to start messaging</p>
              </div>}
          </div>
        </div>

        {/* Mobile: Full-width conversation list */}
        <div className="md:hidden h-full">
          <div className="h-full overflow-hidden bg-background pt-1">
            <div className="h-full overflow-y-auto">
              {renderConversationList()}
            </div>
          </div>


          {/* Mobile: Chat overlay */}
          {(selectedConversation || pendingArtist) && <div className="fixed top-0 bottom-16 left-0 right-0 z-40 bg-background">
              {renderChat(true)}
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