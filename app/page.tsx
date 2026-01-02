"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-provider";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FlagList } from "@/components/admin/flag-list";
import { useFeatureFlags, deleteFlag } from "@/lib/feature-flags";
import { toast } from "sonner";
import { Navbar } from "@/components/admin/navbar";

export default function FlagsPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const { flags, isLoading: flagsLoading, mutate } = useFeatureFlags();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    setMounted(true);
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Track changes for optimistic UI
  const handleToggleFlag = (key: string, enabled: boolean) => {
    // Optimistically update locally, then mutate
    mutate(
      flags?.map((f: { key: string; enabled: boolean }) => f.key === key ? { ...f, enabled } : f),
      false
    );
    
    // Save to backend
    fetch("/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    }).then(() => mutate()).catch(() => {
      toast.error("Failed to update flag");
      mutate(); // Revert on error
    });
  };

  const handleDeleteFlag = async (key: string) => {
    try {
      await deleteFlag(key);
      await mutate();
      toast.success("Flag deleted successfully!");
    } catch {
      toast.error("Failed to delete flag");
    }
  };

  const handleFlagCreated = () => {
    mutate();
  };

  const handleFlagUpdated = () => {
    mutate();
  };

  // Display flags directly from API
  const displayFlags = flags || [];

  // Show consistent loading state to prevent hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (flagsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
              <p className="text-muted-foreground mt-1">
                Manage application feature flags and toggles
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Flag List */}
          <FlagList
            flags={displayFlags}
            searchQuery={searchQuery}
            onToggleFlag={handleToggleFlag}
            onFlagCreated={handleFlagCreated}
            onFlagUpdated={handleFlagUpdated}
            onDeleteFlag={handleDeleteFlag}
          />
        </div>
      </main>
    </div>
  );
}
