import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  QrCode,
  Quote
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import Event from ".././assets/tech.png"
import Conference from ".././assets/techconnect.png"

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Head of Events',
    company: 'TechCorp Global',
    quote: 'MeetMate transformed how we manage our annual conference. Check-ins went from 15 minutes to under 30 seconds.',
    avatar: 'SC',
  },
  {
    name: 'Marcus Johnson',
    role: 'Community Manager',
    company: 'StartupHub',
    quote: 'The attendance analytics alone saved us countless hours. We now make data-driven decisions for every event.',
    avatar: 'MJ',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Event Director',
    company: 'Innovation Summit',
    quote: 'Our attendees love the seamless networking features. Connection rates increased by 40% since switching to MeetMate.',
    avatar: 'ER',
  },
];

const trustedCompanies = [
  'Microsoft', 'Google', 'Salesforce', 'Stripe',
  'Slack', 'Notion', 'Figma', 'Shopify',
];

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
          <div className="space-y-6 animate-fade-in">
            <span>Event & Conference Management Made Simple</span>

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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <p className="text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Event Images Gallery */}
        <section className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need to Run Better Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From check-in to follow-up, manage every aspect of your event with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <GlassCard key={feature.title} className="p-8 h-full group" glow="primary">
                <div className="space-y-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Trusted Companies */}
        <section className="space-y-8">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trusted by leading organizations worldwide
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {trustedCompanies.map((company) => (
              <div
                key={company}
                className="text-xl md:text-2xl font-bold text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:scale-105"
              >
                {company}
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              What Our <span className="text-primary">Customers</span> Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of event professionals who've transformed their events with MeetMate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <GlassCard key={testimonial.name} className="p-6 h-full flex flex-col" glow="primary">
                <Quote className="w-8 h-8 text-primary/40 mb-4" />
                <p className="text-muted-foreground flex-grow mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <GlassCard className="p-12 relative overflow-hidden" glow="primary">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 opacity-40" />
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
        </section>
      </div>
    </Layout>
  );
};

export default Index;
