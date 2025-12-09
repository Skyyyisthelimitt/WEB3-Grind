import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") || "ongoing";

    const supabase = await createClient();
    
    // Map existing 'tab' logic to DB status
    // ongoing = Not Posted, Posted
    // done = Submitted, Cancel
    
    let query = supabase.from("collabs").select(`
      id,
      project,
      twitter,
      community,
      spots,
      contact,
      teamSpots:team_spots,
      giveawayLink:giveaway_link,
      winners,
      status,
      dueAt:due_at
    `).order("created_at", { ascending: true });

    if (tab === 'ongoing') {
      query = query.in('status', ['Not Posted', 'Posted']);
    } else if (tab === 'done') {
      query = query.in('status', ['Submitted', 'Cancel']);
    }

    const { data: collabs, error } = await query;

    if (error) throw error;

    return NextResponse.json({ collabs });
  } catch (error: any) {
    console.error("❌ Error fetching collabs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, twitter, community, spots, contact, teamSpots, status, dueAt, giveawayLink, winners } = body;

    // Validate required fields
    if (!project) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("collabs").insert({
      project,
      twitter,
      community,
      spots,
      contact,
      team_spots: teamSpots,
      giveaway_link: giveawayLink,
      winners,
      status: status || 'Not Posted',
      due_at: dueAt || null,
      user_id: user.id
    });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "Collab added successfully" 
    });
  } catch (e: any) {
    console.error("Collab POST error:", e?.message || e);
    return NextResponse.json({ 
      error: "Failed to add collab: " + (e?.message || "Unknown error")
    }, { status: 500 });
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
    const { project, twitter, community, spots, contact, teamSpots, status, dueAt, giveawayLink, winners } = body;

    const supabase = await createClient();

    const { error } = await supabase
      .from("collabs")
      .update({
         project,
         twitter,
         community,
         spots,
         contact,
         team_spots: teamSpots,
         giveaway_link: giveawayLink,
         winners,
         status,
         due_at: dueAt || null,
      })
      .eq("id", id);

     if (error) throw error;

    return NextResponse.json({ success: true, message: "Collab updated successfully" });
  } catch (e: any) {
    console.error("Collab PUT error:", e?.message || e);
    return NextResponse.json({ error: "Failed to update collab: " + (e?.message || "Unknown error") }, { status: 500 });
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
    const { error } = await supabase.from("collabs").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Collab deleted successfully" });
  } catch (e: any) {
    console.error("Collab DELETE error:", e?.message || e);
    return NextResponse.json({ error: "Failed to delete collab: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}
