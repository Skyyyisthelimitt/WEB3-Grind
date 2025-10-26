import { google } from "googleapis";

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID_COLLABS;
    const range = "COLLABS!A:J"; // adjust if your sheet name/range differs

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

    const rows = res.data.values || [];

    return Response.json({ rows });
  } catch (error: any) {
    console.error("❌ Error fetching Google Sheet:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
