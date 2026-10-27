
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, message: "Silakan login sebagai admin." },
      { status: 401 }
    );
  }

  try {
    const data = await sql`
      SELECT id, nama, jenis_magang, departemen, created_at
      FROM participants
      ORDER BY nama ASC
    `;

    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Gagal mengambil peserta:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data peserta." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, message: "Silakan login sebagai admin." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const jenis = typeof body.jenis_magang === "string"
      ? body.jenis_magang.trim()
      : "";
    const departemen = typeof body.departemen === "string"
      ? body.departemen.trim()
      : "";
    const pin = typeof body.pin === "string" ? body.pin : "";

    if (!nama || !jenis || !departemen) {
      return NextResponse.json(
        { success: false, message: "Semua identitas wajib diisi." },
        { status: 400 }
      );
    }

    if (
      nama.length > 120 ||
      jenis.length > 100 ||
      departemen.length > 120
    ) {
      return NextResponse.json(
        { success: false, message: "Ada isian yang terlalu panjang." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, message: "PIN harus tepat 4 digit angka." },
        { status: 400 }
      );
    }

    const pinHash = await bcrypt.hash(pin, 12);

    await sql`
      INSERT INTO participants
        (nama, jenis_magang, departemen, pin_hash)
      VALUES
        (${nama}, ${jenis}, ${departemen}, ${pinHash})
      ON CONFLICT (nama, jenis_magang, departemen)
      DO UPDATE SET pin_hash = EXCLUDED.pin_hash
    `;

    return NextResponse.json({
      success: true,
      message: "Peserta berhasil didaftarkan dan PIN disimpan.",
    });
  } catch (error) {
    console.error("Gagal menyimpan peserta:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan peserta." },
      { status: 500 }
    );
  }
}
