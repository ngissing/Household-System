import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { Reward } from "@/lib/types";
import { formatPointsAsDollars } from "@/lib/utils"; // Import the formatter

interface RewardCardProps {
  reward: Reward;
  memberPoints: number;
  memberColor?: string | null;
  onRedeem: (rewardId: string, cost: number) => void;
  redeemedRewardId?: string | null; // ID of the uncleared redeemed_rewards entry, if any
  onClear?: (redeemedRewardId: string) => void; // Function to clear the redemption
}

const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  memberPoints,
  memberColor,
  onRedeem,
  redeemedRewardId, // Destructure new props
  onClear,
}) => {
  const canAfford = memberPoints >= reward.cost;
  const progress = reward.cost > 0 ? Math.min((memberPoints / reward.cost) * 100, 100) : 0;
  const defaultColor = 'hsl(var(--primary))';
  const isRedeemed = !!redeemedRewardId; // Check if this specific instance is redeemed but not cleared

  return (
    <Card className="p-4 rounded-xl border shadow-sm">
      <CardContent className="p-0 flex flex-col items-center text-center space-y-2">
        {/* Icon */}
        <span className="text-4xl mb-1">{reward.icon || '🎁'}</span>

        {/* Title */}
        <h4 className="font-semibold text-sm leading-tight">{reward.title}</h4>

        {/* Progress Bar / Redeem Button / Redeemed State */}
        {isRedeemed ? (
           <div className="w-full space-y-1 text-center">
             <p className="text-sm font-medium text-green-600">Redeemed!</p>
             <Button
               size="sm" // Use 'sm' size
               variant="outline"
               className="text-xs h-7 px-2" // Adjust height and padding for smaller feel
               onClick={() => onClear && redeemedRewardId && onClear(redeemedRewardId)}
             >
               Clear
             </Button>
           </div>
         ) : canAfford ? (
           <Button
             size="sm"
             className="w-full rounded-lg text-sm font-medium"
             style={{ backgroundColor: memberColor || defaultColor }}
             onClick={() => onRedeem(reward.id, reward.cost)}
           >
             Redeem
             <Star className="h-3.5 w-3.5 ml-1.5 fill-current" />
             {formatPointsAsDollars(reward.cost)}
           </Button>
         ) : (
           <div className="w-full space-y-1">
             <Progress
               value={progress}
               className="h-5 bg-gray-200 rounded-lg"
               indicatorClassName="rounded-lg bg-[--progress-indicator-color]" // Use CSS var
               style={{ '--progress-indicator-color': memberColor || defaultColor } as React.CSSProperties}
               // Removed direct indicatorStyle
             />
             <div className="flex justify-center items-center text-xs text-muted-foreground">
               <Star className="h-3 w-3 mr-1" />
               <span>{formatPointsAsDollars(memberPoints)}/{formatPointsAsDollars(reward.cost)}</span>
             </div>
           </div>
         )}
       </CardContent>
    </Card>
  );
};

export default RewardCard;