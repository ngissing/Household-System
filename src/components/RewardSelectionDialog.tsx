import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Gift } from "lucide-react";

interface Reward {
  id: string;
  title: string;
  points: number;
  icon: string;
}

interface RewardSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (rewardId: string) => void;
  maxPoints: number;
}

export default function RewardSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  maxPoints = 10,
}: RewardSelectionDialogProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedRewards, setPurchasedRewards] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadRewards();

      // Load purchased rewards
      const purchased = localStorage.getItem("familyTaskPurchasedRewards");
      if (purchased) {
        setPurchasedRewards(JSON.parse(purchased));
      } else {
        setPurchasedRewards([]);
      }
    }
  }, [open]);

  const loadRewards = () => {
    setLoading(true);
    try {
      // Get rewards from localStorage
      const storedRewards = localStorage.getItem("familyTaskRewards");
      if (storedRewards) {
        const allRewards = JSON.parse(storedRewards);
        // Show all rewards, not just affordable ones
        setRewards(allRewards);
      } else {
        setRewards([]);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReward = (rewardId: string) => {
    // Mark reward as purchased in localStorage
    const storedRewards = localStorage.getItem("familyTaskRewards");
    if (storedRewards) {
      const allRewards = JSON.parse(storedRewards);
      const selectedReward = allRewards.find((r: Reward) => r.id === rewardId);

      // Get purchased rewards from localStorage
      const purchasedRewardsStr =
        localStorage.getItem("familyTaskPurchasedRewards") || "[]";
      const purchased = JSON.parse(purchasedRewardsStr);

      // Add this reward to purchased list if not already there
      if (!purchased.includes(rewardId)) {
        purchased.push(rewardId);
        localStorage.setItem(
          "familyTaskPurchasedRewards",
          JSON.stringify(purchased),
        );
      }

      // Update the UI with the new purchased rewards
      setPurchasedRewards(purchased);
    }

    onSelect(rewardId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose a Reward</DialogTitle>
          <DialogDescription>
            You have ${maxPoints} available to spend
          </DialogDescription>
          <div className="text-xs text-muted-foreground mt-1">
            More rewards can be added in the Settings tab
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : rewards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {rewards.map((reward) => (
              <Card
                key={reward.id}
                className={`p-4 relative ${purchasedRewards.includes(reward.id) ? "border-green-500 border-2" : ""} ${reward.points <= maxPoints ? "cursor-pointer hover:bg-muted/50" : "opacity-60 cursor-not-allowed"}`}
                onClick={() =>
                  reward.points <= maxPoints && handleSelectReward(reward.id)
                }
              >
                {purchasedRewards.includes(reward.id) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Purchased
                  </div>
                )}
                <div className="flex flex-col items-center text-center space-y-2">
                  <span className="text-3xl">{reward.icon}</span>
                  <h3 className="font-semibold">{reward.title}</h3>
                  <p
                    className={`text-sm ${reward.points <= maxPoints ? "text-green-600 font-medium" : "text-red-500"}`}
                  >
                    ${reward.points}{" "}
                    {reward.points > maxPoints && "(insufficient funds)"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground" />
            <p>No rewards available.</p>
            <p className="text-sm text-muted-foreground">
              Ask a parent to add some rewards in the Settings tab.
            </p>
          </div>
        )}

        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
