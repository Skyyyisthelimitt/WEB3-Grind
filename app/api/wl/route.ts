import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: wls, error } = await supabase
      .from("whitelists")
      .select(`
        id,
        project,
        x,
        chain,
        type,
        wallets,
        mintDate:mint_date,
        price,
        mintTime:mint_time,
        mintTimezone:mint_timezone,
        priority,
        status
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ wls });
  } catch (e: any) {
    console.error("WL API error:", e?.message || e);
    return NextResponse.json({ error: "Failed to load whitelists" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, x, type, chain, wallet, mintDate, mintPrice, mintTime, mintTimezone } = body;

    // Validate required fields
    if (!project || !type || !chain) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("whitelists").insert({
      project,
      x,
      type,
      chain,
      wallets: wallet, // mapped from frontend 'wallet' to DB 'wallets'
      mint_date: mintDate || null,
      price: mintPrice,
      mint_time: mintTime || null,
      mint_timezone: mintTimezone,
      status: "Not Minted",
      priority: "Potential",
      user_id: user.id
    });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Whitelist added successfully" });
  } catch (e: any) {
    console.error("WL POST error:", e?.message || e);
    return NextResponse.json({ error: "Failed to add whitelist: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    const body = await req.json();
    const { project, x, type, chain, wallet, mintDate, mintPrice, mintTime, mintTimezone } = body;

    const supabase = await createClient();

    // Supabase ID is usually a number or uuid. 
    // The previous implementation used row number.
    // We assume the frontend now passes the Supabase ID.
    
    const { error } = await supabase
      .from("whitelists")
      .update({
        project,
        x,
        type,
        chain,
        wallets: wallet,
        mint_date: mintDate || null,
        price: mintPrice,
        mint_time: mintTime || null,
        mint_timezone: mintTimezone,
      })
      .eq("id", id);

     if (error) throw error;

    return NextResponse.json({ success: true, message: "Whitelist updated successfully" });
  } catch (e: any) {
    console.error("WL PUT error:", e?.message || e);
    return NextResponse.json({ error: "Failed to update whitelist: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from("whitelists").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Whitelist deleted successfully" });
  } catch (e: any) {
    console.error("WL DELETE error:", e?.message || e);
    return NextResponse.json({ error: "Failed to delete whitelist: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}
