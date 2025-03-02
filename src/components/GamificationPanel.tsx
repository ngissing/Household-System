import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calculateLevelInfo } from "@/lib/levels";

interface Reward {
  id: string;
  title: string;
  points: number;
  icon: string;
  minLevel?: number;
  redeemed?: boolean;
}

interface GamificationPanelProps {
  rewards?: Reward[];
}

export default function GamificationPanel({
  rewards: propRewards,
}: GamificationPanelProps) {
  const [rewards, setRewards] = useState<Reward[]>(propRewards || []);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [redeemedRewards, setRedeemedRewards] = useState<string[]>([]);

  useEffect(() => {
    if (propRewards && propRewards.length > 0) {
      setRewards(propRewards);
      setLoading(false);
    } else {
      fetchRewards();
    }
    fetchTotalPoints();

    // Load redeemed rewards from localStorage
    const storedRedeemedRewards = localStorage.getItem(
      "familyTaskRedeemedRewards",
    );
    if (storedRedeemedRewards) {
      setRedeemedRewards(JSON.parse(storedRedeemedRewards));
    }
  }, [propRewards]);

  const fetchRewards = async () => {
    try {
      // Get rewards from localStorage
      const storedRewards = localStorage.getItem("familyTaskRewards");
      if (storedRewards) {
        setRewards(JSON.parse(storedRewards));
      } else {
        // Default rewards if none in storage
        const defaultRewards = [
          {
            id: "1",
            title: "Movie Night",
            points: 100,
            icon: "🎬",
            minLevel: 3,
          },
          {
            id: "2",
            title: "Extra Screen Time",
            points: 50,
            icon: "🎮",
            minLevel: 2,
          },
          {
            id: "3",
            title: "Special Treat",
            points: 30,
            icon: "🍪",
            minLevel: 1,
          },
        ];
        setRewards(defaultRewards);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      // Fallback to default rewards if anything fails
      setRewards([
        {
          id: "1",
          title: "Movie Night",
          points: 100,
          icon: "🎬",
          minLevel: 3,
        },
        {
          id: "2",
          title: "Extra Screen Time",
          points: 50,
          icon: "🎮",
          minLevel: 2,
        },
        {
          id: "3",
          title: "Special Treat",
          points: 30,
          icon: "🍪",
          minLevel: 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("points, level");

      if (error) throw error;
      const total =
        data?.reduce((sum, member) => sum + (member.points || 0), 0) || 0;
      setTotalPoints(total);

      // Get the highest level among family members
      const highestLevel = data?.reduce(
        (max, member) => Math.max(max, member.level || 1),
        1,
      );
      setCurrentLevel(highestLevel || 1);
    } catch (error) {
      console.error("Error fetching total points:", error);
    }
  };

  const handleRedeem = async (rewardId: string, rewardPoints: number) => {
    // Check if family has enough points
    if (totalPoints < rewardPoints) {
      alert("Not enough points to redeem this reward!");
      return;
    }

    try {
      // Add to redeemed rewards
      const updatedRedeemedRewards = [...redeemedRewards, rewardId];
      setRedeemedRewards(updatedRedeemedRewards);

      // Save to localStorage
      localStorage.setItem(
        "familyTaskRedeemedRewards",
        JSON.stringify(updatedRedeemedRewards),
      );

      // Get all family members to distribute point deduction
      const { data: members, error } = await supabase
        .from("family_members")
        .select("id, points, level, progress")
        .order("points", { ascending: false });

      if (error) throw error;

      if (members && members.length > 0) {
        // Deduct points from family members with the most points first
        let remainingPointsToDeduct = rewardPoints;
        const updates = [];

        for (const member of members) {
          if (remainingPointsToDeduct <= 0) break;

          const pointsToDeduct = Math.min(
            member.points,
            remainingPointsToDeduct,
          );
          if (pointsToDeduct <= 0) continue;

          remainingPointsToDeduct -= pointsToDeduct;
          const newPoints = member.points - pointsToDeduct;
          const { level, progress } = calculateLevelInfo(newPoints);

          updates.push({
            id: member.id,
            points: newPoints,
            level,
            progress,
          });
        }

        // Update each family member's points
        for (const update of updates) {
          await supabase
            .from("family_members")
            .update({
              points: update.points,
              level: update.level,
              progress: update.progress,
            })
            .eq("id", update.id);
        }
      }

      alert(`Reward redeemed! ${rewardPoints} points have been deducted.`);

      // Update the UI
      setTotalPoints((prev) => prev - rewardPoints);
    } catch (error) {
      console.error("Error redeeming reward:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rewards available. Add some in the Settings page!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards
                .filter(
                  (reward) =>
                    !reward.minLevel || reward.minLevel <= currentLevel,
                )
                .map((reward) => {
                  const isRedeemed = redeemedRewards.includes(reward.id);
                  return (
                    <Card
                      key={reward.id}
                      className={`p-4 ${isRedeemed ? "bg-muted/50 border-dashed" : ""}`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <span className="text-4xl">{reward.icon}</span>
                        <h3 className="font-semibold">{reward.title}</h3>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span>{reward.points} points</span>
                        </div>
                        {reward.minLevel && reward.minLevel > 1 && (
                          <div className="text-xs text-muted-foreground">
                            Requires Level {reward.minLevel}
                          </div>
                        )}
                        {isRedeemed ? (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Redeemed
                          </div>
                        ) : (
                          <Button
                            className="w-full mt-2"
                            variant="outline"
                            disabled={totalPoints < reward.points}
                            onClick={() =>
                              handleRedeem(reward.id, reward.points)
                            }
                          >
                            {totalPoints >= reward.points
                              ? "Redeem"
                              : "Not enough points"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
