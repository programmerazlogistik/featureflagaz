"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Check, X, Plus, Pencil } from "lucide-react";
import { FeatureFlag } from "@/lib/feature-flags";
import { toast } from "sonner";

interface FlagListProps {
  flags: FeatureFlag[];
  searchQuery: string;
  onToggleFlag: (key: string, enabled: boolean) => void;
  onFlagCreated: () => void;
  onFlagUpdated: () => void;
  onDeleteFlag: (key: string) => void;
}

export function FlagList({ flags, searchQuery, onToggleFlag, onFlagCreated, onFlagUpdated, onDeleteFlag }: FlagListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagToDelete, setFlagToDelete] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set());

  // Filter flags based on search query
  const filteredFlags = flags.filter((flag) => {
    const search = searchQuery.toLowerCase();
    return flag.key.toLowerCase().includes(search);
  });

  const handleDeleteClick = (key: string) => {
    setFlagToDelete(key);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (flagToDelete) {
      // Check if it's a bulk delete
      if (selectedFlags.size > 0 && flagToDelete.includes('flags')) {
        confirmBulkDelete();
      } else {
        onDeleteFlag(flagToDelete);
        setFlagToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  };

  const startEdit = (flag: FeatureFlag) => {
    setEditingKey(flag.key);
    setEditValue(flag.key);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const saveEdit = async (originalKey: string, enabled: boolean) => {
    if (!editValue.trim()) {
      toast.error("Flag key cannot be empty");
      return;
    }

    // Check if the new key already exists (when changing key)
    if (editValue !== originalKey && flags.some(f => f.key === editValue)) {
      toast.error("A flag with this key already exists");
      return;
    }

    setSaving(true);
    try {
      // If key changed, delete old and create new (SEQUENTIALLY to avoid race condition)
      if (editValue !== originalKey) {
        // Step 1: Delete old key first
        const deleteResponse = await fetch(`/api/flags/${encodeURIComponent(originalKey)}`, { 
          method: "DELETE" 
        });
        
        if (!deleteResponse.ok) {
          throw new Error("Failed to delete old flag");
        }
        
        // Step 2: Create new key
        const createResponse = await fetch("/api/flags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: editValue, enabled }),
        });
        
        if (!createResponse.ok) {
          throw new Error("Failed to create new flag");
        }
      }
      
      toast.success("Flag updated successfully!");
      
      // Wait for data to refresh before closing edit mode
      await onFlagUpdated();
      
      setEditingKey(null);
      setEditValue("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update flag");
    } finally {
      setSaving(false);
    }
  };

  const saveNewFlag = async () => {
    if (!newFlagKey.trim()) {
      toast.error("Flag key cannot be empty");
      return;
    }

    // Check if the key already exists
    if (flags.some(f => f.key === newFlagKey)) {
      toast.error("A flag with this key already exists");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newFlagKey, enabled: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create flag");
      }

      toast.success("Flag created successfully!");
      
      // Refresh and scroll to top by reloading
      await onFlagCreated();
      setIsAddingNew(false);
      setNewFlagKey("");
    } catch {
      toast.error("Failed to create flag");
    } finally {
      setSaving(false);
    }
  };

  const cancelAdd = () => {
    setIsAddingNew(false);
    setNewFlagKey("");
  };

  const toggleSelectFlag = (key: string) => {
    setSelectedFlags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFlags.size === filteredFlags.length) {
      setSelectedFlags(new Set());
    } else {
      setSelectedFlags(new Set(filteredFlags.map(f => f.key)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFlags.size === 0) return;
    
    setDeleteDialogOpen(true);
    setFlagToDelete(`${selectedFlags.size} flags`);
  };

  const confirmBulkDelete = async () => {
    setSaving(true);
    try {
      // Delete sequentially to avoid race condition with S3 file writes
      for (const key of Array.from(selectedFlags)) {
        const response = await fetch(`/api/flags/${encodeURIComponent(key)}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error(`Failed to delete ${key}`);
        }
      }
      
      toast.success(`${selectedFlags.size} flags deleted successfully!`);
      onFlagUpdated();
      setSelectedFlags(new Set());
    } catch (error) {
      toast.error(`Failed to delete some flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setFlagToDelete(null);
    }
  };

  if (filteredFlags.length === 0 && !isAddingNew) {
    return (
      <div className="border rounded-md bg-card overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b transition-colors uppercase text-[10px] font-bold tracking-wider text-muted-foreground/70">
              <th className="px-4 py-2 font-semibold">Flag key</th>
              <th className="px-4 py-2 font-semibold w-24 text-center">Status</th>
              <th className="px-4 py-2 font-semibold w-20 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center">
                <p className="text-muted-foreground mb-3">
                  {searchQuery ? "No flags match your search" : "No feature flags yet"}
                </p>
                <Button onClick={() => setIsAddingNew(true)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Flag
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md bg-card overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b transition-colors uppercase text-[10px] font-bold tracking-wider text-muted-foreground/70">
              <th className="px-4 py-2 font-semibold w-12">
                <Checkbox
                  checked={filteredFlags.length > 0 && selectedFlags.size === filteredFlags.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all flags"
                />
              </th>
              <th className="px-4 py-2 font-semibold">Flag key</th>
              <th className="px-4 py-2 font-semibold w-24 text-center">Status</th>
              <th className="px-4 py-2 font-semibold w-20 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Add new flag row */}
            {isAddingNew ? (
              <tr className="bg-accent/50">
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2">
                  <Input
                    value={newFlagKey}
                    onChange={(e) => setNewFlagKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveNewFlag();
                      }
                    }}
                    placeholder="new_feature_name"
                    disabled={saving}
                    autoFocus
                    pattern="[a-z0-9_]+"
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-center items-center">
                    <Switch checked={false} disabled className="scale-90" />
                  </div>
                </td>
                <td className="px-4 py-2 text-right pr-4">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                      onClick={saveNewFlag}
                      disabled={saving}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={cancelAdd}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr className="bg-muted/20 hover:bg-muted/30 transition-colors">
                <td colSpan={4} className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={() => setIsAddingNew(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add New Flag
                  </Button>
                </td>
              </tr>
            )}

            {/* Existing flags */}
            {filteredFlags.map((flag) => (
              <tr
                key={flag.key}
                className={`group hover:bg-muted/30 transition-colors ${
                  editingKey === flag.key ? "bg-accent/50" : ""
                } ${
                  selectedFlags.has(flag.key) ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
              >
                <td className="px-4 py-2">
                  <Checkbox
                    checked={selectedFlags.has(flag.key)}
                    onCheckedChange={() => toggleSelectFlag(flag.key)}
                    disabled={editingKey === flag.key}
                    aria-label={`Select ${flag.key}`}
                  />
                </td>
                <td className="px-4 py-2">
                  {editingKey === flag.key ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit(flag.key, flag.enabled);
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      disabled={saving}
                      autoFocus
                      pattern="[a-z0-9_]+"
                      className="h-8"
                    />
                  ) : (
                    <label
                      htmlFor={`flag-${flag.key}`}
                      className="cursor-pointer hover:underline"
                    >
                      {flag.key}
                    </label>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-center items-center">
                    <Switch
                      id={`flag-${flag.key}`}
                      checked={flag.enabled}
                      onCheckedChange={(checked: boolean) => onToggleFlag(flag.key, checked)}
                      className="scale-90"
                      disabled={editingKey === flag.key}
                    />
                  </div>
                </td>
                <td className="px-4 py-2 text-right pr-4">
                  <div className="flex gap-1 justify-end">
                    {editingKey === flag.key ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                          onClick={() => saveEdit(flag.key, flag.enabled)}
                          disabled={saving}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={cancelEdit}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                          onClick={() => startEdit(flag)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(flag.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating bulk delete button */}
      {selectedFlags.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            className="shadow-lg gap-2"
            disabled={saving}
          >
            <Trash2 className="h-4 w-4" />
            Delete {selectedFlags.size} selected
          </Button>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {flagToDelete?.includes('flags') ? flagToDelete : 'the feature flag'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
