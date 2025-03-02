import { useEffect, useState } from "react";
import { Users, Star, Award } from "lucide-react";
import {
  calculateLevelInfo,
  LEVEL_THRESHOLDS,
  LEVEL_COLORS,
} from "@/lib/levels";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import EditFamilyMemberDialog from "./EditFamilyMemberDialog";
import { supabase } from "@/lib/supabase";

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  progress: number;
  streak: number;
}

function FamilyProgress() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (
    newMember: Omit<FamilyMember, "points" | "level" | "progress" | "streak">,
  ) => {
    try {
      const { error } = await supabase.from("family_members").insert([
        {
          ...newMember,
          points: 0,
          level: 1,
          progress: 0,
          streak: 0,
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Error adding family member:", error);
    }
  };

  const handleEditMember = async (
    editedMember: Omit<
      FamilyMember,
      "points" | "level" | "progress" | "streak"
    >,
  ) => {
    try {
      const { error } = await supabase
        .from("family_members")
        .update({
          name: editedMember.name,
          avatar: editedMember.avatar,
        })
        .eq("id", editedMember.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating family member:", error);
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family Members
            </CardTitle>
            <EditFamilyMemberDialog onSave={handleAddMember} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {familyMembers.map((member) => (
              <div key={member.id} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
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
                        {member.points} points
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Level {member.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    🔥 {member.streak} day streak
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={member.progress}
                    className="h-2 bg-muted"
                    indicatorClassName={LEVEL_COLORS[member.level - 1]}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.ceil(LEVEL_THRESHOLDS[member.level] - member.points)}{" "}
                    points to Level {member.level + 1}
                  </p>
                </div>
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
    </div>
  );
}

export default FamilyProgress;
