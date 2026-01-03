import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Send, ArrowLeft, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

interface Conversation {
  id: string;
  artist_id: string;
  participant_id: string;
  updated_at: string;
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
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const artistId = searchParams.get("artistId");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    fetchUnreadCounts();
  }, [user]);

  // Separate effect for realtime subscription to handle selectedConversation changes
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to new messages across all conversations for notifications
    const channel = supabase
      .channel('all-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only count as unread if not from current user and not in currently selected conversation
          if (newMsg.sender_id !== user.id && newMsg.conversation_id !== selectedConversation?.id) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation?.id]);

  useEffect(() => {
    if (!user || !artistId) return;
    handleArtistContact();
  }, [user, artistId]);

  useEffect(() => {
    if (!selectedConversation || !user) return;
    fetchMessages(selectedConversation.id);
    markMessagesAsRead(selectedConversation.id);
    
    // Clear unread count for selected conversation
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[selectedConversation.id];
      return updated;
    });

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          // Mark as read immediately if it's from the other user
          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead(selectedConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    // Fetch profile info for each conversation
    const conversationsWithProfiles = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.artist_id === user.id ? conv.participant_id : conv.artist_id;
        
        // Fetch other user's profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('stage_name, avatar_url, plan, specialization')
          .eq('id', otherUserId)
          .maybeSingle();
        
        // Fetch artist's profile for specialization
        const { data: artistProfile } = await supabase
          .from('profiles')
          .select('stage_name, avatar_url, plan, specialization')
          .eq('id', conv.artist_id)
          .maybeSingle();
        
        return {
          ...conv,
          other_profile: otherProfile,
          artist_profile: artistProfile
        };
      })
    );

    setConversations(conversationsWithProfiles);
    setLoading(false);
  };

  const fetchUnreadCounts = async () => {
    if (!user) return;
    
    // Get all unread messages (not sent by current user and not read)
    const { data: unreadMessages, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .neq('sender_id', user.id)
      .is('read_at', null);

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
    
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);
  };

  const handleArtistContact = async () => {
    if (!artistId || !user || artistId === user.id) return;

    // Use backend function to get or restore/create conversation
    const { data: conversationId, error: rpcError } = await supabase.rpc('get_or_create_conversation', {
      _artist_id: artistId,
      _participant_id: user.id
    });

    if (rpcError || !conversationId) {
      toast({
        title: "Error",
        description: "Could not start conversation",
        variant: "destructive"
      });
      return;
    }

    // Fetch the conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    // Fetch artist profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stage_name, avatar_url, plan, specialization')
      .eq('id', artistId)
      .maybeSingle();

    const convWithProfile = { ...conv, other_profile: profile, artist_profile: profile };
    
    // Update conversations list
    setConversations(prev => {
      const exists = prev.some(c => c.id === conversationId);
      if (exists) {
        return prev;
      }
      return [convWithProfile, ...prev];
    });
    
    setSelectedConversation(convWithProfile as any);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: newMessage.trim()
    });

    if (error) {
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
    } else {
      setNewMessage("");
      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);
    }
    setSending(false);
  };

  const getOtherProfile = (conv: Conversation | null | undefined) => {
    return (
      conv?.other_profile ?? {
        stage_name: "Unknown",
        avatar_url: null,
        plan: "Free",
        specialization: null,
      }
    );
  };

  const getArtistSpecialization = (conv: Conversation) => {
    return (
      conv.artist_profile?.specialization ||
      getOtherProfile(conv).specialization ||
      "Artist"
    );
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


  const getPlanRingColor = (plan?: string) => {
    switch (plan) {
      case 'Premium':
        return 'ring-2 ring-accent ring-offset-2 ring-offset-background';
      case 'Standard':
        return 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background';
      default:
        return 'ring-2 ring-muted-foreground/30 ring-offset-2 ring-offset-background';
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen ml-64 bg-background">
        <Navigation />
        <div className="pt-32 text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ml-64 bg-background">
      <Navigation />
      
      <div className="px-4 pt-20 pb-4 h-screen">
          <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-96px)]">
            {/* Conversations List */}
            <Card className="md:col-span-1 p-0 overflow-hidden bg-card">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold">Conversations</h2>
              </div>
              <ScrollArea className="h-[calc(100%-60px)]">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const profile = getOtherProfile(conv);
                    return (
                      <div
                        key={conv.id}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border/50 cursor-pointer ${
                          selectedConversation?.id === conv.id ? 'bg-accent/10' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <Avatar className={`h-10 w-10 ${getPlanRingColor(profile.plan)}`}>
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{profile.stage_name}</p>
                            {unreadCounts[conv.id] > 0 && (
                              <span className="flex-shrink-0 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                                {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </Card>

            {/* Messages Area */}
            <Card className="md:col-span-2 p-0 overflow-hidden flex flex-col bg-card">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className={`h-10 w-10 ${getPlanRingColor(getOtherProfile(selectedConversation).plan)}`}>
                      <AvatarImage src={getOtherProfile(selectedConversation).avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {getOtherProfile(selectedConversation).stage_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getArtistSpecialization(selectedConversation)}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg, index) => {
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
                        
                        return (
                          <div key={msg.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4">
                                <div className="bg-muted px-3 py-1 rounded-full">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {formatMessageDate(new Date(msg.created_at))}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div
                              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  msg.sender_id === user?.id
                                    ? 'bg-accent text-accent-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p>{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-xs opacity-70">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {msg.sender_id === user?.id && (
                                    <span className={`text-xs ${msg.read_at ? 'text-blue-400' : 'opacity-50'}`}>
                                      {msg.read_at ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </Card>
          </div>
        </div>
    </div>
  );
};

export default Messages;