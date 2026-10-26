import { NextResponse } from "next/server";
import { adminCookieName } from "../../../../lib/adminAuth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionToken = process.env.ADMIN_SESSION_TOKEN;

    if (!adminPassword || !sessionToken) {
      return NextResponse.json(
        { error: "El administrador no está configurado" },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
    });

    response.cookies.set({
      name: adminCookieName,
      value: sessionToken,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 }
    );
  }
}