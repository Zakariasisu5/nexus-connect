import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  QrCode
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useDemoNotifications } from '@/hooks/useDemoNotifications';
import { useAuth } from '@/hooks/useAuth';
import Event from ".././assets/tech.png"
import Conference from ".././assets/techconnect.png"

const features = [
  {
    icon: Users,
    title: 'Smart Attendee Matching',
    description: 'Connect with the right people automatically based on shared interests, goals, and expertise.',
    gradient: 'from-primary to-primary/60',
  },
  {
    icon: QrCode,
    title: 'QR Code Check-In',
    description: 'Fast, contactless check-in and instant profile sharing with a simple scan.',
    gradient: 'from-accent to-accent/60',
  },
  {
    icon: Calendar,
    title: 'Event Scheduling',
    description: 'Effortlessly manage sessions, meetings, and appointments with built-in calendar sync.',
    gradient: 'from-secondary to-secondary/60',
  },
  {
    icon: BarChart3,
    title: 'Attendance Analytics',
    description: 'Real-time insights into attendee engagement, check-ins, and event performance.',
    gradient: 'from-primary to-accent',
  },
];


const Index = () => {
  const { session } = useAuth();
  // Enable demo notifications only for non-authenticated users
  useDemoNotifications(!session);

  const stats = [
    { label: 'Events Attended', value: '1.2k' },
    { label: 'Connections Made', value: '8.4k' },
    { label: 'Average Match Score', value: '92%' },
    { label: 'Live Conferences', value: '18' },
  ];

  return (
    <Layout>
      <div className="space-y-24">
        {/* Hero Section */}
        <section className="text-center space-y-8 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
           
              
              <span className=''>Event & Conference Management Made Simple</span>

            <h3 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground">Seamless Events,</span>
              <br />
              <span className="text-foreground">Meaningful Connections</span>
            </h3>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              MeetMate streamlines event management with smart check-ins, real-time attendance tracking, 
              and effortless attendee networking—all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session ? (
                <>
                  <Link to="/matches">
                    <NeonButton size="lg" className="min-w-[200px]">
                      <span>View Matches</span>
                      <ArrowRight className="w-5 h-5" />
                    </NeonButton>
                  </Link>
                  <Link to="/dashboard">
                    <NeonButton variant="secondary" size="lg" className="min-w-[200px]">
                      <span>Dashboard</span>
                    </NeonButton>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <NeonButton size="lg" className="min-w-[200px]">
                      <span>Get Started Free</span>
                      <ArrowRight className="w-5 h-5" />
                    </NeonButton>
                  </Link>
                  <Link to="/auth">
                    <NeonButton variant="secondary" size="lg" className="min-w-[200px]">
                      <span>Sign In</span>
                    </NeonButton>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <motion.p
                  className="text-3xl md:text-4xl font-bold gradient-text"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Event Images Gallery - responsive for mobile & tablet */}
        <section className="max-w-6xl mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <figure className="relative rounded-xl overflow-hidden shadow-lg group">
              <img
                src={Event}
                alt="MeetMate event networking"
                className="w-full h-56 sm:h-64 md:h-80 lg:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <figcaption className="absolute left-4 bottom-4 text-left text-white">
                <h4 className="text-lg font-bold">Corporate Events</h4>
                <p className="text-sm text-white/90">Streamline check-ins and connect attendees effortlessly.</p>
                <div className="mt-3">
                  <Link to="/matches">
                    <NeonButton size="sm" className="bg-white/10">View Attendees</NeonButton>
                  </Link>
                </div>
              </figcaption>
            </figure>

            <figure className="relative rounded-xl overflow-hidden shadow-lg group">
              <img
                src={Conference}
                alt="Conference attendees using MeetMate"
                className="w-full h-56 sm:h-64 md:h-80 lg:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <figcaption className="absolute left-4 bottom-4 text-left text-white">
                <h4 className="text-lg font-bold">Industry Conferences</h4>
                <p className="text-sm text-white/90">Real-time attendance tracking and seamless scheduling.</p>
                <div className="mt-3">
                  <Link to="/auth">
                    <NeonButton size="sm" className="bg-white/10">Get Started</NeonButton>
                  </Link>
                </div>
              </figcaption>
            </figure>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="space-y-12">
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="">Everything You Need</span> to Run Better Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From check-in to follow-up, manage every aspect of your event with confidence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-8 h-full group" glow="primary">
                  <div className="space-y-4">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlassCard className="p-12 relative overflow-hidden" glow="primary">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Ready to Elevate Your Events?
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Join thousands of organizers who trust MeetMate to deliver exceptional event experiences.
                </p>
                <Link to={session ? "/matches" : "/auth"}>
                  <NeonButton size="lg">
                    <span>{session ? "View Your Matches" : "Start Free Trial"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </NeonButton>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
