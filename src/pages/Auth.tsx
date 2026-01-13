import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Linkedin, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles,
  QrCode,
  Shield,
  Zap,
  Users
} from 'lucide-react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import logo from '@/assets/logo.jpeg';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { session, signIn, signUp, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  // If coming from QR scan, default to signup mode
  const [isSignUp, setIsSignUp] = useState(!!redirectTo);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (session && !profileLoading) {
      // Check for pending event token (from event QR scan)
      const pendingEventToken = sessionStorage.getItem('pendingEventToken');
      
      // If there's a redirect URL (e.g., from QR code scan), go there immediately
      if (redirectTo) {
        navigate(redirectTo);
      } else if (pendingEventToken) {
        // Redirect to event join page with the pending token
        navigate(`/event/join/${pendingEventToken}`);
      } else if (isSignUp) {
        // After signup, always go to profile setup
        navigate('/profile-setup');
      } else {
        // After signin, go to matches (profile already exists for returning users)
        navigate('/matches');
      }
    }
  }, [session, profileLoading, navigate, redirectTo, isSignUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp && form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await signUp(form.email, form.password, form.name);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ title: 'Error', description: 'This email is already registered. Please sign in instead.', variant: 'destructive' });
            setIsSignUp(false); // Switch to login mode
          } else {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
          }
        } else {
          // Success message based on context
          if (redirectTo) {
            toast({ title: 'Success', description: 'Account created! Completing your connection...' });
          } else {
            toast({ title: 'Success', description: 'Account created! Welcome to MeetMate!' });
          }
          // Note: The useEffect will handle navigation once session is set
        }
      } else {
        const { error } = await signIn(form.email, form.password);
        if (error) {
          toast({ title: 'Error', description: 'Invalid email or password', variant: 'destructive' });
        } else {
          toast({ title: 'Welcome back!', description: 'Successfully signed in.' });
          // Note: The useEffect will handle navigation once session is set
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Shield, title: 'Secure Authentication', description: 'Enterprise-grade security' },
    { icon: Zap, title: 'One-Click Onboarding', description: 'Connect instantly' },
    { icon: Users, title: 'AI-Powered Matching', description: 'Find perfect connections' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          className="space-y-8 text-center md:text-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center md:justify-start gap-3">
            <img 
              src={logo} 
              alt="MeetMate Logo" 
              className="h-16 sm:h-20 w-auto"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Turn Networking into
              <span className="block gradient-text">Meaningful Connections</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              AI-powered matchmaking for conferences. Connect with the right people, schedule meetings, and build your network.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-8" glow="primary">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-muted-foreground">
                  {redirectTo 
                    ? 'Sign up to complete the connection'
                    : (isSignUp ? 'Join the network' : 'Sign in to continue')
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="neon-input"
                      placeholder="Enter your name"
                      required={isSignUp}
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="neon-input pl-12"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="neon-input pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="neon-input"
                      placeholder="••••••••"
                      required={isSignUp}
                    />
                  </motion.div>
                )}

                <NeonButton
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </NeonButton>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NeonButton
                  type="button"
                  variant="secondary"
                  onClick={() => toast({ title: 'LinkedIn', description: 'LinkedIn sign-in coming soon!' })}
                >
                  <Linkedin className="w-5 h-5" />
                  <span>LinkedIn</span>
                </NeonButton>
                <NeonButton
                  type="button"
                  variant="secondary"
                  onClick={() => toast({ title: 'QR Code', description: 'Scan QR code to continue' })}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QR Code</span>
                </NeonButton>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
