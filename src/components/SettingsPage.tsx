import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import GoogleCalendarSetup from "./GoogleCalendarSetup";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Settings</h2>
      <div className="grid gap-6">
        <GoogleCalendarSetup />
      </div>
    </div>
  );
}
