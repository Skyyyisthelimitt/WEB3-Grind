import { google } from "googleapis";

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

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

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
