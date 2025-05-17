import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Lock } from "lucide-react"; // Added Lock icon
import { Input } from "./ui/input"; // Added Input
import { Label } from "./ui/label"; // Added Label
import GoogleCalendarSetup from "./GoogleCalendarSetup";
import RoutineManager from "./RoutineManager";
import RewardManager from "./RewardManager";
import FamilyProgress from "./FamilyProgress";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/utils"; // Import hashing utility
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import type { FamilyMember } from "@/lib/types";

const SETTINGS_PASSWORD_HASH_KEY = 'settingsPasswordHash'; // Key for localStorage

export default function SettingsPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordIsSet, setPasswordIsSet] = useState(false); // Track if a password exists

  useEffect(() => {
    fetchFamilyMembers();
    // Check if password is set on mount
    setPasswordIsSet(!!localStorage.getItem(SETTINGS_PASSWORD_HASH_KEY));
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      // Fetch all necessary fields for FamilyProgress component
      const { data, error } = await supabase
        .from("family_members")
        .select("id, name, avatar, points, color, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Delete all chores from today onwards
      // Consider if this is the desired behavior - might want to delete ALL chores
      const { error: deleteError } = await supabase
        .from("chores")
        .delete()
        .gte("due_date", today.toISOString());

      if (deleteError) throw deleteError;
      alert("Chores from today onwards have been reset."); // Add user feedback
    } catch (error) {
      console.error("Error resetting chores:", error);
      alert("Failed to reset chores."); // Add error feedback
    } finally {
      setIsResetting(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null); // Clear previous feedback

    if (!newPassword) {
      setPasswordFeedback({ type: 'error', message: 'Password cannot be empty.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const hash = await hashPassword(newPassword);
      if (hash) {
        localStorage.setItem(SETTINGS_PASSWORD_HASH_KEY, hash);
        setPasswordFeedback({ type: 'success', message: 'Password updated successfully!' });
        setNewPassword("");
        setConfirmPassword("");
        setPasswordIsSet(true);
        // Force reload to ensure DashboardLayout re-checks lock state
        window.location.reload();
      } else {
        throw new Error("Failed to hash password.");
      }
    } catch (error) {
      console.error("Error saving password:", error);
      setPasswordFeedback({ type: 'error', message: 'Failed to save password. Please try again.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRemovePassword = () => {
      if (confirm("Are you sure you want to remove password protection?")) {
          localStorage.removeItem(SETTINGS_PASSWORD_HASH_KEY);
          setPasswordFeedback({ type: 'success', message: 'Password protection removed.' });
          setPasswordIsSet(false);
          setNewPassword("");
          setConfirmPassword("");
          // Force reload to ensure DashboardLayout re-checks lock state
          window.location.reload();
      }
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Settings</h2>
      {/* Use a responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: Family Management */}
        <div className="space-y-6">
          {/* FamilyProgress component now handles its own data fetching */}
          <FamilyProgress />
        </div>

        {/* Column 2: Other Settings */}
        <div className="space-y-6">
          {/* Pass the fetched family members (only id/name needed here) */}
          <RoutineManager familyMembers={familyMembers.map(m => ({ id: m.id, name: m.name }))} />
          <RewardManager />
          <GoogleCalendarSetup />

          {/* Password Protection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {passwordIsSet
                    ? "Change the password required to access the settings tab."
                    : "Set a password to protect access to the settings tab."}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {passwordFeedback && (
                  <p className={`text-sm ${passwordFeedback.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                    {passwordFeedback.message}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                   <Button type="submit" disabled={isSavingPassword}>
                     {isSavingPassword ? "Saving..." : (passwordIsSet ? "Change Password" : "Set Password")}
                   </Button>
                   {passwordIsSet && (
                     <Button type="button" variant="outline" onClick={handleRemovePassword}>
                       Remove Password
                     </Button>
                   )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Reset Chores Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Reset Chores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isResetting}>
                    {isResetting ? "Resetting..." : "Reset Chores (Today Onwards)"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all chores (including default chores) from
                      today onwards. Default chores will be recreated when you
                      view future dates. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Yes, Reset Chores
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div> {/* End Column 2 */}

      </div> {/* End Grid */}
    </div> // End Main Container
  );
}
