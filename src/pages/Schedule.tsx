import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Coffee, 
  Phone, 
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Meeting {
  id: string;
  title: string;
  type: 'coffee' | 'video' | 'phone' | 'in-person';
  date: string;
  time: string;
  duration: number;
  location: string;
  attendee: string;
  avatar: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Meetings will be loaded from the backend (Supabase). Keep client-side Meeting shape.

const meetingTypes = [
  { id: 'coffee', label: 'Coffee Chat', icon: Coffee, color: 'text-orange-500' },
  { id: 'video', label: 'Video Call', icon: Video, color: 'text-primary' },
  { id: 'phone', label: 'Phone Call', icon: Phone, color: 'text-accent' },
  { id: 'in-person', label: 'In-Person', icon: Users, color: 'text-secondary' },
];

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { session } = useAuth();
  const { trackEvent, trackPageView } = useAnalytics();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('coffee');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Fill in days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift({ date: prevDate, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), currentMonth: true });
    }

    // Fill in remaining days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), currentMonth: false });
    }

    return days;
  };

  const getMeetingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return meetings.filter((m) => m.date === dateStr);
  };

  // Fetch meetings from Supabase for the current user
  const fetchMeetings = async () => {
    if (!session?.user?.id) return;
    try {
      // Fetch meetings first
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('id, title, meeting_type, scheduled_at, duration_minutes, location, status, organizer_id, attendee_id')
        .or(`organizer_id.eq.${session.user.id},attendee_id.eq.${session.user.id}`)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (meetingsError) throw meetingsError;

      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([]);
        return;
      }

      // Get all unique user IDs
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

      const mapped = meetingsData.map((m) => {
        const scheduled = m.scheduled_at ? new Date(m.scheduled_at) : new Date();
        const isOrganizer = session.user.id === m.organizer_id;
        const organizer = profilesMap.get(m.organizer_id);
        const attendee = profilesMap.get(m.attendee_id);
        const other = isOrganizer ? attendee : organizer;
        return {
          id: m.id,
          title: m.title,
          type: (m.meeting_type || 'video') as Meeting['type'],
          date: scheduled.toISOString().split('T')[0],
          time: scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: m.duration_minutes || 30,
          location: m.location || '',
          attendee: other?.full_name || (isOrganizer ? 'You' : 'Unknown'),
          avatar: other?.avatar_url || '',
          status: m.status || 'scheduled',
        } as Meeting;
      });

      setMeetings(mapped);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  // Subscribe to realtime updates for meetings involving the current user
  useEffect(() => {
    if (!session?.user?.id) return;

    fetchMeetings();
    trackPageView('schedule');

    // Fetch profiles for attendee selection (exclude current user)
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, avatar_url, company').neq('id', session.user.id).limit(50);
        if (error) throw error;
        setProfiles(data || []);
        if ((data || []).length > 0 && !selectedAttendeeId) {
          setSelectedAttendeeId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    };

    fetchProfiles();

    const userId = session.user.id;

    const organizerChannel = supabase
      .channel(`user-meetings-organizer-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `organizer_id=eq.${userId}` },
        (payload) => {
          fetchMeetings();
        }
      )
      .subscribe();

    const attendeeChannel = supabase
      .channel(`user-meetings-attendee-${userId}`)
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const getTypeIcon = (type: string) => {
    const found = meetingTypes.find((t) => t.id === type);
    return found ? found.icon : Coffee;
  };

  const getTypeColor = (type: string) => {
    const found = meetingTypes.find((t) => t.id === type);
    return found ? found.color : 'text-muted-foreground';
  };

  const handleScheduleMeeting = async () => {
    if (!selectedSlot) {
      toast({ title: 'Error', description: 'Please select a time slot', variant: 'destructive' });
      return;
    }

    if (!session?.user?.id) {
      toast({ title: 'Error', description: 'You must be signed in to schedule a meeting', variant: 'destructive' });
      return;
    }

    if (!selectedAttendeeId) {
      toast({ title: 'Error', description: 'Please select an attendee', variant: 'destructive' });
      return;
    }

    try {
      // NOTE: current UI does not include attendee selection. For now, create meeting with the
      // current user as both organizer and attendee. Replace `attendee_id` with a real user id
      // after integrating contact selection.
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const payload = {
        action: 'create',
        attendee_id: selectedAttendeeId,
        title: meetingTypes.find((t) => t.id === selectedType)?.label || 'Meeting',
        meeting_type: selectedType,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 30,
        location: selectedType === 'video' ? 'Zoom' : 'Conference Center',
      };

      const { data, error } = await supabase.functions.invoke('schedule-meeting', { body: payload });
      if (error) throw error;

      // The function returns the created meeting; refresh list
      await fetchMeetings();
      setShowNewMeeting(false);
      setSelectedSlot(null);
      trackEvent('meeting_scheduled', { meeting_type: selectedType, attendee_id: selectedAttendeeId || undefined });
      toast({ title: 'Meeting Scheduled', description: 'Your meeting has been added to the calendar.' });
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      toast({ title: 'Error', description: 'Failed to schedule meeting', variant: 'destructive' });
    }
  };

  const days = getDaysInMonth(selectedDate);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              <span className="">Event Scheduler</span> 
            </h1>
            <p className="text-muted-foreground">Plan and manage meetings, sessions, and appointments</p>
          </div>
          <NeonButton onClick={() => setShowNewMeeting(true)}>
            <Plus className="w-5 h-5" />
            <span>Schedule Meeting</span>
          </NeonButton>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                  <motion.button
                    className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    onClick={handlePrevMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-xl"
                    onClick={() => setSelectedDate(new Date())}
                    whileHover={{ scale: 1.05 }}
                  >
                    Today
                  </motion.button>
                  <motion.button
                    className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    onClick={handleNextMonth}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const dayMeetings = getMeetingsForDate(day.date);
                  return (
                    <motion.button
                      key={index}
                      type="button"
                      tabIndex={0}
                      aria-pressed={isSelected(day.date)}
                      className={`
                        min-h-[80px] p-2 rounded-xl border text-left transition-all
                        ${day.currentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
                        ${isToday(day.date) ? 'border-primary bg-primary/10' : 'border-transparent hover:border-border hover:bg-muted/30'}
                        ${isSelected(day.date) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      `}
                      onClick={(e) => { setSelectedDate(day.date); (e.currentTarget as HTMLElement).focus(); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-sm font-medium">{day.date.getDate()}</span>
                      <div className="mt-1 space-y-1">
                        {dayMeetings.slice(0, 2).map((meeting) => (
                          <motion.div
                            key={meeting.id}
                            className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary truncate"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              boxShadow: isSelected(day.date) 
                                ? ['0 0 0px hsl(var(--primary)/0)', '0 0 10px hsl(var(--primary)/0.5)', '0 0 0px hsl(var(--primary)/0)']
                                : 'none'
                            }}
                            transition={{ 
                              boxShadow: { duration: 1.5, repeat: Infinity }
                            }}
                          >
                            {meeting.time}
                          </motion.div>
                        ))}
                        {dayMeetings.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{dayMeetings.length - 2}</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>

          {/* Upcoming Meetings */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold">Upcoming Meetings</h2>
            <div className="space-y-3">
              {meetings
                .filter((m) => m.status === 'scheduled')
                .slice(0, 5)
                .map((meeting, index) => {
                  const TypeIcon = getTypeIcon(meeting.type);
                  return (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <GlassCard className="p-4" glow="none">
                        <div className="flex items-start gap-3">
                          <motion.img
                            src={meeting.avatar}
                            alt={meeting.attendee}
                            className="w-12 h-12 rounded-xl object-cover"
                            whileHover={{ scale: 1.1 }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className={`w-4 h-4 ${getTypeColor(meeting.type)}`} />
                              <span className="font-semibold text-foreground truncate">{meeting.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">with {meeting.attendee}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {meeting.time} ({meeting.duration}min)
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {meeting.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
            </div>

            {/* AI Suggestions */}
            <GlassCard className="p-4 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20" glow="accent">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-accent to-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI Suggestion</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your schedule, 10:00 AM - 11:00 AM slots have the highest meeting success rate.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* New Meeting Modal */}
        <AnimatePresence>
          {showNewMeeting && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewMeeting(false)}
            >
              <motion.div
                className="w-full max-w-md"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <GlassCard className="p-6" glow="primary">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Schedule Meeting</h3>
                    <motion.button
                      className="p-2 rounded-xl hover:bg-muted/50"
                      onClick={() => setShowNewMeeting(false)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>

                    <div className="space-y-6">
                    {/* Attendee selection */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Attendee</label>
                      <div>
                        <select
                          value={selectedAttendeeId ?? ''}
                          onChange={(e) => setSelectedAttendeeId(e.target.value)}
                          className="neon-input w-full"
                        >
                          {profiles.length === 0 && <option value="">No contacts available</option>}
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>{p.full_name || p.email || p.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Meeting Type */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Meeting Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {meetingTypes.map((type) => (
                          <motion.button
                            key={type.id}
                            type="button"
                            tabIndex={0}
                            aria-pressed={selectedType === type.id}
                            className={`
                              flex items-center gap-2 p-3 rounded-xl border transition-all
                              ${selectedType === type.id 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-border hover:border-primary/50 hover:bg-muted/30'
                              }
                            `}
                            onClick={(e) => { setSelectedType(type.id); (e.currentTarget as HTMLElement).focus(); }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            animate={selectedType === type.id ? { 
                              boxShadow: ['0 0 0px hsl(var(--primary)/0)', '0 0 15px hsl(var(--primary)/0.3)', '0 0 0px hsl(var(--primary)/0)']
                            } : {}}
                            transition={{ duration: 1.5, repeat: selectedType === type.id ? Infinity : 0 }}
                          >
                            <type.icon className={`w-5 h-5 ${type.color}`} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Select Time</label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <motion.button
                            key={slot}
                            type="button"
                            tabIndex={0}
                            aria-pressed={selectedSlot === slot}
                            className={`
                              p-2 rounded-xl text-sm font-medium transition-all
                              ${selectedSlot === slot 
                                ? 'bg-primary text-primary-foreground shadow-glow-primary' 
                                : 'bg-muted/30 hover:bg-muted/50 text-foreground'
                              }
                            `}
                            onClick={(e) => { setSelectedSlot(slot); (e.currentTarget as HTMLElement).focus(); }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={selectedSlot === slot ? {
                              boxShadow: ['0 0 0px hsl(var(--primary)/0)', '0 0 20px hsl(var(--primary)/0.5)', '0 0 0px hsl(var(--primary)/0)']
                            } : {}}
                            transition={{ duration: 1, repeat: selectedSlot === slot ? Infinity : 0 }}
                          >
                            {slot}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <NeonButton className="w-full" onClick={handleScheduleMeeting}>
                      <Check className="w-5 h-5" />
                      <span>Confirm Meeting</span>
                    </NeonButton>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Schedule;
