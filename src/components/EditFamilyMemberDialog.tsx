import { useState, useEffect, ChangeEvent } from "react"; // Added useEffect, ChangeEvent
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Pencil, Upload } from "lucide-react"; // Added Upload
import { supabase } from "@/lib/supabase"; // Import supabase client
import type { FamilyMember } from "@/lib/types"; // Import FamilyMember type

interface EditFamilyMemberDialogProps {
  member?: FamilyMember;
  onSave: (
    // Pass avatar URL and color back
    member: Omit<FamilyMember, "points" | "level" | "progress" | "streak"> & { avatar: string; color?: string | null },
  ) => Promise<void>; // Make onSave async
}

export default function EditFamilyMemberDialog({
  member,
  onSave,
}: EditFamilyMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // State for selected file
  const [avatarPreview, setAvatarPreview] = useState<string | null>(member?.avatar || null); // State for preview URL
  const [memberColor, setMemberColor] = useState(member?.color || "#cccccc"); // Keep color state
  const [isUploading, setIsUploading] = useState(false);

  // Reset state when dialog opens/closes or member changes
  useEffect(() => {
      if (open) {
          setName(member?.name || "");
          setAvatarPreview(member?.avatar || null);
          setMemberColor(member?.color || "#cccccc");
          setAvatarFile(null);
          setIsUploading(false);
      }
  }, [open, member]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create a temporary URL for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        // If file selection is cancelled, revert preview to original/default
        setAvatarFile(null);
        setAvatarPreview(member?.avatar || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsUploading(true);

    let avatarUrl = member?.avatar || ""; // Default to existing avatar

    try {
        if (avatarFile) {
            // Upload new avatar if a file was selected
            const fileExt = avatarFile.name.split('.').pop();
            // Use a consistent naming convention, maybe based on member ID if editing
            const memberIdForPath = member?.id || crypto.randomUUID();
            const fileName = `${memberIdForPath}.${fileExt}`; // e.g., memberId.png
            // Just use the filename; Supabase handles the bucket path.
            // Assume files are intended for the root or a configured public folder.
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from('avatars') // Use your bucket name
                .upload(filePath, avatarFile, { // Use just fileName for path
                    cacheControl: '3600', // Optional: Cache control
                    upsert: true // Overwrite if file with same name exists (important for updates)
                });

            // --- BEGIN ADDED LOGGING ---
            if (uploadError) {
                console.error("[EditDialog] Supabase Storage upload error:", uploadError);
                throw uploadError; // Re-throw after logging
            } else {
                console.log("[EditDialog] Supabase Storage upload successful for path:", filePath);
            }
            // --- END ADDED LOGGING ---


            // Get the public URL using just the fileName
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath, { // Use just fileName for path
                   // download: true, // Use if you need a download link instead of direct view
                   // transform: { width: 100, height: 100 } // Optional: Resize on the fly
                });

             // Use the direct public URL from Supabase
             const publicUrl = urlData?.publicUrl;

            if (!publicUrl) {
                throw new Error("Could not get public URL for uploaded avatar.");
            }
            avatarUrl = publicUrl; // Use the canonical URL
        }

        console.log("[EditDialog] Final avatarUrl before calling onSave:", avatarUrl); // DEBUG LOG

        // Call the onSave prop with updated data
        await onSave({ // Await the save operation
            id: member?.id || crypto.randomUUID(), // Generate ID if new member
            name,
            avatar: avatarUrl, // Pass the final URL (newly uploaded or existing)
            color: memberColor, // Pass color
        });

        setOpen(false); // Close dialog on success

    } catch (error) {
        console.error("Error saving family member:", error);
        alert(`Error saving: ${error instanceof Error ? error.message : String(error)}`); // Show error to user
    } finally {
        setIsUploading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {member ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>Add Family Member</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
         {/* Moved Description outside Header for better structure */}
         <DialogDescription>
           {member ? "Edit family member details" : "Add a new family member"}
         </DialogDescription>
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
              disabled={isUploading}
            />
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label htmlFor="avatar-upload">Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {/* Show preview or existing avatar */}
                <AvatarImage src={avatarPreview || undefined} key={avatarPreview} /> {/* Add key to force re-render on change */}
                <AvatarFallback>{name ? name[0] : '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                 <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp" // Accept common image types
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    disabled={isUploading}
                 />
                 <p className="text-xs text-muted-foreground mt-1">Upload a PNG, JPG, or WEBP file.</p>
              </div>
            </div>
          </div>

          {/* Member Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="memberColor">Member Color</Label>
            <Input
              id="memberColor"
              type="color"
              value={memberColor}
              onChange={(e) => setMemberColor(e.target.value)}
              className="w-full h-10 p-1 cursor-pointer"
              disabled={isUploading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? "Saving..." : (member ? "Save Changes" : "Add Member")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
