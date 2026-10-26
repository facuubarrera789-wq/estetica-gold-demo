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

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Servicio inválido" },
        { status: 400 }
      );
    }

    const cambios: {
      precio?: number;
      activo?: boolean;
    } = {};

    if (body.precio !== undefined) {
      const precio = Number(body.precio);

      if (
        !Number.isInteger(precio) ||
        precio < 0
      ) {
        return NextResponse.json(
          { error: "Precio inválido" },
          { status: 400 }
        );
      }

      cambios.precio = precio;
    }

    if (body.activo !== undefined) {
      if (typeof body.activo !== "boolean") {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }

      cambios.activo = body.activo;
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json(
        { error: "No hay cambios para guardar" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("servicios")
      .update(cambios)
      .eq("id", id)
      .select(
        "id,nombre,precio,duracion_minutos,activo"
      )
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "No se pudo actualizar el servicio" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      servicio: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo actualizar el servicio" },
      { status: 500 }
    );
  }
}