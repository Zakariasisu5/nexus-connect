import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  Zap,
  Shield,
  Globe,
  QrCode
} from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useDemoNotifications } from '@/hooks/useDemoNotifications';

const features = [
  {
    icon: Users,
    title: 'AI-Powered Matching',
    description: 'Smart algorithms find your perfect connections based on shared interests and goals.',
    gradient: 'from-primary to-primary/60',
  },
  {
    icon: QrCode,
    title: 'Instant QR Connect',
    description: 'Scan QR codes to instantly connect and share profiles at conferences.',
    gradient: 'from-accent to-accent/60',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Book meetings effortlessly with integrated calendar and availability sync.',
    gradient: 'from-secondary to-secondary/60',
  },
  {
    icon: BarChart3,
    title: 'Engagement Analytics',
    description: 'Track your networking success with detailed insights and metrics.',
    gradient: 'from-primary to-accent',
  },
];

const stats = [
  { value: '10K+', label: 'Connections Made' },
  { value: '500+', label: 'Conferences' },
  { value: '95%', label: 'Match Accuracy' },
  { value: '4.9★', label: 'User Rating' },
];

const Index = () => {
  // Enable demo notifications
  useDemoNotifications(true);

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
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">AI-Powered Conference Networking</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground">Turn Networking into</span>
              <br />
              <span className="gradient-text">Meaningful Connections</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              MeetMate uses AI to match you with the right people at conferences. 
              Scan, connect, and build relationships that matter.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <NeonButton size="lg" className="min-w-[200px]">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </NeonButton>
              </Link>
              <Link to="/matches">
                <NeonButton variant="secondary" size="lg" className="min-w-[200px]">
                  <span>View Demo</span>
                </NeonButton>
              </Link>
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

        {/* Features Section */}
        <section className="space-y-12">
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="gradient-text">Everything You Need</span> to Network Smarter
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI matching to real-time notifications, we've got you covered.
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
                  Ready to <span className="gradient-text">Transform</span> Your Networking?
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Join thousands of professionals already using MeetMate to build meaningful connections.
                </p>
                <Link to="/auth">
                  <NeonButton size="lg">
                    <Sparkles className="w-5 h-5" />
                    <span>Start Free Trial</span>
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
