import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

interface QrScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

const QrScanner = ({ onScan, onClose }: QrScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    const startScanner = async () => {
      if (isScanning.current) return;
      isScanning.current = true;

      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (decodedText.startsWith("http")) {
              scanner.stop();
              onScan(decodedText);
            } else {
              toast.error("Invalid QR code format");
            }
          },
          () => {
            // Error callback - ignore scanning errors
          }
        );
      } catch (error) {
        toast.error("Failed to start camera");
        onClose();
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && isScanning.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            isScanning.current = false;
          });
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          id="qr-reader"
          className="rounded-md overflow-hidden border border-border"
        />
        <Button
          onClick={onClose}
          variant="outline"
          size="icon"
          className="absolute top-2 right-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Point camera at QR code
      </p>
    </div>
  );
};

export default QrScanner;
