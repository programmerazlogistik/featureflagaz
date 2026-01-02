"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createFlag } from "@/lib/feature-flags";

interface AddFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlagCreated: () => void;
}

export function AddFlagDialog({ open, onOpenChange, onFlagCreated }: AddFlagDialogProps) {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createFlag(key);
      
      toast.success("Flag created successfully!");
      setKey("");
      onFlagCreated();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create flag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Feature Flag</DialogTitle>
            <DialogDescription>
              Create a new feature flag to control application behavior
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Flag Key *</Label>
              <Input
                id="key"
                placeholder="e.g., new_feature"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                disabled={loading}
                pattern="[a-z0-9_]+"
                title="Only lowercase letters, numbers, and underscores allowed"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, numbers, underscores only)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
