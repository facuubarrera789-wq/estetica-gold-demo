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

export default function AdminAgenda({
  turnos = [],
  servicios = [],
  horarios = [],
  barberos = [],
}: Props) {
  const router = useRouter();

  const [filtro, setFiltro] =
    useState<Filtro>("hoy");

  const [busqueda, setBusqueda] =
    useState("");

  const [precios, setPrecios] =
    useState<Record<number, string>>(
      () =>
        Object.fromEntries(
          servicios.map((servicio) => [
            servicio.id,
            String(
              servicio.precio ?? 0
            ),
          ])
        )
    );

  const [
    nombresServicios,
    setNombresServicios,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      servicios.map((servicio) => [
        servicio.id,
        servicio.nombre,
      ])
    )
  );

  const [
    duraciones,
    setDuraciones,
  ] = useState<
    Record<number, string>
  >(() =>
    Object.fromEntries(
      servicios.map((servicio) => [
        servicio.id,
        String(
          servicio.duracion_minutos ??
            60
        ),
      ])
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
  ] = useState<string | null>(
    null
  );

  const [
    procesandoServicio,
    setProcesandoServicio,
  ] = useState<number | null>(
    null
  );

  const [
    procesandoHorario,
    setProcesandoHorario,
  ] = useState<number | null>(
    null
  );

  const [
    procesandoProfesional,
    setProcesandoProfesional,
  ] = useState<number | null>(
    null
  );

  const [
    agregandoProfesional,
    setAgregandoProfesional,
  ] = useState(false);

  const [
    cerrandoSesion,
    setCerrandoSesion,
  ] = useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

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
              servicio.precio ?? 0
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
            "No se pudieron cargar los tratamientos de las profesionales"
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
          ] = asignacion.activo;
        }
      );

      setAsignaciones(mapa);
    } catch (err) {
      console.error(err);

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
    turnos.filter((turno) => {
      if (
        filtro === "hoy" &&
        !(
          turno.estado ===
            "confirmado" &&
          turno.fecha === hoy
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
    });

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
            "No se pudo actualizar el tratamiento"
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
          : "No se pudo actualizar la asignación"
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
      !Number.isInteger(precio) ||
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
            "No se pudo agregar el tratamiento"
        );
      }

      setNuevoTratamiento("");
      setNuevoPrecio("");
      setNuevaDuracion("60");

      setMensaje(
        `${resultado.servicio.nombre} agregado correctamente. Ahora podés asignárselo a las profesionales.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo agregar el tratamiento"
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
            "No se pudo actualizar el tratamiento"
        );
      }

      setPrecios(
        (actuales) => ({
          ...actuales,

          [id]: String(
            resultado.servicio
              .precio ?? 0
          ),
        })
      );

      setNombresServicios(
        (actuales) => ({
          ...actuales,

          [id]:
            resultado.servicio
              .nombre,
        })
      );

      setDuraciones(
        (actuales) => ({
          ...actuales,

          [id]: String(
            resultado.servicio
              .duracion_minutos ??
              60
          ),
        })
      );

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
        "El nombre del tratamiento no puede estar vacío."
      );

      return;
    }

    if (
      !Number.isInteger(precio) ||
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
        `¿Eliminar definitivamente el tratamiento "${servicio.nombre}"?`
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
            "No se pudo eliminar el tratamiento"
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
          : "No se pudo eliminar el tratamiento"
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
            "No se pudo actualizar el horario"
        );
      }

      setMensaje(
        `Horario ${String(
          resultado.horario.hora
        ).slice(
          0,
          5
        )} actualizado.`
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
            "No se pudo agregar la profesional"
        );
      }

      setNuevoProfesional("");

      setMensaje(
        `${resultado.barbero.nombre} agregada correctamente. Ahora podés asignarle sus tratamientos.`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo agregar la profesional"
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
            "No se pudo actualizar la profesional"
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
          : "No se pudo actualizar la profesional"
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
            "No se pudo eliminar la profesional"
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
          : "No se pudo eliminar la profesional"
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c6a66b] bg-[#2d241f] text-sm font-black tracking-widest text-[#e4c382]">
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
              className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-700 disabled:opacity-50"
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

        <p className="mt-3 max-w-2xl text-[#847469]">
          Administrá profesionales,
          tratamientos, precios,
          horarios y turnos desde un
          solo lugar.
        </p>

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
        <section className="mt-10 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
            Equipo
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Profesionales
          </h2>

          <p className="mt-2 text-sm text-[#8f7e72]">
            Administrá el equipo y
            elegí qué tratamientos
            realiza cada profesional.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={
                nuevoProfesional
              }
              onChange={(event) =>
                setNuevoProfesional(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  agregarProfesional();
                }
              }}
              placeholder="Nombre de la nueva profesional"
              className="flex-1 rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none transition focus:border-[#b58a45]"
            />

            <button
              type="button"
              onClick={
                agregarProfesional
              }
              disabled={
                agregandoProfesional
              }
              className="rounded-full bg-[#b58a45] px-6 py-4 font-black text-white disabled:opacity-50"
            >
              {agregandoProfesional
                ? "AGREGANDO..."
                : "+ AGREGAR PROFESIONAL"}
            </button>
          </div>

          {cargandoAsignaciones && (
            <div className="mt-6 rounded-2xl bg-[#f7f2ea] p-4 text-sm text-[#8f7e72]">
              Cargando tratamientos
              de las profesionales...
            </div>
          )}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {barberos.map(
              (profesional) => (
                <div
                  key={
                    profesional.id
                  }
                  className={`rounded-3xl border p-5 ${
                    profesional.activo
                      ? "border-green-200 bg-green-50/40"
                      : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efe3d2] text-2xl">
                        ♡
                      </div>

                      <p className="mt-3 text-xl font-black">
                        {
                          profesional.nombre
                        }
                      </p>
                    </div>

                    <span
                      className={
                        profesional.activo
                          ? "text-xs font-black text-green-700"
                          : "text-xs font-black text-red-700"
                      }
                    >
                      {profesional.activo
                        ? "ACTIVA"
                        : "INACTIVA"}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#e5d8c8] bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a47f43]">
                      Tratamientos que realiza
                    </p>

                    <div className="mt-4 space-y-3">
                      {servicios.map(
                        (servicio) => {
                          const clave =
                            claveAsignacion(
                              profesional.id,
                              servicio.id
                            );

                          const asignado =
                            asignaciones[
                              clave
                            ] ??
                            false;

                          const procesando =
                            procesandoAsignacion ===
                            clave;

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
                                procesando
                              }
                              className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${
                                asignado
                                  ? "border-[#c8a76d] bg-[#f4ead9]"
                                  : "border-[#eadfd2] bg-[#faf7f2]"
                              }`}
                            >
                              <div>
                                <p className="text-sm font-bold">
                                  {
                                    servicio.nombre
                                  }
                                </p>

                                {!servicio.activo && (
                                  <p className="mt-1 text-[10px] font-bold text-red-600">
                                    TRATAMIENTO
                                    INACTIVO
                                  </p>
                                )}
                              </div>

                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-black ${
                                  asignado
                                    ? "border-[#b58a45] bg-[#b58a45] text-white"
                                    : "border-[#d7c9b8] bg-white text-transparent"
                                }`}
                              >
                                ✓
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
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
                    className={`mt-5 w-full rounded-full py-3 font-black disabled:opacity-50 ${
                      profesional.activo
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {procesandoProfesional ===
                    profesional.id
                      ? "GUARDANDO..."
                      : profesional.activo
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
                    className="mt-3 w-full rounded-full border border-red-200 bg-white py-3 font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    ELIMINAR
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* TRATAMIENTOS */}
        <section className="mt-8 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
            Servicios
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Tratamientos y precios
          </h2>

          <p className="mt-2 text-sm text-[#8f7e72]">
            Agregá nuevos tratamientos,
            editá nombre, precio y
            duración, o eliminá los que
            ya no uses.
          </p>

          {/* NUEVO TRATAMIENTO */}
          <div className="mt-6 rounded-3xl border border-[#dac5a7] bg-[#f7f2ea] p-5">
            <p className="font-black">
              Agregar nuevo tratamiento
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={
                  nuevoTratamiento
                }
                onChange={(event) =>
                  setNuevoTratamiento(
                    event.target.value
                  )
                }
                placeholder="Ej: Manicura"
                className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none focus:border-[#b58a45]"
              />

              <input
                type="number"
                min="0"
                value={nuevoPrecio}
                onChange={(event) =>
                  setNuevoPrecio(
                    event.target.value
                  )
                }
                placeholder="Precio"
                className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none focus:border-[#b58a45]"
              />

              <input
                type="number"
                min="1"
                value={
                  nuevaDuracion
                }
                onChange={(event) =>
                  setNuevaDuracion(
                    event.target.value
                  )
                }
                placeholder="Duración en minutos"
                className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none focus:border-[#b58a45]"
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
              className="mt-4 rounded-full bg-[#2d241f] px-7 py-4 font-black text-white disabled:opacity-50"
            >
              {agregandoTratamiento
                ? "AGREGANDO..."
                : "+ AGREGAR TRATAMIENTO"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {servicios.map(
              (servicio) => (
                <div
                  key={
                    servicio.id
                  }
                  className="rounded-3xl border border-[#e6d9ca] bg-white p-5"
                >
                  <div className="flex justify-between gap-3">
                    <div className="text-2xl">
                      ✨
                    </div>

                    <span
                      className={
                        servicio.activo
                          ? "text-xs font-black text-green-700"
                          : "text-xs font-black text-red-700"
                      }
                    >
                      {servicio.activo
                        ? "ACTIVO"
                        : "INACTIVO"}
                    </span>
                  </div>

                  <label className="mt-5 block text-xs font-black uppercase tracking-widest text-[#99877a]">
                    Nombre
                  </label>

                  <input
                    value={
                      nombresServicios[
                        servicio.id
                      ] ?? ""
                    }
                    onChange={(
                      event
                    ) =>
                      setNombresServicios(
                        (
                          actuales
                        ) => ({
                          ...actuales,

                          [servicio.id]:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-[#e4d6c6] bg-[#f7f2ea] p-3 outline-none focus:border-[#b58a45]"
                  />

                  <label className="mt-4 block text-xs font-black uppercase tracking-widest text-[#99877a]">
                    Precio
                  </label>

                  <div className="mt-2 flex items-center rounded-2xl border border-[#e4d6c6] bg-[#f7f2ea] px-4">
                    <span className="font-black text-[#a47f43]">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={
                        precios[
                          servicio.id
                        ] ?? ""
                      }
                      onChange={(
                        event
                      ) =>
                        setPrecios(
                          (
                            actuales
                          ) => ({
                            ...actuales,

                            [servicio.id]:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full bg-transparent p-3 outline-none"
                    />
                  </div>

                  <label className="mt-4 block text-xs font-black uppercase tracking-widest text-[#99877a]">
                    Duración
                  </label>

                  <div className="mt-2 flex items-center rounded-2xl border border-[#e4d6c6] bg-[#f7f2ea] px-4">
                    <input
                      type="number"
                      min="1"
                      value={
                        duraciones[
                          servicio.id
                        ] ?? ""
                      }
                      onChange={(
                        event
                      ) =>
                        setDuraciones(
                          (
                            actuales
                          ) => ({
                            ...actuales,

                            [servicio.id]:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full bg-transparent p-3 outline-none"
                    />

                    <span className="text-sm font-bold text-[#8f7e72]">
                      min
                    </span>
                  </div>

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
                    className="mt-5 w-full rounded-full bg-[#b58a45] py-3 font-black text-white disabled:opacity-50"
                  >
                    {procesandoServicio ===
                    servicio.id
                      ? "GUARDANDO..."
                      : "GUARDAR CAMBIOS"}
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
                    className={`mt-3 w-full rounded-full py-3 font-black disabled:opacity-50 ${
                      servicio.activo
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
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
                    className="mt-3 w-full rounded-full border border-red-200 bg-white py-3 font-black text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    ELIMINAR
                  </button>
                </div>
              )
            )}
          </div>
        </section>

        {/* HORARIOS */}
        <section className="mt-8 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
            Agenda
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Horarios de atención
          </h2>

          <p className="mt-2 text-sm text-[#8f7e72]">
            Tocá un horario para
            activarlo o desactivarlo.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
                  className={`rounded-2xl border p-4 text-center disabled:opacity-50 ${
                    horario.activo
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <span className="block text-xl font-black">
                    {
                      horario.hora
                    }
                  </span>

                  <span className="mt-1 block text-[10px] font-black">
                    {horario.activo
                      ? "ACTIVO"
                      : "INACTIVO"}
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        {/* TURNOS */}
        <section className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
            Turnos
          </p>

          <h2 className="mt-2 text-3xl font-black">
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
            onChange={(event) =>
              setBusqueda(
                event.target.value
              )
            }
            placeholder="Buscar cliente, teléfono o profesional..."
            className="mt-5 w-full rounded-2xl border border-[#dfcfbb] bg-white p-4 outline-none focus:border-[#b58a45]"
          />

          <p className="mt-5 text-sm text-[#8f7e72]">
            {
              turnosFiltrados.length
            }{" "}
            turnos encontrados
          </p>

          {turnosFiltrados.length ===
          0 ? (
            <div className="mt-6 rounded-[32px] border border-[#dfcfbb] bg-[#fffaf4] p-10 text-center">
              <p className="text-4xl">
                ✨
              </p>

              <p className="mt-4 font-black">
                No hay turnos para
                mostrar.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {turnosFiltrados.map(
                (turno) => (
                  <TurnoCard
                    key={
                      turno.id
                    }
                    turno={
                      turno
                    }
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
          ? "border-[#b58a45] bg-[#b58a45] text-white"
          : "border-[#dfcfbb] bg-[#fffaf4]"
      }`}
    >
      <span className="block text-sm font-black">
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
  horarios = [],
  actualizar,
}: {
  turno: Turno;
  horarios?: HorarioAdmin[];
  actualizar: () => void;
}) {
  const [
    fechaNueva,
    setFechaNueva,
  ] = useState(
    turno.fecha
  );

  const [
    horaNueva,
    setHoraNueva,
  ] = useState(
    String(
      turno.hora
    ).slice(0, 5)
  );

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const cancelado =
    turno.estado ===
    "cancelado";

  const horaActual = String(
    turno.hora
  ).slice(0, 5);

  const horariosActivos =
    horarios
      .filter(
        (horario) =>
          horario.activo
      )
      .map(
        (horario) =>
          String(
            horario.hora
          ).slice(0, 5)
      );

  const opcionesHorario =
    horariosActivos.includes(
      horaActual
    )
      ? horariosActivos
      : [
          horaActual,
          ...horariosActivos,
        ];

  async function enviarCambio(
    cambios: Record<
      string,
      string
    >
  ) {
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

            body: JSON.stringify(
              cambios
            ),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo realizar el cambio"
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
      );
    } finally {
      setCargando(false);
    }
  }

  async function moverTurno() {
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

    await enviarCambio({
      accion: "mover",
      fecha: fechaNueva,
      hora: horaNueva,
    });
  }

  async function cancelarTurno() {
    const confirmar =
      window.confirm(
        `¿Cancelar el turno de ${turno.nombre} ${turno.apellido}?`
      );

    if (!confirmar) {
      return;
    }

    await enviarCambio({
      accion: "cancelar",
    });
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
            "No se pudo borrar el turno"
        );
      }

      actualizar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error"
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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black">
              {turno.nombre}{" "}
              {turno.apellido}
            </h3>

            <span
              className={
                cancelado
                  ? "text-xs font-black text-red-700"
                  : "text-xs font-black text-green-700"
              }
            >
              {turno.estado.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-[#806f64]">
            <p>
              ✨ Profesional:{" "}
              <strong className="text-[#a47f43]">
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
              💳{" "}
              {
                turno.forma_pago
              }
            </p>

            <p>
              💰 $
              {turno.precio.toLocaleString(
                "es-AR"
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={fechaNueva}
            disabled={cancelado}
            onChange={(event) =>
              setFechaNueva(
                event.target.value
              )
            }
            className="rounded-2xl border border-[#e4d6c6] bg-white p-3 disabled:opacity-40"
          />

          <select
            value={horaNueva}
            disabled={cancelado}
            onChange={(event) =>
              setHoraNueva(
                event.target.value
              )
            }
            className="rounded-2xl border border-[#e4d6c6] bg-white p-3 disabled:opacity-40"
          >
            {opcionesHorario.map(
              (horario) => (
                <option
                  key={horario}
                  value={horario}
                >
                  {horario}
                </option>
              )
            )}
          </select>
        </div>

        {!cancelado ? (
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <button
              type="button"
              onClick={
                moverTurno
              }
              disabled={
                cargando
              }
              className="rounded-full bg-[#b58a45] px-5 py-3 font-black text-white disabled:opacity-50"
            >
              {cargando
                ? "Procesando..."
                : "Mover"}
            </button>

            <button
              type="button"
              onClick={
                cancelarTurno
              }
              disabled={
                cargando
              }
              className="rounded-full bg-red-100 px-5 py-3 font-black text-red-700 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={
              borrarTurno
            }
            disabled={
              cargando
            }
            className="rounded-full bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50"
          >
            {cargando
              ? "Borrando..."
              : "Borrar definitivamente"}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-2xl bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}
    </article>
  );
}