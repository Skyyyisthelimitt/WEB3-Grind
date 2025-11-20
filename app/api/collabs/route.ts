import { google } from "googleapis";
import { NextResponse } from "next/server";

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
      return NextResponse.json({ error: "Invalid tab parameter" }, { status: 400 });
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
    
    return NextResponse.json({ collabs });
  } catch (error: any) {
    console.error("❌ Error fetching Google Sheet:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, twitter, community, spots, contact, teamSpots, status, dueAt, giveawayLink, winners, tab } = body;

    // Validate required fields
    if (!project) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const sheetName = tab === "done" ? "COLLABS_DONE" : "COLLABS_ACTIVE";
    
    const auth = getAuth(false); // Need write permissions
    const sheets = google.sheets({ version: "v4", auth });

    // First, find the last row with data in column A to determine where to append
    const lastRowRange = `${sheetName}!A:A`;
    const lastRowRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: lastRowRange,
    });
    const lastRow = (lastRowRes.data.values?.length || 0) + 1; // +1 to append after last row
    
    // Prepare the row data matching your sheet columns: 
    // A: Project, B: X, C: Community, D: Spots, E: Contact, F: Team Spot, G: GA, H: Winners, I: Status, J: Deadline
    const rowData = [
      project || "",
      twitter || "",
      community || "",
      spots || "",
      contact || "",
      teamSpots || "",
      giveawayLink || "",
      winners || "",
      status || "",
      dueAt || "",
    ];

    // Use update instead of append to write to a specific row
    const targetRange = `${sheetName}!A${lastRow}:J${lastRow}`;
    const updateResult = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: targetRange,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    console.log("Update result:", {
      updatedRange: updateResult.data.updatedRange,
      updatedRows: updateResult.data.updatedRows,
      updatedCells: updateResult.data.updatedCells,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Collab added successfully",
      updatedRange: updateResult.data.updatedRange,
    });
  } catch (e: any) {
    console.error("Collab POST error:", e?.message || e);
    const errorDetails = e?.response?.data || e?.code || e?.message || "Unknown error";
    console.error("Error details:", JSON.stringify(errorDetails, null, 2));
    return NextResponse.json({ 
      error: "Failed to add collab: " + (e?.message || "Unknown error"),
      details: errorDetails,
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const tab = url.searchParams.get("tab") || "ongoing";
    
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    const body = await req.json();
    const { project, twitter, community, spots, contact, teamSpots, status, dueAt, giveawayLink, winners } = body;

    // Validate required fields
    if (!project) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const sheetName = tab === "done" ? "COLLABS_DONE" : "COLLABS_ACTIVE";
    
    // ID is the index from GET (starts at 1), sheet row = id + 1 (since we skip row 1 header)
    // GET reads from A2, so index 0 = row 2, index 1 = row 3, etc.
    // id 1 = index 0 = row 2, id 2 = index 1 = row 3
    const sheetRowNumber = parseInt(id, 10) + 1; // +1 because row 1 is header
    if (isNaN(sheetRowNumber) || sheetRowNumber < 2) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    const range = `${sheetName}!A${sheetRowNumber}:J${sheetRowNumber}`;

    // Prepare the row data
    const rowData = [
      project || "",
      twitter || "",
      community || "",
      spots || "",
      contact || "",
      teamSpots || "",
      giveawayLink || "",
      winners || "",
      status || "",
      dueAt || "",
    ];

    // Update the row
    const auth = getAuth(false);
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

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
    const tab = url.searchParams.get("tab") || "ongoing";
    
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const sheetName = tab === "done" ? "COLLABS_DONE" : "COLLABS_ACTIVE";
    
    // ID is the index from GET (starts at 1), sheet row = id + 1 (since we skip row 1 header)
    const sheetRowNumber = parseInt(id, 10) + 1; // +1 because row 1 is header
    if (isNaN(sheetRowNumber) || sheetRowNumber < 2) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Delete the row
    const auth = getAuth(false);
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await getSheetId(sheets, spreadsheetId, sheetName),
              dimension: "ROWS",
              startIndex: sheetRowNumber - 1, // 0-based index
              endIndex: sheetRowNumber,
            },
          },
        }],
      },
    });

    return NextResponse.json({ success: true, message: "Collab deleted successfully" });
  } catch (e: any) {
    console.error("Collab DELETE error:", e?.message || e);
    return NextResponse.json({ error: "Failed to delete collab: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}

async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string): Promise<number> {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets?.find((s: any) => s.properties.title === sheetName);
  return sheet?.properties.sheetId || 0;
}
