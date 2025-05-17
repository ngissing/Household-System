import { useState, useEffect } from "react"; // Import hooks
import { CalendarDays, Trophy, Settings, Lock, Calendar as CalendarIcon } from "lucide-react"; // Added CalendarIcon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ChoreManager from "./ChoreManager";
import GamificationDashboard from "./GamificationDashboard";
// FamilyProgress is no longer directly used here
import DashboardHeader from "./DashboardHeader";
import SettingsPage from "./SettingsPage";
import SettingsPasswordPrompt from "./SettingsPasswordPrompt"; // Import prompt
import CalendarPage from "./CalendarPage"; // Import CalendarPage
import { comparePassword } from "@/lib/utils"; // Import password comparison utility

const SETTINGS_PASSWORD_HASH_KEY = 'settingsPasswordHash'; // Key for localStorage

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("chores");
  // Removed isSettingsUnlocked state
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  // Removed useEffect for initial lock check

  const handleTabChange = (value: string) => {
    if (value === 'settings') {
      const storedHash = localStorage.getItem(SETTINGS_PASSWORD_HASH_KEY);
      if (storedHash) {
        // Always show prompt if hash exists, don't switch tab yet
        setShowPasswordPrompt(true);
      } else {
        // No password set, allow direct access
        setActiveTab('settings');
      }
    } else {
      setActiveTab(value); // Switch to other tabs directly
    }
  };

  const handlePasswordCheck = async (password: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(SETTINGS_PASSWORD_HASH_KEY);
    // If somehow prompt was shown without hash, allow access
    if (!storedHash) {
        setShowPasswordPrompt(false);
        setActiveTab('settings');
        return true;
    }

    const isCorrect = await comparePassword(password, storedHash);
    if (isCorrect) {
      // Don't set unlocked state, just switch tab and close prompt
      setShowPasswordPrompt(false);
      setActiveTab('settings');
      return true;
    } else {
      return false; // Keep prompt open on incorrect password
    }
  };


  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="py-6 px-4 md:px-6">
        {/* Control Tabs value and handle change */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList
            className="grid w-full grid-cols-4 h-14 items-stretch" // Changed grid-cols-3 to grid-cols-4
            id="main-tabs"
          >
            <TabsTrigger
              value="chores"
              className="flex items-center justify-center gap-2"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="hidden sm:inline">Chores</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar" // Added Calendar tab trigger
              className="flex items-center justify-center gap-2"
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="flex items-center justify-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            {/* Removed Family Tab Trigger */}
            <TabsTrigger
              value="settings"
              className="flex items-center justify-center gap-2"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chores" className="space-y-4">
            <ChoreManager />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4"> {/* Added Calendar tab content */}
            <CalendarPage />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <GamificationDashboard />
          </TabsContent>

          {/* Removed Family Tab Content */}

          <TabsContent value="settings" className="space-y-4">
            {/* Always render SettingsPage, access is controlled by tab switching */}
            <SettingsPage />
          </TabsContent>
        </Tabs>

        {/* Password Prompt Dialog */}
        <SettingsPasswordPrompt
          open={showPasswordPrompt}
          onOpenChange={setShowPasswordPrompt}
          onSubmit={handlePasswordCheck}
        />
      </main>
    </div>
  );
}
