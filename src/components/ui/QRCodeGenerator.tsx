import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Copy, RefreshCw } from 'lucide-react';
import NeonButton from './NeonButton';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL } from '@/lib/constants';

interface QRCodeGeneratorProps {
  profileId: string;
  name: string;
  onClose?: () => void;
}

const QRCodeGenerator = ({ profileId, name, onClose }: QRCodeGeneratorProps) => {
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Generate the connect URL using the secure QR code token
  const connectUrl = qrCodeId ? `${APP_URL}/connect/${qrCodeId}` : '';

  // Fetch or generate the user's QR code ID on mount
  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: 'Please sign in',
          description: 'You need to be logged in to generate your QR code.',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('qr-connect', {
        body: { action: 'generate' },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.error) {
        console.error('QR generate error:', response.error);
        toast({
          title: 'Error',
          description: 'Failed to generate QR code',
          variant: 'destructive',
        });
        return;
      }

      if (response.data?.qr_code_id) {
        setQrCodeId(response.data.qr_code_id);
      }
    } catch (error) {
      console.error('QR fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load QR code',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!connectUrl) return;
    await navigator.clipboard.writeText(connectUrl);
    toast({
      title: 'Link Copied!',
      description: 'Share this link to connect with others',
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
      description: 'Share it to connect with others!',
    });
  };

  const handleShare = async () => {
    if (!connectUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: `Connect with ${name} on MeetMate`,
        text: 'Scan to connect on MeetMate',
        url: connectUrl,
      });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground mt-4">Generating your QR code...</p>
      </div>
    );
  }

  if (!qrCodeId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to generate QR code</p>
        <NeonButton variant="secondary" onClick={fetchQRCode} className="mt-4">
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </NeonButton>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6"
    >
      <div className="space-y-2">
        <h3 className="text-2xl font-bold gradient-text">Scan to connect on MeetMate</h3>
        <p className="text-muted-foreground">Share your QR code to instantly connect</p>
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
            value={connectUrl}
            size={200}
            level="H"
            bgColor="#ffffff"
            fgColor="#1a1a2e"
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
        When scanned, new users will be prompted to sign up first
      </p>
    </motion.div>
  );
};

export default QRCodeGenerator;
