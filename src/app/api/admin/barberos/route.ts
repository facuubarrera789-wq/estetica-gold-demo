import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request: Request) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const nombre =
      String(
        body.nombre ?? ""
      ).trim();

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "Ingresá el nombre del barbero",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("barberos")
        .insert({
          nombre,
          activo: true,
        })
        .select(
          "id,nombre,activo"
        )
        .single();

    if (error) {
      console.error(error);

      if (
        error.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "Ya existe un barbero con ese nombre",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            "No se pudo agregar el barbero",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      barbero: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo agregar el barbero",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    const activo =
      body.activo;

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Barbero inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof activo !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Estado inválido",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("barberos")
        .update({
          activo,
        })
        .eq("id", id)
        .select(
          "id,nombre,activo"
        )
        .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo actualizar el barbero",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      barbero: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el barbero",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error: "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Barbero inválido",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: barbero,
      error: errorBarbero,
    } =
      await supabaseAdmin
        .from("barberos")
        .select(
          "id,nombre,activo"
        )
        .eq("id", id)
        .maybeSingle();

    if (errorBarbero) {
      console.error(
        errorBarbero
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar el barbero",
        },
        {
          status: 500,
        }
      );
    }

    if (!barbero) {
      return NextResponse.json(
        {
          error:
            "El barbero no existe",
        },
        {
          status: 404,
        }
      );
    }

    const {
      count,
      error: errorTurnos,
    } =
      await supabaseAdmin
        .from("turnos")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "barbero_id",
          id
        );

    if (errorTurnos) {
      console.error(
        errorTurnos
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar si el barbero tiene turnos",
        },
        {
          status: 500,
        }
      );
    }

    if (
      (count ?? 0) > 0
    ) {
      return NextResponse.json(
        {
          error:
            `${barbero.nombre} tiene turnos registrados. Para conservar el historial, desactivalo en lugar de eliminarlo.`,
        },
        {
          status: 409,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("barberos")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo eliminar el barbero",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      nombre:
        barbero.nombre,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar el barbero",
      },
      {
        status: 500,
      }
    );
  }
}