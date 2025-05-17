import { useState, useEffect } from "react";
import { Star, Wallet, Gift, PiggyBank, Heart, Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { supabase } from "@/lib/supabase";
import { calculateLevelInfo, LEVEL_COLORS } from "@/lib/levels";
import { formatPointsAsDollars } from "@/lib/utils"; // Import the formatter
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import LevelUpButton from "./LevelUpButton";
import RewardSelectionDialog from "./RewardSelectionDialog";

interface MemberRewardPanelProps {
  memberId: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  progress: number;
}

export default function MemberRewardPanel({
  memberId,
  name,
  avatar,
  points,
  level,
  progress,
}: MemberRewardPanelProps) {
  const [bankBalance, setBankBalance] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<
    Array<{
      id: string;
      type: "spend" | "save" | "give";
      amount: number;
      date: string;
      description?: string;
    }>
  >([]);
  const [levelReached, setLevelReached] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(level);
  const [showRewardSelection, setShowRewardSelection] = useState(false);

  // Level-based avatar images
  const levelImages = [
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level1`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level2`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level3`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level4`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level5`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level6`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level7`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level8`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level9`,
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}-level10`,
  ];

  useEffect(() => {
    // Load bank balance from localStorage
    const storedBalance = localStorage.getItem(`familyTask_bank_${memberId}`);
    if (storedBalance) {
      setBankBalance(parseFloat(storedBalance));
    }

    // Load reward history from localStorage
    const storedHistory = localStorage.getItem(
      `familyTask_history_${memberId}`,
    );
    if (storedHistory) {
      setRewardHistory(JSON.parse(storedHistory));
    }

    // Load previous level from localStorage
    const storedPreviousLevel = localStorage.getItem(
      `familyTask_prevLevel_${memberId}`,
    );
    const savedPreviousLevel = storedPreviousLevel
      ? parseInt(storedPreviousLevel)
      : 0;

    // Set the previous level state
    setPreviousLevel(savedPreviousLevel);

    // Check if level has increased
    if (level > savedPreviousLevel) {
      setLevelReached(true);
      setShowRewardDialog(true);
    }
  }, [memberId, level]);

  const handleRewardChoice = (choice: "spend" | "save" | "give") => {
    const newReward = {
      id: crypto.randomUUID(),
      type: choice,
      amount: 10,
      date: new Date().toISOString(),
      description:
        choice === "spend"
          ? "Reward options"
          : choice === "save"
            ? "Saved for later"
            : "Donated to charity",
    };

    let newBalance = bankBalance;

    if (choice === "save") {
      newBalance += 10;
    }

    // Update bank balance
    setBankBalance(newBalance);
    localStorage.setItem(`familyTask_bank_${memberId}`, newBalance.toString());

    // Update reward history
    const updatedHistory = [newReward, ...rewardHistory];
    setRewardHistory(updatedHistory);
    localStorage.setItem(
      `familyTask_history_${memberId}`,
      JSON.stringify(updatedHistory),
    );

    // Save the current level as the previous level to prevent showing the dialog again
    localStorage.setItem(`familyTask_prevLevel_${memberId}`, level.toString());
    setPreviousLevel(level);
    setLevelReached(false);
    setShowRewardDialog(false);

    // If they chose to spend, show the rewards selection dialog
    if (choice === "spend") {
      setShowRewardSelection(true);
    }
  };

  const getLevelImage = () => {
    const index = Math.min(level - 1, levelImages.length - 1);
    return levelImages[index];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getLevelImage()} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <span>{name}'s Rewards</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <Star className="h-8 w-8 text-yellow-500 mb-2" />
              <h3 className="font-semibold">Level {level}</h3>
              <Progress
                value={progress}
                className="w-full mt-2"
                indicatorClassName={LEVEL_COLORS[level - 1]}
              />
              {level > previousLevel && (
                <div className="mt-2">
                  <LevelUpButton
                    memberId={memberId}
                    level={level}
                    onRewardChoice={handleRewardChoice}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <PiggyBank className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold">Bank Balance</h3>
              <p className="text-2xl font-bold">${bankBalance.toFixed(2)}</p>
            </div>

            <div className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
              <Wallet className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold">Points</h3>
              <p className="text-2xl font-bold">{formatPointsAsDollars(points)}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-4">Reward History</h3>
            {rewardHistory.length > 0 ? (
              <div className="space-y-2">
                {rewardHistory.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-3 bg-muted/20 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      {reward.type === "spend" && (
                        <Gift className="h-5 w-5 text-purple-500" />
                      )}
                      {reward.type === "save" && (
                        <PiggyBank className="h-5 w-5 text-green-500" />
                      )}
                      {reward.type === "give" && (
                        <Heart className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {reward.type === "spend"
                            ? reward.description &&
                              reward.description !== "Reward options"
                              ? reward.description
                              : "Spent on rewards"
                            : reward.type === "save"
                              ? "Saved for later"
                              : "Donated to charity"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reward.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      ${reward.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No reward history yet. Complete chores to earn rewards!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Level {level} Reached! 🎉</DialogTitle>
            <DialogDescription>
              Congratulations! You've reached Level {level} and earned $10.
              Choose what you'd like to do with your reward:
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              onClick={() => handleRewardChoice("spend")}
              className="flex flex-col items-center h-auto py-6"
              variant="outline"
            >
              <Gift className="h-8 w-8 mb-2 text-purple-500" />
              <span className="font-semibold">Spend</span>
              <span className="text-xs text-center mt-1">
                Choose from rewards
              </span>
            </Button>

            <Button
              onClick={() => handleRewardChoice("save")}
              className="flex flex-col items-center h-auto py-6"
              variant="outline"
            >
              <PiggyBank className="h-8 w-8 mb-2 text-green-500" />
              <span className="font-semibold">Save</span>
              <span className="text-xs text-center mt-1">Add to your bank</span>
            </Button>

            <Button
              onClick={() => handleRewardChoice("give")}
              className="flex flex-col items-center h-auto py-6"
              variant="outline"
            >
              <Heart className="h-8 w-8 mb-2 text-red-500" />
              <span className="font-semibold">Give</span>
              <span className="text-xs text-center mt-1">
                Donate to charity
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RewardSelectionDialog
        open={showRewardSelection}
        onOpenChange={setShowRewardSelection}
        onSelect={(rewardId) => {
          // Find the reward details
          const storedRewards = localStorage.getItem("familyTaskRewards");
          if (storedRewards) {
            const allRewards = JSON.parse(storedRewards);
            const selectedReward = allRewards.find(
              (reward) => reward.id === rewardId,
            );
            if (selectedReward) {
              alert(
                `You've selected ${selectedReward.title} for ${selectedReward.points}! It will be delivered soon.`,
              );

              // Add to reward history with specific reward name
              const newRewardHistory = [
                {
                  id: crypto.randomUUID(),
                  type: "spend" as const,
                  amount: selectedReward.points,
                  date: new Date().toISOString(),
                  description: `Purchased: ${selectedReward.title}`,
                },
                ...rewardHistory,
              ];

              setRewardHistory(newRewardHistory);
              localStorage.setItem(
                `familyTask_history_${memberId}`,
                JSON.stringify(newRewardHistory),
              );
            }
          }
        }}
        maxPoints={10}
      />
    </div>
  );
}
