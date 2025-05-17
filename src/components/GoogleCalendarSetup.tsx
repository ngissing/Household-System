import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Calendar } from "lucide-react";
import { GOOGLE_CLIENT_ID, initGoogleCalendar } from "@/lib/google-calendar"; // Import Client ID and init function

interface GoogleCalendarSetupProps {
  error?: string;
}

export default function GoogleCalendarSetup({
  error,
}: GoogleCalendarSetupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // This useEffect will now only ensure that the Google API scripts are loaded
    // and the GAPI client is initialized when the component mounts.
    // It will not attempt to silently log in or change the isConnected state.
    // The isConnected state will be managed by the explicit handleConnect flow.
    const initializeGoogleApis = async () => {
      try {
        console.log("GoogleCalendarSetup: useEffect: Calling initGoogleCalendar()...");
        await initGoogleCalendar();
        console.log("GoogleCalendarSetup: useEffect: initGoogleCalendar() completed.");
        // The isConnected state will remain false by default.
        // The user must click "Connect Calendar" to initiate the OAuth flow.
        // After a successful connection and page reload (from handleConnect),
        // GAPI calls in CalendarPage should work due to the established Google session.
      } catch (error) {
        console.error("GoogleCalendarSetup: Error during initGoogleCalendar in useEffect:", error);
      }
    };

    initializeGoogleApis();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    console.log("handleConnect: Attempting to connect...");
    try {
      // Ensure GAPI client is loaded and initialized before attempting to get a token
      console.log("handleConnect: Calling initGoogleCalendar()...");
      await initGoogleCalendar();
      console.log("handleConnect: initGoogleCalendar() completed.");

      if (!window.google?.accounts?.oauth2) {
        console.error("handleConnect: Google Identity Services (GIS) oauth2 not available.");
        setIsConnecting(false);
        return;
      }

      // Add a small delay and re-check for the GIS object, just in case of timing issues
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

      if (!window.google?.accounts?.oauth2?.initTokenClient) {
          console.error("handleConnect: Google Identity Services (GIS) oauth2.initTokenClient still not available after delay.");
          setIsConnecting(false);
          return;
      }
      
      console.log("handleConnect: Initializing token client...");
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            console.log("Access token received:", tokenResponse.access_token);
            // Set the token for the GAPI client to use
            if (window.gapi && window.gapi.client) {
              window.gapi.client.setToken({ access_token: tokenResponse.access_token });
              setIsConnected(true); // Update connection status
              console.log("GAPI client token set. State updated, no reload.");
              // REMOVED: window.location.reload();
              // The CalendarPage should react to the new isConnected state or re-check GAPI token.
            } else {
               console.error("GAPI client not available to set token.");
               setIsConnecting(false);
            }
          } else {
            console.error("Failed to retrieve access token from Google.", tokenResponse);
            setIsConnecting(false);
          }
        }
        // Removed error_callback as it's not a property of initTokenClient config per TS types
      });
      console.log("handleConnect: Requesting access token...");
      client.requestAccessToken();
      console.log("handleConnect: requestAccessToken() called.");
    } catch (error) {
      console.error("Failed to connect to Google Calendar (in handleConnect catch):", error);
      setIsConnecting(false);
    }
    // No finally here, as setIsConnecting is handled in callbacks
  };

  const handleDisconnect = () => {
    // Clear GAPI client's active token, if GAPI is loaded.
    // This prevents the app from using the token for further API calls.
    if (window.gapi?.client) {
      window.gapi.client.setToken(null);
      console.log('GAPI client token cleared.');
    }

    // Update UI state to reflect disconnection
    setIsConnected(false);

    // Reload the page. This helps to clear any in-memory state related to the
    // Google session and ensures the user would need to re-authenticate.
    // The actual token held by Google Identity Services will expire on its own.
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isConnected ? "Google Calendar Connected" : "Connect Google Calendar"}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your Google Calendar is connected. You can now manage events in the Calendar tab."
            : "Connect your Google Calendar to sync chores and schedules."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        {isConnected ? (
          <Button
            onClick={handleDisconnect}
            variant="outline"
            className="w-full"
          >
            Disconnect Calendar
          </Button>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? "Connecting..." : "Connect Calendar"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
