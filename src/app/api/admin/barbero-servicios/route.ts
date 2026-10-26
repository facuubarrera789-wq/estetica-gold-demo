import {
  NextRequest,
  NextResponse,
} from "next/server";

import { isAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function GET(
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
    const barberoIdTexto =
      request.nextUrl.searchParams.get(
        "barberoId"
      );

    let consulta =
      supabaseAdmin
        .from(
          "barbero_servicios"
        )
        .select(
          "barbero_id,servicio_id,activo"
        );

    if (barberoIdTexto) {
      const barberoId =
        Number(barberoIdTexto);

      if (
        !Number.isInteger(
          barberoId
        ) ||
        barberoId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Profesional inválida",
          },
          {
            status: 400,
          }
        );
      }

      consulta =
        consulta.eq(
          "barbero_id",
          barberoId
        );
    }

    const {
      data,
      error,
    } = await consulta;

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudieron cargar los tratamientos de los profesionales",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      asignaciones:
        data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar las asignaciones",
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

    const barberoId =
      Number(
        body.barberoId
      );

    const servicioId =
      Number(
        body.servicioId
      );

    const activo =
      body.activo;

    if (
      !Number.isInteger(
        barberoId
      ) ||
      barberoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Profesional inválida",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        servicioId
      ) ||
      servicioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tratamiento inválido",
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

    const {
      data: profesional,
      error:
        errorProfesional,
    } =
      await supabaseAdmin
        .from("barberos")
        .select(
          "id,nombre"
        )
        .eq(
          "id",
          barberoId
        )
        .maybeSingle();

    if (
      errorProfesional
    ) {
      console.error(
        errorProfesional
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar la profesional",
        },
        {
          status: 500,
        }
      );
    }

    if (!profesional) {
      return NextResponse.json(
        {
          error:
            "La profesional no existe",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data: servicio,
      error:
        errorServicio,
    } =
      await supabaseAdmin
        .from("servicios")
        .select(
          "id,nombre"
        )
        .eq(
          "id",
          servicioId
        )
        .maybeSingle();

    if (
      errorServicio
    ) {
      console.error(
        errorServicio
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar el tratamiento",
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
            "El tratamiento no existe",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "barbero_servicios"
        )
        .upsert(
          {
            barbero_id:
              barberoId,

            servicio_id:
              servicioId,

            activo,
          },
          {
            onConflict:
              "barbero_id,servicio_id",
          }
        )
        .select(
          "barbero_id,servicio_id,activo"
        )
        .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudo actualizar el tratamiento de la profesional",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      asignacion: data,

      profesional:
        profesional.nombre,

      tratamiento:
        servicio.nombre,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar la asignación",
      },
      {
        status: 500,
      }
    );
  }
}