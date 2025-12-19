import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  User, 
  Sparkles,
  Menu,
  X,
  QrCode
} from 'lucide-react';
import AnimatedBackground from './ui/AnimatedBackground';
import AIChatbot from './ui/AIChatbot';
import { NotificationBell, NotificationPanel, NotificationToastContainer } from './ui/NotificationCenter';
import QRCodeModal from './ui/QRCodeModal';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/matches', label: 'Matches', icon: Users },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Get user profile for QR code
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const profileId = userProfile.id || 'demo-user';
  const profileName = userProfile.name || 'Demo User';

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40">
        <div className="glass-card mx-4 mt-4 rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                MeetMate
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300',
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* QR Code Button */}
              <motion.button
                onClick={() => setQrModalOpen(true)}
                className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <QrCode className="w-5 h-5 text-foreground" />
              </motion.button>

              {/* Notification Bell */}
              <NotificationBell onClick={() => setNotificationPanelOpen(!notificationPanelOpen)} />

              {/* Mobile Menu Button */}
              <motion.button
                className="md:hidden p-2 rounded-xl hover:bg-muted/50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden px-6 pb-4 space-y-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                        isActive 
                          ? 'bg-primary/20 text-primary' 
                          : 'text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-28 pb-8 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* AI Chatbot */}
      <AIChatbot />

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />

      {/* Notification Toasts */}
      <NotificationToastContainer />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        profileId={profileId}
        profileName={profileName}
        onScanResult={(id) => {
          console.log('Scanned profile:', id);
          // Could navigate to profile or show connection modal
        }}
      />
    </div>
  );
};

export default Layout;
