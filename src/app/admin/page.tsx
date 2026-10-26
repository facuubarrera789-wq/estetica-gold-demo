import { redirect } from "next/navigation";
import AdminAgenda from "../../components/AdminAgenda";
import { isAdmin } from "../../lib/adminAuth";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type TurnoBase = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  forma_pago: string;
  estado: string;
  barbero_id: number;
  barberos:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

export default async function AdminPage() {
  const autorizado = await isAdmin();

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

  if (respuestaTurnos.error) {
    console.error(
      "Error cargando turnos:",
      respuestaTurnos.error
    );
  }

  if (respuestaServicios.error) {
    console.error(
      "Error cargando servicios:",
      respuestaServicios.error
    );
  }

  if (respuestaHorarios.error) {
    console.error(
      "Error cargando horarios:",
      respuestaHorarios.error
    );
  }

  if (respuestaBarberos.error) {
    console.error(
      "Error cargando barberos:",
      respuestaBarberos.error
    );
  }

  const turnosRaw =
    (respuestaTurnos.data ??
      []) as TurnoBase[];

  const turnos =
    turnosRaw.map((turno) => {
      let barberoNombre =
        "Sin asignar";

      if (
        Array.isArray(
          turno.barberos
        )
      ) {
        barberoNombre =
          turno.barberos[0]
            ?.nombre ??
          "Sin asignar";
      } else if (
        turno.barberos
      ) {
        barberoNombre =
          turno.barberos.nombre;
      }

      return {
        id: turno.id,
        nombre: turno.nombre,
        apellido:
          turno.apellido,
        telefono:
          turno.telefono,
        servicio:
          turno.servicio,
        precio: turno.precio,
        fecha: turno.fecha,
        hora: String(
          turno.hora
        ).slice(0, 5),
        forma_pago:
          turno.forma_pago,
        estado: turno.estado,
        barbero_id:
          turno.barbero_id,
        barbero_nombre:
          barberoNombre,
      };
    });

  const horarios =
    respuestaHorarios.data?.map(
      (horario) => ({
        id: horario.id,
        hora: String(
          horario.hora
        ).slice(0, 5),
        activo:
          horario.activo,
      })
    ) ?? [];

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