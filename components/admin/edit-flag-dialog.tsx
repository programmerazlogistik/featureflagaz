"use client";

import { useState, useEffect } from "react";
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
import { FeatureFlag } from "@/lib/feature-flags";

interface EditFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlagUpdated: () => void;
  flag: FeatureFlag | null;
}

export function EditFlagDialog({ open, onOpenChange, onFlagUpdated, flag }: EditFlagDialogProps) {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState("");

  // Reset form when flag changes
  useEffect(() => {
    if (flag) {
      setKey(flag.key);
    }
  }, [flag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag) return;
    
    if (!key.trim()) {
      toast.error("Flag key cannot be empty");
      return;
    }

    setLoading(true);

    try {
      // Use atomic rename via a single POST request
      const trimmedKey = key.trim();
      const payload = {
        key: trimmedKey,
        enabled: flag.enabled,
        oldKey: trimmedKey !== flag.key ? flag.key : undefined
      };

      const response = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update flag");
      }
      
      toast.success("Flag updated successfully!");
      onFlagUpdated();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update flag");
    } finally {
      setLoading(false);
    }
  };

  if (!flag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>
              Update the feature flag key
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key">Flag Key *</Label>
              <Input
                id="edit-key"
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
              {loading ? "Updating..." : "Update Flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
