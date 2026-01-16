import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  QrCode, 
  Share2,
  Loader2,
  X,
  Link,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, Event, generateSlugFromName } from '@/hooks/useEvents';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { APP_URL } from '@/lib/constants';

const Events = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { events, myEvents, loading, createEvent, deleteEvent, endEvent, isEventEnded } = useEvents();
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [endingEventId, setEndingEventId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<Event | null>(null);
  const [creating, setCreating] = useState(false);
  const [customSlugEnabled, setCustomSlugEnabled] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    custom_slug: '',
  });

  // Auto-generate slug preview from event name
  useEffect(() => {
    if (!customSlugEnabled && form.name) {
      const autoSlug = generateSlugFromName(form.name);
      setForm(prev => ({ ...prev, custom_slug: autoSlug }));
    }
  }, [form.name, customSlugEnabled]);

  // Redirect to auth if not logged in
  if (!authLoading && !session) {
    navigate('/auth?redirect=/events');
    return null;
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({
        title: 'Error',
        description: 'Event name is required',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const newEvent = await createEvent({
        name: form.name,
        description: form.description || undefined,
        location: form.location || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        custom_slug: form.custom_slug || undefined,
      });

      if (newEvent) {
        toast({
          title: 'Event created!',
          description: 'Your event is ready. Share the QR code to invite attendees.',
        });
        setShowCreateModal(false);
        setForm({ name: '', description: '', location: '', start_date: '', end_date: '', custom_slug: '' });
        setCustomSlugEnabled(false);
        setShowQRModal(newEvent);
      }
    } finally {
      setCreating(false);
    }
  };

  const copyShareLink = (event: Event) => {
    if (!event.qr_token) return;
    const url = `${APP_URL}/event/join/${event.qr_token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Share this link to invite others.',
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    setDeletingEventId(eventId);
    const success = await deleteEvent(eventId);
    setDeletingEventId(null);
    
    if (success) {
      toast({
        title: 'Event deleted',
        description: 'The event has been permanently removed.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEndEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to end this event? Attendees will be notified.')) return;
    
    setEndingEventId(eventId);
    const success = await endEvent(eventId);
    setEndingEventId(null);
    
    if (success) {
      toast({
        title: 'Event ended',
        description: 'The event has been marked as ended. All attendees have been notified.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to end event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getEventStatus = (event: Event) => {
    const ended = isEventEnded(event);
    if (ended) {
      return { label: 'Ended', color: 'bg-muted text-muted-foreground', icon: CheckCircle };
    }
    if (event.start_date && new Date(event.start_date) > new Date()) {
      return { label: 'Upcoming', color: 'bg-primary/20 text-primary', icon: Clock };
    }
    return { label: 'Active', color: 'bg-accent/20 text-accent', icon: AlertCircle };
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Create and manage your networking events</p>
          </div>
          <NeonButton onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </NeonButton>
        </div>

        {/* My Events Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">My Events</h2>
          
          {myEvents.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't created any events yet</p>
              <NeonButton size="sm" onClick={() => setShowCreateModal(true)}>
                Create Your First Event
              </NeonButton>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard 
                    className={`p-4 h-full cursor-pointer hover:border-primary/50 transition-colors ${isEventEnded(event) ? 'opacity-75' : ''}`}
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const status = getEventStatus(event);
                            const StatusIcon = status.icon;
                            return (
                              <span className={`text-xs ${status.color} px-2 py-1 rounded-full flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {event.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(event.start_date)}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 flex-wrap">
                        <NeonButton 
                          size="sm" 
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQRModal(event);
                          }}
                        >
                          <QrCode className="w-4 h-4" />
                        </NeonButton>
                        <NeonButton 
                          size="sm" 
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyShareLink(event);
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </NeonButton>
                        {!isEventEnded(event) && (
                          <NeonButton 
                            size="sm" 
                            variant="secondary"
                            onClick={(e) => handleEndEvent(e, event.id)}
                            disabled={endingEventId === event.id}
                          >
                            {endingEventId === event.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </NeonButton>
                        )}
                        <NeonButton 
                          size="sm" 
                          variant="secondary"
                          className="text-destructive hover:bg-destructive/20"
                          onClick={(e) => handleDeleteEvent(e, event.id)}
                          disabled={deletingEventId === event.id}
                        >
                          {deletingEventId === event.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </NeonButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Joined Events Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Events I've Joined</h2>
          
          {events.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                You haven't joined any events yet
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Scan an event QR code to join
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
                const status = getEventStatus(event);
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlassCard 
                      className={`p-4 h-full cursor-pointer hover:border-primary/50 transition-colors ${isEventEnded(event) ? 'opacity-75' : ''}`}
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{event.name}</h3>
                          <span className={`text-xs ${status.color} px-2 py-1 rounded-full flex items-center gap-1 shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {event.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(event.start_date)}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>

                        {isEventEnded(event) && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              This event has ended
                            </p>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6" glow="primary">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Create Event</h2>
                  <button 
                    onClick={() => setShowCreateModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="neon-input"
                      placeholder="Tech Conference 2026"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="neon-input min-h-[80px] resize-none"
                      placeholder="What's this event about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="neon-input"
                      placeholder="San Francisco, CA"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        className="neon-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        className="neon-input"
                      />
                    </div>
                  </div>

                  {/* Custom Event Link */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-foreground">
                        Event Link
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomSlugEnabled(!customSlugEnabled)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        {customSlugEnabled ? 'Use auto-generated' : 'Customize'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-l-lg border border-r-0 border-border/50">
                        <Link className="w-3 h-3" />
                        <span>/event/join/</span>
                      </div>
                      <input
                        type="text"
                        value={form.custom_slug}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^\w-]/g, '')
                            .replace(/\s+/g, '-');
                          setForm({ ...form, custom_slug: value });
                        }}
                        disabled={!customSlugEnabled}
                        className={`neon-input flex-1 rounded-l-none ${!customSlugEnabled ? 'opacity-60' : ''}`}
                        placeholder="my-awesome-event"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {customSlugEnabled 
                        ? 'Use letters, numbers, and hyphens only'
                        : 'Auto-generated from event name'}
                    </p>
                  </div>

                  <NeonButton type="submit" className="w-full" disabled={creating}>
                    {creating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span>Create Event</span>
                      </>
                    )}
                  </NeonButton>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQRModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <GlassCard className="p-8 text-center" glow="primary">
                <button 
                  onClick={() => setShowQRModal(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-lg font-semibold mb-2">{showQRModal.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Scan to join this event on MeetMate
                </p>
                
                <div className="bg-white p-4 rounded-xl inline-block mb-6">
                  <QRCodeSVG
                    value={`${APP_URL}/event/join/${showQRModal.qr_token}`}
                    size={200}
                    level="H"
                  />
                </div>

                <NeonButton 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => copyShareLink(showQRModal)}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Copy Invite Link</span>
                </NeonButton>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Events;
