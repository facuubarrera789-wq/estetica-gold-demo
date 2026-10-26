"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Servicio = {
  id: number;
  nombre: string;
  precio: number;
  duracion_minutos: number;
  activo: boolean;
};

type Profesional = {
  id: number;
  nombre: string;
  activo: boolean;
};

type Dia = {
  valor: string;
  nombre: string;
  numero: string;
  mes: string;
};

type Confirmacion = {
  nombre: string;
  apellido: string;
  servicio: string;
  profesional: string;
  fecha: string;
  hora: string;
  formaPago: string;
  precio: number;
};

function crearDias(): Dia[] {
  const resultado: Dia[] = [];

  for (let i = 0; i < 7; i++) {
    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() + i
    );

    const año =
      fecha.getFullYear();

    const mesNumero = String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      fecha.getDate()
    ).padStart(2, "0");

    const valor =
      `${año}-${mesNumero}-${dia}`;

    const nombre = fecha
      .toLocaleDateString(
        "es-AR",
        {
          weekday: "short",
        }
      )
      .replace(".", "")
      .toUpperCase();

    const mes = fecha
      .toLocaleDateString(
        "es-AR",
        {
          month: "short",
        }
      )
      .replace(".", "")
      .toUpperCase();

    resultado.push({
      valor,
      nombre,
      numero: dia,
      mes,
    });
  }

  return resultado;
}

