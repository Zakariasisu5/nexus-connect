import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Copy } from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import { toast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  profileId: string;
  name: string;
  onClose?: () => void;
}

const QRCodeGenerator = ({ profileId, name, onClose }: QRCodeGeneratorProps) => {
  const profileUrl = `${window.location.origin}/connect/${profileId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Link Copied!',
      description: 'Profile link copied to clipboard',
    });
  };

  const handleDownload = () => {
    const svg = document.querySelector('#profile-qr-code svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 300;
        canvas.height = 300;
        ctx?.fillRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, 0, 0, 300, 300);
        
        const link = document.createElement('a');
        link.download = `${name.replace(/\s+/g, '-')}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
    toast({
      title: 'QR Code Downloaded',
      description: 'Share it at the conference!',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Connect with ${name}`,
        text: `Scan to connect with ${name} at the conference!`,
        url: profileUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6"
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-bold gradient-text">Your Profile QR</h3>
        <p className="text-muted-foreground">Scan to connect instantly</p>
      </div>

      <motion.div
        id="profile-qr-code"
        className="relative mx-auto w-fit"
        whileHover={{ scale: 1.02 }}
        animate={{
          boxShadow: [
            '0 0 20px hsl(217 91% 60% / 0.3)',
            '0 0 40px hsl(217 91% 60% / 0.5)',
            '0 0 20px hsl(217 91% 60% / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="p-6 bg-white rounded-2xl">
          <QRCodeSVG
            value={profileUrl}
            size={200}
            level="H"
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            imageSettings={{
              src: '/favicon.ico',
              height: 40,
              width: 40,
              excavate: true,
            }}
          />
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/50 pointer-events-none"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>

      <div className="flex justify-center gap-3">
        <NeonButton variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="w-4 h-4" />
          <span>Copy Link</span>
        </NeonButton>
        <NeonButton variant="secondary" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4" />
          <span>Download</span>
        </NeonButton>
        <NeonButton size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </NeonButton>
      </div>

      <p className="text-xs text-muted-foreground">
        Show this QR code to connect with other attendees
      </p>
    </motion.div>
  );
};

export default QRCodeGenerator;
