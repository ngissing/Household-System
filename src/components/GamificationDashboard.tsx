import { Trophy, Star, Gift, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { Reward, FamilyMember } from "@/lib/types";
import RewardCard from "./RewardCard";
import { formatPointsAsDollars } from "@/lib/utils"; // Import the formatter
import DonateGiveDialog from "./DonateGiveDialog"; // Import the new dialog

// Interface for uncleared redemptions from DB
interface UnclearedRedemption {
    id: string;
    reward_id: string | null; // Can be null for 'Donate/Give'
    member_id: string;
}


export default function GamificationDashboard() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [assignedRewards, setAssignedRewards] = useState<Array<{reward_id: string, member_id: string}>>([]);
  const [unclearedRedemptions, setUnclearedRedemptions] = useState<UnclearedRedemption[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingRedemptions, setLoadingRedemptions] = useState(true);
  const [isDonateGiveDialogOpen, setIsDonateGiveDialogOpen] = useState(false);
  const [donateGiveMemberId, setDonateGiveMemberId] = useState<string | null>(null);
  const [donateGiveCost, setDonateGiveCost] = useState<number>(0);


  useEffect(() => {
    fetchFamilyMembers();
    fetchRewards();
    fetchAssignedRewards();
    fetchUnclearedRedemptions();

    // Subscribe to realtime changes for family members
    const memberChannel = supabase
      .channel("family_members_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "family_members" },
        () => { fetchFamilyMembers(); }
      )
      .subscribe();

    // Subscribe to changes in assigned_rewards table
    const assignmentChannel = supabase
      .channel('assigned_rewards_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assigned_rewards' },
        () => { fetchAssignedRewards(); }
      )
      .subscribe();

    // Subscribe to changes in redeemed_rewards table
    const redemptionChannel = supabase
      .channel('redeemed_rewards_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'redeemed_rewards' },
        (payload: any) => { // Supabase RealtimePayload
          console.log('Redeemed rewards change:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          // Helper to create UnclearedRedemption object from a record
          const toUnclearedRedemption = (record: any): UnclearedRedemption | null => {
            if (!record || typeof record.id === 'undefined') return null;
            return {
              id: record.id,
              reward_id: record.reward_id,
              member_id: record.member_id,
            };
          };

          if (eventType === 'INSERT') {
            const newUncleared = toUnclearedRedemption(newRecord);
            if (newUncleared && newRecord.is_cleared === false) {
              setUnclearedRedemptions(prev => {
                if (prev.find(r => r.id === newUncleared.id)) return prev; // Avoid duplicates
                return [...prev, newUncleared];
              });
            }
          } else if (eventType === 'UPDATE') {
            const updatedRecord = toUnclearedRedemption(newRecord);
            if (updatedRecord) {
              if (newRecord.is_cleared === true) {
                // If updated to be cleared, remove from unclearedRedemptions
                setUnclearedRedemptions(prev => prev.filter(r => r.id !== updatedRecord.id));
              } else if (newRecord.is_cleared === false) {
                // If updated to be not cleared, add/update it
                setUnclearedRedemptions(prev => {
                  const existingIndex = prev.findIndex(r => r.id === updatedRecord.id);
                  if (existingIndex !== -1) {
                    const newState = [...prev];
                    newState[existingIndex] = updatedRecord;
                    return newState;
                  }
                  return [...prev, updatedRecord];
                });
              }
            }
          } else if (eventType === 'DELETE') {
            // If deleted, remove from unclearedRedemptions
            // Ensure oldRecord and oldRecord.id exist before trying to access id
            if (oldRecord && typeof oldRecord.id !== 'undefined') {
                 setUnclearedRedemptions(prev => prev.filter(r => r.id !== oldRecord.id));
            }
          }
        }
      )
      .subscribe();

    // Cleanup all subscriptions
    return () => {
        supabase.removeChannel(memberChannel);
        supabase.removeChannel(assignmentChannel);
        supabase.removeChannel(redemptionChannel);
    };
  }, []);

  const fetchFamilyMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("id, name, avatar, points, color") // Select needed fields including color
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Function to fetch rewards
  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      setRewards([]);
    } finally {
      setLoadingRewards(false);
    }
  };

  // Fetch assigned rewards
  const fetchAssignedRewards = async () => {
      setLoadingAssignments(true);
      try {
          const { data, error } = await supabase
              .from("assigned_rewards")
              .select("reward_id, member_id");

          if (error) throw error;
          setAssignedRewards(data || []);
      } catch (error) {
          console.error("Error fetching assigned rewards:", error);
          setAssignedRewards([]);
      } finally {
          setLoadingAssignments(false);
      }
  };

   // Fetch uncleared redemptions
   const fetchUnclearedRedemptions = async () => {
    setLoadingRedemptions(true);
    try {
        const { data, error } = await supabase
            .from("redeemed_rewards")
            .select("id, reward_id, member_id") // Select necessary fields
            .eq("is_cleared", false); // Only fetch uncleared ones

        if (error) throw error;
        setUnclearedRedemptions(data || []);
    } catch (error) {
        console.error("Error fetching uncleared redemptions:", error);
        setUnclearedRedemptions([]);
    } finally {
        setLoadingRedemptions(false);
    }
  };

  // Redeem logic - Opens dialog for 'donate-give', otherwise processes directly
  const handleRedeem = async (rewardId: string, cost: number, memberId: string) => {
      const member = familyMembers.find(m => m.id === memberId);
      if (!member || member.points < cost) {
          alert("Not enough points to redeem this reward!");
          return;
      }

      // --- Special handling for Donate/Give ---
      if (rewardId === 'donate-give') {
          setDonateGiveMemberId(memberId);
          setDonateGiveCost(cost);
          setIsDonateGiveDialogOpen(true);
          return; // Stop here, let the dialog handle the next step
      }

      // --- Standard redemption logic for other rewards ---
      const calculatedNewPoints = member.points - cost;
      const newPoints = Math.round(calculatedNewPoints);

      try {
          // 1. Update member points
          const { error: pointsError } = await supabase
              .from("family_members")
              .update({ points: newPoints })
              .eq("id", memberId);
          if (pointsError) throw pointsError;

          // 2. Insert into redeemed_rewards table
          const { data: redemptionData, error: logError } = await supabase
              .from("redeemed_rewards")
              .insert({
                  reward_id: rewardId, // Use the actual rewardId
                  member_id: memberId,
                  points_spent: cost,
                  is_cleared: false
              })
              .select('id, reward_id, member_id')
              .single();
          if (logError) throw logError;

          // 3. Update local state
          setFamilyMembers(prevMembers =>
              prevMembers.map(m =>
                  m.id === memberId ? { ...m, points: newPoints } : m
              )
          );
          if (redemptionData) {
              setUnclearedRedemptions(prev => [...prev, redemptionData]);
          }

          alert("Reward redeemed successfully!");

      } catch (error) {
          console.error("Error redeeming standard reward:", error);
          alert("Failed to redeem reward. Please try again.");
      }
  };

  // Handles the choice from the DonateGiveDialog
  const handleDonateGiveConfirm = async (choice: 'donate' | 'give', targetMemberId?: string) => {
      if (!donateGiveMemberId || donateGiveCost <= 0) {
          console.error("Missing data for donate/give confirmation.");
          alert("An error occurred. Please try again.");
          setIsDonateGiveDialogOpen(false);
          return;
      }

      const giver = familyMembers.find(m => m.id === donateGiveMemberId);
      if (!giver) {
          alert("Could not find the redeeming member.");
          setIsDonateGiveDialogOpen(false);
          return;
      }

      const cost = donateGiveCost; // Use the stored cost
      const giverId = donateGiveMemberId;

      setIsDonateGiveDialogOpen(false); // Close dialog immediately

      try {
          // --- Donate Logic ---
          if (choice === 'donate') {
              const calculatedNewPoints = giver.points - cost;
              const newPoints = Math.round(calculatedNewPoints);

              // 1. Update giver's points
              const { error: pointsError } = await supabase
                  .from("family_members")
                  .update({ points: newPoints })
                  .eq("id", giverId);
              if (pointsError) throw pointsError;

              // 2. Log the donation redemption
              const { data: redemptionData, error: logError } = await supabase
                  .from("redeemed_rewards")
                  .insert({
                      reward_id: null, // Explicitly null for donate/give
                      member_id: giverId,
                      points_spent: cost,
                      is_cleared: false // Needs admin clearing
                      // Removed notes field
                  })
                  .select('id, reward_id, member_id')
                  .single();
              if (logError) throw logError;

              // 3. Update local state
              setFamilyMembers(prevMembers =>
                  prevMembers.map(m =>
                      m.id === giverId ? { ...m, points: newPoints } : m
                  )
              );
              if (redemptionData) {
                  setUnclearedRedemptions(prev => [...prev, redemptionData]);
              }
              alert(`Successfully donated ${formatPointsAsDollars(cost)}!`);

          // --- Give Logic ---
          } else if (choice === 'give' && targetMemberId) {
              const receiver = familyMembers.find(m => m.id === targetMemberId);
              if (!receiver) {
                  alert("Could not find the receiving member.");
                  return;
              }

              const giverNewPoints = Math.round(giver.points - cost);
              const receiverNewPoints = Math.round(receiver.points + cost);

              // Use a transaction or function if possible, otherwise sequential updates
              // 1. Update Giver Points
              const { error: giverError } = await supabase
                  .from("family_members")
                  .update({ points: giverNewPoints })
                  .eq("id", giverId);
              if (giverError) throw giverError;

              // 2. Update Receiver Points
              const { error: receiverError } = await supabase
                  .from("family_members")
                  .update({ points: receiverNewPoints })
                  .eq("id", targetMemberId);
              if (receiverError) {
                  // Attempt to rollback giver's points (best effort without transaction)
                  await supabase.from("family_members").update({ points: giver.points }).eq("id", giverId);
                  throw receiverError;
              }

              // 3. Log the 'give' redemption for the giver
              const { data: redemptionData, error: logError } = await supabase
                  .from("redeemed_rewards")
                  .insert({
                      reward_id: null, // Explicitly null for donate/give
                      member_id: giverId,
                      points_spent: cost,
                      is_cleared: false // Needs admin clearing
                      // Removed notes field
                  })
                  .select('id, reward_id, member_id')
                  .single();
              if (logError) throw logError;

              // 4. Update local state for both members
              setFamilyMembers(prevMembers =>
                  prevMembers.map(m => {
                      if (m.id === giverId) return { ...m, points: giverNewPoints };
                      if (m.id === targetMemberId) return { ...m, points: receiverNewPoints };
                      return m;
                  })
              );
               if (redemptionData) {
                  setUnclearedRedemptions(prev => [...prev, redemptionData]);
              }

              alert(`Successfully gave ${formatPointsAsDollars(cost)} to ${receiver.name}!`);
          }
      } catch (error) {
          console.error("Error processing donate/give choice:", error);
          alert("An error occurred while processing your choice. Please check points and try again.");
          // Consider fetching fresh data to ensure consistency after error
          fetchFamilyMembers();
          fetchUnclearedRedemptions();
      } finally {
          // Reset state regardless of success/failure
          setDonateGiveMemberId(null);
          setDonateGiveCost(0);
      }
  };

  // Clear redeemed reward by removing the assignment (or marking Donate/Give as cleared)
  const handleClear = async (redeemedRewardId: string) => {
      // Find the redemption record to get reward_id and member_id
      const redemptionToClear = unclearedRedemptions.find(r => r.id === redeemedRewardId);
      if (!redemptionToClear) {
          console.error("Could not find redemption record to clear locally.");
          alert("Error clearing reward.");
          return;
      }

      const { reward_id, member_id } = redemptionToClear;

      // Handle 'Donate / Give' differently: mark as cleared, don't delete assignment
      if (reward_id === null) { // Check for null reward_id for Donate/Give
        console.log(`Attempting to clear 'Donate / Give' with redeemedRewardId: ${redeemedRewardId}`);
           try {
               const { error: updateError, data: updateData } = await supabase
                   .from("redeemed_rewards")
                   .update({ is_cleared: true })
                   .eq("id", redeemedRewardId)
                   .select(); // Request the updated row(s) to see what happened

               console.log('Donate/Give clear update attempt result:', { updateError, updateData });

               if (updateError) {
                  console.error("Supabase update error object for Donate/Give:", JSON.stringify(updateError, null, 2));
                  throw updateError; // Propagate to catch block
               }

               if (!updateData || updateData.length === 0) {
                   console.warn(`No rows updated for Donate/Give redeemedRewardId: ${redeemedRewardId}. Was it already cleared or deleted?`);
                   // Still attempt to clear from local state as it might have been there
               } else {
                   console.log(`Successfully updated is_cleared for Donate/Give redeemedRewardId: ${redeemedRewardId}`, updateData);
               }

               // Update local state
               setUnclearedRedemptions(prev => prev.filter(r => r.id !== redeemedRewardId));
               console.log("Locally cleared 'Donate / Give' redemption status.");

           } catch(error: any) {
                console.error("Error in catch block while clearing 'Donate / Give' redemption:", error);
                if (error && error.message) {
                  console.error("Error message:", error.message);
                  if (error.details) console.error("Error details:", error.details);
                  if (error.hint) console.error("Error hint:", error.hint);
                  if (error.code) console.error("Error code:", error.code);
                }
                alert("Failed to clear 'Donate / Give' status. Please check the browser console for more details.");
           }
          return;
      }

      // For custom rewards, delete the assignment
      try {
          const { error } = await supabase
              .from("assigned_rewards")
              .delete()
              .eq("reward_id", reward_id)
              .eq("member_id", member_id);

          if (error) throw error;

          // Update local state for both uncleared redemptions and assignments
          setUnclearedRedemptions(prev => prev.filter(r => r.id !== redeemedRewardId));
          setAssignedRewards(prev => prev.filter(a => !(a.reward_id === reward_id && a.member_id === member_id)));

          console.log(`Reward assignment cleared for reward ${reward_id} and member ${member_id}`);

      } catch (error) {
          console.error("Error clearing redeemed reward assignment:", error);
          alert("Failed to clear reward assignment. Please try again.");
      }
  };


  if (loadingMembers || loadingRewards || loadingAssignments || loadingRedemptions) { // Check all loading states
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Helper to convert hex to rgba for background tint
  const hexToRgba = (hex: string, alpha: number): string => {
    if (!/^#[0-9A-F]{6}$/i.test(hex)) {
      // console.warn(`Invalid hex color: ${hex}, using default.`);
      return `rgba(200, 200, 200, ${alpha})`; // Default gray if invalid
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };


  return (
    <div className="space-y-6">
      {/* Removed static title */}

      {/* Use flex-wrap layout similar to ChoreManager */}
      <div className="flex flex-wrap gap-6 pb-6 justify-center">
        {familyMembers.map((member) => {
          const columnBgColor = member.color ? hexToRgba(member.color, 0.1) : 'transparent';

          return (
            // Member Column
            <div
              key={member.id}
              className="flex flex-col items-center space-y-4 p-4 rounded-lg flex-grow flex-shrink-0 basis-[calc(20%-1.5rem)]" // Adjust basis/gap as needed
              style={{ backgroundColor: columnBgColor }}
            >
              {/* Member Header */}
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                </div>
                {/* Points Badge */}
                <div className="flex items-center gap-1 text-sm bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full flex-shrink-0">
                  <Star className="h-4 w-4" />
                  <span>{formatPointsAsDollars(member.points)}</span>
                </div>
              </div>

              {/* Rewards List - Filtered based on assignment */}
              <div className="w-full space-y-2 mt-4">
                 {/* Static Donate/Give Reward (Always shown) */}
                 <RewardCard
                    key="donate-give"
                    reward={{ id: 'donate-give', title: 'Donate / Give', cost: 500, icon: '💖' }}
                    memberPoints={member.points}
                    memberColor={member.color}
                    // Find if 'Donate / Give' has been redeemed but not cleared by this member
                    redeemedRewardId={unclearedRedemptions.find(r => r.member_id === member.id && r.reward_id === null)?.id || null}
                    onRedeem={() => handleRedeem('donate-give', 500, member.id)}
                    onClear={handleClear}
                 />
                 {/* Map over assigned rewards for this member */}
                 {rewards
                    .filter(reward =>
                        // Check if reward is assigned to this member
                        assignedRewards.some(a => a.reward_id === reward.id && a.member_id === member.id)
                    )
                    .map((reward) => {
                       // Find if there's an uncleared redemption for this member/reward
                       const unclearedRedemption = unclearedRedemptions.find(
                           r => r.member_id === member.id && r.reward_id === reward.id
                       );
                       return (
                           <RewardCard
                              key={reward.id}
                              reward={reward}
                              memberPoints={member.points}
                              memberColor={member.color}
                              redeemedRewardId={unclearedRedemption?.id || null} // Pass redemption ID or null
                              onRedeem={(rewardId, cost) => handleRedeem(rewardId, cost, member.id)}
                              onClear={handleClear} // Pass clear handler
                           />
                       );
                    })}
                 {/* Optional: Message if no custom rewards are assigned */}
                 {rewards.filter(reward => assignedRewards.some(a => a.reward_id === reward.id && a.member_id === member.id)).length === 0 && (
                    <p className="text-center text-muted-foreground text-sm pt-4">No specific rewards assigned yet.</p>
                 )}
              </div>
            </div>
          );
        })}

        {familyMembers.length === 0 && (
           <Card className="p-8 w-full">
             <div className="text-center space-y-4">
               <Users className="h-12 w-12 mx-auto text-muted-foreground" />
               <h2 className="text-2xl font-bold">No Family Members Yet</h2>
               <p className="text-muted-foreground">
                 Add family members in the Family tab to start tracking rewards.
               </p>
             </div>
           </Card>
         )}
     </div>

     {/* Donate/Give Dialog */}
     <DonateGiveDialog
       isOpen={isDonateGiveDialogOpen}
       onClose={() => {
           setIsDonateGiveDialogOpen(false);
           setDonateGiveMemberId(null);
           setDonateGiveCost(0);
       }}
       onConfirm={handleDonateGiveConfirm}
       cost={donateGiveCost}
       currentMemberId={donateGiveMemberId || ''}
       // Filter out the current member from the list passed to the dialog
       otherMembers={familyMembers.filter(m => m.id !== donateGiveMemberId)}
     />
   </div>
 );
}
