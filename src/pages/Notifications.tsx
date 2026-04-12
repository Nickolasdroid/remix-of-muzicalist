import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Star, Heart, Calendar, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import Navigation from "@/components/Navigation";
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  actor_id: string | null;
  actor_name: string | null;
  read_at: string | null;
  created_at: string;
}
const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deleteNotificationId, setDeleteNotificationId] = useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      loadNotifications(session.user.id);
    };
    checkAuth();
  }, [navigate]);
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const channel = supabase.channel('notifications-realtime').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, payload => {
      setNotifications(prev => [payload.new as Notification, ...prev]);
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const loadNotifications = async (userId: string) => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', {
      ascending: false
    });
    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };
  const markAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({
      read_at: new Date().toISOString()
    }).eq('id', notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? {
      ...n,
      read_at: new Date().toISOString()
    } : n));
  };
  const markAllAsRead = async () => {
    await supabase.from('notifications').update({
      read_at: new Date().toISOString()
    }).eq('user_id', user.id).is('read_at', null);
    setNotifications(prev => prev.map(n => ({
      ...n,
      read_at: n.read_at || new Date().toISOString()
    })));
  };
  const deleteNotification = async () => {
    if (!deleteNotificationId) return;
    await supabase.from('notifications').delete().eq('id', deleteNotificationId);
    setNotifications(prev => prev.filter(n => n.id !== deleteNotificationId));
    setDeleteNotificationId(null);
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'booking_request':
      case 'booking_update':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };
  const handleNotificationClick = async (notification: Notification) => {
    // Only mark as read on tap (no navigation)
    if (notification.read_at) return;
    await markAsRead(notification.id);
  };
  const unreadCount = notifications.filter(n => !n.read_at).length;
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="md:ml-64 pt-16 md:pt-2 pb-20 md:pb-4">
        <div className="max-w-3xl mx-auto p-4 md:p-6 px-0 py-0">
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            {unreadCount > 0 && <Button variant="outline" size="sm" className="pl-2" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>}
          </div>
          {unreadCount > 0 && <div className="flex md:hidden justify-end p-2">
            <Button variant="outline" size="sm" className="pl-2" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
          </div>}

          {loading ? <div className="space-y-4">
              {[1, 2, 3].map(i => <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </Card>)}
            </div> : notifications.length === 0 ? <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                You'll be notified when someone reviews your profile, likes your posts, or sends you a booking request.
              </p>
            </Card> : <div className="divide-y divide-border border-y border-border">
              {notifications.map(notification => <div key={notification.id} className={`p-4 cursor-pointer transition-colors hover:bg-accent/5 min-h-[100px] ${!notification.read_at ? 'bg-accent/10' : ''}`} onClick={() => handleNotificationClick(notification)}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium line-clamp-1 ${!notification.read_at ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true
                      })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={e => {
                    e.stopPropagation();
                    setDeleteNotificationId(notification.id);
                  }}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {!notification.read_at && <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-2" />}
                  </div>
                </div>)}
            </div>}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNotificationId} onOpenChange={open => !open && setDeleteNotificationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteNotification} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default Notifications;