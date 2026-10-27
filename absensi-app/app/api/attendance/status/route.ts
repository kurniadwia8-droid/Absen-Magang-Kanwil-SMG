
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function reply(
  body: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getTodayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function POST(request: Request) {
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

    if (
      !nama || !jenis || !departemen ||
      nama.length > 120 || jenis.length > 100 ||
      departemen.length > 120 || !/^\d{4}$/.test(pin)
    ) {
      return reply({
        success: false,
        message: "Isi identitas dan PIN 4 digit dengan benar.",
      }, 400);
    }

    const participants = await sql`
      SELECT pin_hash FROM participants
      WHERE LOWER(nama) = LOWER(${nama})
        AND jenis_magang = ${jenis}
        AND departemen = ${departemen}
      LIMIT 1
    `;

    if (
      participants.length === 0 ||
      !(await bcrypt.compare(pin, participants[0].pin_hash))
    ) {
      return reply({
        success: false,
        message: "Identitas atau PIN tidak sesuai.",
      }, 401);
    }

    const rows = await sql`
      SELECT id, nama, jenis_magang, departemen, tanggal, masuk, pulang
      FROM attendance_records
      WHERE LOWER(nama) = LOWER(${nama})
        AND jenis_magang = ${jenis}
        AND departemen = ${departemen}
      ORDER BY tanggal DESC, id DESC
      LIMIT 90
    `;

    const today = getTodayWIB();
    const todayRecord = rows.find(
      (row) => String(row.tanggal).slice(0, 10) === today
    ) ?? null;

    return reply({
      success: true,
      today: todayRecord,
      data: rows,
    });
  } catch (error) {
    console.error("Gagal memuat status absensi:", error);
    return reply({
      success: false,
      message: "Gagal memuat status absensi.",
    }, 500);
  }
}
