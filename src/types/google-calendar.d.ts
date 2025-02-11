interface Window {
  gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: (config: {
        apiKey: string;
        discoveryDocs?: string[];
      }) => Promise<void>;
      setToken: (token: { access_token: string }) => void;
      calendar: {
        events: {
          insert: (params: {
            calendarId: string;
            resource: any;
          }) => Promise<any>;
          list: (params: {
            calendarId: string;
            timeMin: string;
            timeMax: string;
            showDeleted: boolean;
            singleEvents: boolean;
            orderBy: string;
          }) => Promise<{
            result: {
              items: any[];
            };
          }>;
        };
      };
    };
  };
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: any) => void;
        }) => void;
      };
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: any) => void;
        }) => {
          requestAccessToken: () => void;
        };
        getToken: () => { access_token: string } | null;
      };
    };
  };
}
