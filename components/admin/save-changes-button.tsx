"use client";

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface SaveChangesButtonProps {
  visible: boolean;
  onSave: () => void;
  loading: boolean;
}

export function SaveChangesButton({ visible, onSave, loading }: SaveChangesButtonProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
      <Button
        size="lg"
        onClick={onSave}
        disabled={loading}
        className="shadow-lg hover:shadow-xl transition-shadow gap-2"
      >
        <Save className="h-5 w-5" />
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
