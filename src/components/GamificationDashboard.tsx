import { Trophy, Star, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import GamificationPanel from "./GamificationPanel";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateLevelInfo } from "@/lib/levels";

export default function GamificationDashboard() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [pointsToNextLevel, setPointsToNextLevel] = useState(0);
  const [rewardCount, setRewardCount] = useState(0);

  useEffect(() => {
    fetchFamilyPoints();
    fetchRewardCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("family_members_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_members" },
        () => {
          fetchFamilyPoints();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRewardCount = async () => {
    try {
      // Get rewards count from localStorage
      const storedRewards = localStorage.getItem("familyTaskRewards");
      if (storedRewards) {
        const rewards = JSON.parse(storedRewards);
        setRewardCount(rewards.length);
      } else {
        // Default to 3 if no rewards in storage
        setRewardCount(3);
      }
    } catch (error) {
      console.error("Error fetching reward count:", error);
      // Default to 3 if there's an error
      setRewardCount(3);
    }
  };

  const fetchFamilyPoints = async () => {
    try {
      // Get all family members
      const { data: members, error } = await supabase
        .from("family_members")
        .select("points");

      if (error) throw error;

      // Calculate total points
      const total =
        members?.reduce((sum, member) => sum + (member.points || 0), 0) || 0;
      setTotalPoints(total);

      // Calculate level info
      const levelInfo = calculateLevelInfo(total);
      setLevel(levelInfo.level);
      setProgress(levelInfo.progress);
      setPointsToNextLevel(levelInfo.pointsToNextLevel);

      // Calculate weekly points (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: recentChores, error: choresError } = await supabase
        .from("chores")
        .select("points, status")
        .gte("created_at", oneWeekAgo.toISOString())
        .eq("status", "completed");

      if (choresError) throw choresError;

      const weekly =
        recentChores?.reduce((sum, chore) => sum + (chore.points || 0), 0) || 0;
      setWeeklyPoints(weekly);
    } catch (error) {
      console.error("Error fetching family points:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              +{weeklyPoints} points this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Level Progress
            </CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Level {level}</div>
            <Progress value={progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {pointsToNextLevel} points to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Rewards
            </CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewardCount}</div>
            <p className="text-xs text-muted-foreground">
              Unlock more with points
            </p>
          </CardContent>
        </Card>
      </div>

      <GamificationPanel />
    </div>
  );
}
