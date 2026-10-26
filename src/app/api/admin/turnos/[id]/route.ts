import {
  NextRequest,
  NextResponse,
} from "next/server";

import { isAdmin } from "../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

function horaCorta(
  hora: string
) {
  return String(hora).slice(
    0,
    5
  );
}

function fechaValida(
  fecha: string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    fecha
  );
}

function horaValida(
  hora: string
) {
  return /^\d{2}:\d{2}$/.test(
    hora
  );
}

async function obtenerTurno(
  id: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("turnos")
      .select(
        "id,nombre,apellido,telefono,servicio,precio,fecha,hora,forma_pago,estado,barbero_id,fecha_propuesta,hora_propuesta,propuesta_enviada_at"
      )
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function horarioActivo(
  hora: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("horarios")
      .select("id,hora,activo")
      .eq("activo", true);

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).some(
    (horario) =>
      horaCorta(
        horario.hora
      ) === hora
  );
}

async function horarioOcupado({
  fecha,
  hora,
  barberoId,
  turnoId,
}: {
  fecha: string;
  hora: string;
  barberoId: number;
  turnoId: string;
}) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("turnos")
      .select("id,hora")
      .eq(
        "fecha",
        fecha
      )
      .eq(
        "barbero_id",
        barberoId
      )
      .eq(
        "estado",
        "confirmado"
      )
      .neq(
        "id",
        turnoId
      );

  if (error) {
    throw error;
  }

  return (
    data ?? []
  ).some(
    (turno) =>
      horaCorta(
        turno.hora
      ) === hora
  );
}

