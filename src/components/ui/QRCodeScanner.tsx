import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, FlipHorizontal } from 'lucide-react';
import NeonButton from './NeonButton';
import { toast } from '@/hooks/use-toast';

interface QRCodeScannerProps {
  onScan: (profileId: string) => void;
  onClose?: () => void;
}

const QRCodeScanner = ({ onScan, onClose }: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Check if it's a valid profile URL
          const match = decodedText.match(/\/connect\/([a-zA-Z0-9-]+)$/);
          if (match) {
            setScanResult('success');
            stopScanning();
            setTimeout(() => {
              onScan(match[1]);
              toast({
                title: 'Profile Found!',
                description: 'Connecting you now...',
              });
            }, 1000);
          } else {
            setScanResult('error');
            setTimeout(() => setScanResult(null), 2000);
          }
        },
        () => {} // Ignore errors during scanning
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const toggleCamera = async () => {
    await stopScanning();
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold gradient-text">Scan QR Code</h3>
        <p className="text-muted-foreground">Point camera at a profile QR code</p>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto w-[300px] h-[300px] rounded-2xl overflow-hidden bg-muted/30"
      >
        <div id="qr-reader" className="w-full h-full" />

        {/* Scanning overlay */}
        {isScanning && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-primary rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-primary rounded-br-lg" />

            {/* Scan line animation */}
            <motion.div
              className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ top: ['20%', '80%', '20%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        {/* Result overlay */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              className={`absolute inset-0 flex items-center justify-center ${
                scanResult === 'success' ? 'bg-accent/20' : 'bg-destructive/20'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                {scanResult === 'success' ? (
                  <CheckCircle className="w-20 h-20 text-accent" />
                ) : (
                  <XCircle className="w-20 h-20 text-destructive" />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placeholder when not scanning */}
        {!isScanning && !scanResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Camera className="w-16 h-16 text-muted-foreground" />
            </motion.div>
            <p className="text-sm text-muted-foreground">Camera not active</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!isScanning ? (
          <NeonButton onClick={startScanning}>
            <Camera className="w-4 h-4" />
            <span>Start Scanning</span>
          </NeonButton>
        ) : (
          <>
            <NeonButton variant="secondary" onClick={toggleCamera}>
              <FlipHorizontal className="w-4 h-4" />
              <span>Flip</span>
            </NeonButton>
            <NeonButton variant="ghost" onClick={stopScanning}>
              <CameraOff className="w-4 h-4" />
              <span>Stop</span>
            </NeonButton>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default QRCodeScanner;
