import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Reward {
  id: string;
  title: string;
  points: number;
  icon: string;
}

interface GamificationPanelProps {
  rewards: Reward[];
}

export default function GamificationPanel({ rewards }: GamificationPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id} className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <span className="text-4xl">{reward.icon}</span>
                  <h3 className="font-semibold">{reward.title}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{reward.points} points</span>
                  </div>
                  <Button className="w-full mt-2" variant="outline">
                    Redeem
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
