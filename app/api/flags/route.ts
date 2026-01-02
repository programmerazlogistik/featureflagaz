import { NextRequest, NextResponse } from "next/server";
import { readFlagsFromS3, writeFlagsToS3 } from "@/lib/s3-client";
import { createClient } from "@/lib/supabase/server";

// GET /api/flags
export async function GET() {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flat = await readFlagsFromS3();
    // Convert to array format for frontend and sort alphabetically
    const flags = Object.entries(flat)
      .filter(([key]) => key !== "isMaintenance")
      .map(([key, enabled]) => ({ key, enabled: enabled as boolean }))
      .sort((a, b) => a.key.localeCompare(b.key));
    
    return NextResponse.json({
      flags,
      isMaintenance: flat.isMaintenance ?? false
    });
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch flags" }, { status: 500 });
  }
}

// POST /api/flags - Create or update single/multiple flags
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, enabled, batch } = body;
    
    const currentFlags = await readFlagsFromS3();
    
    if (batch && Array.isArray(batch)) {
      // Batch update
      batch.forEach((update: { key: string, enabled: boolean }) => {
        currentFlags[update.key] = update.enabled;
      });
    } else if (key) {
      // Single update/create
      currentFlags[key] = enabled ?? false;
    } else if (typeof body.isMaintenance === "boolean") {
        currentFlags.isMaintenance = body.isMaintenance;
    }
    
    await writeFlagsToS3(currentFlags);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: "Failed to update flags" }, { status: 500 });
  }
}

// DELETE /api/flags/[key] could be implemented, but for now we can use POST with a delete flag or separate route
// Let's use a dynamic route for delete for better REST practices or just handle in POST
