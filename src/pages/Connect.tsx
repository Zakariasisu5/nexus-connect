import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2, UserPlus, Users } from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'loading' | 'success' | 'already_connected' | 'error' | 'self_connect' | 'not_found';

interface ConnectionResult {
  status: ConnectionStatus;
  message: string;
  connectedUserName?: string;
}

const Connect = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [message, setMessage] = useState('');
  const [connectedUserName, setConnectedUserName] = useState('');

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
            {/* Status Icon */}
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
              animate={status === 'loading' ? { rotate: 360 } : {}}
              transition={status === 'loading' ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            >
              {getStatusIcon()}
            </motion.div>

            {/* Status Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {getStatusTitle()}
              </h1>
              <p className="text-muted-foreground">
                {getStatusDescription()}
              </p>
            </div>

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
