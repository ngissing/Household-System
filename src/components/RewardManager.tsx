import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Star } from "lucide-react"; // Add Users, Star icons
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"; // Add DialogDescription
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import type { FamilyMember } from "@/lib/types";
import { formatPointsAsDollars } from "@/lib/utils"; // Import the formatter

// Align with DB schema
interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string | null;
  // created_at?: string; // Optional if needed
}

export default function RewardManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [iconInput, setIconInput] = useState<string | null>("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]); // State for family members
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]); // State for selected members in dialog

  const COMMON_ICONS = [
    "🎬", "🎮", "🍦", "🍕", "🎪", "🎨", "📱", "🎁", "🍪", "🏊", "🚲", "🎯",
  ];

  useEffect(() => {
    fetchRewards();
    fetchFamilyMembers(); // Fetch members on mount
    return () => {
        setRewards([]);
        setFamilyMembers([]);
    }
  }, []);

  // Fetch from Supabase
  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      setRewards([]); // Set empty on error
    } finally {
      setIsLoading(false);
    }
  };

   // Fetch Family Members
   const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        // Select fields required by the FamilyMember type to satisfy state typing
        .select("id, name, avatar, points, color, created_at");
      if (error) throw error;
      // Type assertion might be needed if Supabase type inference isn't perfect,
      // but usually select('*') or selecting all known fields works.
      setFamilyMembers(data as FamilyMember[] || []);
    } catch (error) {
      console.error("Error fetching family members for rewards:", error);
    }
  };

  // Save to Supabase (including assignments)
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;

    // Ensure cost is a number
    const cost = Number(editingReward.cost) || 0;

    const rewardData = {
      title: editingReward.title,
      cost: cost,
      icon: editingReward.icon,
    };

    try {
      let error;
      let rewardId = editingReward.id; // Keep track of reward ID

      if (editingReward.id) {
        // Update existing reward details
        ({ error } = await supabase
          .from("rewards")
          .update(rewardData)
          .eq("id", editingReward.id));
      } else {
        // Create new reward and get its ID
        const { data: newRewardData, error: insertError } = await supabase
            .from("rewards")
            .insert(rewardData)
            .select('id') // Select only the ID
            .single();

        if (insertError || !newRewardData) throw insertError || new Error("Failed to get new reward ID");
        error = insertError;
        rewardId = newRewardData.id; // Store the new ID
      }

      if (error) throw error;

      // --- Manage Assigned Rewards ---
      if (rewardId) { // Ensure we have a reward ID
          // 1. Delete existing assignments for this reward
          const { error: deleteError } = await supabase
              .from("assigned_rewards")
              .delete()
              .eq("reward_id", rewardId);

          // Don't throw error if delete fails (e.g., no previous assignments), but log it
          if (deleteError) console.warn("Error deleting old assignments:", deleteError);

          // 2. Insert new assignments if members are selected
          if (assignedMemberIds.length > 0) {
              const assignmentsToInsert = assignedMemberIds.map(memberId => ({
                  reward_id: rewardId,
                  member_id: memberId,
              }));
              const { error: assignError } = await supabase
                  .from("assigned_rewards")
                  .insert(assignmentsToInsert);

              if (assignError) throw assignError; // Throw if assignment fails
          }
      } else {
          throw new Error("Reward ID is missing after save/update.");
      }
      // --- End Manage Assigned Rewards ---


      await fetchRewards(); // Refresh list
      setIsDialogOpen(false);
      setEditingReward(null);
      setIconInput("");
      setAssignedMemberIds([]); // Reset selected members
    } catch (error) {
      console.error("Error saving reward:", error);
      // TODO: Add user feedback here (e.g., toast notification)
    }
  };

  // Delete from Supabase
  const handleDeleteReward = async (id: string, title: string) => {
    // Prevent deleting the default reward
    if (title === "Donate / Give") {
        alert("The default 'Donate / Give' reward cannot be deleted.");
        return;
    }
    // Cascade delete should handle assigned_rewards, no need to delete manually here
    // TODO: Add confirmation dialog maybe? For now, just delete directly.
    try {
      const { error } = await supabase.from("rewards").delete().eq("id", id);
      if (error) throw error;
      await fetchRewards(); // Refresh list
    } catch (error) {
      console.error("Error deleting reward:", error);
      // TODO: Add user feedback here
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manage Rewards</CardTitle>
          <div className="flex gap-2">
            {/* Removed Reset Purchases Button */}
            <Button
              onClick={() => {
                // Initialize for new reward
                setEditingReward({
                  id: "", // ID is empty for new
                  title: "",
                  cost: 10, // Default cost
                  icon: "🎁", // Default icon
                });
                setIconInput("🎁");
                setAssignedMemberIds([]); // Clear assignments for new reward
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Reward
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Static "Donate / Give" Reward */}
              <Card key="donate-give" className="p-4 relative border-dashed border-muted-foreground">
                <div className="flex flex-col items-center text-center space-y-2 opacity-70">
                  <span className="text-4xl">💖</span> {/* Or another suitable icon */}
                  <h3 className="font-semibold">Donate / Give</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4" />
                    <span>{formatPointsAsDollars(500)}</span> {/* Fixed cost */}
                  </div>
                  <p className="text-xs text-muted-foreground">(Default reward)</p>
                </div>
              </Card>

              {/* Map over rewards from DB */}
              {rewards.map((reward) => (
                <Card key={reward.id} className="p-4 relative">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <span className="text-4xl">{reward.icon || '🎁'}</span>
                    <h3 className="font-semibold">{reward.title}</h3>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4" />
                      <span>{formatPointsAsDollars(reward.cost)}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => { // Make async to fetch assignments
                          // Fetch current assignments for this reward when editing
                          try {
                              const { data: assignments, error } = await supabase
                                  .from("assigned_rewards")
                                  .select("member_id")
                                  .eq("reward_id", reward.id);
                              if (error) throw error;
                              setAssignedMemberIds(assignments?.map(a => a.member_id) || []);
                          } catch (fetchError) {
                              console.error("Error fetching reward assignments:", fetchError);
                              setAssignedMemberIds([]); // Reset on error
                          }
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
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteReward(reward.id, reward.title)}
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
              <DialogDescription>
                {editingReward?.id ? "Update the reward details and assignments." : "Create a new reward and assign it to family members."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveReward} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Reward Name</Label>
                <Input
                  id="title"
                  value={editingReward?.title || ''} // Handle null
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
                <Label htmlFor="cost">Cost (Points)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="1"
                  value={editingReward?.cost || ''} // Handle potential null/undefined for controlled input
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev
                        ? { ...prev, cost: parseInt(e.target.value) || 0 }
                        : null,
                    )
                  }
                  placeholder="100"
                  required
                />
              </div>

              {/* Removed Minimum Level Input */}

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="flex items-center gap-2">
                  <div className="text-4xl w-16 h-16 flex items-center justify-center border rounded-md bg-secondary">
                    {editingReward?.icon || '🎁'}
                  </div>
                  <Input
                    id="icon"
                    value={iconInput || ''} // Handle null for controlled input
                    onChange={(e) => {
                      const newIcon = e.target.value || null;
                      setIconInput(newIcon);
                      setEditingReward((prev) =>
                        prev ? { ...prev, icon: newIcon } : null,
                      );
                    }}
                    placeholder="🎁 or leave blank"
                    className="flex-1"
                  />
                </div>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {COMMON_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`text-2xl p-2 border rounded-md hover:bg-secondary transition-colors ${iconInput === icon ? 'border-primary ring-2 ring-primary' : ''}`} // Highlight selected
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

              {/* Assigned Members Checkboxes */}
              <div className="space-y-2">
                  <Label>Assign to Members</Label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-40 overflow-y-auto p-1 border rounded-md">
                      {familyMembers.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2">
                              <Checkbox
                                  id={`assign-${member.id}`}
                                  checked={assignedMemberIds.includes(member.id)}
                                  onCheckedChange={(checked) => {
                                      const memberId = member.id;
                                      setAssignedMemberIds((prev) =>
                                          checked
                                              ? [...prev, memberId]
                                              : prev.filter((id) => id !== memberId)
                                      );
                                  }}
                              />
                              <label
                                  htmlFor={`assign-${member.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                  {member.name}
                              </label>
                          </div>
                      ))}
                      {familyMembers.length === 0 && (
                          <p className="text-sm text-muted-foreground col-span-2 text-center py-2">No family members found.</p>
                      )}
                  </div>
                  <p className="text-xs text-muted-foreground">Select which family members can redeem this reward.</p>
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
