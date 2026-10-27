
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

function getTodayWIB() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, nama, jenis_magang, departemen, tanggal, masuk, pulang
      FROM attendance_records
      ORDER BY tanggal DESC, id DESC
      LIMIT 500
    `;

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Gagal mengambil absensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data absensi." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;
    const nama = typeof body.nama === "string" ? body.nama.trim() : "";
    const jenisMagang =
      typeof body.jenis_magang === "string" ? body.jenis_magang.trim() : "";
    const departemen =
      typeof body.departemen === "string" ? body.departemen.trim() : "";
    const tanggal = getTodayWIB();

    if (!nama || !jenisMagang || !departemen) {
      return NextResponse.json(
        { success: false, message: "Nama, jenis magang, dan departemen wajib diisi." },
        { status: 400 }
      );
    }

    if (nama.length > 120 || jenisMagang.length > 100 || departemen.length > 120) {
      return NextResponse.json(
        { success: false, message: "Ada isian yang terlalu panjang." },
        { status: 400 }
      );
    }

    if (action === "masuk") {
      const existing = await sql`
        SELECT id FROM attendance_records
        WHERE tanggal = ${tanggal}
          AND LOWER(nama) = LOWER(${nama})
          AND jenis_magang = ${jenisMagang}
          AND departemen = ${departemen}
        LIMIT 1
      `;

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, message: "Absensi masuk untuk hari ini sudah tercatat." },
          { status: 409 }
        );
      }

      const rows = await sql`
        INSERT INTO attendance_records
          (nama, jenis_magang, departemen, tanggal, masuk)
        VALUES
          (${nama}, ${jenisMagang}, ${departemen}, ${tanggal}, ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })})
        RETURNING id, nama, jenis_magang, departemen, tanggal, masuk, pulang
      `;

      return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
    }

    if (action === "pulang") {
      const existing = await sql`
        SELECT id FROM attendance_records
        WHERE tanggal = ${tanggal}
          AND LOWER(nama) = LOWER(${nama})
          AND jenis_magang = ${jenisMagang}
          AND departemen = ${departemen}
          AND masuk IS NOT NULL
          AND pulang IS NULL
        ORDER BY id DESC
        LIMIT 1
      `;

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, message: "Data masuk belum ada atau absensi pulang sudah tercatat." },
          { status: 409 }
        );
      }

      const jamPulang = new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const rows = await sql`
        UPDATE attendance_records
        SET pulang = ${jamPulang}, updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING id, nama, jenis_magang, departemen, tanggal, masuk, pulang
      `;

      return NextResponse.json({ success: true, data: rows[0] });
    }

    return NextResponse.json(
      { success: false, message: "Aksi absensi tidak dikenal." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Gagal menyimpan absensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan absensi ke database." },
      { status: 500 }
    );
  }
}
