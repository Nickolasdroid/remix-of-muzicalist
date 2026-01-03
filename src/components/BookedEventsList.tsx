import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, User, Mail, Phone, Calendar, Edit2, Save, X, Trash2 } from "lucide-react";

interface BookedEvent {
  timeSlot?: string;
  bookedBy: string;
  eventType: string;
  contact?: string;
  phone?: string;
  dayInfo?: string;
  rawText: string;
}

interface BookedEventsListProps {
  notes: string;
  onUpdateNotes: (newNotes: string) => Promise<void>;
  isSaving: boolean;
}

const parseBookedEvents = (notes: string): BookedEvent[] => {
  if (!notes || !notes.trim()) return [];
  
  const entries = notes.split(/\n\n---\n\n/);
  
  return entries.map(entry => {
    const lines = entry.trim().split('\n');
    let timeSlot = '';
    let bookedBy = '';
    let eventType = '';
    let contact = '';
    let phone = '';
    let dayInfo = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().startsWith('time:')) {
        timeSlot = trimmedLine.replace(/^time:\s*/i, '');
      } else if (trimmedLine.toLowerCase().startsWith('booked by:')) {
        bookedBy = trimmedLine.replace(/^booked by:\s*/i, '');
      } else if (trimmedLine.toLowerCase().startsWith('event:')) {
        eventType = trimmedLine.replace(/^event:\s*/i, '');
      } else if (trimmedLine.toLowerCase().startsWith('contact:')) {
        contact = trimmedLine.replace(/^contact:\s*/i, '');
      } else if (trimmedLine.toLowerCase().startsWith('phone:')) {
        phone = trimmedLine.replace(/^phone:\s*/i, '');
      } else if (trimmedLine.startsWith('(Day ')) {
        dayInfo = trimmedLine;
      }
    }
    
    return {
      timeSlot,
      bookedBy,
      eventType,
      contact,
      phone,
      dayInfo,
      rawText: entry.trim()
    };
  }).filter(event => event.bookedBy || event.eventType || event.timeSlot);
};

const serializeBookedEvents = (events: BookedEvent[]): string => {
  return events.map(event => {
    const lines: string[] = [];
    if (event.timeSlot) lines.push(`Time: ${event.timeSlot}`);
    if (event.bookedBy) lines.push(`Booked by: ${event.bookedBy}`);
    if (event.eventType) lines.push(`Event: ${event.eventType}`);
    if (event.contact) lines.push(`Contact: ${event.contact}`);
    if (event.phone) lines.push(`Phone: ${event.phone}`);
    if (event.dayInfo) lines.push(event.dayInfo);
    return lines.join('\n');
  }).join('\n\n---\n\n');
};

const BookedEventsList = ({ notes, onUpdateNotes, isSaving }: BookedEventsListProps) => {
  const [selectedEvent, setSelectedEvent] = useState<BookedEvent | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(-1);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    timeSlot: '',
    bookedBy: '',
    eventType: '',
    contact: '',
    phone: ''
  });

  const events = parseBookedEvents(notes);

  const handleEventClick = (event: BookedEvent, index: number) => {
    setSelectedEvent(event);
    setSelectedEventIndex(index);
    setEditForm({
      timeSlot: event.timeSlot || '',
      bookedBy: event.bookedBy || '',
      eventType: event.eventType || '',
      contact: event.contact || '',
      phone: event.phone || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (selectedEventIndex < 0) return;
    
    const updatedEvents = [...events];
    updatedEvents[selectedEventIndex] = {
      ...updatedEvents[selectedEventIndex],
      timeSlot: editForm.timeSlot,
      bookedBy: editForm.bookedBy,
      eventType: editForm.eventType,
      contact: editForm.contact,
      phone: editForm.phone
    };
    
    const newNotes = serializeBookedEvents(updatedEvents);
    await onUpdateNotes(newNotes);
    setShowEditDialog(false);
  };

  const handleDeleteEvent = async () => {
    if (selectedEventIndex < 0) return;
    
    const updatedEvents = events.filter((_, index) => index !== selectedEventIndex);
    const newNotes = updatedEvents.length > 0 ? serializeBookedEvents(updatedEvents) : '';
    await onUpdateNotes(newNotes);
    setShowEditDialog(false);
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Booked Events ({events.length})</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events.map((event, index) => (
            <Card 
              key={index}
              className="p-3 cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => handleEventClick(event, index)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {event.timeSlot && (
                      <span className="text-sm font-medium text-accent flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.timeSlot}
                      </span>
                    )}
                    {event.dayInfo && (
                      <span className="text-xs text-muted-foreground">{event.dayInfo}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate mt-1">
                    {event.bookedBy || 'Unknown'}
                  </p>
                  {event.eventType && (
                    <p className="text-xs text-muted-foreground truncate">{event.eventType}</p>
                  )}
                </div>
                <Edit2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Time Slot
              </Label>
              <Input
                value={editForm.timeSlot}
                onChange={e => setEditForm({ ...editForm, timeSlot: e.target.value })}
                placeholder="e.g., 14:00 - 18:00"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Booked By
              </Label>
              <Input
                value={editForm.bookedBy}
                onChange={e => setEditForm({ ...editForm, bookedBy: e.target.value })}
                placeholder="Client name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Event Type
              </Label>
              <Input
                value={editForm.eventType}
                onChange={e => setEditForm({ ...editForm, eventType: e.target.value })}
                placeholder="e.g., Wedding, Corporate Event"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Contact Email
              </Label>
              <Input
                value={editForm.contact}
                onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone
              </Label>
              <Input
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+40..."
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex justify-between w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSaving}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this booking from your calendar. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-accent text-accent-foreground">
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookedEventsList;
