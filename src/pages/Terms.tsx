import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';

const Terms = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <GlassCard className="p-8 md:p-12 space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using MeetMate's services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you 
                are prohibited from using or accessing our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Description of Service</h2>
              <p className="text-muted-foreground">
                MeetMate provides an event management platform that includes features such as attendee 
                registration, QR code check-in, attendance tracking, networking tools, scheduling, and 
                analytics. We reserve the right to modify, suspend, or discontinue any part of our 
                services at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. User Accounts</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>To use certain features, you must create an account. You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Promptly update any changes to your information</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use the service for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Upload malicious code or content</li>
                <li>Scrape or collect user data without permission</li>
                <li>Use automated systems to access the service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The service and its original content, features, and functionality are owned by MeetMate 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws. You may not reproduce, distribute, modify, or create 
                derivative works without our express permission.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. User Content</h2>
              <p className="text-muted-foreground">
                You retain ownership of content you submit to MeetMate. By submitting content, you grant 
                us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and 
                distribute that content in connection with providing our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Payment Terms</h2>
              <p className="text-muted-foreground">
                Certain features may require payment. All fees are non-refundable unless otherwise stated. 
                We reserve the right to change our pricing at any time with reasonable notice. Continued 
                use after price changes constitutes acceptance of the new pricing.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, MeetMate shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including loss of profits, data, 
                or goodwill, arising from your use of the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">9. Disclaimer</h2>
              <p className="text-muted-foreground">
                Our services are provided "as is" and "as available" without warranties of any kind, 
                either express or implied. We do not warrant that the service will be uninterrupted, 
                secure, or error-free.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">10. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the service immediately, without 
                prior notice, for any reason, including breach of these Terms. Upon termination, your 
                right to use the service will cease immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the State 
                of California, without regard to its conflict of law provisions. Any disputes shall be 
                resolved in the courts of San Francisco, California.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">12. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users of any 
                material changes by posting the new Terms on this page. Your continued use of the 
                service after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">13. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:legal@meetmate.com" className="text-primary hover:underline">legal@meetmate.com</a><br />
                Address: 123 Innovation Drive, San Francisco, CA 94105
              </p>
            </section>
          </GlassCard>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Terms;
