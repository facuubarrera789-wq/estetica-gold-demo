import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function PATCH(request: Request) {
  const autorizado = await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const id = Number(body.id);
    const activo = body.activo;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Horario inválido" },
        { status: 400 }
      );
    }

    if (typeof activo !== "boolean") {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("horarios")
      .update({ activo })
      .eq("id", id)
      .select("id,hora,activo")
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "No se pudo actualizar el horario" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      horario: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo actualizar el horario" },
      { status: 500 }
    );
  }
}