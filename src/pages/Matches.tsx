import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  MessageCircle, 
  Calendar, 
  Sparkles,
  MapPin,
  Briefcase,
  Heart,
  RefreshCw
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import ChipTag from '@/components/ui/ChipTag';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMatches } from '@/hooks/useMatches';
import { supabase } from '@/integrations/supabase/client';

const filters = ['All', 'High Match (90%+)', 'Connected', 'Pending'];

const Matches = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { matches, loading: matchesLoading, refreshMatches, updateMatchStatus } = useMatches();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [session, authLoading, navigate]);

  const filteredMatches = matches.filter((match) => {
    const matchedProfile = match.matched_profile;
    if (!matchedProfile) return false;

    const matchesSearch = 
      (matchedProfile.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (matchedProfile.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (matchedProfile.company?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'High Match (90%+)' && (match.match_score || 0) >= 90) ||
      (activeFilter === 'Connected' && match.status === 'connected') ||
      (activeFilter === 'Pending' && match.status === 'pending');

    return matchesSearch && matchesFilter;
  });

  const handleGenerateMatches = async () => {
    if (!session?.user?.id) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-match', {
        body: { userId: session.user.id }
      });
      
      if (error) {
        // Handle rate limiting
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast({ 
            title: 'Service Busy', 
            description: 'AI matching is temporarily busy. Please wait a moment and try again.', 
            variant: 'destructive' 
          });
          return;
        }
        throw error;
      }
      
      toast({ title: 'Matches Generated!', description: `Found ${data.matches?.length || 0} potential connections.` });
      refreshMatches();
    } catch (error: any) {
      console.error('Error generating matches:', error);
      const message = error.message?.includes('rate') || error.message?.includes('busy')
        ? 'AI service is busy. Please wait a moment and try again.'
        : 'Failed to generate matches. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConnect = async (matchId: string, matchName: string) => {
    try {
      await updateMatchStatus(matchId, 'pending');
      toast({ title: 'Connection Request Sent', description: `Waiting for ${matchName} to accept.` });
      
      // Simulate connection acceptance after 3 seconds
      setTimeout(async () => {
        await updateMatchStatus(matchId, 'connected');
        toast({ title: 'Connected!', description: `You are now connected with ${matchName}.` });
      }, 3000);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send connection request.', variant: 'destructive' });
    }
  };

  const handleMessage = (matchName: string) => {
    toast({ title: 'Opening Chat', description: `Starting conversation with ${matchName}...` });
  };

  const handleSchedule = (matchName: string) => {
    toast({ title: 'Schedule Meeting', description: `Opening scheduler for ${matchName}...` });
    navigate('/schedule');
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'from-accent to-accent/80';
    if (score >= 80) return 'from-primary to-primary/80';
    return 'from-secondary to-secondary/80';
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">AI-Powered</span> Matches
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover professionals who share your interests, skills, and goals
          </p>
          <NeonButton 
            onClick={handleGenerateMatches} 
            disabled={isGenerating}
            className="mx-auto"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Finding Matches...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Matches</span>
              </>
            )}
          </NeonButton>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neon-input pl-12 w-full"
              placeholder="Search by name, title, or company..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <ChipTag
                key={filter}
                label={filter}
                selected={activeFilter === filter}
                onSelect={() => setActiveFilter(filter)}
              />
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {matchesLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Matches Grid */}
        {!matchesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMatches.map((match, index) => {
                const profile = match.matched_profile;
                if (!profile) return null;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <GlassCard
                      className="p-0 overflow-hidden cursor-pointer"
                      onClick={() => setExpandedCard(expandedCard === match.id ? null : match.id)}
                    >
                      {/* Match Score Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <motion.div
                          className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${getMatchScoreColor(match.match_score || 0)} text-white text-sm font-bold shadow-lg`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.2 + index * 0.05 }}
                        >
                          {match.match_score || 0}% Match
                        </motion.div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4">
                          <motion.img
                            src={profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                            alt={profile.full_name || 'User'}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30"
                            whileHover={{ scale: 1.1 }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate">{profile.full_name || 'Unknown User'}</h3>
                            <p className="text-sm text-muted-foreground truncate">{profile.title || 'No title'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Briefcase className="w-3 h-3" />
                              <span className="truncate">{profile.company || 'No company'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        {profile.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{profile.location}</span>
                          </div>
                        )}

                        {/* Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.skills.slice(0, 4).map((skill) => (
                              <span
                                key={skill}
                                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Why This Match - Expandable */}
                        <AnimatePresence>
                          {expandedCard === match.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-4 overflow-hidden"
                            >
                              {match.ai_explanation && (
                                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                                  <div className="flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-accent mb-1">Why this match?</p>
                                      <p className="text-sm text-muted-foreground">{match.ai_explanation}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {profile.bio && (
                                <p className="text-sm text-muted-foreground">{profile.bio}</p>
                              )}

                              {match.shared_interests && match.shared_interests.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-foreground mb-2">Shared Interests</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {match.shared_interests.map((interest) => (
                                      <span
                                        key={interest}
                                        className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {match.status === 'connected' ? (
                            <>
                              <NeonButton
                                size="sm"
                                className="flex-1"
                                onClick={(e) => { e.stopPropagation(); handleMessage(profile.full_name || 'User'); }}
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>Message</span>
                              </NeonButton>
                              <NeonButton
                                size="sm"
                                variant="secondary"
                                onClick={(e) => { e.stopPropagation(); handleSchedule(profile.full_name || 'User'); }}
                              >
                                <Calendar className="w-4 h-4" />
                              </NeonButton>
                            </>
                          ) : match.status === 'pending' ? (
                            <NeonButton size="sm" variant="secondary" className="flex-1" disabled>
                              <span>Pending...</span>
                            </NeonButton>
                          ) : (
                            <>
                              <NeonButton
                                size="sm"
                                className="flex-1"
                                onClick={(e) => { e.stopPropagation(); handleConnect(match.id, profile.full_name || 'User'); }}
                              >
                                <Heart className="w-4 h-4" />
                                <span>Connect</span>
                              </NeonButton>
                              <NeonButton
                                size="sm"
                                variant="secondary"
                                onClick={(e) => { e.stopPropagation(); handleSchedule(profile.full_name || 'User'); }}
                              >
                                <Calendar className="w-4 h-4" />
                              </NeonButton>
                            </>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!matchesLoading && filteredMatches.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {matches.length === 0 
                ? "No matches yet. Click 'Generate AI Matches' to find connections!" 
                : "No matches found. Try adjusting your filters."}
            </p>
            {matches.length === 0 && (
              <NeonButton onClick={handleGenerateMatches} disabled={isGenerating}>
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Matches</span>
              </NeonButton>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Matches;
