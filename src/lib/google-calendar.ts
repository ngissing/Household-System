let isInitialized = false;
let isTokenSetAttempted = false; // New flag to track if we've tried to set token from storage

const GOOGLE_TOKEN_STORAGE_KEY = 'googleApiToken'; // Key for localStorage

// Google Calendar API integration
// Export CLIENT_ID for use in other components
export const GOOGLE_CLIENT_ID = "13393732816-4643a3l9tqt7tlo6cqutqcinuufma5qc.apps.googleusercontent.com";
const API_KEY = "AIzaSyC2Dp4_U9eONBcg5eUuK0vAhDoSll9Qkbc"; // This should ideally be in an env variable
const SCOPES =
  "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";

export async function initGoogleCalendar(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      console.warn("Google Calendar init skipped: window is undefined (SSR or worker?)");
      return reject(new Error("Window not available"));
    }

    // REMOVED: const token = window.google?.accounts?.oauth2?.getToken(); - This was causing the error.
    // The token is handled by the GIS library and applied to gapi.client after user connects.

    if (isInitialized && window.gapi && window.gapi.client) {
      console.log("Google Calendar GAPI client core already initialized.");
      // If core is initialized, try to set token if not already attempted this session
      if (!isTokenSetAttempted && window.gapi?.client?.setToken) { // Check for setToken
          const storedTokenString = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
          if (storedTokenString) {
              try {
                  const token = JSON.parse(storedTokenString); // This is the full token object
                  if (token && token.access_token) {
                      // TODO: Add expiry check here if expires_in or similar is stored
                      window.gapi.client.setToken(token); // Pass the whole token object
                      console.log("Google Calendar: Restored token object from localStorage on re-init.");
                  } else {
                      console.warn("Google Calendar: Invalid token structure in localStorage.");
                      localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
                  }
              } catch (e) {
                  console.error("Google Calendar: Failed to parse stored token:", e);
                  localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
              }
          }
          isTokenSetAttempted = true; // Mark that we've attempted to set the token
      }
      return resolve();
    }
    // If not initialized, or gapi.client is missing, proceed with full initialization.
    isInitialized = false; // Ensure full re-initialization if something was amiss
    isTokenSetAttempted = false;
    // Load Google Identity Services script
    const loadGisScript = () => {
      return new Promise((resolveScript, rejectScript) => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = resolveScript;
        script.onerror = rejectScript;
        document.body.appendChild(script);
      });
    };

    // Load GAPI script
    const loadGapiScript = () => {
      return new Promise((resolveScript, rejectScript) => {
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = resolveScript;
        script.onerror = rejectScript;
        document.body.appendChild(script);
      });
    };

    // Initialize Google Identity Services - This specific initialization is for Google Sign-In (One Tap, etc.)
    // and its callback is for ID tokens. For Token Client (OAuth for API access),
    // this explicit initGis() call in the chain might not be strictly necessary for initTokenClient to work,
    // as long as the GIS script itself is loaded. Let's simplify the chain.
    // const initGis = () => {
    //   return new Promise((resolveGis) => {
    //     if (window.google && window.google.accounts && window.google.accounts.id) {
    //       window.google.accounts.id.initialize({
    //         client_id: GOOGLE_CLIENT_ID,
    //         callback: (response) => { // This callback is for ID token response
    //           console.log("google.accounts.id.initialize callback response:", response);
    //           resolveGis(response);
    //         },
    //       });
    //     } else {
    //       console.warn("initGis: window.google.accounts.id not ready.");
    //       // Resolve immediately if this part isn't critical or ready
    //       // Or reject if it's considered essential for this init flow
    //       resolveGis(null); // Or reject, depending on strictness
    //     }
    //   });
    // };

    // Initialize GAPI client
    const initGapiClient = async () => {
      await new Promise<void>((resolveLoad) => {
        window.gapi.load("client", resolveLoad);
      });

      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });

      // At this point, gapi.client is initialized with apiKey and discoveryDocs.
      // It does NOT have an access token yet. The token is set after the user
      // successfully connects via GoogleCalendarSetup.tsx -> handleConnect -> callback.
      console.log("Google Calendar GAPI client core initialized (apiKey and discoveryDocs set).");

      // Attempt to load and set token from localStorage immediately after core init
      const storedTokenString = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
      if (storedTokenString) {
        try {
          const token = JSON.parse(storedTokenString);
          if (token && token.access_token) {
            // TODO: Add expiry check here if expires_in or similar is stored
            // For now, just set it. The API call will fail if it's truly expired.
            window.gapi.client.setToken(token);
            console.log("Google Calendar: Restored access token from localStorage post-init.");
          } else {
            console.warn("Google Calendar: Invalid token structure in localStorage during init.");
            localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY); // Clean up invalid item
          }
        } catch (e) {
          console.error("Google Calendar: Failed to parse stored token during init:", e);
          localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY); // Clean up corrupted item
        }
      }
      isTokenSetAttempted = true; // Mark that we've attempted to set the token
      isInitialized = true;
      console.log("Access token (if found in storage) has been applied. Otherwise, it will be set after user connects via OAuth flow.");
      resolve();
    };

    // Execute the sequence
    // We need both scripts loaded. initGis (for google.accounts.id) is not directly
    // awaited for initGapiClient or the subsequent initTokenClient flow.
    Promise.all([loadGisScript(), loadGapiScript()])
      .then(() => {
        // GIS script is loaded, so window.google.accounts.oauth2 should be available.
        // GAPI script is loaded, so window.gapi should be available.
        // Now initialize the GAPI client part.
        return initGapiClient();
      })
      // .then(() => initGis()) // Removed initGis from the blocking chain for initGoogleCalendar's resolution
      .then(resolve) // Resolve the main promise once initGapiClient (which now resolves void) is done
      .catch(reject);
  });
}

export async function addChoreToCalendar(chore: {
  title: string;
  description?: string;
  dueDate: Date;
}) {
  if (!window.gapi?.client?.calendar) {
    throw new Error("Google Calendar not initialized");
  }

  const event = {
    summary: chore.title,
    description: chore.description,
    start: {
      dateTime: chore.dueDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(chore.dueDate.getTime() + 30 * 60000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  try {
    await window.gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
  } catch (error) {
    console.error("Error adding event to calendar:", error);
    throw error;
  }
}

export async function getCalendarEvents(
  calendarIds: string[],
  timeMin: Date,
  timeMax: Date
) {
  if (!window.gapi?.client?.calendar) {
    throw new Error("Google Calendar not initialized");
  }

  try {
    const allEvents: any[] = [];
    for (const calendarId of calendarIds) {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
      });
      if (response.result.items) {
        allEvents.push(...response.result.items);
      }
    }
    // Sort all events by start time
    allEvents.sort((a, b) => {
      const timeA = new Date(a.start.dateTime || a.start.date).getTime();
      const timeB = new Date(b.start.dateTime || b.start.date).getTime();
      return timeA - timeB;
    });
    return allEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

export async function listCalendars() {
  if (!window.gapi?.client?.calendar) {
    throw new Error("Google Calendar not initialized");
  }
  try {
    const response = await (window.gapi.client.calendar as any).calendarList.list();
    return response.result.items;
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    throw error;
  }
}

export async function createEvent(calendarId: string, event: any) {
  if (!window.gapi?.client?.calendar) {
    throw new Error("Google Calendar not initialized");
  }
  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId: calendarId,
      resource: event,
    });
    return response.result;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}
