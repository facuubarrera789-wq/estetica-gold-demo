"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Turno = {
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
  barbero_nombre: string;

  fecha_propuesta: string | null;
  hora_propuesta: string | null;
  propuesta_enviada_at: string | null;
};

type ServicioAdmin = {
  id: number;
  nombre: string;
  precio: number | null;
  duracion_minutos: number | null;
  activo: boolean;
};

type HorarioAdmin = {
  id: number;
  hora: string;
  activo: boolean;
};

type ProfesionalAdmin = {
  id: number;
  nombre: string;
  activo: boolean;
};

type Asignacion = {
  barbero_id: number;
  servicio_id: number;
  activo: boolean;
};

type Filtro =
  | "hoy"
  | "proximos"
  | "historial"
  | "cancelados";

type Props = {
  turnos?: Turno[];
  servicios?: ServicioAdmin[];
  horarios?: HorarioAdmin[];
  barberos?: ProfesionalAdmin[];
};

function obtenerHoy() {
  const ahora = new Date();

  const año = ahora.getFullYear();

  const mes = String(
    ahora.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    ahora.getDate()
  ).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

function claveAsignacion(
  barberoId: number,
  servicioId: number
) {
  return `${barberoId}-${servicioId}`;
}

function formatearFecha(
  fecha: string
) {
  const [año, mes, dia] =
    fecha.split("-");

  if (!año || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${año}`;
}

function prepararNumeroWhatsApp(
  telefono: string
) {
  let numero =
    telefono.replace(/\D/g, "");

  numero =
    numero.replace(/^0+/, "");

  if (!numero) {
    return "";
  }

  if (
    numero.startsWith("549")
  ) {
    return numero;
  }

  if (
    numero.startsWith("54")
  ) {
    return `549${numero.slice(
      2
    ).replace(/^9/, "")}`;
  }

  if (
    numero.startsWith("9")
  ) {
    return `54${numero}`;
  }

  return `549${numero}`;
}

function crearLinkWhatsApp(
  telefono: string,
  mensaje: string
) {
  const numero =
    prepararNumeroWhatsApp(
      telefono
    );

  if (!numero) {
    return "";
  }

  return `https://wa.me/${numero}?text=${encodeURIComponent(
    mensaje
  )}`;
}

function mensajePropuesta(
  turno: Turno,
  fechaNueva: string,
  horaNueva: string
) {
  return (
    `Hola ${turno.nombre} 👋\n\n` +
    `Te escribimos de Estética Gold por tu turno de ${turno.servicio}.\n\n` +
    `Necesitamos proponerte un cambio de horario:\n\n` +
    `📅 Turno actual: ${formatearFecha(
      turno.fecha
    )} a las ${String(
      turno.hora
    ).slice(0, 5)}\n\n` +
    `✨ Nuevo turno propuesto:\n` +
    `📅 ${formatearFecha(
      fechaNueva
    )}\n` +
    `🕐 ${horaNueva}\n` +
    `👩 Profesional: ${turno.barbero_nombre}\n\n` +
    `¿Podés confirmarnos por acá si te queda bien este nuevo día y horario?\n\n` +
    `Muchas gracias 💛`
  );
}

function mensajeConfirmacion(
  turno: Turno,
  fechaNueva: string,
  horaNueva: string
) {
  return (
    `Hola ${turno.nombre} 😊\n\n` +
    `¡Perfecto! Te confirmamos que tu turno en Estética Gold quedó reprogramado correctamente.\n\n` +
    `✨ Tratamiento: ${turno.servicio}\n` +
    `👩 Profesional: ${turno.barbero_nombre}\n` +
    `📅 Fecha: ${formatearFecha(
      fechaNueva
    )}\n` +
    `🕐 Horario: ${horaNueva}\n\n` +
    `¡Te esperamos! 💛`
  );
}

export default function AdminAgenda({
  turnos = [],
  servicios = [],
  horarios = [],
  barberos = [],
}: Props) {
  const router = useRouter();

  const [
    filtro,
    setFiltro,
  ] = useState<Filtro>(
    "hoy"
  );

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    precios,
    setPrecios,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      servicios.map(
        (servicio) => [
          servicio.id,
          String(
            servicio.precio ??
              0
          ),
        ]
      )
    )
  );

  const [
    nombresServicios,
    setNombresServicios,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      servicios.map(
        (servicio) => [
          servicio.id,
          servicio.nombre,
        ]
      )
    )
  );

  const [
    duraciones,
    setDuraciones,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      servicios.map(
        (servicio) => [
          servicio.id,
          String(
            servicio.duracion_minutos ??
              60
          ),
        ]
      )
    )
  );

  const [
    nuevoProfesional,
    setNuevoProfesional,
  ] = useState("");

  const [
    nuevoTratamiento,
    setNuevoTratamiento,
  ] = useState("");

  const [
    nuevoPrecio,
    setNuevoPrecio,
  ] = useState("");

  const [
    nuevaDuracion,
    setNuevaDuracion,
  ] = useState("60");

  const [
    agregandoTratamiento,
    setAgregandoTratamiento,
  ] = useState(false);

  const [
    asignaciones,
    setAsignaciones,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    cargandoAsignaciones,
    setCargandoAsignaciones,
  ] = useState(true);

  const [
    procesandoAsignacion,
    setProcesandoAsignacion,
  ] = useState<
    string | null
  >(null);

  const [
    procesandoServicio,
    setProcesandoServicio,
  ] = useState<
    number | null
  >(null);

  const [
    procesandoHorario,
    setProcesandoHorario,
  ] = useState<
    number | null
  >(null);

  const [
    procesandoProfesional,
    setProcesandoProfesional,
  ] = useState<
    number | null
  >(null);

  const [
    agregandoProfesional,
    setAgregandoProfesional,
  ] = useState(false);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const hoy = obtenerHoy();

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  useEffect(() => {
    setPrecios(
      Object.fromEntries(
        servicios.map(
          (servicio) => [
            servicio.id,
            String(
              servicio.precio ??
                0
            ),
          ]
        )
      )
    );

    setNombresServicios(
      Object.fromEntries(
        servicios.map(
          (servicio) => [
            servicio.id,
            servicio.nombre,
          ]
        )
      )
    );

    setDuraciones(
      Object.fromEntries(
        servicios.map(
          (servicio) => [
            servicio.id,
            String(
              servicio.duracion_minutos ??
                60
            ),
          ]
        )
      )
    );
  }, [servicios]);

  async function cargarAsignaciones() {
    setCargandoAsignaciones(
      true
    );

    try {
      const respuesta =
        await fetch(
          "/api/admin/barbero-servicios",
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar las asignaciones"
        );
      }

      const mapa: Record<
        string,
        boolean
      > = {};

      (
        resultado.asignaciones ??
        []
      ).forEach(
        (
          asignacion: Asignacion
        ) => {
          mapa[
            claveAsignacion(
              asignacion.barbero_id,
              asignacion.servicio_id
            )
          ] =
            asignacion.activo;
        }
      );

      setAsignaciones(mapa);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las asignaciones"
      );
    } finally {
      setCargandoAsignaciones(
        false
      );
    }
  }

  const cantidadHoy =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha === hoy
    ).length;

  const cantidadProximos =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha > hoy
    ).length;

  const cantidadHistorial =
    turnos.filter(
      (turno) =>
        turno.estado ===
          "confirmado" &&
        turno.fecha < hoy
    ).length;

  const cantidadCancelados =
    turnos.filter(
      (turno) =>
        turno.estado ===
        "cancelado"
    ).length;

  const turnosFiltrados =
    turnos.filter(
      (turno) => {
        if (
          filtro === "hoy" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha ===
              hoy
          )
        ) {
          return false;
        }

        if (
          filtro ===
            "proximos" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha > hoy
          )
        ) {
          return false;
        }

        if (
          filtro ===
            "historial" &&
          !(
            turno.estado ===
              "confirmado" &&
            turno.fecha < hoy
          )
        ) {
          return false;
        }

        if (
          filtro ===
            "cancelados" &&
          turno.estado !==
            "cancelado"
        ) {
          return false;
        }

        const texto =
          `${turno.nombre} ${turno.apellido} ${turno.telefono} ${turno.barbero_nombre}`.toLowerCase();

        return texto.includes(
          busqueda
            .trim()
            .toLowerCase()
        );
      }
    );

  async function cerrarSesion() {
    setCerrandoSesion(true);

    await fetch(
      "/api/admin/logout",
      {
        method: "POST",
      }
    );

    window.location.href =
      "/admin/login";
  }

  async function cambiarAsignacion(
    profesional: ProfesionalAdmin,
    servicio: ServicioAdmin
  ) {
    const clave =
      claveAsignacion(
        profesional.id,
        servicio.id
      );

    const activoActual =
      asignaciones[clave] ??
      false;

    const nuevoEstado =
      !activoActual;

    setProcesandoAsignacion(
      clave
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barbero-servicios",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              barberoId:
                profesional.id,

              servicioId:
                servicio.id,

              activo:
                nuevoEstado,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar"
        );
      }

      setAsignaciones(
        (actuales) => ({
          ...actuales,
          [clave]:
            nuevoEstado,
        })
      );

      setMensaje(
        nuevoEstado
          ? `${profesional.nombre} ahora realiza ${servicio.nombre}.`
          : `${profesional.nombre} ya no realiza ${servicio.nombre}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar"
      );
    } finally {
      setProcesandoAsignacion(
        null
      );
    }
  }

  async function agregarTratamiento() {
    const nombre =
      nuevoTratamiento.trim();

    const precio =
      Number(nuevoPrecio);

    const duracion =
      Number(nuevaDuracion);

    if (!nombre) {
      setError(
        "Ingresá el nombre del tratamiento."
      );
      return;
    }

    if (
      !Number.isInteger(
        precio
      ) ||
      precio < 0
    ) {
      setError(
        "Ingresá un precio válido."
      );
      return;
    }

    if (
      !Number.isInteger(
        duracion
      ) ||
      duracion <= 0
    ) {
      setError(
        "Ingresá una duración válida."
      );
      return;
    }

    setAgregandoTratamiento(
      true
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/servicios",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nombre,
              precio,
              duracionMinutos:
                duracion,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo agregar"
        );
      }

      setNuevoTratamiento("");
      setNuevoPrecio("");
      setNuevaDuracion("60");

      setMensaje(
        `${resultado.servicio.nombre} agregado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo agregar"
      );
    } finally {
      setAgregandoTratamiento(
        false
      );
    }
  }

  async function actualizarServicio(
    id: number,
    cambios: {
      precio?: number;
      duracionMinutos?: number;
      nombre?: string;
      activo?: boolean;
    }
  ) {
    setProcesandoServicio(id);

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/servicios",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id,
              ...cambios,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar"
        );
      }

      setMensaje(
        `${resultado.servicio.nombre} actualizado correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setProcesandoServicio(
        null
      );
    }
  }

  async function guardarCambiosServicio(
    servicio: ServicioAdmin
  ) {
    const nombre =
      (
        nombresServicios[
          servicio.id
        ] ?? ""
      ).trim();

    const precio =
      Number(
        precios[
          servicio.id
        ]
      );

    const duracion =
      Number(
        duraciones[
          servicio.id
        ]
      );

    if (!nombre) {
      setError(
        "El nombre no puede estar vacío."
      );
      return;
    }

    if (
      !Number.isInteger(
        precio
      ) ||
      precio < 0
    ) {
      setError(
        "Ingresá un precio válido."
      );
      return;
    }

    if (
      !Number.isInteger(
        duracion
      ) ||
      duracion <= 0
    ) {
      setError(
        "Ingresá una duración válida."
      );
      return;
    }

    await actualizarServicio(
      servicio.id,
      {
        nombre,
        precio,
        duracionMinutos:
          duracion,
      }
    );
  }

  async function cambiarServicio(
    servicio: ServicioAdmin
  ) {
    await actualizarServicio(
      servicio.id,
      {
        activo:
          !servicio.activo,
      }
    );
  }

  async function eliminarTratamiento(
    servicio: ServicioAdmin
  ) {
    const confirmar =
      window.confirm(
        `¿Eliminar definitivamente "${servicio.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    setProcesandoServicio(
      servicio.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/servicios",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: servicio.id,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo eliminar"
        );
      }

      setMensaje(
        `${resultado.nombre} eliminado correctamente.`
      );

      router.refresh();

      await cargarAsignaciones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar"
      );
    } finally {
      setProcesandoServicio(
        null
      );
    }
  }

  async function cambiarHorario(
    horario: HorarioAdmin
  ) {
    setProcesandoHorario(
      horario.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/horarios",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: horario.id,
              activo:
                !horario.activo,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar"
        );
      }

      setMensaje(
        "Horario actualizado correctamente."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setProcesandoHorario(
        null
      );
    }
  }

  async function agregarProfesional() {
    const nombre =
      nuevoProfesional.trim();

    if (!nombre) {
      setError(
        "Ingresá el nombre de la profesional."
      );
      return;
    }

    setAgregandoProfesional(
      true
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barberos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nombre,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo agregar"
        );
      }

      setNuevoProfesional("");

      setMensaje(
        `${resultado.barbero.nombre} agregada correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo agregar"
      );
    } finally {
      setAgregandoProfesional(
        false
      );
    }
  }

  async function cambiarProfesional(
    profesional: ProfesionalAdmin
  ) {
    setProcesandoProfesional(
      profesional.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barberos",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: profesional.id,
              activo:
                !profesional.activo,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo actualizar"
        );
      }

      setMensaje(
        `${resultado.barbero.nombre} actualizada correctamente.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar"
      );
    } finally {
      setProcesandoProfesional(
        null
      );
    }
  }

  async function eliminarProfesional(
    profesional: ProfesionalAdmin
  ) {
    const confirmar =
      window.confirm(
        `¿Eliminar definitivamente a ${profesional.nombre}?`
      );

    if (!confirmar) {
      return;
    }

    setProcesandoProfesional(
      profesional.id
    );

    setMensaje("");
    setError("");

    try {
      const respuesta =
        await fetch(
          "/api/admin/barberos",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: profesional.id,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo eliminar"
        );
      }

      setMensaje(
        `${resultado.nombre} eliminada correctamente.`
      );

      router.refresh();

      await cargarAsignaciones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar"
      );
    } finally {
      setProcesandoProfesional(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2ea] text-[#2d241f]">
      <header className="border-b border-[#dfd1c0] bg-[#fffaf4]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2d241f] font-black text-[#e4c382]">
              EG
            </div>

            <div>
              <p className="font-black tracking-[0.18em]">
                ESTÉTICA GOLD
              </p>

              <p className="text-xs uppercase tracking-[0.2em] text-[#9a7b55]">
                Panel administrador
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-full border border-[#d8c7b3] px-5 py-3 text-sm font-bold"
            >
              Ver web
            </a>

            <button
              type="button"
              onClick={
                cerrarSesion
              }
              disabled={
                cerrandoSesion
              }
              className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-700"
            >
              {cerrandoSesion
                ? "Cerrando..."
                : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#a47f43]">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-black">
          Panel Estética Gold
        </h1>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
            ✓ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* PROFESIONALES */}
        <section className="mt-10 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-6">
          <h2 className="text-2xl font-black">
            Profesionales
          </h2>

          <p className="mt-2 text-sm text-[#8f7e72]">
            Administrá el equipo y asigná los tratamientos que realiza cada profesional.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={
                nuevoProfesional
              }
              onChange={(e) =>
                setNuevoProfesional(
                  e.target.value
                )
              }
              placeholder="Nueva profesional"
              className="flex-1 rounded-2xl border p-4"
            />

            <button
              type="button"
              onClick={
                agregarProfesional
              }
              disabled={
                agregandoProfesional
              }
              className="rounded-full bg-[#b58a45] px-6 py-3 font-black text-white"
            >
              + AGREGAR
            </button>
          </div>

          {cargandoAsignaciones && (
            <p className="mt-5">
              Cargando...
            </p>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {barberos.map(
              (profesional) => (
                <div
                  key={
                    profesional.id
                  }
                  className="rounded-3xl border bg-white p-5"
                >
                  <div className="flex justify-between gap-3">
                    <h3 className="text-xl font-black">
                      {
                        profesional.nombre
                      }
                    </h3>

                    <span className="text-xs font-black">
                      {profesional.activo
                        ? "ACTIVA"
                        : "INACTIVA"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {servicios.map(
                      (servicio) => {
                        const clave =
                          claveAsignacion(
                            profesional.id,
                            servicio.id
                          );

                        const activo =
                          asignaciones[
                            clave
                          ] ?? false;

                        return (
                          <button
                            key={
                              servicio.id
                            }
                            type="button"
                            onClick={() =>
                              cambiarAsignacion(
                                profesional,
                                servicio
                              )
                            }
                            disabled={
                              procesandoAsignacion ===
                              clave
                            }
                            className={`flex w-full justify-between rounded-2xl border p-3 text-left ${
                              activo
                                ? "border-[#b58a45] bg-[#f4ead9]"
                                : ""
                            }`}
                          >
                            <span>
                              {
                                servicio.nombre
                              }
                            </span>

                            <span>
                              {activo
                                ? "✓"
                                : ""}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarProfesional(
                        profesional
                      )
                    }
                    disabled={
                      procesandoProfesional ===
                      profesional.id
                    }
                    className="mt-4 w-full rounded-full bg-[#eee2d1] py-3 font-black"
                  >
                    {profesional.activo
                      ? "DESACTIVAR"
                      : "ACTIVAR"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      eliminarProfesional(
                        profesional
                      )
                    }
                    disabled={
                      procesandoProfesional ===
                      profesional.id
                    }
                    className="mt-3 w-full rounded-full border border-red-200 py-3 font-black text-red-700"
                  >
                    ELIMINAR
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* TRATAMIENTOS */}
        <section className="mt-8 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-6">
          <h2 className="text-2xl font-black">
            Tratamientos y precios
          </h2>

          <div className="mt-6 rounded-3xl bg-[#f7f2ea] p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={
                  nuevoTratamiento
                }
                onChange={(e) =>
                  setNuevoTratamiento(
                    e.target.value
                  )
                }
                placeholder="Tratamiento"
                className="rounded-2xl border bg-white p-4"
              />

              <input
                type="number"
                value={nuevoPrecio}
                onChange={(e) =>
                  setNuevoPrecio(
                    e.target.value
                  )
                }
                placeholder="Precio"
                className="rounded-2xl border bg-white p-4"
              />

              <input
                type="number"
                value={
                  nuevaDuracion
                }
                onChange={(e) =>
                  setNuevaDuracion(
                    e.target.value
                  )
                }
                placeholder="Duración"
                className="rounded-2xl border bg-white p-4"
              />
            </div>

            <button
              type="button"
              onClick={
                agregarTratamiento
              }
              disabled={
                agregandoTratamiento
              }
              className="mt-4 rounded-full bg-[#2d241f] px-7 py-4 font-black text-white"
            >
              + AGREGAR TRATAMIENTO
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {servicios.map(
              (servicio) => (
                <div
                  key={
                    servicio.id
                  }
                  className="rounded-3xl border bg-white p-5"
                >
                  <label className="text-xs font-black">
                    Nombre
                  </label>

                  <input
                    value={
                      nombresServicios[
                        servicio.id
                      ] ?? ""
                    }
                    onChange={(e) =>
                      setNombresServicios(
                        (actuales) => ({
                          ...actuales,
                          [servicio.id]:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="mt-2 w-full rounded-2xl border p-3"
                  />

                  <label className="mt-4 block text-xs font-black">
                    Precio
                  </label>

                  <input
                    type="number"
                    value={
                      precios[
                        servicio.id
                      ] ?? ""
                    }
                    onChange={(e) =>
                      setPrecios(
                        (actuales) => ({
                          ...actuales,
                          [servicio.id]:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="mt-2 w-full rounded-2xl border p-3"
                  />

                  <label className="mt-4 block text-xs font-black">
                    Duración
                  </label>

                  <input
                    type="number"
                    value={
                      duraciones[
                        servicio.id
                      ] ?? ""
                    }
                    onChange={(e) =>
                      setDuraciones(
                        (actuales) => ({
                          ...actuales,
                          [servicio.id]:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="mt-2 w-full rounded-2xl border p-3"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      guardarCambiosServicio(
                        servicio
                      )
                    }
                    disabled={
                      procesandoServicio ===
                      servicio.id
                    }
                    className="mt-4 w-full rounded-full bg-[#b58a45] py-3 font-black text-white"
                  >
                    GUARDAR CAMBIOS
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarServicio(
                        servicio
                      )
                    }
                    disabled={
                      procesandoServicio ===
                      servicio.id
                    }
                    className="mt-3 w-full rounded-full bg-[#eee2d1] py-3 font-black"
                  >
                    {servicio.activo
                      ? "DESACTIVAR"
                      : "ACTIVAR"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      eliminarTratamiento(
                        servicio
                      )
                    }
                    disabled={
                      procesandoServicio ===
                      servicio.id
                    }
                    className="mt-3 w-full rounded-full border border-red-200 py-3 font-black text-red-700"
                  >
                    ELIMINAR
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* HORARIOS */}
        <section className="mt-8 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-6">
          <h2 className="text-2xl font-black">
            Horarios de atención
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {horarios.map(
              (horario) => (
                <button
                  key={
                    horario.id
                  }
                  type="button"
                  onClick={() =>
                    cambiarHorario(
                      horario
                    )
                  }
                  disabled={
                    procesandoHorario ===
                    horario.id
                  }
                  className={`rounded-2xl border p-4 font-black ${
                    horario.activo
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {String(
                    horario.hora
                  ).slice(0, 5)}
                </button>
              )
            )}
          </div>
        </section>

        {/* TURNOS */}
        <section className="mt-12">
          <h2 className="text-3xl font-black">
            Agenda e historial
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Filtro
              nombre="Hoy"
              cantidad={
                cantidadHoy
              }
              activo={
                filtro === "hoy"
              }
              onClick={() =>
                setFiltro("hoy")
              }
            />

            <Filtro
              nombre="Próximos"
              cantidad={
                cantidadProximos
              }
              activo={
                filtro ===
                "proximos"
              }
              onClick={() =>
                setFiltro(
                  "proximos"
                )
              }
            />

            <Filtro
              nombre="Historial"
              cantidad={
                cantidadHistorial
              }
              activo={
                filtro ===
                "historial"
              }
              onClick={() =>
                setFiltro(
                  "historial"
                )
              }
            />

            <Filtro
              nombre="Cancelados"
              cantidad={
                cantidadCancelados
              }
              activo={
                filtro ===
                "cancelados"
              }
              onClick={() =>
                setFiltro(
                  "cancelados"
                )
              }
            />
          </div>

          <input
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            placeholder="Buscar cliente, teléfono o profesional..."
            className="mt-5 w-full rounded-2xl border bg-white p-4"
          />

          {turnosFiltrados.length ===
          0 ? (
            <div className="mt-6 rounded-3xl border bg-white p-8 text-center">
              No hay turnos para mostrar.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {turnosFiltrados.map(
                (turno) => (
                  <TurnoCard
                    key={turno.id}
                    turno={turno}
                    horarios={
                      horarios
                    }
                    actualizar={() =>
                      router.refresh()
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Filtro({
  nombre,
  cantidad,
  activo,
  onClick,
}: {
  nombre: string;
  cantidad: number;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${
        activo
          ? "bg-[#b58a45] text-white"
          : "bg-white"
      }`}
    >
      <span className="font-black">
        {nombre}
      </span>

      <span className="mt-1 block text-2xl font-black">
        {cantidad}
      </span>
    </button>
  );
}

function TurnoCard({
  turno,
  horarios,
  actualizar,
}: {
  turno: Turno;
  horarios: HorarioAdmin[];
  actualizar: () => void;
}) {
  const [
    fechaNueva,
    setFechaNueva,
  ] = useState(
    turno.fecha_propuesta ??
      turno.fecha
  );

  const [
    horaNueva,
    setHoraNueva,
  ] = useState(
    turno.hora_propuesta ??
      String(
        turno.hora
      ).slice(0, 5)
  );

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensajeLocal,
    setMensajeLocal,
  ] = useState("");

  const [
    cambioConfirmado,
    setCambioConfirmado,
  ] = useState<{
    fecha: string;
    hora: string;
  } | null>(null);

  const cancelado =
    turno.estado ===
    "cancelado";

  const horaActual =
    String(
      turno.hora
    ).slice(0, 5);

  const tienePropuesta =
    Boolean(
      turno.fecha_propuesta &&
        turno.hora_propuesta
    );

  const propuestaEnviada =
    Boolean(
      turno.propuesta_enviada_at
    );

  const horariosActivos =
    horarios
      .filter(
        (horario) =>
          horario.activo
      )
      .map((horario) =>
        String(
          horario.hora
        ).slice(0, 5)
      );

  const opcionesHorario =
    horariosActivos.includes(
      horaNueva
    )
      ? horariosActivos
      : [
          horaNueva,
          ...horariosActivos,
        ];

  async function proponerCambio() {
    setError("");
    setMensajeLocal("");

    if (
      fechaNueva ===
        turno.fecha &&
      horaNueva === horaActual
    ) {
      setError(
        "Elegí otra fecha u otro horario."
      );
      return;
    }

    const confirmar =
      window.confirm(
        `¿Preparar esta propuesta de cambio?\n\n` +
          `TURNO ACTUAL\n` +
          `${formatearFecha(
            turno.fecha
          )} - ${horaActual}\n\n` +
          `NUEVA PROPUESTA\n` +
          `${formatearFecha(
            fechaNueva
          )} - ${horaNueva}\n\n` +
          `El turno original todavía NO se va a modificar.`
      );

    if (!confirmar) {
      return;
    }

    setCargando(true);

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              accion:
                "proponer",
              fecha:
                fechaNueva,
              hora:
                horaNueva,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo preparar la propuesta."
        );
      }

      setMensajeLocal(
        "Propuesta preparada. El turno original todavía no cambió."
      );

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo preparar la propuesta."
      );
    } finally {
      setCargando(false);
    }
  }

  async function enviarPropuestaWhatsApp() {
    if (
      !turno.fecha_propuesta ||
      !turno.hora_propuesta
    ) {
      setError(
        "No hay una propuesta pendiente."
      );
      return;
    }

    const link =
      crearLinkWhatsApp(
        turno.telefono,
        mensajePropuesta(
          turno,
          turno.fecha_propuesta,
          turno.hora_propuesta
        )
      );

    if (!link) {
      setError(
        "El teléfono del cliente no es válido."
      );
      return;
    }

    /*
     * Abrimos WhatsApp directamente
     * desde el click para evitar que
     * el navegador lo bloquee.
     */
    window.open(
      link,
      "_blank"
    );

    setMensajeLocal(
      "WhatsApp abierto. Ahora esperá la respuesta del cliente."
    );

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              accion:
                "marcar_propuesta_enviada",
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo marcar la propuesta como enviada."
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "WhatsApp se abrió, pero no se pudo actualizar el estado."
      );
    }
  }

  async function confirmarCambio() {
    if (
      !turno.fecha_propuesta ||
      !turno.hora_propuesta
    ) {
      setError(
        "No hay una propuesta pendiente."
      );
      return;
    }

    if (
      !turno.propuesta_enviada_at
    ) {
      setError(
        "Primero enviá la propuesta al cliente por WhatsApp."
      );
      return;
    }

    const confirmar =
      window.confirm(
        `IMPORTANTE\n\n` +
          `Confirmá esto solamente si ${turno.nombre} respondió que SÍ por WhatsApp.\n\n` +
          `¿El cliente aceptó el nuevo turno del ${formatearFecha(
            turno.fecha_propuesta
          )} a las ${turno.hora_propuesta}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(true);
    setError("");
    setMensajeLocal("");

    const fechaConfirmada =
      turno.fecha_propuesta;

    const horaConfirmada =
      turno.hora_propuesta;

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              accion:
                "confirmar_propuesta",
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo confirmar el cambio."
        );
      }

      setCambioConfirmado({
        fecha:
          fechaConfirmada,
        hora:
          horaConfirmada,
      });

      setMensajeLocal(
        "Turno reprogramado correctamente. Ahora podés enviar la confirmación al cliente."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo confirmar el cambio."
      );
    } finally {
      setCargando(false);
    }
  }

  function enviarConfirmacionWhatsApp() {
    if (!cambioConfirmado) {
      return;
    }

    const link =
      crearLinkWhatsApp(
        turno.telefono,
        mensajeConfirmacion(
          turno,
          cambioConfirmado.fecha,
          cambioConfirmado.hora
        )
      );

    if (!link) {
      setError(
        "El teléfono del cliente no es válido."
      );
      return;
    }

    window.open(
      link,
      "_blank"
    );

    setMensajeLocal(
      "Confirmación preparada en WhatsApp."
    );

    setCambioConfirmado(
      null
    );

    actualizar();
  }

  async function cancelarPropuesta() {
    const confirmar =
      window.confirm(
        "¿Descartar esta propuesta? El turno original seguirá igual."
      );

    if (!confirmar) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              accion:
                "cancelar_propuesta",
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo descartar la propuesta."
        );
      }

      setMensajeLocal(
        "Propuesta descartada."
      );

      setFechaNueva(
        turno.fecha
      );

      setHoraNueva(
        horaActual
      );

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo descartar la propuesta."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cancelarTurno() {
    const confirmar =
      window.confirm(
        `¿Cancelar definitivamente el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              accion:
                "cancelar",
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo cancelar el turno."
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cancelar."
      );
    } finally {
      setCargando(false);
    }
  }

  async function borrarTurno() {
    const confirmar =
      window.confirm(
        `¿Borrar definitivamente el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta =
        await fetch(
          `/api/admin/turnos/${turno.id}`,
          {
            method: "DELETE",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo borrar."
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo borrar."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <article
      className={`rounded-[28px] border p-6 ${
        cancelado
          ? "border-red-200 bg-red-50"
          : "border-[#dfcfbb] bg-[#fffaf4]"
      }`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black">
              {turno.nombre}{" "}
              {turno.apellido}
            </h3>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                cancelado
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {turno.estado.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              ✨ Profesional:{" "}
              <strong>
                {
                  turno.barbero_nombre
                }
              </strong>
            </p>

            <p>
              ♡ Tratamiento:{" "}
              {turno.servicio}
            </p>

            <p>
              📱{" "}
              {turno.telefono}
            </p>

            <p>
              📅 Turno actual:{" "}
              <strong>
                {formatearFecha(
                  turno.fecha
                )}
              </strong>
            </p>

            <p>
              🕐 Horario:{" "}
              <strong>
                {horaActual}
              </strong>
            </p>
          </div>
        </div>

        {!cancelado &&
          !tienePropuesta &&
          !cambioConfirmado && (
            <div className="rounded-3xl border border-[#e3d5c4] bg-white p-5">
              <p className="font-black">
                Proponer otro horario
              </p>

              <p className="mt-1 text-xs text-[#8f7e72]">
                El turno no se modificará hasta que el cliente confirme.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={
                    fechaNueva
                  }
                  onChange={(e) =>
                    setFechaNueva(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border bg-white p-3"
                />

                <select
                  value={
                    horaNueva
                  }
                  onChange={(e) =>
                    setHoraNueva(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border bg-white p-3"
                >
                  {opcionesHorario.map(
                    (horario) => (
                      <option
                        key={
                          horario
                        }
                        value={
                          horario
                        }
                      >
                        {horario}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={
                  proponerCambio
                }
                disabled={
                  cargando
                }
                className="mt-4 w-full rounded-full bg-[#b58a45] py-3 font-black text-white disabled:opacity-50"
              >
                {cargando
                  ? "GUARDANDO..."
                  : "PROPONER CAMBIO"}
              </button>
            </div>
          )}
      </div>

      {!cancelado &&
        tienePropuesta &&
        !cambioConfirmado && (
          <div className="mt-6 rounded-3xl border-2 border-[#d7b36c] bg-[#fff8e9] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a47f43]">
              Cambio pendiente de confirmación
            </p>

            <h4 className="mt-2 text-xl font-black">
              Propuesta para el cliente
            </h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold text-[#8f7e72]">
                  TURNO ACTUAL
                </p>

                <p className="mt-2 font-black">
                  {formatearFecha(
                    turno.fecha
                  )}
                </p>

                <p className="font-black">
                  {horaActual}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f2e5c9] p-4">
                <p className="text-xs font-bold text-[#8b6b34]">
                  NUEVA PROPUESTA
                </p>

                <p className="mt-2 font-black">
                  {formatearFecha(
                    turno.fecha_propuesta!
                  )}
                </p>

                <p className="font-black">
                  {
                    turno.hora_propuesta
                  }
                </p>
              </div>
            </div>

            {!propuestaEnviada ? (
              <button
                type="button"
                onClick={
                  enviarPropuestaWhatsApp
                }
                className="mt-5 w-full rounded-full bg-[#25D366] py-4 font-black text-white"
              >
                💬 ENVIAR PROPUESTA POR WHATSAPP
              </button>
            ) : (
              <>
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                  ✓ Propuesta enviada por WhatsApp.
                  Esperá la respuesta del cliente antes de confirmar el cambio.
                </div>

                <button
                  type="button"
                  onClick={
                    enviarPropuestaWhatsApp
                  }
                  className="mt-3 w-full rounded-full border border-[#25D366] bg-white py-3 font-black text-[#128C7E]"
                >
                  💬 VOLVER A ABRIR WHATSAPP
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarCambio
                  }
                  disabled={
                    cargando
                  }
                  className="mt-3 w-full rounded-full bg-[#2d241f] py-4 font-black text-white disabled:opacity-50"
                >
                  {cargando
                    ? "CONFIRMANDO..."
                    : "✓ EL CLIENTE CONFIRMÓ — APLICAR CAMBIO"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={
                cancelarPropuesta
              }
              disabled={
                cargando
              }
              className="mt-3 w-full rounded-full border border-red-200 bg-white py-3 font-black text-red-700"
            >
              DESCARTAR PROPUESTA
            </button>
          </div>
        )}

      {cambioConfirmado && (
        <div className="mt-6 rounded-3xl border-2 border-green-300 bg-green-50 p-6">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-green-700">
            ✓ Cambio confirmado
          </p>

          <h4 className="mt-2 text-2xl font-black">
            El turno ya fue reprogramado
          </h4>

          <p className="mt-3">
            Nueva fecha:{" "}
            <strong>
              {formatearFecha(
                cambioConfirmado.fecha
              )}
            </strong>
          </p>

          <p>
            Nuevo horario:{" "}
            <strong>
              {
                cambioConfirmado.hora
              }
            </strong>
          </p>

          <button
            type="button"
            onClick={
              enviarConfirmacionWhatsApp
            }
            className="mt-5 w-full rounded-full bg-[#25D366] py-4 font-black text-white"
          >
            💬 ENVIAR CONFIRMACIÓN POR WHATSAPP
          </button>

          <button
            type="button"
            onClick={() => {
              setCambioConfirmado(
                null
              );
              actualizar();
            }}
            className="mt-3 w-full rounded-full border border-green-300 bg-white py-3 font-black text-green-700"
          >
            CERRAR SIN ENVIAR
          </button>
        </div>
      )}

      {!cancelado &&
        !cambioConfirmado && (
          <button
            type="button"
            onClick={
              cancelarTurno
            }
            disabled={
              cargando
            }
            className="mt-5 rounded-full bg-red-100 px-5 py-3 font-black text-red-700"
          >
            Cancelar turno
          </button>
        )}

      {cancelado && (
        <button
          type="button"
          onClick={
            borrarTurno
          }
          disabled={
            cargando
          }
          className="mt-5 rounded-full bg-red-600 px-5 py-3 font-black text-white"
        >
          Borrar definitivamente
        </button>
      )}

      {mensajeLocal && (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
          ✓ {mensajeLocal}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}
    </article>
  );
}