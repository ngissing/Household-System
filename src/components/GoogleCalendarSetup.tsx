import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Calendar } from "lucide-react";

interface GoogleCalendarSetupProps {
  error?: string;
}

export default function GoogleCalendarSetup({
  error,
}: GoogleCalendarSetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id:
          "1034425721932-rvf0iu4aq9aqhqjmqk7jv4t7k8ub5u7s.apps.googleusercontent.com",
        scope:
          "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
        callback: (response) => {
          if (response.access_token) {
            window.location.reload();
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      console.error("Failed to connect to Google Calendar:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Connect Google Calendar
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync chores and schedules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect Calendar"}
        </Button>
      </CardContent>
    </Card>
  );
}
