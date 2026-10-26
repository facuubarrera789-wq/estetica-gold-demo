"use client";

import {
  FormEvent,
  useState,
} from "react";

export default function AdminLoginPage() {
  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(false);

  async function ingresar(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (!password.trim()) {
      setError(
        "Ingresá la contraseña."
      );
      return;
    }

    setCargando(true);

    try {
      const respuesta =
        await fetch(
          "/api/admin/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              password,
            }),
          }
        );

      const resultado =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "Contraseña incorrecta"
        );
      }

      window.location.href =
        "/admin";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f2ea] px-5 py-12 text-[#2d241f]">
      {/* DECORACIÓN */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#d8bd93]/30 blur-3xl" />

      <div className="absolute -bottom-40 -right-32 h-[430px] w-[430px] rounded-full bg-[#d9bca4]/30 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[36px] border border-[#ddcdb8] bg-[#fffaf4] p-7 shadow-2xl shadow-[#7a5a3d]/10 sm:p-9">
        {/* LOGO */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#c4a46d] bg-[#2d241f]">
          <span className="font-serif text-2xl font-black italic tracking-wider text-[#e2c17f]">
            EG
          </span>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-[#a47f43]">
            ESTÉTICA GOLD
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Panel Admin
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#8b786b]">
            Acceso exclusivo para la
            administración del centro.
          </p>
        </div>

        <form
          onSubmit={ingresar}
          className="mt-8"
        >
          <label
            htmlFor="password"
            className="text-sm font-bold"
          >
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Ingresá tu contraseña"
            autoComplete="current-password"
            className="mt-3 w-full rounded-2xl border border-[#e2d4c2] bg-white p-4 outline-none transition focus:border-[#b58a45]"
          />

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-6 w-full rounded-full bg-[#b58a45] py-4 font-black tracking-[0.15em] text-white transition hover:bg-[#9d7639] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando
              ? "INGRESANDO..."
              : "INGRESAR"}
          </button>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-sm font-bold text-[#92764e] transition hover:text-[#614b31]"
        >
          ← Volver a Estética Gold
        </a>
      </div>
    </main>
  );
}