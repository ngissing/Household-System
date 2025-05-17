import { useState } from "react";
import { Button } from "./ui/button";
import { Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Gift, PiggyBank, Heart } from "lucide-react";

interface LevelUpButtonProps {
  memberId: string;
  level: number;
  onRewardChoice: (choice: "spend" | "save" | "give") => void;
}

export default function LevelUpButton({
  memberId,
  level,
  onRewardChoice,
}: LevelUpButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const handleClick = () => {
    setShowDialog(true);
  };

  const handleRewardChoice = (choice: "spend" | "save" | "give") => {
    onRewardChoice(choice);
    setShowDialog(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={handleClick}
      >
        <Trophy className="h-4 w-4 text-yellow-500" />
        Claim Level {level} Reward
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
    </>
  );
}
