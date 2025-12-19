import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Scan } from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeScanner from './QRCodeScanner';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
  onScanResult?: (profileId: string) => void;
}

type TabType = 'share' | 'scan';

const QRCodeModal = ({ isOpen, onClose, profileId, profileName, onScanResult }: QRCodeModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('share');

  const handleScan = (scannedProfileId: string) => {
    onScanResult?.(scannedProfileId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md"
          >
            <GlassCard className="p-0 overflow-hidden" glow="primary">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 className="text-lg font-semibold gradient-text">Quick Connect</h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex p-2 gap-2 bg-muted/20">
                <motion.button
                  onClick={() => setActiveTab('share')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                    activeTab === 'share'
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-glow-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                  whileHover={{ scale: activeTab === 'share' ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <QrCode className="w-5 h-5" />
                  <span>My QR</span>
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                    activeTab === 'scan'
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-glow-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                  whileHover={{ scale: activeTab === 'scan' ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Scan className="w-5 h-5" />
                  <span>Scan</span>
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'share' ? (
                    <motion.div
                      key="share"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <QRCodeGenerator
                        profileId={profileId}
                        name={profileName}
                        onClose={onClose}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="scan"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <QRCodeScanner onScan={handleScan} onClose={onClose} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QRCodeModal;
