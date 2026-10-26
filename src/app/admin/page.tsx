import { redirect } from "next/navigation";

import AdminAgenda from "../../components/AdminAgenda";
import { isAdmin } from "../../lib/adminAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function obtenerNombreProfesional(
  relacion: unknown
) {
  if (Array.isArray(relacion)) {
    const primero =
      relacion[0];

    if (
      primero &&
      typeof primero ===
        "object"
    ) {
      const nombre =
        (
          primero as Record<
            string,
            unknown
          >
        ).nombre;

      if (
        typeof nombre ===
        "string"
      ) {
        return nombre;
      }
    }
  }

  if (
    relacion &&
    typeof relacion ===
      "object"
  ) {
    const nombre =
      (
        relacion as Record<
          string,
          unknown
        >
      ).nombre;

    if (
      typeof nombre ===
      "string"
    ) {
      return nombre;
    }
  }

  return "Sin profesional";
}

export default async function AdminPage() {
  const autorizado =
    await isAdmin();

  if (!autorizado) {
    redirect("/admin/login");
  }

  const [
    respuestaTurnos,
    respuestaServicios,
    respuestaHorarios,
    respuestaBarberos,
  ] = await Promise.all([
    supabaseAdmin
      .from("turnos")
      .select(
        `
        id,
        nombre,
        apellido,
        telefono,
        servicio,
        precio,
        fecha,
        hora,
        forma_pago,
        estado,
        barbero_id,
        fecha_propuesta,
        hora_propuesta,
        propuesta_enviada_at,
        barberos (
          nombre
        )
        `
      )
      .order("fecha", {
        ascending: true,
      })
      .order("hora", {
        ascending: true,
      }),

    supabaseAdmin
      .from("servicios")
      .select(
        "id,nombre,precio,duracion_minutos,activo"
      )
      .order("id", {
        ascending: true,
      }),

    supabaseAdmin
      .from("horarios")
      .select(
        "id,hora,activo"
      )
      .order("hora", {
        ascending: true,
      }),

    supabaseAdmin
      .from("barberos")
      .select(
        "id,nombre,activo"
      )
      .order("id", {
        ascending: true,
      }),
  ]);

  if (
    respuestaTurnos.error
  ) {
    console.error(
      respuestaTurnos.error
    );
  }

  if (
    respuestaServicios.error
  ) {
    console.error(
      respuestaServicios.error
    );
  }

  if (
    respuestaHorarios.error
  ) {
    console.error(
      respuestaHorarios.error
    );
  }

  if (
    respuestaBarberos.error
  ) {
    console.error(
      respuestaBarberos.error
    );
  }

  const turnos =
    (
      respuestaTurnos.data ??
      []
    ).map((turno) => {
      const nombreProfesional =
        obtenerNombreProfesional(
          turno.barberos
        );

      return {
        id: turno.id,

        nombre:
          turno.nombre,

        apellido:
          turno.apellido,

        telefono:
          turno.telefono,

        servicio:
          turno.servicio,

        precio:
          turno.precio,

        fecha:
          turno.fecha,

        hora: String(
          turno.hora
        ).slice(0, 5),

        forma_pago:
          turno.forma_pago,

        estado:
          turno.estado,

        barbero_id:
          turno.barbero_id,

        barbero_nombre:
          nombreProfesional,

        fecha_propuesta:
          turno.fecha_propuesta ??
          null,

        hora_propuesta:
          turno.hora_propuesta
            ? String(
                turno.hora_propuesta
              ).slice(0, 5)
            : null,

        propuesta_enviada_at:
          turno.propuesta_enviada_at ??
          null,
      };
    });

  const horarios =
    (
      respuestaHorarios.data ??
      []
    ).map((horario) => ({
      ...horario,

      hora: String(
        horario.hora
      ).slice(0, 5),
    }));

  return (
    <AdminAgenda
      turnos={turnos}
      servicios={
        respuestaServicios.data ??
        []
      }
      horarios={horarios}
      barberos={
        respuestaBarberos.data ??
        []
      }
    />
  );
}