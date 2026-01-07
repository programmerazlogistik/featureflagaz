import useSWR from "swr";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
}

// Convert FeatureFlag array to flat object
export function flagsToFlat(flags: FeatureFlag[]): Record<string, boolean> {
  const flat: Record<string, boolean> = {};
  flags.forEach(flag => {
    flat[flag.key] = flag.enabled;
  });
  return flat;
}


// Fetcher function for SWR
const fetcher = async (): Promise<FeatureFlag[]> => {
  const response = await fetch("/api/flags");
  if (!response.ok) {
    throw new Error("Failed to fetch flags");
  }
  const data = await response.json();
  
  // Combine flags array and isMaintenance into a single FeatureFlag array for the UI
  const flags: FeatureFlag[] = data.flags || [];
  if (typeof data.isMaintenance === "boolean") {
    flags.push({ key: "isMaintenance", enabled: data.isMaintenance });
  }
  return flags;
};

// Custom hook to fetch flags
export function useFeatureFlags() {
  const { data, error, isLoading, mutate } = useSWR<FeatureFlag[]>("feature-flags", fetcher);

  return {
    flags: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Update a flag
export async function updateFlag(key: string, enabled: boolean): Promise<void> {
  const response = await fetch("/api/flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: key.trim(), enabled }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update flag");
  }
}

// Save batch changes
export async function saveBatch(changes: { key: string, enabled: boolean }[]): Promise<void> {
  const response = await fetch("/api/flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      batch: changes.map(c => ({ ...c, key: c.key.trim() })) 
    }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to save changes");
  }
}

// Create a new flag
export async function createFlag(key: string): Promise<void> {
  const response = await fetch("/api/flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: key.trim(), enabled: false }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create flag");
  }
}

// Delete a flag
export async function deleteFlag(key: string): Promise<void> {
  const response = await fetch(`/api/flags/${encodeURIComponent(key.trim())}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete flag");
  }
}
