import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Calendar, MapPin, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { useEvents, Event } from '@/hooks/useEvents';
import { toast } from '@/hooks/use-toast';

type JoinState = 'loading' | 'not_found' | 'unauthenticated' | 'joining' | 'joined' | 'error';

const EventJoin = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { getEventByToken, joinEvent, hasJoinedEvent } = useEvents();
  
  const [state, setState] = useState<JoinState>('loading');
  const [event, setEvent] = useState<Event | null>(null);

  // Store token in sessionStorage for redirect after auth
  useEffect(() => {
    if (token) {
      sessionStorage.setItem('pendingEventToken', token);
    }
  }, [token]);

  const handleJoinEvent = useCallback(async (eventData: Event) => {
    setState('joining');
    const success = await joinEvent(eventData.id);
    
    if (success) {
      setState('joined');
      toast({
        title: "You're now part of this event",
        description: `Welcome to ${eventData.name}!`,
      });
      // Clear the pending token
      sessionStorage.removeItem('pendingEventToken');
      // Navigate to event space after a short delay
      setTimeout(() => {
        navigate(`/events/${eventData.id}`);
      }, 1500);
    } else {
      setState('error');
      toast({
        title: 'Error',
        description: 'Failed to join the event. Please try again.',
        variant: 'destructive',
      });
    }
  }, [joinEvent, navigate]);

  useEffect(() => {
    const loadEvent = async () => {
      if (!token) {
        setState('not_found');
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) return;

      // Fetch event by token
      const eventData = await getEventByToken(token);
      
      if (!eventData) {
        setState('not_found');
        return;
      }

      setEvent(eventData);

      // Check if user is authenticated
      if (!session) {
        setState('unauthenticated');
        return;
      }

      // Check if already joined
      const alreadyJoined = await hasJoinedEvent(eventData.id);
      if (alreadyJoined) {
        setState('joined');
        toast({
          title: "You're already part of this event",
          description: 'Redirecting to event space...',
        });
        setTimeout(() => {
          navigate(`/events/${eventData.id}`);
        }, 1000);
        return;
      }

      // Auto-join the event
      handleJoinEvent(eventData);
    };

    loadEvent();
  }, [token, session, authLoading, getEventByToken, hasJoinedEvent, handleJoinEvent, navigate]);

  const handleSignupRedirect = () => {
    // Redirect to auth with return URL
    navigate(`/auth?redirect=/event/join/${token}`);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8 text-center space-y-6" glow="primary">
            {/* Loading State */}
            {state === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                <h2 className="text-xl font-bold text-foreground">Loading event...</h2>
              </>
            )}

            {/* Not Found State */}
            {state === 'not_found' && (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Invalid or expired event QR code</h2>
                <p className="text-muted-foreground">
                  This event link may have expired or doesn't exist.
                </p>
                <NeonButton onClick={() => navigate('/')}>
                  Go Home
                </NeonButton>
              </>
            )}

            {/* Unauthenticated State */}
            {state === 'unauthenticated' && event && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Join event</h2>
                  <h3 className="text-lg text-primary font-semibold">{event.name}</h3>
                </div>
                
                {(event.start_date || event.location) && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {event.start_date && (
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-muted-foreground">
                  Complete signup to join the event
                </p>
                
                <NeonButton onClick={handleSignupRedirect} className="w-full">
                  Sign Up to Join
                </NeonButton>
                
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button 
                    onClick={handleSignupRedirect}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {/* Joining State */}
            {state === 'joining' && event && (
              <>
                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                <h2 className="text-xl font-bold text-foreground">Joining {event.name}...</h2>
                <p className="text-muted-foreground">Please wait a moment</p>
              </>
            )}

            {/* Joined State */}
            {state === 'joined' && event && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <CheckCircle className="w-16 h-16 text-accent mx-auto" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">You're now part of this event</h2>
                <p className="text-muted-foreground">
                  Welcome to {event.name}! Redirecting to the event space...
                </p>
              </>
            )}

            {/* Error State */}
            {state === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
                <p className="text-muted-foreground">
                  We couldn't join you to this event. Please try again.
                </p>
                <NeonButton onClick={() => window.location.reload()}>
                  Try Again
                </NeonButton>
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </Layout>
  );
};

export default EventJoin;
