import { useEffect, useState } from "react";
import { Users, Star, DollarSign } from "lucide-react"; // Added DollarSign
import { formatPointsAsDollars } from "@/lib/utils";
import AddPointsDialog from "./AddPointsDialog"; // Import the new dialog
// Removed level imports
// import {
//   calculateLevelInfo,
//   LEVEL_THRESHOLDS,
//   LEVEL_COLORS,
// } from "@/lib/levels";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button"; // Import Button
// import { Progress } from "./ui/progress"; // Removed Progress import
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
// Removed commented out Tabs import
import EditFamilyMemberDialog from "./EditFamilyMemberDialog";
// Removed commented out MemberLevelPhotos import
import { supabase } from "@/lib/supabase";
import type { FamilyMember } from "@/lib/types"; // Import shared FamilyMember type

// Removed local FamilyMember interface definition
// interface FamilyMember { ... }

function FamilyProgress() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  // Remove activeTab state if Tabs are removed
  // const [activeTab, setActiveTab] = useState<string>("members");

  useEffect(() => {
    fetchFamilyMembers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("family_members_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_members" },
        (payload) => {
          console.log("Change received!", payload);
          fetchFamilyMembers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("family_members")
        // Explicitly select needed columns, including avatar and color
        .select("id, name, avatar, points, color, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      console.log("[FamilyProgress] fetchFamilyMembers fetched:", data); // DEBUG LOG
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (
    // Type now includes avatar URL and color from dialog
    newMember: Omit<FamilyMember, "points" | "level" | "progress" | "streak"> & { avatar: string; color?: string | null },
  ) => {
    console.log("[FamilyProgress] handleAddMember received:", newMember); // DEBUG LOG
    try {
      const { error } = await supabase.from("family_members").insert([
        {
          id: newMember.id,
          name: newMember.name,
          avatar: newMember.avatar,
          color: newMember.color,
          points: 0,
          // Remove level, progress, streak as they are deprecated
          // level: 1,
          // progress: 0,
          // streak: 0,
        },
      ]);

      if (error) throw error;
      await fetchFamilyMembers(); // Refetch after successful insert
    } catch (error) {
      console.error("Error adding family member:", error);
    }
  };

  const handleEditMember = async (
    // Type now includes avatar URL and color from dialog
     editedMember: Omit<FamilyMember, "points" | "level" | "progress" | "streak"> & { avatar: string; color?: string | null },
   ) => {
     console.log("[FamilyProgress] handleEditMember received:", editedMember); // DEBUG LOG
     try {
       const { error } = await supabase
         .from("family_members")
        .update({
          name: editedMember.name,
          avatar: editedMember.avatar, // Use avatar URL from dialog
          color: editedMember.color,   // Use color from dialog
        })
        .eq("id", editedMember.id);

      if (error) throw error;
      await fetchFamilyMembers(); // Refetch after successful update
    } catch (error) {
      console.error("Error updating family member:", error);
    }
  };

  // Function to handle adding points
  const handleAddPoints = async (memberId: string, pointsToAdd: number) => {
    console.log(`[FamilyProgress] handleAddPoints called for member ${memberId} with ${pointsToAdd} points.`); // DEBUG LOG
    try {
      // 1. Fetch current points
      const { data: memberData, error: fetchError } = await supabase
        .from("family_members")
        .select("points")
        .eq("id", memberId)
        .single(); // Expecting only one member

      if (fetchError || !memberData) {
        throw fetchError || new Error("Family member not found.");
      }

      const currentPoints = memberData.points || 0;
      const newTotalPoints = currentPoints + pointsToAdd;

      console.log(`[FamilyProgress] Current points: ${currentPoints}, New total: ${newTotalPoints}`); // DEBUG LOG

      // 2. Update points in the database
      const { error: updateError } = await supabase
        .from("family_members")
        .update({ points: newTotalPoints })
        .eq("id", memberId);

      if (updateError) {
        throw updateError;
      }

      console.log(`[FamilyProgress] Points updated successfully for member ${memberId}.`); // DEBUG LOG

      // 3. Refetch data (optional, as realtime should update, but good for immediate feedback)
      // await fetchFamilyMembers(); // Already handled by realtime subscription

    } catch (error) {
      console.error("Error in handleAddPoints:", error);
      // Re-throw the error so the dialog can display it
      throw error;
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
      <h2 className="text-2xl font-bold text-primary">Family</h2>

      {/* Remove Tabs wrapper and TabsList */}
      {/* <Tabs ... > */}
        {/* <TabsList ... > ... </TabsList> */}

        {/* Keep only the "members" content */}
        {/* <TabsContent value="members"> */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <div className="flex items-center gap-2"> {/* Wrapper for buttons */}
                  <AddPointsDialog
                    members={familyMembers}
                    onAddPoints={handleAddPoints}
                    triggerButton={
                      <Button variant="outline" size="sm">
                        <DollarSign className="h-4 w-4 mr-1" /> Add Points
                      </Button>
                    }
                  />
                  <EditFamilyMemberDialog onSave={handleAddMember} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {familyMembers.map((member) => (
                  <div key={member.id} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {/* Use the actual avatar URL now and add key */}
                        {/* Reverted timestamp addition */}
                        <AvatarImage src={member.avatar} key={member.avatar} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      {/* Removed temporary debug img tag */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          <EditFamilyMemberDialog
                            member={member}
                            onSave={handleEditMember}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {formatPointsAsDollars(member.points)}
                          </span>
                          {/* Remove Level display */}
                          {/* <span className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            Level {member.level}
                          </span> */}
                        </div>
                      </div>
                      {/* Remove Streak display */}
                      {/* <div className="text-sm font-medium">
                        🔥 {member.streak} day streak
                      </div> */}
                    </div>
                    {/* Remove Progress bar and points to next level */}
                    {/* <div className="space-y-1"> ... </div> */}
                  </div>
                ))}

                {familyMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No family members yet. Add your first one!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        {/* </TabsContent> */}

        {/* Remove Level Photos TabsContent */}
        {/* <TabsContent value="photos"> ... </TabsContent> */}
      {/* </Tabs> */}
    </div>
  );
}

export default FamilyProgress;
