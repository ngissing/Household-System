import { Trophy, Star, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import GamificationPanel from "./GamificationPanel";

const REWARDS = [
  {
    id: "1",
    title: "Movie Night",
    points: 100,
    icon: "🎬",
  },
  {
    id: "2",
    title: "Extra Screen Time",
    points: 50,
    icon: "🎮",
  },
  {
    id: "3",
    title: "Special Treat",
    points: 30,
    icon: "🍪",
  },
];

export default function GamificationDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">250</div>
            <p className="text-xs text-muted-foreground">
              +20 points this week
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
            <div className="text-2xl font-bold">Level 5</div>
            <Progress value={60} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              40 points to next level
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
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Unlock more with points
            </p>
          </CardContent>
        </Card>
      </div>

      <GamificationPanel rewards={REWARDS} />
    </div>
  );
}
