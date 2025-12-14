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
    const { project = "New Whitelist", x, type = "WL", chain = "ETH", wallet, wallets, mintDate, mintPrice, mintTime, mintTimezone } = body;

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.from("whitelists").insert({
      project,
      x,
      type,
      chain,
      wallets: wallets || wallet || "",
      mint_date: mintDate || null,
      price: mintPrice,
      mint_time: mintTime || null,
      mint_timezone: mintTimezone,
      status: "Not Minted",
      priority: "Potential",
      user_id: user.id
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, whitelist: data });
  } catch (e: any) {
    console.error("WL POST error:", e?.message || e);
    return NextResponse.json({ error: "Failed to add whitelist: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    // Check ID in Param or Body
    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    if (!id && body.id) id = body.id;

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    const updateData: any = {};
    
    if (body.project !== undefined) updateData.project = body.project;
    if (body.x !== undefined) updateData.x = body.x;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.chain !== undefined) updateData.chain = body.chain;
    
    // Handle wallets alias
    if (body.wallets !== undefined) updateData.wallets = body.wallets;
    else if (body.wallet !== undefined) updateData.wallets = body.wallet;

    if (body.mintDate !== undefined) updateData.mint_date = body.mintDate || null;
    // Handle price mapping
    if (body.price !== undefined) updateData.price = body.price;
    else if (body.mintPrice !== undefined) updateData.price = body.mintPrice;

    if (body.mintTime !== undefined) updateData.mint_time = body.mintTime || null;
    if (body.mintTimezone !== undefined) updateData.mint_timezone = body.mintTimezone;

    const supabase = await createClient();
    
    const { error } = await supabase
      .from("whitelists")
      .update(updateData)
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
    let id = new URL(req.url).searchParams.get("id");
    if (!id) {
        try {
            const body = await req.json();
            if (body.id) id = body.id;
        } catch {}
    }

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
