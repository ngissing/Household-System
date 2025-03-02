import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Reward {
  id: string;
  title: string;
  points: number;
  icon: string;
  minLevel?: number;
  redeemed?: boolean;
}

export default function RewardManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [iconInput, setIconInput] = useState("");

  const COMMON_ICONS = [
    "🎬",
    "🎮",
    "🍦",
    "🍕",
    "🎪",
    "🎨",
    "📱",
    "🎁",
    "🍪",
    "🏊",
    "🚲",
    "🎯",
  ];

  useEffect(() => {
    fetchRewards();
    return () => setRewards([]);
  }, []);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      // Use local storage for rewards instead of database
      const storedRewards = localStorage.getItem("familyTaskRewards");
      if (storedRewards) {
        setRewards(JSON.parse(storedRewards));
      } else {
        // Default rewards if none in storage
        const defaultRewards = [
          {
            id: crypto.randomUUID(),
            title: "Movie Night",
            points: 100,
            icon: "🎬",
            minLevel: 3,
          },
          {
            id: crypto.randomUUID(),
            title: "Extra Screen Time",
            points: 50,
            icon: "🎮",
            minLevel: 2,
          },
          {
            id: crypto.randomUUID(),
            title: "Special Treat",
            points: 30,
            icon: "🍪",
            minLevel: 1,
          },
        ];
        setRewards(defaultRewards);
        localStorage.setItem(
          "familyTaskRewards",
          JSON.stringify(defaultRewards),
        );
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      // Fallback to defaults if anything fails
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;

    try {
      let updatedRewards;

      if (editingReward.id) {
        // Update existing reward in local state
        updatedRewards = rewards.map((reward) =>
          reward.id === editingReward.id ? editingReward : reward,
        );
      } else {
        // Create new reward with a unique ID
        const newReward = {
          ...editingReward,
          id: crypto.randomUUID(),
        };
        updatedRewards = [...rewards, newReward];
      }

      // Update state and save to localStorage
      setRewards(updatedRewards);
      localStorage.setItem("familyTaskRewards", JSON.stringify(updatedRewards));

      setIsDialogOpen(false);
      setEditingReward(null);
      setIconInput("");
    } catch (error) {
      console.error("Error saving reward:", error);
    }
  };

  const handleDeleteReward = async (id: string) => {
    try {
      // Delete reward from local state
      const updatedRewards = rewards.filter((reward) => reward.id !== id);
      setRewards(updatedRewards);

      // Save updated list to localStorage
      localStorage.setItem("familyTaskRewards", JSON.stringify(updatedRewards));
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rewards</CardTitle>
          <Button
            onClick={() => {
              setEditingReward({
                id: "",
                title: "",
                points: 0,
                icon: "🎁",
                minLevel: 1,
              });
              setIconInput("🎁");
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Reward
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rewards.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No rewards yet. Add your first one!
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <Card key={reward.id} className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="text-4xl">{reward.icon}</span>
                    <h3 className="font-semibold">{reward.title}</h3>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <span>{reward.points} points</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingReward(reward);
                          setIconInput(reward.icon);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReward(reward.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingReward?.id ? "Edit" : "Create"} Reward
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveReward} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Reward Name</Label>
                <Input
                  id="title"
                  value={editingReward?.title}
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev ? { ...prev, title: e.target.value } : null,
                    )
                  }
                  placeholder="Movie Night"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points Required</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={editingReward?.points}
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev
                        ? { ...prev, points: parseInt(e.target.value) || 0 }
                        : null,
                    )
                  }
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minLevel">Minimum Level Required</Label>
                <Input
                  id="minLevel"
                  type="number"
                  min="1"
                  max="10"
                  value={editingReward?.minLevel || 1}
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev
                        ? { ...prev, minLevel: parseInt(e.target.value) || 1 }
                        : null,
                    )
                  }
                  placeholder="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="flex items-center gap-2">
                  <div className="text-4xl w-16 h-16 flex items-center justify-center border rounded-md">
                    {editingReward?.icon}
                  </div>
                  <Input
                    id="icon"
                    value={iconInput}
                    onChange={(e) => {
                      setIconInput(e.target.value);
                      if (e.target.value) {
                        setEditingReward((prev) =>
                          prev ? { ...prev, icon: e.target.value } : null,
                        );
                      }
                    }}
                    placeholder="🎁"
                    className="flex-1"
                  />
                </div>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {COMMON_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className="text-2xl p-2 border rounded-md hover:bg-secondary transition-colors"
                      onClick={() => {
                        setIconInput(icon);
                        setEditingReward((prev) =>
                          prev ? { ...prev, icon } : null,
                        );
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                Save Reward
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
