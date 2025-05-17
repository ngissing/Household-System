import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FamilyMember } from '@/lib/types';
import { formatPointsAsDollars } from '@/lib/utils'; // Import the formatter

interface DonateGiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (choice: 'donate' | 'give', targetMemberId?: string) => void;
  cost: number;
  currentMemberId: string;
  otherMembers: FamilyMember[]; // List of members excluding the current one
}

const DonateGiveDialog: React.FC<DonateGiveDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cost,
  currentMemberId,
  otherMembers,
}) => {
  const [choice, setChoice] = useState<'donate' | 'give' | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setChoice(null);
      setSelectedMemberId(undefined);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (choice === 'donate') {
      onConfirm('donate');
    } else if (choice === 'give' && selectedMemberId) {
      onConfirm('give', selectedMemberId);
    }
  };

  const canConfirm = choice === 'donate' || (choice === 'give' && !!selectedMemberId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donate or Give Reward</DialogTitle>
          <DialogDescription>
            You've redeemed the 'Donate / Give' reward worth {formatPointsAsDollars(cost)}.
            Choose whether to donate it to charity or give the {formatPointsAsDollars(cost)} to another family member.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <RadioGroup value={choice ?? ""} onValueChange={(value) => setChoice(value as 'donate' | 'give')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="donate" id="donate" />
              <Label htmlFor="donate">Donate {formatPointsAsDollars(cost)} to charity</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="give" id="give" />
              <Label htmlFor="give">Give {formatPointsAsDollars(cost)} to another family member</Label>
            </div>
          </RadioGroup>

          {choice === 'give' && (
            <div className="pl-6 space-y-2">
              <Label htmlFor="member-select">Select Family Member:</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger id="member-select">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {otherMembers.length > 0 ? (
                    otherMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No other members available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Confirm Choice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DonateGiveDialog;