let isInitialized = false;

// Google Calendar API integration
export async function initGoogleCalendar() {
  if (isInitialized) return;
  const CLIENT_ID =
    "1034425721932-rvf0iu4aq9aqhqjmqk7jv4t7k8ub5u7s.apps.googleusercontent.com";
  const API_KEY = "AIzaSyDqxjqjEBKCK1vg-iDfHQdxYVLrGhHUoYk";
  const SCOPES =
    "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events";

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;

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

    // Initialize Google Identity Services
    const initGis = () => {
      return new Promise((resolveGis) => {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            resolveGis(response);
          },
        });
      });
    };

    // Initialize GAPI client
    const initGapiClient = async () => {
      await new Promise((resolveLoad) => {
        window.gapi.load("client", resolveLoad);
      });

      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });

      window.gapi.client.setToken({
        access_token: window.google.accounts.oauth2.getToken()?.access_token,
      });

      resolve(window.gapi);
      isInitialized = true;
    };

    // Execute the sequence
    Promise.all([loadGisScript(), loadGapiScript()])
      .then(() => initGis())
      .then(() => initGapiClient())
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

export async function getCalendarEvents(timeMin: Date, timeMax: Date) {
  if (!window.gapi?.client?.calendar) {
    throw new Error("Google Calendar not initialized");
  }

  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.result.items;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}
