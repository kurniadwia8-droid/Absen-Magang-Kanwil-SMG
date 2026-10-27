
import { NextRequest, NextResponse } from "next/server";
import {
  adminCookie,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const password = body?.password;

    if (typeof password !== "string" || password.length > 256) {
      return NextResponse.json(
        { success: false, message: "Password wajib diisi." },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, message: "Password admin salah." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
    });

    response.cookies.set(
      adminCookie.name,
      createAdminSession(),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: adminCookie.maxAge,
      }
    );

    return response;
  } catch (error) {
    console.error("Login admin gagal:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
