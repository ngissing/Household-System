import { CalendarDays, Users, Trophy, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ChoreManager from "./ChoreManager";
import GamificationDashboard from "./GamificationDashboard";
import FamilyProgress from "./FamilyProgress";
import DashboardHeader from "./DashboardHeader";
import SettingsPage from "./SettingsPage";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader />

      <main className="container mx-auto py-6 px-4 md:px-6">
        <Tabs defaultValue="chores" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 items-stretch">
            <TabsTrigger
              value="chores"
              className="flex items-center justify-center gap-2"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="hidden sm:inline">Chores</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="flex items-center justify-center gap-2"
            >
              <Trophy className="h-5 w-5" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="flex items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline">Family</span>
            </TabsTrigger>
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

          <TabsContent value="progress" className="space-y-4">
            <GamificationDashboard />
          </TabsContent>

          <TabsContent value="family" className="space-y-4">
            <FamilyProgress />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
