import { motion } from 'framer-motion';
import { Users, Target, Award, Globe } from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';

const values = [
  {
    icon: Users,
    title: 'People First',
    description: 'We believe meaningful connections drive success. Our platform is designed to bring people together.',
  },
  {
    icon: Target,
    title: 'Simplicity',
    description: 'Event management should be effortless. We remove complexity so you can focus on what matters.',
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We strive for the highest standards in everything we do, from product quality to customer support.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Supporting events worldwide, we help organizations connect people across borders and time zones.',
  },
];

const team = [
  { name: 'Sarah Chen', role: 'CEO & Co-Founder', initials: 'SC' },
  { name: 'Marcus Johnson', role: 'CTO & Co-Founder', initials: 'MJ' },
  { name: 'Elena Rodriguez', role: 'Head of Product', initials: 'ER' },
  { name: 'David Kim', role: 'Head of Engineering', initials: 'DK' },
];

const About = () => {
  return (
    <Layout>
      <div className="space-y-16 max-w-5xl mx-auto">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-bold">
              About <span className="text-primary">MeetMate</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to transform how organizations manage events and connect people.
            </p>
          </motion.div>
        </section>

        {/* Story Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                MeetMate was founded in 2023 with a simple observation: event management was stuck in the past. 
                Organizers were juggling spreadsheets, paper check-ins, and disconnected tools while attendees 
                struggled to make meaningful connections.
              </p>
              <p>
                Our founders, having experienced these frustrations firsthand at countless conferences and 
                corporate events, set out to build something better. The result is MeetMate—a unified platform 
                that streamlines every aspect of event management while fostering genuine connections.
              </p>
              <p>
                Today, MeetMate powers thousands of events worldwide, from intimate workshops to large-scale 
                conferences. We're proud to help organizations create memorable experiences and build lasting 
                professional relationships.
              </p>
            </div>
          </GlassCard>
        </motion.section>

        {/* Values Section */}
        <section className="space-y-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold">Our Values</h2>
            <p className="text-muted-foreground mt-2">The principles that guide everything we do</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold">Leadership Team</h2>
            <p className="text-muted-foreground mt-2">The people behind MeetMate</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                  {member.initials}
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-8" glow="primary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground mt-1">Events Hosted</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-primary">500K+</p>
                <p className="text-sm text-muted-foreground mt-1">Attendees Connected</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground mt-1">Countries</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-primary">99.9%</p>
                <p className="text-sm text-muted-foreground mt-1">Uptime</p>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </div>
    </Layout>
  );
};

export default About;
