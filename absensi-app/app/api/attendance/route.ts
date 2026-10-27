
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
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

function getWIBTime() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return reply({
      success: false,
      message: "Silakan login sebagai admin.",
    }, 401);
  }

  try {
    const rows = await sql`
      SELECT id, nama, jenis_magang, departemen, tanggal, masuk, pulang
      FROM attendance_records
      ORDER BY tanggal DESC, id DESC
      LIMIT 500
    `;

    return reply({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil absensi:", error);
    return reply({
      success: false,
      message: "Gagal mengambil data absensi.",
    }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const action = body.action;
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

    if (action !== "masuk" && action !== "pulang") {
      return reply({
        success: false,
        message: "Aksi absensi tidak dikenal.",
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

    const tanggal = getTodayWIB();

    if (action === "masuk") {
      const existing = await sql`
        SELECT id FROM attendance_records
        WHERE tanggal = ${tanggal}
          AND LOWER(nama) = LOWER(${nama})
          AND jenis_magang = ${jenis}
          AND departemen = ${departemen}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return reply({
          success: false,
          message: "Absensi masuk hari ini sudah tercatat.",
        }, 409);
      }

      const rows = await sql`
        INSERT INTO attendance_records
          (nama, jenis_magang, departemen, tanggal, masuk)
        VALUES
          (${nama}, ${jenis}, ${departemen}, ${tanggal}, ${getWIBTime()})
        RETURNING id, nama, jenis_magang, departemen, tanggal, masuk, pulang
      `;

      return reply({ success: true, data: rows[0] }, 201);
    }

    const existing = await sql`
      SELECT id FROM attendance_records
      WHERE tanggal = ${tanggal}
        AND LOWER(nama) = LOWER(${nama})
        AND jenis_magang = ${jenis}
        AND departemen = ${departemen}
        AND masuk IS NOT NULL
        AND pulang IS NULL
      ORDER BY id DESC
      LIMIT 1
    `;

    if (existing.length === 0) {
      return reply({
        success: false,
        message: "Data masuk belum ada atau absensi pulang sudah tercatat.",
      }, 409);
    }

    const rows = await sql`
      UPDATE attendance_records
      SET pulang = ${getWIBTime()}, updated_at = NOW()
      WHERE id = ${existing[0].id}
      RETURNING id, nama, jenis_magang, departemen, tanggal, masuk, pulang
    `;

    return reply({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Gagal menyimpan absensi:", error);
    return reply({
      success: false,
      message: "Gagal menyimpan absensi ke database.",
    }, 500);
  }
}
