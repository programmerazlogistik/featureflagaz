import { NextRequest, NextResponse } from "next/server";
import { readFlagsFromS3, writeFlagsToS3 } from "@/lib/s3-client";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/flags/[key]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key: rawKey } = await params;
    const key = rawKey?.trim();
    
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }
    
    const currentFlags = await readFlagsFromS3();
    
    if (key in currentFlags) {
      delete currentFlags[key];
      await writeFlagsToS3(currentFlags);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  } catch (error) {
    console.error("API DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete flag" }, { status: 500 });
  }
}
