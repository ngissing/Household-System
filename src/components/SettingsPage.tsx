import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Trash2, Gift } from "lucide-react";
import GoogleCalendarSetup from "./GoogleCalendarSetup";
import RoutineManager from "./RoutineManager";
import RewardManager from "./RewardManager";
import { supabase } from "@/lib/supabase";
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

export default function SettingsPage() {
  const [familyMembers, setFamilyMembers] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    fetchFamilyMembers();
    createRewardsTableIfNeeded();
  }, []);

  const createRewardsTableIfNeeded = async () => {
    // No need to check for rewards table since we're using localStorage
  };

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Delete all chores from today onwards
      const { error: deleteError } = await supabase
        .from("chores")
        .delete()
        .gte("due_date", today.toISOString());

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error("Error resetting chores:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Settings</h2>
      <div className="grid gap-6">
        <RoutineManager familyMembers={familyMembers} />
        <RewardManager />
        <GoogleCalendarSetup />

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
                  {isResetting ? "Resetting..." : "Reset All Chores"}
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
                    Yes, Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