export default function Home() {
  const dias = useMemo(
    () => crearDias(),
    []
  );

  const [
    servicios,
    setServicios,
  ] = useState<Servicio[]>([]);

  const [
    profesionales,
    setProfesionales,
  ] = useState<Profesional[]>([]);

  const [
    horarios,
    setHorarios,
  ] = useState<string[]>([]);

  const [
    servicioSeleccionado,
    setServicioSeleccionado,
  ] = useState<number | null>(
    null
  );

  const [
    profesionalSeleccionado,
    setProfesionalSeleccionado,
  ] = useState<number | null>(
    null
  );

  const [
    fecha,
    setFecha,
  ] = useState("");

  const [
    hora,
    setHora,
  ] = useState("");

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    apellido,
    setApellido,
  ] = useState("");

  const [
    telefono,
    setTelefono,
  ] = useState("");

  const [
    formaPago,
    setFormaPago,
  ] = useState("");

  const [
    ocupados,
    setOcupados,
  ] = useState<string[]>([]);

  const [
    cargandoServicios,
    setCargandoServicios,
  ] = useState(true);

  const [
    cargandoProfesionales,
    setCargandoProfesionales,
  ] = useState(false);

  const [
    cargandoHorarios,
    setCargandoHorarios,
  ] = useState(true);

  const [
    cargandoOcupados,
    setCargandoOcupados,
  ] = useState(false);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    confirmacion,
    setConfirmacion,
  ] =
    useState<Confirmacion | null>(
      null
    );

  const servicioActual =
    servicios.find(
      (servicio) =>
        servicio.id ===
        servicioSeleccionado
    ) ?? null;

  const profesionalActual =
    profesionales.find(
      (profesional) =>
        profesional.id ===
        profesionalSeleccionado
    ) ?? null;

  async function cargarServicios() {
    setCargandoServicios(true);

    try {
      const respuesta =
        await fetch(
          "/api/servicios",
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar los servicios"
        );
      }

      setServicios(
        resultado.servicios ?? []
      );
    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron cargar los servicios."
      );
    } finally {
      setCargandoServicios(
        false
      );
    }
  }

  async function cargarProfesionales(
    servicioId: number
  ) {
    setCargandoProfesionales(
      true
    );

    setProfesionales([]);

    try {
      const respuesta =
        await fetch(
          `/api/barberos?servicioId=${servicioId}`,
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar los profesionales"
        );
      }

      setProfesionales(
        resultado.barberos ?? []
      );
    } catch (err) {
      console.error(err);

      setProfesionales([]);

      setError(
        "No se pudieron cargar los profesionales."
      );
    } finally {
      setCargandoProfesionales(
        false
      );
    }
  }

  async function cargarHorarios() {
    setCargandoHorarios(true);

    try {
      const respuesta =
        await fetch(
          "/api/horarios",
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron cargar los horarios"
        );
      }

      const nuevosHorarios:
        string[] =
        (
          resultado.horarios ??
          []
        ).map(
          (horario: {
            hora: string;
          }) =>
            String(
              horario.hora
            ).slice(0, 5)
        );

      setHorarios(
        nuevosHorarios
      );
    } catch (err) {
      console.error(err);

      setHorarios([]);
    } finally {
      setCargandoHorarios(
        false
      );
    }
  }

  async function cargarOcupados(
    fechaElegida: string,
    profesionalId: number
  ) {
    if (
      !fechaElegida ||
      !profesionalId
    ) {
      setOcupados([]);
      return;
    }

    setCargandoOcupados(true);

    try {
      const respuesta =
        await fetch(
          `/api/turnos?fecha=${encodeURIComponent(
            fechaElegida
          )}&barberoId=${profesionalId}`,
          {
            cache: "no-store",
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudieron consultar los horarios"
        );
      }

      const nuevosOcupados =
        resultado.ocupados ?? [];

      setOcupados(
        nuevosOcupados
      );

      setHora(
        (horaActual) =>
          nuevosOcupados.includes(
            horaActual
          )
            ? ""
            : horaActual
      );
    } catch (err) {
      console.error(err);

      setError(
        "No se pudieron consultar los horarios."
      );
    } finally {
      setCargandoOcupados(
        false
      );
    }
  }

  useEffect(() => {
    cargarServicios();
    cargarHorarios();
  }, []);

  useEffect(() => {
    if (
      !servicioSeleccionado
    ) {
      setProfesionales([]);
      setProfesionalSeleccionado(
        null
      );
      return;
    }

    cargarProfesionales(
      servicioSeleccionado
    );
  }, [
    servicioSeleccionado,
  ]);

  useEffect(() => {
    setHora("");
    setError("");

    if (
      !fecha ||
      !profesionalSeleccionado
    ) {
      setOcupados([]);
      return;
    }

    cargarOcupados(
      fecha,
      profesionalSeleccionado
    );
  }, [
    fecha,
    profesionalSeleccionado,
  ]);

  function seleccionarServicio(
    servicio: Servicio
  ) {
    const mismoServicio =
      servicioSeleccionado ===
      servicio.id;

    if (mismoServicio) {
      setServicioSeleccionado(
        null
      );

      setProfesionales([]);
    } else {
      setServicioSeleccionado(
        servicio.id
      );
    }

    setProfesionalSeleccionado(
      null
    );

    setFecha("");
    setHora("");
    setOcupados([]);
    setError("");
  }

  function seleccionarProfesional(
    profesional: Profesional
  ) {
    setProfesionalSeleccionado(
      (actual) =>
        actual === profesional.id
          ? null
          : profesional.id
    );

    setFecha("");
    setHora("");
    setOcupados([]);
    setError("");
  }

  function seleccionarFecha(
    valor: string
  ) {
    setFecha(
      (actual) =>
        actual === valor
          ? ""
          : valor
    );
  }

  function seleccionarHora(
    valor: string
  ) {
    if (
      ocupados.includes(valor)
    ) {
      return;
    }

    setHora(
      (actual) =>
        actual === valor
          ? ""
          : valor
    );
  }

  async function confirmarTurno(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (!servicioActual) {
      setError(
        "Elegí un tratamiento."
      );
      return;
    }

    if (!profesionalActual) {
      setError(
        "Elegí una profesional."
      );
      return;
    }

    if (!fecha) {
      setError(
        "Elegí una fecha."
      );
      return;
    }

    if (!hora) {
      setError(
        "Elegí un horario."
      );
      return;
    }

    if (!nombre.trim()) {
      setError(
        "Ingresá tu nombre."
      );
      return;
    }

    if (!apellido.trim()) {
      setError(
        "Ingresá tu apellido."
      );
      return;
    }

    if (!telefono.trim()) {
      setError(
        "Ingresá tu teléfono."
      );
      return;
    }

    if (!formaPago) {
      setError(
        "Elegí una forma de pago."
      );
      return;
    }

    setEnviando(true);

    try {
      const respuesta =
        await fetch(
          "/api/turnos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nombre:
                nombre.trim(),

              apellido:
                apellido.trim(),

              telefono:
                telefono.trim(),

              servicioId:
                servicioActual.id,

              barberoId:
                profesionalActual.id,

              fecha,

              hora,

              formaPago,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        if (
          respuesta.status ===
          409
        ) {
          setHora("");

          await cargarOcupados(
            fecha,
            profesionalActual.id
          );
        }

        throw new Error(
          resultado.error ||
            "No se pudo reservar el turno"
        );
      }

      setConfirmacion({
        nombre:
          nombre.trim(),

        apellido:
          apellido.trim(),

        servicio:
          servicioActual.nombre,

        profesional:
          profesionalActual.nombre,

        fecha,

        hora,

        formaPago,

        precio:
          servicioActual.precio,
      });

      setNombre("");
      setApellido("");
      setTelefono("");
      setFormaPago("");

      setServicioSeleccionado(
        null
      );

      setProfesionalSeleccionado(
        null
      );

      setProfesionales([]);
      setFecha("");
      setHora("");
      setOcupados([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo reservar el turno."
      );
    } finally {
      setEnviando(false);
    }
  }

  function nuevaReserva() {
    setConfirmacion(null);

    setServicioSeleccionado(
      null
    );

    setProfesionalSeleccionado(
      null
    );

    setProfesionales([]);
    setFecha("");
    setHora("");
    setNombre("");
    setApellido("");
    setTelefono("");
    setFormaPago("");
    setOcupados([]);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f7f2ea] text-[#2d241f]">
      <header className="border-b border-[#d9c9b6] bg-[#fffaf4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c6a66b] bg-[#2d241f] text-lg font-black tracking-widest text-[#e4c382]">
              EG
            </div>

            <div>
              <p className="text-lg font-black tracking-[0.18em] text-[#2d241f]">
                ESTÉTICA GOLD
              </p>

              <p className="text-xs uppercase tracking-[0.25em] text-[#9a7b55]">
                Beauty Studio
              </p>
            </div>
          </div>

          <a
            href="#reservar"
            className="rounded-full bg-[#2d241f] px-6 py-3 text-sm font-bold text-[#fffaf4] transition hover:bg-[#4a382d]"
          >
            RESERVAR
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#e1d5c7]">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#e5c88f]/25 blur-3xl" />

        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#d9bda5]/30 blur-3xl" />

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#a47f43]">
              Belleza · Cuidado · Bienestar
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
              TU MOMENTO
              <br />

              <span className="font-serif italic text-[#b58a45]">
                es ahora.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#76675d]">
              Reservá tu tratamiento
              de manera simple,
              elegí tu profesional y
              encontrá el horario
              ideal para vos.
            </p>

            <a
              href="#reservar"
              className="mt-9 inline-flex rounded-full bg-[#b58a45] px-8 py-4 font-black text-white transition hover:bg-[#9d7639]"
            >
              AGENDAR TURNO →
            </a>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative flex aspect-square w-full max-w-md items-center justify-center rounded-[40%_60%_55%_45%] border border-[#d6bd92] bg-[#efe1cd] shadow-2xl shadow-[#b58a45]/10">
              <div className="text-center">
                <p className="font-serif text-8xl italic text-[#b58a45]">
                  EG
                </p>

                <div className="mx-auto mt-5 h-px w-24 bg-[#b58a45]" />

                <p className="mt-5 text-sm font-bold uppercase tracking-[0.35em] text-[#76604b]">
                  Estética Gold
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="reservar"
        className="mx-auto max-w-7xl px-5 py-20"
      >
        {confirmacion ? (
          <div className="mx-auto max-w-2xl rounded-[36px] border border-[#d8c4a1] bg-[#fffaf4] p-8 text-center shadow-xl shadow-[#6b4a2e]/5 md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e7dccb] text-4xl text-[#9b783f]">
              ✓
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-[0.3em] text-[#a47f43]">
              Turno confirmado
            </p>

            <h2 className="mt-3 text-4xl font-black">
              ¡Te esperamos!
            </h2>

            <p className="mt-4 text-[#827267]">
              Tu reserva quedó
              registrada correctamente.
            </p>

            <div className="mt-8 rounded-3xl border border-[#e5d9cb] bg-[#f7f2ea] p-6 text-left">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                    Cliente
                  </p>

                  <p className="mt-1 font-black">
                    {confirmacion.nombre}{" "}
                    {confirmacion.apellido}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                    Tratamiento
                  </p>

                  <p className="mt-1 font-black">
                    {confirmacion.servicio}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                    Profesional
                  </p>

                  <p className="mt-1 font-black text-[#a47f43]">
                    ✨{" "}
                    {confirmacion.profesional}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                      Fecha
                    </p>

                    <p className="mt-1 font-black">
                      {confirmacion.fecha}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                      Horario
                    </p>

                    <p className="mt-1 font-black">
                      {confirmacion.hora}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                      Forma de pago
                    </p>

                    <p className="mt-1 font-black">
                      {confirmacion.formaPago}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#a08d7e]">
                      Total
                    </p>

                    <p className="mt-1 font-black text-[#a47f43]">
                      $
                      {confirmacion.precio.toLocaleString(
                        "es-AR"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={
                nuevaReserva
              }
              className="mt-8 w-full rounded-full bg-[#2d241f] py-4 font-black text-white transition hover:bg-[#4a382d]"
            >
              AGENDAR OTRO TURNO
            </button>
          </div>
        ) : (
          <>
            <div className="mb-12 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#a47f43]">
                Reservas online
              </p>

              <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                Elegí tu momento
              </h2>

              <p className="mx-auto mt-4 max-w-xl leading-7 text-[#827267]">
                Seleccioná el
                tratamiento, profesional,
                día y horario que más
                te convenga.
              </p>
            </div>

            <section className="rounded-[32px] border border-[#e0d2c0] bg-[#fffaf4] p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b58a45] font-black text-white">
                  1
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
                    Tratamientos
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    ¿Qué querés realizarte?
                  </h3>
                </div>
              </div>

              {cargandoServicios ? (
                <p className="mt-7 text-[#8c7c70]">
                  Cargando tratamientos...
                </p>
              ) : (
                <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {servicios.map(
                    (servicio) => {
                      const seleccionado =
                        servicioSeleccionado ===
                        servicio.id;

                      return (
                        <button
                          key={
                            servicio.id
                          }
                          type="button"
                          onClick={() =>
                            seleccionarServicio(
                              servicio
                            )
                          }
                          className={`rounded-3xl border p-5 text-left transition ${
                            seleccionado
                              ? "border-[#b58a45] bg-[#f2e7d3] shadow-md"
                              : "border-[#e8ddd0] bg-white hover:border-[#c7a66d]"
                          }`}
                        >
                          <span className="text-3xl">
                            ✨
                          </span>

                          <h4 className="mt-5 text-lg font-black">
                            {
                              servicio.nombre
                            }
                          </h4>

                          <p className="mt-2 text-sm text-[#958377]">
                            {
                              servicio.duracion_minutos
                            }{" "}
                            minutos
                          </p>

                          <p className="mt-5 text-xl font-black text-[#a47f43]">
                            $
                            {servicio.precio.toLocaleString(
                              "es-AR"
                            )}
                          </p>

                          {seleccionado && (
                            <p className="mt-3 text-xs font-black text-[#a47f43]">
                              SELECCIONADO
                            </p>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-[32px] border border-[#e0d2c0] bg-[#fffaf4] p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b58a45] font-black text-white">
                  2
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
                    Equipo
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Elegí tu profesional
                  </h3>
                </div>
              </div>

              {!servicioActual ? (
                <div className="mt-7 rounded-2xl bg-[#f7f2ea] p-5 text-[#958377]">
                  Primero elegí un
                  tratamiento.
                </div>
              ) : cargandoProfesionales ? (
                <div className="mt-7 rounded-2xl bg-[#f7f2ea] p-5 text-[#958377]">
                  Buscando profesionales
                  para este tratamiento...
                </div>
              ) : profesionales.length ===
                0 ? (
                <div className="mt-7 rounded-2xl bg-[#f7f2ea] p-5 text-[#958377]">
                  No hay profesionales
                  disponibles para este
                  tratamiento.
                </div>
              ) : (
                <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profesionales.map(
                    (profesional) => {
                      const seleccionado =
                        profesionalSeleccionado ===
                        profesional.id;

                      return (
                        <button
                          key={
                            profesional.id
                          }
                          type="button"
                          onClick={() =>
                            seleccionarProfesional(
                              profesional
                            )
                          }
                          className={`rounded-3xl border p-6 text-left transition ${
                            seleccionado
                              ? "border-[#b58a45] bg-[#f2e7d3]"
                              : "border-[#e8ddd0] bg-white hover:border-[#c7a66d]"
                          }`}
                        >
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efe3d2] text-2xl">
                            ♡
                          </div>

                          <p className="mt-5 text-xl font-black">
                            {
                              profesional.nombre
                            }
                          </p>

                          <p className="mt-2 text-sm text-[#958377]">
                            Especialista en el
                            tratamiento elegido
                          </p>

                          {seleccionado && (
                            <p className="mt-3 text-xs font-black text-[#a47f43]">
                              SELECCIONADA
                            </p>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-[32px] border border-[#e0d2c0] bg-[#fffaf4] p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b58a45] font-black text-white">
                  3
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
                    Fecha
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Elegí el día
                  </h3>
                </div>
              </div>

              {!profesionalActual ? (
                <div className="mt-7 rounded-2xl bg-[#f7f2ea] p-5 text-[#958377]">
                  Primero elegí una
                  profesional.
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {dias.map(
                    (dia) => {
                      const seleccionado =
                        fecha ===
                        dia.valor;

                      return (
                        <button
                          key={
                            dia.valor
                          }
                          type="button"
                          onClick={() =>
                            seleccionarFecha(
                              dia.valor
                            )
                          }
                          className={`rounded-2xl border p-4 text-center transition ${
                            seleccionado
                              ? "border-[#b58a45] bg-[#b58a45] text-white"
                              : "border-[#e8ddd0] bg-white hover:border-[#c7a66d]"
                          }`}
                        >
                          <span className="block text-xs font-black">
                            {dia.nombre}
                          </span>

                          <span className="mt-2 block text-2xl font-black">
                            {dia.numero}
                          </span>

                          <span className="mt-1 block text-[10px] font-bold">
                            {dia.mes}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <section className="mt-8 rounded-[32px] border border-[#e0d2c0] bg-[#fffaf4] p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b58a45] font-black text-white">
                  4
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
                    Horario
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Elegí la hora
                  </h3>
                </div>
              </div>

              {!fecha ? (
                <div className="mt-7 rounded-2xl bg-[#f7f2ea] p-5 text-[#958377]">
                  Primero elegí un día.
                </div>
              ) : cargandoHorarios ||
                cargandoOcupados ? (
                <div className="mt-7 rounded-2xl bg-[#f7f2ea] p-5 text-[#958377]">
                  Consultando horarios...
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {horarios.map(
                    (horario) => {
                      const ocupado =
                        ocupados.includes(
                          horario
                        );

                      const seleccionado =
                        hora ===
                        horario;

                      return (
                        <button
                          key={
                            horario
                          }
                          type="button"
                          disabled={
                            ocupado
                          }
                          onClick={() =>
                            seleccionarHora(
                              horario
                            )
                          }
                          className={`rounded-2xl border p-4 font-black transition ${
                            ocupado
                              ? "cursor-not-allowed border-[#eadfd3] bg-[#eee8e1] text-[#b9aaa0]"
                              : seleccionado
                                ? "border-[#b58a45] bg-[#b58a45] text-white"
                                : "border-[#e8ddd0] bg-white hover:border-[#c7a66d]"
                          }`}
                        >
                          {horario}

                          {ocupado && (
                            <span className="mt-1 block text-[9px]">
                              OCUPADO
                            </span>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>

            <form
              onSubmit={
                confirmarTurno
              }
              className="mt-8 rounded-[32px] border border-[#e0d2c0] bg-[#fffaf4] p-6 shadow-sm md:p-8"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b58a45] font-black text-white">
                  5
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#a47f43]">
                    Tus datos
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Confirmá tu reserva
                  </h3>
                </div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <input
                  value={nombre}
                  onChange={(e) =>
                    setNombre(
                      e.target.value
                    )
                  }
                  placeholder="Nombre"
                  className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none transition focus:border-[#b58a45]"
                />

                <input
                  value={apellido}
                  onChange={(e) =>
                    setApellido(
                      e.target.value
                    )
                  }
                  placeholder="Apellido"
                  className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none transition focus:border-[#b58a45]"
                />

                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(
                      e.target.value
                    )
                  }
                  placeholder="Teléfono"
                  className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none transition focus:border-[#b58a45]"
                />

                <select
                  value={formaPago}
                  onChange={(e) =>
                    setFormaPago(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-[#e4d6c6] bg-white p-4 outline-none transition focus:border-[#b58a45]"
                >
                  <option value="">
                    Forma de pago
                  </option>

                  <option value="Efectivo">
                    Efectivo
                  </option>

                  <option value="Transferencia">
                    Transferencia
                  </option>

                  <option value="Tarjeta">
                    Tarjeta
                  </option>
                </select>
              </div>

              <div className="mt-7 rounded-3xl bg-[#f7f2ea] p-6">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#a47f43]">
                  Resumen
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <p className="text-xs text-[#9a897d]">
                      Tratamiento
                    </p>

                    <p className="mt-1 font-black">
                      {servicioActual?.nombre ??
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#9a897d]">
                      Profesional
                    </p>

                    <p className="mt-1 font-black">
                      {profesionalActual?.nombre ??
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#9a897d]">
                      Fecha
                    </p>

                    <p className="mt-1 font-black">
                      {fecha || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#9a897d]">
                      Horario
                    </p>

                    <p className="mt-1 font-black">
                      {hora || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#9a897d]">
                      Total
                    </p>

                    <p className="mt-1 font-black text-[#a47f43]">
                      {servicioActual
                        ? `$${servicioActual.precio.toLocaleString(
                            "es-AR"
                          )}`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  enviando
                }
                className="mt-7 w-full rounded-full bg-[#2d241f] py-4 font-black text-white transition hover:bg-[#4a382d] disabled:opacity-50"
              >
                {enviando
                  ? "RESERVANDO..."
                  : "CONFIRMAR TURNO"}
              </button>
            </form>
          </>
        )}
      </section>

      <footer className="border-t border-[#ded1c2] bg-[#2d241f] py-12 text-center text-white">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#b58a45] text-sm font-black tracking-widest text-[#d8b878]">
          EG
        </div>

        <p className="mt-4 font-black tracking-[0.2em]">
          ESTÉTICA GOLD
        </p>

        <p className="mt-2 text-sm text-[#b8aaa1]">
          Belleza · Cuidado · Bienestar
        </p>
      </footer>
    </main>
  );
}