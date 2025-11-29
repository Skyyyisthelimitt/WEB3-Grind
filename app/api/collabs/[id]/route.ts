// app/api/collabs/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "collabs.json");

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
async function writeAll(rows: any[]) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await readAll();
  const row = rows.find((r: any) => r.id === params.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await req.json();
  const rows = await readAll();
  const idx = rows.findIndex((r: any) => r.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = { ...rows[idx], ...payload, id: params.id };
  rows[idx] = updated;
  await writeAll(rows);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await readAll();
  const next = rows.filter((r: any) => r.id !== params.id);
  await writeAll(next);
  return NextResponse.json({ success: true });
}
