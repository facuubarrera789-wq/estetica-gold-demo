import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const fecha =
      request.nextUrl.searchParams.get("fecha");

    const barberoIdTexto =
      request.nextUrl.searchParams.get("barberoId");

    if (!fecha) {
      return NextResponse.json(
        {
          error: "Falta la fecha",
        },
        {
          status: 400,
        }
      );
    }

    if (!barberoIdTexto) {
      return NextResponse.json({
        ocupados: [],
      });
    }

    const barberoId =
      Number(barberoIdTexto);

    if (
      !Number.isInteger(barberoId) ||
      barberoId <= 0
    ) {
      return NextResponse.json(
        {
          error: "Barbero inválido",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("turnos")
        .select("hora")
        .eq("fecha", fecha)
        .eq("barbero_id", barberoId)
        .eq("estado", "confirmado");

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No se pudieron consultar los horarios",
        },
        {
          status: 500,
        }
      );
    }

    const ocupados =
      data?.map((turno) =>
        String(turno.hora).slice(0, 5)
      ) ?? [];

    return NextResponse.json({
      ocupados,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron consultar los horarios",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body =
      await request.json();

    const {
      nombre,
      apellido,
      telefono,
      servicioId,
      barberoId,
      fecha,
      hora,
      formaPago,
    } = body;

    if (
      !nombre ||
      !apellido ||
      !telefono ||
      !servicioId ||
      !barberoId ||
      !fecha ||
      !hora ||
      !formaPago
    ) {
      return NextResponse.json(
        {
          error:
            "Completá todos los datos",
        },
        {
          status: 400,
        }
      );
    }

    const idServicio =
      Number(servicioId);

    const idBarbero =
      Number(barberoId);

    if (
      !Number.isInteger(idServicio) ||
      idServicio <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Servicio inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(idBarbero) ||
      idBarbero <= 0
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

    // SERVICIO
    const {
      data: servicio,
      error: errorServicio,
    } =
      await supabaseAdmin
        .from("servicios")
        .select(
          "id,nombre,precio,duracion_minutos,activo"
        )
        .eq("id", idServicio)
        .eq("activo", true)
        .single();

    if (
      errorServicio ||
      !servicio
    ) {
      return NextResponse.json(
        {
          error:
            "Servicio inválido o desactivado",
        },
        {
          status: 400,
        }
      );
    }

    // COLOR NO SE RESERVA DESDE ESTA API
    if (
      servicio.nombre
        .trim()
        .toLowerCase() ===
      "color"
    ) {
      return NextResponse.json(
        {
          error:
            "Los servicios de color se coordinan por WhatsApp.",
        },
        {
          status: 400,
        }
      );
    }

    // BARBERO
    const {
      data: barbero,
      error: errorBarbero,
    } =
      await supabaseAdmin
        .from("barberos")
        .select(
          "id,nombre,activo"
        )
        .eq("id", idBarbero)
        .eq("activo", true)
        .single();

    if (
      errorBarbero ||
      !barbero
    ) {
      return NextResponse.json(
        {
          error:
            "Barbero inválido o desactivado",
        },
        {
          status: 400,
        }
      );
    }

    // HORARIO
    const {
      data: horarioActivo,
      error: errorHorario,
    } =
      await supabaseAdmin
        .from("horarios")
        .select(
          "id,hora,activo"
        )
        .eq("hora", hora)
        .eq("activo", true)
        .maybeSingle();

    if (errorHorario) {
      console.error(
        errorHorario
      );

      return NextResponse.json(
        {
          error:
            "No se pudo comprobar el horario",
        },
        {
          status: 500,
        }
      );
    }

    if (!horarioActivo) {
      return NextResponse.json(
        {
          error:
            "Ese horario no está disponible para reservas.",
        },
        {
          status: 400,
        }
      );
    }

    // FORMA DE PAGO
    if (
      ![
        "Efectivo",
        "Transferencia",
        "Tarjeta",
      ].includes(formaPago)
    ) {
      return NextResponse.json(
        {
          error:
            "Forma de pago inválida",
        },
        {
          status: 400,
        }
      );
    }

    // GUARDAR TURNO
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("turnos")
        .insert({
          nombre:
            String(nombre).trim(),

          apellido:
            String(apellido).trim(),

          telefono:
            String(telefono).trim(),

          servicio:
            servicio.nombre,

          precio:
            servicio.precio,

          fecha,

          hora,

          forma_pago:
            formaPago,

          estado:
            "confirmado",

          barbero_id:
            idBarbero,
        })
        .select()
        .single();

    if (error) {
      console.error(error);

      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            error:
              `${barbero.nombre} ya tiene un turno en ese horario. Elegí otro.`,
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            "No se pudo guardar el turno",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,

        turno: data,

        barbero: {
          id:
            barbero.id,

          nombre:
            barbero.nombre,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Solicitud inválida",
      },
      {
        status: 400,
      }
    );
  }
}