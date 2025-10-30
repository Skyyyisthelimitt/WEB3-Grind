import { google } from "googleapis";

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_COLLABS;
    const range = "COLLABS!A2:L"; // Start from A2 to skip headers

    // ✅ Normalize private key to fix OpenSSL error
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    // Transform sheet rows into collab objects matching your table structure
    const collabs = (res.data.values || []).map((row, index) => {
      // Get the emoji and text separately
      const winnersCell = row[7] || '';
      const emojiMatch = winnersCell.match(/📋/);
      const winnersEmoji = emojiMatch ? emojiMatch[0] : '';
      const winnersTitle = winnersCell.replace(/📋/, '').trim();

      return {
        id: index + 1,
        project: row[0] || '',
        twitter: row[1] || '',
        community: row[2] || '',
        spots: row[3] || '',
        teamSpots: row[5] || '',
        giveawayLink: row[6] || '',
        winners: row[7] || '',
        winnersEmoji,
        winnersTitle,
        status: row[8] || '',
        dueAt: row[9] || ''
      };
    });

    return Response.json({ collabs });
  } catch (error: any) {
    console.error("❌ Error fetching Google Sheet:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
