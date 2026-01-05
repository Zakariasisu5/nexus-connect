import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';

const Cookies = () => {
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
            <h1 className="text-4xl md:text-5xl font-bold">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>

          <GlassCard className="p-8 md:p-12 space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. What Are Cookies</h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your computer or mobile device when you 
                visit a website. They are widely used to make websites work more efficiently and provide 
                information to website owners. Cookies help us remember your preferences and improve 
                your experience on MeetMate.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. How We Use Cookies</h2>
              <p className="text-muted-foreground">MeetMate uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Essential Cookies:</strong> Required for the operation of our platform, including user authentication and session management.</li>
                <li><strong className="text-foreground">Functional Cookies:</strong> Remember your preferences such as language settings and theme choices.</li>
                <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with our platform to improve our services.</li>
                <li><strong className="text-foreground">Performance Cookies:</strong> Monitor platform performance and identify any issues.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Types of Cookies We Use</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Cookie Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Purpose</th>
                      <th className="text-left py-3 px-4 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">session_id</td>
                      <td className="py-3 px-4">User authentication</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">theme_preference</td>
                      <td className="py-3 px-4">Store light/dark mode preference</td>
                      <td className="py-3 px-4">1 year</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">analytics_id</td>
                      <td className="py-3 px-4">Anonymous usage analytics</td>
                      <td className="py-3 px-4">2 years</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">cookie_consent</td>
                      <td className="py-3 px-4">Remember cookie preferences</td>
                      <td className="py-3 px-4">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Third-Party Cookies</h2>
              <p className="text-muted-foreground">
                We may use third-party services that set their own cookies. These services include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Analytics providers:</strong> To help us understand platform usage</li>
                <li><strong className="text-foreground">Authentication services:</strong> For secure login functionality</li>
                <li><strong className="text-foreground">Payment processors:</strong> To handle transactions securely</li>
              </ul>
              <p className="text-muted-foreground">
                These third parties have their own privacy and cookie policies, which we encourage you to review.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Managing Cookies</h2>
              <p className="text-muted-foreground">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through their settings menu.</li>
                <li><strong className="text-foreground">Platform Settings:</strong> You can manage your cookie preferences in your MeetMate account settings.</li>
                <li><strong className="text-foreground">Opt-Out Links:</strong> Many analytics providers offer opt-out mechanisms.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Please note that disabling cookies may affect the functionality of our platform. Some 
                features may not work properly without essential cookies.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">6. Local Storage</h2>
              <p className="text-muted-foreground">
                In addition to cookies, we may use local storage technologies to store preferences and 
                improve performance. Local storage works similarly to cookies but can store larger amounts 
                of data. You can clear local storage through your browser settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">7. Updates to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or for legal reasons. We will notify you of any significant changes by updating the 
                "Last updated" date at the top of this page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">8. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies, please contact us at:
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

export default Cookies;
