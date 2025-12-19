import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  MessageCircle, 
  Calendar, 
  Sparkles,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Heart,
  X
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import ChipTag from '@/components/ui/ChipTag';
import { toast } from '@/hooks/use-toast';
import { triggerMatchNotification, triggerMeetingNotification } from '@/hooks/useDemoNotifications';

interface Match {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  avatar: string;
  matchScore: number;
  skills: string[];
  interests: string[];
  bio: string;
  whyMatch: string;
}

const mockMatches: Match[] = [
  {
    id: '1',
    name: 'Anna Chen',
    title: 'Product Designer',
    company: 'DeFi Labs',
    location: 'San Francisco, CA',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    matchScore: 94,
    skills: ['Product Design', 'UX Research', 'Figma', 'DeFi'],
    interests: ['DeFi', 'Product Design', 'AI/ML'],
    bio: 'Product designer passionate about creating intuitive DeFi experiences.',
    whyMatch: 'You both share interests in DeFi and Product Design. Anna is looking for developers to collaborate with.',
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    title: 'Smart Contract Developer',
    company: 'Ethereum Foundation',
    location: 'Berlin, Germany',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    matchScore: 87,
    skills: ['Solidity', 'Ethereum', 'DeFi Protocols', 'Rust'],
    interests: ['DeFi', 'Blockchain', 'Zero Knowledge'],
    bio: 'Smart contract developer working on DeFi protocols and ZK proofs.',
    whyMatch: 'Marcus is interested in AI/ML integration with blockchain - your expertise could help.',
  },
  {
    id: '3',
    name: 'Sarah Kim',
    title: 'Growth Marketing Manager',
    company: 'Web3 Startup',
    location: 'Seoul, South Korea',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    matchScore: 82,
    skills: ['Growth Marketing', 'Community Building', 'Web3'],
    interests: ['Web3', 'Community', 'Growth'],
    bio: 'Growth marketer focused on Web3 projects and community building.',
    whyMatch: 'Sarah is looking for technical co-founders for her new project.',
  },
  {
    id: '4',
    name: 'David Thompson',
    title: 'AI Research Engineer',
    company: 'AI Research Lab',
    location: 'London, UK',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    matchScore: 78,
    skills: ['Machine Learning', 'Python', 'AI Research'],
    interests: ['AI/ML', 'Research', 'Innovation'],
    bio: 'AI researcher working on neural network architectures.',
    whyMatch: 'David is exploring AI applications in Web3 - potential collaboration opportunity.',
  },
  {
    id: '5',
    name: 'Emily Carter',
    title: 'Community Lead',
    company: 'DAO Collective',
    location: 'Toronto, Canada',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    matchScore: 85,
    skills: ['Community Management', 'DAO Governance', 'Public Speaking'],
    interests: ['DAO', 'Community', 'Web3'],
    bio: 'Community lead for a DAO, passionate about decentralized governance.',
    whyMatch: 'Emily could help grow your project community and provide governance insights.',
  },
];

const filters = ['All', 'High Match (90%+)', 'Connected', 'Pending'];

const Matches = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, 'pending' | 'connected'>>({});

  const filteredMatches = mockMatches.filter((match) => {
    const matchesSearch = 
      match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'High Match (90%+)' && match.matchScore >= 90) ||
      (activeFilter === 'Connected' && connections[match.id] === 'connected') ||
      (activeFilter === 'Pending' && connections[match.id] === 'pending');

    return matchesSearch && matchesFilter;
  });

  const handleConnect = (matchId: string, match: Match) => {
    setConnections((prev) => ({ ...prev, [matchId]: 'pending' }));
    toast({ title: 'Connection Request Sent', description: `Waiting for ${match.name} to accept.` });
    
    // Simulate connection acceptance after 3 seconds
    setTimeout(() => {
      setConnections((prev) => ({ ...prev, [matchId]: 'connected' }));
      triggerMatchNotification(match.name, match.avatar);
    }, 3000);
  };

  const handleMessage = (matchName: string) => {
    toast({ title: 'Opening Chat', description: `Starting conversation with ${matchName}...` });
  };

  const handleSchedule = (matchName: string) => {
    toast({ title: 'Schedule Meeting', description: `Opening scheduler for ${matchName}...` });
    triggerMeetingNotification(`Coffee chat with ${matchName}`, '2:00 PM tomorrow');
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'from-accent to-accent/80';
    if (score >= 80) return 'from-primary to-primary/80';
    return 'from-secondary to-secondary/80';
  };

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

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredMatches.map((match, index) => (
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
                      className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${getMatchScoreColor(match.matchScore)} text-white text-sm font-bold shadow-lg`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 + index * 0.05 }}
                    >
                      {match.matchScore}% Match
                    </motion.div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                      <motion.img
                        src={match.avatar}
                        alt={match.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30"
                        whileHover={{ scale: 1.1 }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{match.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{match.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{match.company}</span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{match.location}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5">
                      {match.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Why This Match - Expandable */}
                    <AnimatePresence>
                      {expandedCard === match.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-accent mb-1">Why this match?</p>
                                <p className="text-sm text-muted-foreground">{match.whyMatch}</p>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">{match.bio}</p>

                          <div>
                            <p className="text-xs font-medium text-foreground mb-2">Shared Interests</p>
                            <div className="flex flex-wrap gap-1.5">
                              {match.interests.map((interest) => (
                                <span
                                  key={interest}
                                  className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {connections[match.id] === 'connected' ? (
                        <>
                          <NeonButton
                            size="sm"
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); handleMessage(match.name); }}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Message</span>
                          </NeonButton>
                          <NeonButton
                            size="sm"
                            variant="secondary"
                            onClick={(e) => { e.stopPropagation(); handleSchedule(match.name); }}
                          >
                            <Calendar className="w-4 h-4" />
                          </NeonButton>
                        </>
                      ) : connections[match.id] === 'pending' ? (
                        <NeonButton size="sm" variant="secondary" className="flex-1" disabled>
                          <span>Pending...</span>
                        </NeonButton>
                      ) : (
                        <>
                          <NeonButton
                            size="sm"
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); handleConnect(match.id, match); }}
                          >
                            <Heart className="w-4 h-4" />
                            <span>Connect</span>
                          </NeonButton>
                          <NeonButton
                            size="sm"
                            variant="secondary"
                            onClick={(e) => { e.stopPropagation(); handleSchedule(match.name); }}
                          >
                            <Calendar className="w-4 h-4" />
                          </NeonButton>
                        </>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredMatches.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground">No matches found. Try adjusting your filters.</p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Matches;
