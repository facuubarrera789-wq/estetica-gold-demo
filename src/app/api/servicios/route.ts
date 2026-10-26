import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } =
      await supabaseAdmin
        .from("servicios")
        .select(
          "id,nombre,precio,duracion_minutos,activo"
        )
        .order("id", {
          ascending: true,
        });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudieron cargar los servicios",
        },
        {
          status: 500,
        }
      );
    }

    const todos = data ?? [];

    const color =
      todos.find(
        (servicio) =>
          servicio.nombre
            .trim()
            .toLowerCase() ===
          "color"
      ) ?? null;

    const servicios =
      todos.filter(
        (servicio) =>
          servicio.activo &&
          servicio.nombre
            .trim()
            .toLowerCase() !==
            "color"
      );

    return NextResponse.json({
      servicios,
      colorActivo:
        color?.activo ?? false,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los servicios",
      },
      {
        status: 500,
      }
    );
  }
}