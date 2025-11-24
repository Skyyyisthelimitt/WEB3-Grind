// app/api/wl/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

type Chain = "ETH" | "SOL" | "BTC" | "APE" | "BASE" | "ABS" | "Monad" | "HYPER";
type WLType = "GTD" | "FCFS" | "OG" | "WL";
type Priority = "High" | "Potential" | "Early";
type WL = {
  id: number;
  project: string;
  x?: string;
  chain: Chain;
  type: WLType;
  wallets?: string;
  mintDate?: string;
  price?: string; // Changed to string to preserve symbols
  mintTime?: string;
  mintTimezone?: string;
  priority?: Priority;
  status?: "Not Minted" | "Minted";
};

const normalizeKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const idxMap = (headers: string[]) =>
  headers.reduce<Record<string, number>>((m, h, i) => { m[normalizeKey(h)] = i; return m; }, {});
const getCell = (row: string[], map: Record<string, number>, key: string) => row[map[key] ?? -1] ?? "";
const pick = (row: string[], map: Record<string, number>, keys: string[]) => {
  for (const k of keys) {
    const v = getCell(row, map, normalizeKey(k));
    if (v != null && String(v).trim() !== "") return v;
  }
  return "";
};

const normalizeChain = (s = ""): Chain => {
  const t = s.trim().toUpperCase();
  const m: Record<string, Chain> = {
    ETH: "ETH", ETHEREUM: "ETH",
    SOL: "SOL", SOLANA: "SOL",
    BTC: "BTC", BITCOIN: "BTC",
    APE: "APE", BASE: "BASE",
    ABSTRACT: "ABS", ABS: "ABS",
    MONAD: "Monad", MON: "Monad",
    HYPER: "HYPER", HYPERLIQUID: "HYPER",
  };
  return m[t] ?? "ETH";
};
const normalizeType = (s = ""): WLType => {
  const t = s.trim().toUpperCase();
  return (["GTD","FCFS","OG","WL"].includes(t) ? (t as WLType) : "WL");
};
const toISO = (v: string): string | undefined => {
  if (!v) return;
  const num = Number(v);
  if (!Number.isNaN(num) && v.trim() !== "") {
    const base = new Date(Date.UTC(1899, 11, 30));
    return new Date(base.getTime() + num * 86400000).toISOString().slice(0,10);
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
};
const toNum = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

// tiny CSV parser
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQ = false;
  for (let i=0;i<text.length;i++) {
    const c = text[i], n = text[i+1];
    if (inQ) {
      if (c === '"' && n === '"') { cell += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cell += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row=[]; cell=""; }
      else if (c === "\r") { /* ignore */ }
      else { cell += c; }
    }
  }
  row.push(cell); rows.push(row);
  return rows.filter(r => r.length && r.some(x => x !== ""));
}

function mapRows(values: string[][]): WL[] {
  if (values.length < 2) return [];
  const headerRow = values[0];
  const map = idxMap(headerRow);

  return values.slice(1).map((row, i) => {
    const project = pick(row, map, ["Project Name","ProjectName","Project"]).trim();
    if (!project) return undefined as any;

    const x = pick(row, map, ["X"]).trim() || undefined;
    const type = normalizeType(pick(row, map, ["Type","Phase"]));
    const chain = normalizeChain(pick(row, map, ["Chain"]));
    const wallets = pick(row, map, ["Wallet","Wallets"]).trim() || undefined;
    const mintDate = toISO(pick(row, map, ["Mint Date","MintDate"]));
    const priceRaw = pick(row, map, ["Mint Price","Price","MintPrice"]).trim(); // pass as string!
    const mintTime = pick(row, map, ["Mint Time","MintTime","Time"]).trim() || undefined;
    const mintTimezone = pick(row, map, ["Timezone","Time Zone","MintTimezone"]).trim() || undefined;

    return {
      id: i + 2, // i+2 because: i is 0-based in slice(1), so first data row (sheet row 2) gets id=2
      project,
      x,
      chain,
      type,
      wallets,
      mintDate,
      price: priceRaw || undefined, // string not number!
      mintTime,
      mintTimezone,
      priority: "Potential",
      status: "Not Minted",
    };
  }).filter(Boolean);
}

export const runtime = "nodejs";

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

export async function GET() {
  try {
    // Fetch the WHITELIST sheet from your Google Spreadsheet via Google Sheets API
    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8"; // same as collabs API
    const range = "WHITELIST!A1:I"; // Updated to include H (mintTime) and I (mintTimezone)

    const auth = getAuth(true);
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = res.data.values || [];

    // Reuse your mapRows logic to normalize
    const wls = mapRows(values);

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
    if (!project || !type || !chain || !wallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const range = "WHITELIST!A:I"; // Updated to include H (mintTime) and I (mintTimezone)

    const auth = getAuth(false); // Need write permissions
    const sheets = google.sheets({ version: "v4", auth });

    // Prepare the row data matching your sheet columns: ProjectName, X, Type, Chain, Wallet, Mint Date, Mint Price, Mint Time, Timezone
    const rowData = [
      project || "",
      x || "",
      type || "",
      chain || "",
      wallet || "",
      mintDate || "",
      mintPrice || "",
      mintTime || "",
      mintTimezone || "",
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

    // Validate required fields
    if (!project || !type || !chain || !wallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const sheetName = "WHITELIST";
    
    // ID is the sheet row number (row 1 = header, row 2+ = data)
    const sheetRowNumber = parseInt(id, 10);
    if (isNaN(sheetRowNumber) || sheetRowNumber < 2) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    const range = `${sheetName}!A${sheetRowNumber}:I${sheetRowNumber}`;

    // Prepare the row data
    const rowData = [
      project || "",
      x || "",
      type || "",
      chain || "",
      wallet || "",
      mintDate || "",
      mintPrice || "",
      mintTime || "",
      mintTimezone || "",
    ];

    // Update the row
    const writeAuth = getAuth(false);
    const writeSheets = google.sheets({ version: "v4", auth: writeAuth });
    await writeSheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

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

    const spreadsheetId = "1AMOVd-VwMJAN4Ac_-cdmo5sCKnkgGz18ebe1AT5w8D8";
    const sheetName = "WHITELIST";
    
    // ID is the sheet row number (row 1 = header, row 2+ = data)
    const sheetRowNumber = parseInt(id, 10);
    if (isNaN(sheetRowNumber) || sheetRowNumber < 2) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Delete the row
    const writeAuth = getAuth(false);
    const writeSheets = google.sheets({ version: "v4", auth: writeAuth });
    await writeSheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await getSheetId(writeSheets, spreadsheetId, sheetName),
              dimension: "ROWS",
              startIndex: sheetRowNumber - 1, // 0-based index
              endIndex: sheetRowNumber,
            },
          },
        }],
      },
    });

    return NextResponse.json({ success: true, message: "Whitelist deleted successfully" });
  } catch (e: any) {
    console.error("WL DELETE error:", e?.message || e);
    return NextResponse.json({ error: "Failed to delete whitelist: " + (e?.message || "Unknown error") }, { status: 500 });
  }
}

async function getSheetId(sheets: any, spreadsheetId: string, sheetName: string): Promise<number> {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets?.find((s: any) => s.properties.title === sheetName);
  return sheet?.properties.sheetId || 0;
}
