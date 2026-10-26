import { NextResponse } from "next/server";
import { isAdmin } from "../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

const horariosPermitidos = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

// MOVER O CANCELAR TURNO
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const autorizado = await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // CANCELAR
    if (body.accion === "cancelar") {
      const { error } = await supabaseAdmin
        .from("turnos")
        .update({
          estado: "cancelado",
        })
        .eq("id", id);

      if (error) {
        console.error(error);

        return NextResponse.json(
          { error: "No se pudo cancelar el turno" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
      });
    }

    // MOVER
    if (body.accion === "mover") {
      const fecha = body.fecha;
      const hora = body.hora;

      if (!fecha) {
        return NextResponse.json(
          { error: "Fecha inválida" },
          { status: 400 }
        );
      }

      if (!horariosPermitidos.includes(hora)) {
        return NextResponse.json(
          { error: "Horario inválido" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("turnos")
        .update({
          fecha,
          hora,
        })
        .eq("id", id)
        .eq("estado", "confirmado");

      if (error) {
        console.error(error);

        if (error.code === "23505") {
          return NextResponse.json(
            {
              error: "Ese horario ya está ocupado.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          { error: "No se pudo mover el turno" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
      });
    }

    return NextResponse.json(
      { error: "Acción inválida" },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo procesar la operación" },
      { status: 500 }
    );
  }
}

// BORRAR DEFINITIVAMENTE UN TURNO CANCELADO
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const autorizado = await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const { data, error } = await supabaseAdmin
      .from("turnos")
      .delete()
      .eq("id", id)
      .eq("estado", "cancelado")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "No se pudo borrar el turno" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Solo se pueden borrar definitivamente los turnos cancelados",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo borrar el turno" },
      { status: 500 }
    );
  }
}