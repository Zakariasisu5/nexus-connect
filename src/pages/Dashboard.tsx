import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  MessageCircle, 
  TrendingUp,
  Target,
  Award,
  Download,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Metric {
  label: string;
  value: number;
  change: number;
  icon: typeof Users;
  color: 'primary' | 'accent' | 'secondary';
}

interface ChartDataItem {
  day: string;
  matches: number;
  meetings: number;
  messages: number;
  connections: number;
}

interface EngagementDataItem {
  time: string;
  level: string;
  count: number;
}

interface AnalyticsData {
  total_matches: number;
  total_meetings: number;
  total_connections: number;
  total_messages: number;
  response_rate: number;
  conversion_rate: number;
  chart_data: ChartDataItem[];
  engagement_data: EngagementDataItem[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { trackPageView } = useAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/auth');
    }
  }, [session, authLoading, navigate]);

  // Track page view
  useEffect(() => {
    if (session?.user?.id) {
      trackPageView('dashboard');
    }
  }, [session?.user?.id, trackPageView]);

  // Fetch analytics data
  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics();
      fetchTopMatches();
      fetchMeetings();
    }
  }, [session?.user?.id]);

  // Subscribe to realtime updates for meetings so dashboard updates live
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;

    const organizerChannel = supabase
      .channel(`dashboard-meetings-organizer-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `organizer_id=eq.${userId}` },
        (payload) => {
          fetchMeetings();
        }
      )
      .subscribe();

    const attendeeChannel = supabase
      .channel(`dashboard-meetings-attendee-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `attendee_id=eq.${userId}` },
        (payload) => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(organizerChannel);
      supabase.removeChannel(attendeeChannel);
    };
  }, [session?.user?.id]);

  const fetchAnalytics = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        body: { userId: session.user.id, type: 'personal' }
      });
      
      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default values on error
      setAnalytics({
        total_matches: 0,
        total_meetings: 0,
        total_connections: 0,
        total_messages: 0,
        response_rate: 0,
        conversion_rate: 0,
        chart_data: [],
        engagement_data: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopMatches = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Fetch matches first
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, match_score, matched_user_id')
        .eq('user_id', session.user.id)
        .order('match_score', { ascending: false })
        .limit(4);
      
      if (matchesError) throw matchesError;
      
      if (!matchesData || matchesData.length === 0) {
        setTopMatches([]);
        return;
      }

      // Fetch profiles for matched users
      const matchedUserIds = matchesData.map(m => m.matched_user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, company, avatar_url')
        .in('id', matchedUserIds);

      if (profilesError) throw profilesError;

      // Combine matches with profiles
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const combined = matchesData.map(match => ({
        ...match,
        profiles: profilesMap.get(match.matched_user_id) || null
      }));

      setTopMatches(combined);
    } catch (error) {
      console.error('Error fetching top matches:', error);
    }
  };

  const fetchMeetings = async () => {
    if (!session?.user?.id) return;

    try {
      // Fetch meetings first
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('id, title, scheduled_at, duration_minutes, status, organizer_id, attendee_id')
        .or(`organizer_id.eq.${session.user.id},attendee_id.eq.${session.user.id}`)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(6);

      if (meetingsError) throw meetingsError;

      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([]);
        return;
      }

      // Get all unique user IDs (organizers and attendees)
      const userIds = [...new Set([
        ...meetingsData.map(m => m.organizer_id),
        ...meetingsData.map(m => m.attendee_id)
      ])];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const combined = meetingsData.map(m => ({
        ...m,
        organizer: profilesMap.get(m.organizer_id) || null,
        attendee: profilesMap.get(m.attendee_id) || null,
      }));

      setMeetings(combined);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const metrics: Metric[] = [
    { label: 'Total Matches', value: analytics?.total_matches || 0, change: 12, icon: Users, color: 'primary' },
    { label: 'Scheduled Meetings', value: analytics?.total_meetings || 0, change: 8, icon: Calendar, color: 'accent' },
    { label: 'Active Connections', value: analytics?.total_connections || 0, change: 15, icon: MessageCircle, color: 'secondary' },
    { label: 'Response Rate', value: analytics?.response_rate || 0, change: 5, icon: TrendingUp, color: 'primary' },
  ];

  // Use real chart data from analytics or fallback to empty
  const chartData = analytics?.chart_data?.length ? analytics.chart_data : [
    { day: 'Mon', matches: 0, meetings: 0, messages: 0, connections: 0 },
    { day: 'Tue', matches: 0, meetings: 0, messages: 0, connections: 0 },
    { day: 'Wed', matches: 0, meetings: 0, messages: 0, connections: 0 },
    { day: 'Thu', matches: 0, meetings: 0, messages: 0, connections: 0 },
    { day: 'Fri', matches: 0, meetings: 0, messages: 0, connections: 0 },
    { day: 'Sat', matches: 0, meetings: 0, messages: 0, connections: 0 },
    { day: 'Sun', matches: 0, meetings: 0, messages: 0, connections: 0 },
  ];

  // Use real engagement data from analytics or fallback
  const engagementData = analytics?.engagement_data?.length ? analytics.engagement_data : [
    { time: '9:00 AM', level: 'low', count: 0 },
    { time: '10:00 AM', level: 'low', count: 0 },
    { time: '11:00 AM', level: 'low', count: 0 },
    { time: '12:00 PM', level: 'low', count: 0 },
    { time: '1:00 PM', level: 'low', count: 0 },
    { time: '2:00 PM', level: 'low', count: 0 },
    { time: '3:00 PM', level: 'low', count: 0 },
    { time: '4:00 PM', level: 'low', count: 0 },
    { time: '5:00 PM', level: 'low', count: 0 },
  ];

  // Animate numbers on mount
  useEffect(() => {
    if (isLoading) return;
    
    metrics.forEach((metric) => {
      let start = 0;
      const end = metric.value;
      const duration = 1500;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(timer);
        }
        setAnimatedValues((prev) => ({ ...prev, [metric.label]: Math.floor(start) }));
      }, 16);
    });
  }, [isLoading, analytics]);

  const getHeatmapColor = (level: string) => {
    switch (level) {
      case 'very-high': return 'bg-accent';
      case 'high': return 'bg-accent/70';
      case 'medium': return 'bg-primary/50';
      case 'low': return 'bg-muted';
      default: return 'bg-muted/50';
    }
  };

  const maxChartValue = Math.max(...chartData.map((d) => d.matches));

  if (authLoading || isLoading) {
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
          className="flex items-center justify-between flex-wrap gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              <span className="">Event Analytics</span> 
            </h1>
            <p className="text-muted-foreground">Monitor attendance, engagement, and event performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="neon-input w-auto"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
            <NeonButton variant="secondary" onClick={fetchAnalytics}>
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </NeonButton>
            <NeonButton variant="secondary">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </NeonButton>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6" glow={metric.color as any}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.color === 'primary' ? 'bg-primary/20' : metric.color === 'accent' ? 'bg-accent/20' : 'bg-secondary/20'}`}>
                    <metric.icon className={`w-6 h-6 ${metric.color === 'primary' ? 'text-primary' : metric.color === 'accent' ? 'text-accent' : 'text-secondary'}`} />
                  </div>
                  <motion.span
                    className="text-sm font-medium text-accent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    +{metric.change}%
                  </motion.span>
                </div>
                <motion.div
                  className="text-3xl font-bold text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {animatedValues[metric.label] || 0}
                  {metric.label === 'Response Rate' && '%'}
                </motion.div>
                <p className="text-sm text-muted-foreground mt-1">{metric.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold mb-6">Weekly Activity</h3>
              <div className="space-y-4 overflow-x-auto">
                {chartData.map((data, index) => (
                  <div key={data.day} className="space-y-2 min-w-[260px]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium w-12">{data.day}</span>
                      <span className="text-muted-foreground">
                        {data.matches} matches, {data.meetings} meetings, {data.messages} msgs
                      </span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${maxChartValue > 0 ? (data.matches / maxChartValue) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Top Matches */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold mb-4">Top Matches</h3>
              <div className="space-y-4">
                {topMatches.length > 0 ? (
                  topMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <img
                        src={match.profiles?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'}
                        alt={match.profiles?.full_name || 'User'}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{match.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{match.profiles?.company || 'No company'}</p>
                      </div>
                      <div className="text-sm font-bold text-accent">{match.match_score || 0}%</div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No matches yet</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-muted/20">
                <h4 className="text-sm font-semibold mb-3">Upcoming Meetings</h4>
                <div className="space-y-3">
                  {meetings.length > 0 ? (
                    meetings.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <img
                          src={m.attendee?.avatar_url || m.organizer?.avatar_url || 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=60&h=60&fit=crop&crop=face'}
                          alt={m.attendee?.full_name || m.organizer?.full_name || 'User'}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{m.title || 'Meeting'}</p>
                          <p className="text-xs text-muted-foreground truncate">{new Date(m.scheduled_at).toLocaleString()}</p>
                        </div>
                        <div className="text-sm font-medium text-accent">{m.status || 'scheduled'}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Engagement Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <h3 className="text-lg font-bold">Engagement Heatmap</h3>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 rounded bg-primary/50" /> Medium</span>
                <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 rounded bg-accent/70" /> High</span>
                <span className="flex items-center gap-1 text-sm"><span className="w-3 h-3 rounded bg-accent" /> Very High</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              {engagementData.map((slot, index) => (
                <motion.div
                  key={slot.time}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <motion.div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${getHeatmapColor(slot.level)} transition-colors`}
                    whileHover={{ scale: 1.06 }}
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">{slot.time}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <GlassCard className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20" glow="primary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">AI Recommendations</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Schedule meetings during 10-11 AM for best results</li>
                    <li>• Follow up with matches within 24 hours</li>
                    <li>• Focus on high-score connections (90%+)</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <GlassCard className="p-6 bg-gradient-to-br from-secondary/10 to-primary/10 border-secondary/20" glow="secondary">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-secondary to-primary flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">Performance Goals</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {analytics?.total_matches || 0}/50 total matches this week {(analytics?.total_matches || 0) >= 50 ? '✓' : '○'}</li>
                    <li>• {analytics?.total_meetings || 0}/30 scheduled meetings {(analytics?.total_meetings || 0) >= 30 ? '✓' : '○'}</li>
                    <li>• {analytics?.response_rate || 0}%/80% response rate {(analytics?.response_rate || 0) >= 80 ? '✓' : '○'}</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
