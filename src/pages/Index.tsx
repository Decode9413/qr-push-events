import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, QrCode, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import QrScanner from "@/components/QrScanner";

type AppState = "permission" | "scan" | "events";

interface EventItem {
  id: string;
  text: string;
  timestamp: number;
}

const Index = () => {
  const [state, setState] = useState<AppState>("permission");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Check if notification permission already granted
    if ("Notification" in window && Notification.permission === "granted") {
      setState("scan");
    }

    // Load events from localStorage
    const stored = localStorage.getItem("events");
    if (stored) {
      setEvents(JSON.parse(stored));
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notifications enabled");
        setState("scan");
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      toast.error("Failed to request permission");
    }
  };

  const handleQrScan = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("QR code registered");
        setState("events");
        setIsScanning(false);
      } else {
        toast.error("Failed to register QR code");
      }
    } catch (error) {
      toast.error("Failed to send request");
    }
  };

  const handleForget = () => {
    localStorage.removeItem("events");
    setEvents([]);
    setState("scan");
    toast.success("Data cleared");
  };

  const addEvent = (text: string) => {
    const newEvent: EventItem = {
      id: Date.now().toString(),
      text,
      timestamp: Date.now(),
    };
    const updated = [newEvent, ...events];
    setEvents(updated);
    localStorage.setItem("events", JSON.stringify(updated));
  };

  // Simulate push notification (in real app, this comes from service worker)
  useEffect(() => {
    if (state === "events") {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "push-notification") {
          addEvent(event.data.text);
        }
      };
      navigator.serviceWorker?.addEventListener("message", handleMessage);
      return () => {
        navigator.serviceWorker?.removeEventListener("message", handleMessage);
      };
    }
  }, [state, events]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-card border-border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Event Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {state === "permission" && "Enable notifications to continue"}
            {state === "scan" && "Scan QR code to register"}
            {state === "events" && "Your events"}
          </p>
        </div>

        {state === "permission" && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Push notifications are required for app functionality
              </p>
            </div>
            <Button
              onClick={requestNotificationPermission}
              className="w-full"
              size="lg"
            >
              Enable Notifications
            </Button>
          </div>
        )}

        {state === "scan" && !isScanning && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Scan a QR code to start tracking events
              </p>
            </div>
            <Button
              onClick={() => setIsScanning(true)}
              className="w-full"
              size="lg"
            >
              Scan QR Code
            </Button>
          </div>
        )}

        {state === "scan" && isScanning && (
          <div className="space-y-4">
            <QrScanner
              onScan={handleQrScan}
              onClose={() => setIsScanning(false)}
            />
          </div>
        )}

        {state === "events" && (
          <div className="space-y-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No events yet. Waiting for notifications...
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 bg-accent rounded-md text-sm text-accent-foreground border border-border"
                  >
                    {event.text}
                  </div>
                ))
              )}
            </div>
            <Button
              onClick={handleForget}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Forget
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Index;
