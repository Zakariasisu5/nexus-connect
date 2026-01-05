import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';

const Privacy = () => {
  const lastUpdated = 'January 5, 2026';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <GlassCard className="p-8 md:p-12 space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to MeetMate ("we," "our," or "us"). We are committed to protecting your personal 
                information and your right to privacy. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our event management platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number, job title, company name, and profile information you provide.</p>
                <p><strong className="text-foreground">Account Data:</strong> Login credentials, account preferences, and settings.</p>
                <p><strong className="text-foreground">Event Data:</strong> Event registrations, attendance records, networking connections, and meeting schedules.</p>
                <p><strong className="text-foreground">Usage Data:</strong> Information about how you interact with our platform, including pages visited, features used, and time spent.</p>
                <p><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, and device identifiers.</p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide and maintain our services</li>
                <li>Process event registrations and check-ins</li>
                <li>Facilitate networking and attendee matching</li>
                <li>Send transactional emails and notifications</li>
                <li>Analyze usage to improve our platform</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Information Sharing</h2>
              <p className="text-muted-foreground">
                We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Event Organizers:</strong> To facilitate event management and attendance tracking.</li>
                <li><strong className="text-foreground">Other Attendees:</strong> Profile information you choose to share for networking purposes.</li>
                <li><strong className="text-foreground">Service Providers:</strong> Third-party vendors who help us operate our platform.</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. This 
                includes encryption, secure servers, and regular security assessments.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Your Rights</h2>
              <p className="text-muted-foreground">Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Object to processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this policy, unless a longer retention period 
                is required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not intended for individuals under the age of 16. We do not knowingly 
                collect personal information from children.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">10. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:privacy@meetmate.com" className="text-primary hover:underline">privacy@meetmate.com</a><br />
                Address: 123 Innovation Drive, San Francisco, CA 94105
              </p>
            </section>
          </GlassCard>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Privacy;
