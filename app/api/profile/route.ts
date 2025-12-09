import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
       // If unique error not found, it might be first time load before trigger ran? 
       // But trigger runs on auth signup.
       // Keep it simple.
       throw error;
    }

    return NextResponse.json({ profile });
  } catch (e: any) {
    console.error("Profile GET error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, x_handle, discord_handle, role, avatar_url } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updates.full_name = full_name;
    if (x_handle !== undefined) updates.x_handle = x_handle;
    if (discord_handle !== undefined) updates.discord_handle = discord_handle;
    if (role !== undefined) updates.role = role;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Profile PUT error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Failed to update profile" }, { status: 500 });
  }
}