export async function PATCH(
  request: NextRequest,
  context: Contexto
) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const {
      id,
    } =
      await context.params;

    const body =
      await request.json();

    const accion =
      String(
        body.accion ?? ""
      );

    const turno =
      await obtenerTurno(id);

    if (!turno) {
      return NextResponse.json(
        {
          error:
            "El turno no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      accion ===
      "proponer"
    ) {
      if (
        turno.estado !==
        "confirmado"
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede reprogramar un turno cancelado.",
          },
          {
            status: 400,
          }
        );
      }

      const fecha =
        String(
          body.fecha ?? ""
        );

      const hora =
        horaCorta(
          String(
            body.hora ?? ""
          )
        );

      if (
        !fechaValida(
          fecha
        )
      ) {
        return NextResponse.json(
          {
            error:
              "La fecha propuesta no es válida.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !horaValida(
          hora
        )
      ) {
        return NextResponse.json(
          {
            error:
              "El horario propuesto no es válido.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        fecha ===
          turno.fecha &&
        hora ===
          horaCorta(
            turno.hora
          )
      ) {
        return NextResponse.json(
          {
            error:
              "Elegí otra fecha u otro horario.",
          },
          {
            status: 400,
          }
        );
      }

      const activo =
        await horarioActivo(
          hora
        );

      if (!activo) {
        return NextResponse.json(
          {
            error:
              "Ese horario no está habilitado.",
          },
          {
            status: 400,
          }
        );
      }

      const ocupado =
        await horarioOcupado({
          fecha,
          hora,
          barberoId:
            turno.barbero_id,
          turnoId:
            turno.id,
        });

      if (ocupado) {
        return NextResponse.json(
          {
            error:
              "Ese horario ya está ocupado para la profesional.",
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
          .from("turnos")
          .update({
            fecha_propuesta:
              fecha,
            hora_propuesta:
              hora,
            propuesta_enviada_at:
              null,
          })
          .eq(
            "id",
            turno.id
          )
          .select(
            "id,fecha,hora,fecha_propuesta,hora_propuesta"
          )
          .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        ok: true,
        mensaje:
          "La propuesta quedó preparada. El turno original todavía no fue modificado.",
        turno: data,
      });
    }

    if (
      accion ===
      "marcar_propuesta_enviada"
    ) {
      if (
        !turno.fecha_propuesta ||
        !turno.hora_propuesta
      ) {
        return NextResponse.json(
          {
            error:
              "Este turno no tiene una propuesta pendiente.",
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
          .from("turnos")
          .update({
            propuesta_enviada_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            turno.id
          )
          .select(
            "id,fecha_propuesta,hora_propuesta,propuesta_enviada_at"
          )
          .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        ok: true,
        turno: data,
      });
    }

    if (
      accion ===
      "cancelar_propuesta"
    ) {
      const {
        error,
      } =
        await supabaseAdmin
          .from("turnos")
          .update({
            fecha_propuesta:
              null,
            hora_propuesta:
              null,
            propuesta_enviada_at:
              null,
          })
          .eq(
            "id",
            turno.id
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        ok: true,
        mensaje:
          "La propuesta de cambio fue descartada.",
      });
    }

    if (
      accion ===
      "confirmar_propuesta"
    ) {
      if (
        turno.estado !==
        "confirmado"
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede confirmar el cambio de un turno cancelado.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !turno.fecha_propuesta ||
        !turno.hora_propuesta
      ) {
        return NextResponse.json(
          {
            error:
              "Este turno no tiene una propuesta pendiente.",
          },
          {
            status: 400,
          }
        );
      }

      const fechaNueva =
        turno.fecha_propuesta;

      const horaNueva =
        horaCorta(
          turno.hora_propuesta
        );

      const activo =
        await horarioActivo(
          horaNueva
        );

      if (!activo) {
        return NextResponse.json(
          {
            error:
              "El horario propuesto ya no está habilitado.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Volvemos a comprobar la disponibilidad
       * porque otro cliente pudo reservar ese
       * horario mientras esperábamos la respuesta.
       */
      const ocupado =
        await horarioOcupado({
          fecha:
            fechaNueva,
          hora:
            horaNueva,
          barberoId:
            turno.barbero_id,
          turnoId:
            turno.id,
        });

      if (ocupado) {
        return NextResponse.json(
          {
            error:
              "Ese horario se ocupó mientras esperabas la confirmación del cliente. Elegí otro horario.",
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
          .from("turnos")
          .update({
            fecha:
              fechaNueva,
            hora:
              horaNueva,
            fecha_propuesta:
              null,
            hora_propuesta:
              null,
            propuesta_enviada_at:
              null,
          })
          .eq(
            "id",
            turno.id
          )
          .select(
            "id,nombre,apellido,telefono,servicio,precio,fecha,hora,forma_pago,estado,barbero_id"
          )
          .single();

      if (error) {
        /*
         * La base también tiene una restricción
         * para impedir dos turnos en el mismo
         * horario con la misma profesional.
         */
        if (
          error.code ===
          "23505"
        ) {
          return NextResponse.json(
            {
              error:
                "Ese horario acaba de ser ocupado. Elegí otro.",
            },
            {
              status: 409,
            }
          );
        }

        throw error;
      }

      return NextResponse.json({
        ok: true,
        mensaje:
          "El cambio fue confirmado y el turno ya quedó reprogramado.",
        turno: data,
      });
    }

    if (
      accion ===
      "cancelar"
    ) {
      if (
        turno.estado ===
        "cancelado"
      ) {
        return NextResponse.json(
          {
            error:
              "El turno ya está cancelado.",
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
          .from("turnos")
          .update({
            estado:
              "cancelado",
            fecha_propuesta:
              null,
            hora_propuesta:
              null,
            propuesta_enviada_at:
              null,
          })
          .eq(
            "id",
            turno.id
          )
          .select(
            "id,estado"
          )
          .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        ok: true,
        turno: data,
      });
    }

    return NextResponse.json(
      {
        error:
          "Acción inválida.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo modificar el turno.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: Contexto
) {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    return NextResponse.json(
      {
        error:
          "No autorizado",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const {
      id,
    } =
      await context.params;

    const turno =
      await obtenerTurno(id);

    if (!turno) {
      return NextResponse.json(
        {
          error:
            "El turno no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      turno.estado !==
      "cancelado"
    ) {
      return NextResponse.json(
        {
          error:
            "Solamente se pueden borrar definitivamente los turnos cancelados.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from("turnos")
        .delete()
        .eq(
          "id",
          turno.id
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudo borrar el turno.",
      },
      {
        status: 500,
      }
    );
  }
}