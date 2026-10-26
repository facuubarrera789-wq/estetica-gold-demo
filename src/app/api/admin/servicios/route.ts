import {
  NextRequest,
  NextResponse,
} from "next/server";

import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(
  request: Request
) {
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

    const precio =
      Number(body.precio);

    const duracionMinutos =
      Number(
        body.duracionMinutos
      );

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "Ingresá el nombre del tratamiento.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(precio) ||
      precio < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá un precio válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        duracionMinutos
      ) ||
      duracionMinutos <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá una duración válida.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: existente,
      error: errorExistente,
    } =
      await supabaseAdmin
        .from("servicios")
        .select("id,nombre")
        .ilike("nombre", nombre)
        .maybeSingle();

    if (errorExistente) {
      console.error(
        errorExistente
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar el tratamiento.",
        },
        {
          status: 500,
        }
      );
    }

    if (existente) {
      return NextResponse.json(
        {
          error:
            "Ya existe un tratamiento con ese nombre.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("servicios")
        .insert({
          nombre,
          precio,
          duracion_minutos:
            duracionMinutos,
          activo: true,
        })
        .select(
          "id,nombre,precio,duracion_minutos,activo"
        )
        .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo agregar el tratamiento.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      servicio: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo agregar el tratamiento.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
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
            "Tratamiento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const cambios: {
      precio?: number;
      duracion_minutos?: number;
      activo?: boolean;
      nombre?: string;
    } = {};

    if (
      body.precio !==
      undefined
    ) {
      const precio =
        Number(body.precio);

      if (
        !Number.isInteger(
          precio
        ) ||
        precio < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Ingresá un precio válido.",
          },
          {
            status: 400,
          }
        );
      }

      cambios.precio =
        precio;
    }

    if (
      body.duracionMinutos !==
      undefined
    ) {
      const duracion =
        Number(
          body.duracionMinutos
        );

      if (
        !Number.isInteger(
          duracion
        ) ||
        duracion <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Ingresá una duración válida.",
          },
          {
            status: 400,
          }
        );
      }

      cambios.duracion_minutos =
        duracion;
    }

    if (
      body.activo !==
      undefined
    ) {
      if (
        typeof body.activo !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "Estado inválido.",
          },
          {
            status: 400,
          }
        );
      }

      cambios.activo =
        body.activo;
    }

    if (
      body.nombre !==
      undefined
    ) {
      const nombre =
        String(
          body.nombre
        ).trim();

      if (!nombre) {
        return NextResponse.json(
          {
            error:
              "El nombre no puede estar vacío.",
          },
          {
            status: 400,
          }
        );
      }

      cambios.nombre =
        nombre;
    }

    if (
      Object.keys(cambios)
        .length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No hay cambios para guardar.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
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
        {
          error:
            "No se pudo actualizar el tratamiento.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      servicio: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el tratamiento.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
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
            "Tratamiento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: servicio,
      error: errorServicio,
    } =
      await supabaseAdmin
        .from("servicios")
        .select("id,nombre")
        .eq("id", id)
        .maybeSingle();

    if (errorServicio) {
      console.error(
        errorServicio
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar el tratamiento.",
        },
        {
          status: 500,
        }
      );
    }

    if (!servicio) {
      return NextResponse.json(
        {
          error:
            "El tratamiento no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from("servicios")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo eliminar el tratamiento.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      nombre:
        servicio.nombre,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar el tratamiento.",
      },
      {
        status: 500,
      }
    );
  }
}