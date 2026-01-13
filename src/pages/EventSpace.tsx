import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Link2, 
  Calendar, 
  MapPin, 
  QrCode, 
  Share2, 
  Check,
  MessageSquare,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, Event, EventParticipant } from '@/hooks/useEvents';
import { useConnections } from '@/hooks/useConnections';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

const EventSpace = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { getEventParticipants, getEventStats } = useEvents();
  const { createConnection, isConnected } = useConnections();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [stats, setStats] = useState({ participantCount: 0, connectionCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  const isOrganizer = event?.organizer_id === session?.user?.id;

  const loadEventData = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      // Load event details
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !eventData) {
        toast({
          title: 'Event not found',
          description: 'This event does not exist.',
          variant: 'destructive',
        });
        navigate('/events');
        return;
      }

      setEvent(eventData);

      // Load participants
      const participantsData = await getEventParticipants(eventId);
      setParticipants(participantsData);

      // Load stats if organizer
      if (eventData.organizer_id === session?.user?.id) {
        const statsData = await getEventStats(eventId);
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, session?.user?.id, getEventParticipants, getEventStats, navigate]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendees',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          loadEventData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, loadEventData]);

  const handleConnect = async (userId: string) => {
    if (!eventId) return;
    
    setConnectingTo(userId);
    try {
      const success = await createConnection(userId, undefined, 'event');
      
      // Also update the connection with event_id
      if (success) {
        await supabase
          .from('connections')
          .update({ event_id: eventId })
          .or(`and(user_id.eq.${session?.user?.id},connected_user_id.eq.${userId}),and(user_id.eq.${userId},connected_user_id.eq.${session?.user?.id})`);
        
        toast({
          title: "You're connected",
          description: 'You can now message each other!',
        });
      }
    } finally {
      setConnectingTo(null);
    }
  };

  const handleMessage = (userId: string) => {
    navigate(`/messages?user=${userId}`);
  };

  const copyShareLink = () => {
    if (!event?.qr_token) return;
    const url = `${window.location.origin}/event/join/${event.qr_token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Share this link to invite others to the event.',
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/events')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events</span>
            </button>
            <h1 className="text-3xl font-bold text-foreground">{event.name}</h1>
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {event.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {isOrganizer && (
            <div className="flex gap-2">
              <NeonButton 
                variant="secondary" 
                size="sm"
                onClick={copyShareLink}
              >
                <Share2 className="w-4 h-4" />
                <span>Copy Link</span>
              </NeonButton>
              <NeonButton 
                size="sm"
                onClick={() => setShowQRCode(!showQRCode)}
              >
                <QrCode className="w-4 h-4" />
                <span>Show QR</span>
              </NeonButton>
            </div>
          )}
        </div>

        {/* QR Code Modal for Organizer */}
        {showQRCode && event.qr_token && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-8 text-center max-w-sm mx-auto" glow="primary">
              <h3 className="text-lg font-semibold mb-4">Scan to join this event on MeetMate</h3>
              <div className="bg-white p-4 rounded-xl inline-block">
                <QRCodeSVG
                  value={`${window.location.origin}/event/join/${event.qr_token}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Attendees can scan this code to join
              </p>
              <NeonButton 
                variant="secondary" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowQRCode(false)}
              >
                Close
              </NeonButton>
            </GlassCard>
          </motion.div>
        )}

        {/* Organizer Stats */}
        {isOrganizer && (
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <GlassCard className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.participantCount}</p>
              <p className="text-sm text-muted-foreground">Total participants</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <Link2 className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.connectionCount}</p>
              <p className="text-sm text-muted-foreground">Total connections made</p>
            </GlassCard>
          </div>
        )}

        {/* Participants Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Participants ({participants.length})
          </h2>
          
          {participants.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No participants yet</p>
              {isOrganizer && (
                <p className="text-sm text-muted-foreground mt-2">
                  Share the QR code to invite attendees
                </p>
              )}
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participants.map((participant) => {
                const profile = participant.profile;
                const isSelf = participant.user_id === session?.user?.id;
                const connected = isConnected(participant.user_id);

                return (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlassCard className="p-4 h-full">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile.full_name || 'User'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {profile?.full_name || 'Anonymous'}
                            {isSelf && (
                              <span className="text-xs text-muted-foreground ml-1">(You)</span>
                            )}
                          </h3>
                          {profile?.title && (
                            <p className="text-sm text-muted-foreground truncate">
                              {profile.title}
                              {profile.company && ` at ${profile.company}`}
                            </p>
                          )}
                          {profile?.location && (
                            <p className="text-xs text-muted-foreground truncate">
                              {profile.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!isSelf && (
                        <div className="mt-4 flex gap-2">
                          {connected ? (
                            <>
                              <NeonButton 
                                size="sm" 
                                variant="secondary" 
                                className="flex-1"
                                disabled
                              >
                                <Check className="w-4 h-4" />
                                <span>You're connected</span>
                              </NeonButton>
                              <NeonButton 
                                size="sm" 
                                onClick={() => handleMessage(participant.user_id)}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </NeonButton>
                            </>
                          ) : (
                            <NeonButton 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleConnect(participant.user_id)}
                              disabled={connectingTo === participant.user_id}
                            >
                              {connectingTo === participant.user_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4" />
                                  <span>Connect</span>
                                </>
                              )}
                            </NeonButton>
                          )}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EventSpace;
