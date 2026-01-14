import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, FlipHorizontal, RefreshCw } from 'lucide-react';
import NeonButton from './NeonButton';
import { toast } from '@/hooks/use-toast';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
}

const QRCodeScanner = ({ onScan, onClose }: QRCodeScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const scannerIdRef = useRef(`qr-reader-${Date.now()}`);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.stop();
        }
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      if (mountedRef.current) {
        setIsScanning(false);
      }
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setScanResult(null);

    try {
      // Stop any existing scanner first
      await stopScanning();

      // Create new scanner instance
      const scannerId = scannerIdRef.current;
      const scannerElement = document.getElementById(scannerId);
      
      if (!scannerElement) {
        throw new Error('Scanner element not found');
      }

      // Clear any existing content
      scannerElement.innerHTML = '';
      
      const html5QrCode = new Html5Qrcode(scannerId, {
        verbose: false,
        formatsToSupport: undefined, // Support all formats
      });
      
      scannerRef.current = html5QrCode;

      // Get available cameras first
      const cameras = await Html5Qrcode.getCameras();
      
      if (!cameras || cameras.length === 0) {
        setHasCamera(false);
        toast({
          title: 'No Camera Found',
          description: 'Please ensure your device has a camera.',
          variant: 'destructive',
        });
        setIsInitializing(false);
        return;
      }

      setHasCamera(true);

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!mountedRef.current) return;
          
          // Check if it's a valid profile QR URL
          const profileMatch = decodedText.match(/\/connect\/([a-zA-Z0-9-]+)$/);
          // Check if it's a valid event join URL
          const eventMatch = decodedText.match(/\/event\/join\/([a-zA-Z0-9-]+)$/);
          
          if (profileMatch || eventMatch) {
            setScanResult('success');
            stopScanning();
            
            setTimeout(() => {
              if (mountedRef.current) {
                onScan(decodedText);
                toast({
                  title: profileMatch ? 'Profile Found!' : 'Event Found!',
                  description: profileMatch ? 'Connecting you now...' : 'Joining event...',
                });
              }
            }, 800);
          } else {
            // Could be any URL or data - let the parent handle it
            setScanResult('success');
            stopScanning();
            setTimeout(() => {
              if (mountedRef.current) {
                onScan(decodedText);
              }
            }, 500);
          }
        },
        () => {
          // Ignore QR code not found errors during scanning
        }
      );

      if (mountedRef.current) {
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      
      if (mountedRef.current) {
        const errorMessage = err?.message || 'Unknown error';
        
        if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
          toast({
            title: 'Camera Permission Denied',
            description: 'Please allow camera access in your browser settings.',
            variant: 'destructive',
          });
        } else if (errorMessage.includes('NotFound') || errorMessage.includes('device')) {
          setHasCamera(false);
          toast({
            title: 'Camera Not Found',
            description: 'No camera detected on this device.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Scanner Error',
            description: 'Could not start camera. Try refreshing the page.',
            variant: 'destructive',
          });
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsInitializing(false);
      }
    }
  }, [facingMode, onScan, stopScanning, isInitializing]);

  const toggleCamera = useCallback(async () => {
    await stopScanning();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopScanning]);

  // Auto-restart when facing mode changes
  useEffect(() => {
    if (!isScanning && !isInitializing && scanResult === null) {
      // Don't auto-start, wait for user interaction
    }
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch (e) {
          // Ignore cleanup errors
        }
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
        <p className="text-muted-foreground">Point your camera at a QR code to scan</p>
      </div>

      <div className="relative mx-auto w-[280px] h-[280px] rounded-2xl overflow-hidden bg-muted/30 border border-border/50">
        <div id={scannerIdRef.current} className="w-full h-full" />

        {/* Scanning overlay */}
        {isScanning && !scanResult && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-10 h-10 border-l-3 border-t-3 border-primary rounded-tl-lg" style={{ borderWidth: '3px' }} />
            <div className="absolute top-4 right-4 w-10 h-10 border-r-3 border-t-3 border-primary rounded-tr-lg" style={{ borderWidth: '3px' }} />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-3 border-b-3 border-primary rounded-bl-lg" style={{ borderWidth: '3px' }} />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-3 border-b-3 border-primary rounded-br-lg" style={{ borderWidth: '3px' }} />

            {/* Scan line animation */}
            <motion.div
              className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ top: ['25%', '75%', '25%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {/* Result overlay */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              className={`absolute inset-0 flex items-center justify-center ${
                scanResult === 'success' ? 'bg-accent/30' : 'bg-destructive/30'
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
                  <CheckCircle className="w-16 h-16 text-accent" />
                ) : (
                  <XCircle className="w-16 h-16 text-destructive" />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initializing state */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Starting camera...</p>
          </div>
        )}

        {/* Placeholder when not scanning */}
        {!isScanning && !isInitializing && !scanResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/50">
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {hasCamera ? (
                <Camera className="w-14 h-14 text-muted-foreground" />
              ) : (
                <CameraOff className="w-14 h-14 text-destructive" />
              )}
            </motion.div>
            <p className="text-sm text-muted-foreground text-center px-4">
              {hasCamera ? 'Tap "Start Scanning" to begin' : 'No camera available'}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!isScanning && !isInitializing ? (
          <NeonButton onClick={startScanning} disabled={!hasCamera}>
            <Camera className="w-4 h-4" />
            <span>Start Scanning</span>
          </NeonButton>
        ) : isInitializing ? (
          <NeonButton disabled>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Starting...</span>
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

      {scanResult === 'error' && (
        <div className="text-center">
          <NeonButton 
            variant="secondary" 
            onClick={() => {
              setScanResult(null);
              startScanning();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </NeonButton>
        </div>
      )}
    </motion.div>
  );
};

export default QRCodeScanner;
