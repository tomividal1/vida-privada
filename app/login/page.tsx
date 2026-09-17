"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function comprobarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
      } else {
        setCargando(false);
      }
    }

    comprobarSesion();
  }, [router, supabase]);

  async function iniciarSesion(e: FormEvent) {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Completá tu email y contraseña.");
      return;
    }

    setEntrando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("invalid login")) {
        setError("El email o la contraseña son incorrectos.");
      } else {
        setError(error.message);
      }

      setEntrando(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white" />
          <p className="text-sm text-white/40">Preparando tu espacio...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* Fondo */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-[-250px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[120px]" />
        <div className="absolute bottom-[-300px] left-[-150px] h-[500px] w-[500px] rounded-full bg-blue-500/[0.035] blur-[120px]" />
        <div className="absolute right-[-150px] top-1/3 h-[500px] w-[500px] rounded-full bg-violet-500/[0.03] blur-[120px]" />
      </div>

      {/* Grid decorativo */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* Marca */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-white/[0.03]">
              <div className="h-7 w-7 rounded-full border border-white/60">
                <div className="ml-2 mt-2 h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/35">
              Tu espacio personal
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white">
              Vida Privada
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Todo lo importante de tu vida, en un solo lugar.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-tight">
                Bienvenido de nuevo
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Ingresá para continuar.
              </p>
            </div>

            <form onSubmit={iniciarSesion} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-white/55">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-black/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-white/55">
                  Contraseña
                </label>

                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-black/60"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-white/35 transition hover:bg-white/5 hover:text-white/70"
                  >
                    {mostrarPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={entrando}
                className="group relative w-full overflow-hidden rounded-2xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10">
                  {entrando ? "Ingresando..." : "Entrar a Vida Privada"}
                </span>
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/7" />
              <span className="text-[10px] uppercase tracking-widest text-white/20">
                o
              </span>
              <div className="h-px flex-1 bg-white/7" />
            </div>

            <p className="text-center text-sm text-white/35">
              ¿Todavía no tenés una cuenta?{" "}
              <Link
                href="/registro"
                className="font-medium text-white/70 transition hover:text-white"
              >
                Crear cuenta
              </Link>
            </p>
          </div>

          <p className="mt-7 text-center text-[11px] text-white/20">
            Un espacio privado. Tus datos, tu vida.
          </p>
        </div>
      </div>
    </main>
  );
}