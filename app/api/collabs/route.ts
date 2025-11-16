import { google } from "googleapis";

const getAuth = (readOnly = true) => {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: readOnly 
      ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      : ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") || "ongoing";

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    
    // Map tab parameter to correct sheet name and gid
    const ranges = {
      ongoing: "COLLABS_ACTIVE!A2:L",
      done: "COLLABS_DONE!A2:L"  // Make sure this matches your sheet name exactly
    };

    const range = ranges[tab as keyof typeof ranges];
    if (!range) {
      return Response.json({ error: "Invalid tab parameter" }, { status: 400 });
    }

    const auth = getAuth(true);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    // Filter out empty rows and map to collab objects
    const collabs = (res.data.values || [])
      .filter(row => row.some(cell => cell && cell.trim() !== '')) // Only keep rows with at least one non-empty cell
      .map((row, index) => ({
        id: index + 1,
        project: row[0] || '',
        twitter: row[1] || '',
        community: row[2] || '',
        spots: row[3] || '',
        contact: row[4] || '',
        teamSpots: row[5] || '',
        giveawayLink: row[6] || '',
        winners: row[7] || '',
        status: row[8] || '',
        dueAt: row[9] || '',
      }));

    // Debug logging
    console.log(`Fetched ${collabs.length} collabs for tab: ${tab}`);
    
    return Response.json({ collabs });
  } catch (error: any) {
    console.error("❌ Error fetching Google Sheet:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, twitter, community, spots, teamSpots, status, dueAt, giveawayLink, winners, tab } = body;

    // Validate required fields
    if (!project) {
      return Response.json({ error: "Project is required" }, { status: 400 });
    }

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const sheetName = tab === "done" ? "COLLABS_DONE" : "COLLABS_ACTIVE";
    const range = `${sheetName}!A:L`; // Append to the end of the sheet

    const auth = getAuth(false); // Need write permissions
    const sheets = google.sheets({ version: "v4", auth });

    // Prepare the row data matching your sheet columns: Project, Twitter, Community, Spots, Contact, Team Spots, Giveaway Link, Winners, Status, Due Date
    // Based on the GET mapping: project[0], twitter[1], community[2], spots[3], contact[4], teamSpots[5], giveawayLink[6], winners[7], status[8], dueAt[9]
    const rowData = [
      project || "",
      twitter || "",
      community || "",
      spots || "",
      "", // contact (not in form yet)
      teamSpots || "",
      giveawayLink || "",
      winners || "",
      status || "",
      dueAt || "",
      "", // column 11 (if exists)
      "", // column 12 (if exists)
    ];

    // Append the row to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowData],
      },
    });

    return Response.json({ success: true, message: "Collab added successfully" });
  } catch (e: any) {
    console.error("Collab POST error:", e?.message || e);
    return Response.json({ error: "Failed to add collab: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}
