import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2, UserPlus, Users, MapPin, Briefcase, Building2, Linkedin, Github, Globe } from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import ChipTag from '@/components/ui/ChipTag';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type ConnectionStatus = 'loading' | 'success' | 'already_connected' | 'error' | 'self_connect' | 'not_found';

interface ConnectedUserProfile {
  id: string;
  full_name: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  skills: string[];
  interests: string[];
  linkedin_url: string | null;
  github_url: string | null;
  website: string | null;
}

interface ConnectionResult {
  status: ConnectionStatus;
  message: string;
  connectedUserName?: string;
  connectedUserProfile?: ConnectedUserProfile;
}

const Connect = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [message, setMessage] = useState('');
  const [connectedUserName, setConnectedUserName] = useState('');
  const [connectedProfile, setConnectedProfile] = useState<ConnectedUserProfile | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If not logged in, redirect to auth with return URL
    if (!session) {
      const returnUrl = `/connect/${token}`;
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Process the connection
    processConnection();
  }, [token, session, authLoading]);

  const processConnection = async () => {
    if (!token || !session?.access_token) {
      setStatus('error');
      setMessage('Invalid or expired QR code');
      return;
    }

    try {
      const response = await supabase.functions.invoke('qr-connect', {
        body: {
          action: 'scan',
          qr_code_id: token,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('QR connect error:', response.error);
        setStatus('error');
        setMessage('Invalid or expired QR code');
        return;
      }

      const data = response.data as ConnectionResult;

      setStatus(data.status);
      setMessage(data.message);
      if (data.connectedUserName) {
        setConnectedUserName(data.connectedUserName);
      }
      if (data.connectedUserProfile) {
        setConnectedProfile(data.connectedUserProfile);
      }

      // Show toast based on result
      if (data.status === 'success') {
        toast({
          title: "You're now connected!",
          description: `You can now message ${data.connectedUserName || 'your new connection'}`,
        });
      } else if (data.status === 'already_connected') {
        toast({
          title: "You're already connected",
          description: 'This person is already in your connections.',
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('error');
      setMessage('Invalid or expired QR code');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
      case 'success':
        return <Check className="w-16 h-16 text-green-500" />;
      case 'already_connected':
        return <Users className="w-16 h-16 text-primary" />;
      case 'self_connect':
        return <UserPlus className="w-16 h-16 text-muted-foreground" />;
      default:
        return <X className="w-16 h-16 text-destructive" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Connecting...';
      case 'success':
        return "You're now connected!";
      case 'already_connected':
        return "You're already connected";
      case 'self_connect':
        return "That's your own QR code";
      case 'not_found':
        return 'QR Code Not Found';
      default:
        return 'Invalid or expired QR code';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we process your connection...';
      case 'success':
        return connectedUserName 
          ? `You and ${connectedUserName} are now connected on MeetMate!`
          : 'You can now message your new connection.';
      case 'already_connected':
        return connectedUserName
          ? `You and ${connectedUserName} are already connected.`
          : 'This person is already in your network.';
      case 'self_connect':
        return "You can't connect with yourself. Share this QR code with others!";
      default:
        return message || 'This QR code is no longer valid.';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="p-8 text-center" glow={status === 'success' ? 'accent' : 'primary'}>
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {/* Status Icon or Avatar */}
            {(status === 'success' || status === 'already_connected') && connectedProfile ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                <Avatar className="w-24 h-24 border-4 border-primary/30 shadow-glow-primary">
                  <AvatarImage src={connectedProfile.avatar_url || undefined} alt={connectedProfile.full_name || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
                    {getInitials(connectedProfile.full_name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ) : (
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                animate={status === 'loading' ? { rotate: 360 } : {}}
                transition={status === 'loading' ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
              >
                {getStatusIcon()}
              </motion.div>
            )}

            {/* Status Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {getStatusTitle()}
              </h1>
              <p className="text-muted-foreground">
                {getStatusDescription()}
              </p>
            </div>

            {/* Connected User Profile Card */}
            {(status === 'success' || status === 'already_connected') && connectedProfile && (
              <motion.div
                className="w-full space-y-4 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-left">
                  {/* Name and Title */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">{connectedProfile.full_name}</h3>
                    {connectedProfile.title && (
                      <p className="text-sm text-muted-foreground">{connectedProfile.title}</p>
                    )}
                  </div>

                  {/* Company and Location */}
                  <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                    {connectedProfile.company && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{connectedProfile.company}</span>
                      </div>
                    )}
                    {connectedProfile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{connectedProfile.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {connectedProfile.bio && (
                    <p className="text-sm text-muted-foreground text-center italic">
                      "{connectedProfile.bio}"
                    </p>
                  )}

                  {/* Skills */}
                  {connectedProfile.skills && connectedProfile.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Skills</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {connectedProfile.skills.slice(0, 6).map((skill, index) => (
                          <ChipTag key={index} label={skill} color="primary" />
                        ))}
                        {connectedProfile.skills.length > 6 && (
                          <span className="text-xs text-muted-foreground">+{connectedProfile.skills.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {connectedProfile.interests && connectedProfile.interests.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Interests</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {connectedProfile.interests.slice(0, 6).map((interest, index) => (
                          <ChipTag key={index} label={interest} color="accent" />
                        ))}
                        {connectedProfile.interests.length > 6 && (
                          <span className="text-xs text-muted-foreground">+{connectedProfile.interests.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {(connectedProfile.linkedin_url || connectedProfile.github_url || connectedProfile.website) && (
                    <div className="flex justify-center gap-4 pt-2">
                      {connectedProfile.linkedin_url && (
                        <a href={connectedProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {connectedProfile.github_url && (
                        <a href={connectedProfile.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Github className="w-5 h-5" />
                        </a>
                      )}
                      {connectedProfile.website && (
                        <a href={connectedProfile.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {status !== 'loading' && (
              <motion.div
                className="flex flex-col gap-3 w-full pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {status === 'success' && (
                  <NeonButton onClick={() => navigate('/messages')} className="w-full">
                    <span>Send a Message</span>
                  </NeonButton>
                )}
                <NeonButton 
                  variant="secondary" 
                  onClick={() => navigate('/matches')} 
                  className="w-full"
                >
                  <span>View Connections</span>
                </NeonButton>
                <NeonButton 
                  variant="ghost" 
                  onClick={() => navigate('/')} 
                  className="w-full"
                >
                  <span>Go Home</span>
                </NeonButton>
              </motion.div>
            )}
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Connect;
