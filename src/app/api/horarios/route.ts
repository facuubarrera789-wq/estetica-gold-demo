import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("horarios")
      .select("id,hora,activo")
      .eq("activo", true)
      .order("hora", {
        ascending: true,
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudieron cargar los horarios",
        },
        { status: 500 }
      );
    }

    const horarios =
      data?.map((horario) => ({
        id: horario.id,
        hora: String(horario.hora).slice(
          0,
          5
        ),
        activo: horario.activo,
      })) ?? [];

    return NextResponse.json({
      horarios,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los horarios",
      },
      { status: 500 }
    );
  }
}