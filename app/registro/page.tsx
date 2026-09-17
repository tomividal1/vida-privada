"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../lib/supabase";

export default function RegistroPage() {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

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

  async function registrarse(e: FormEvent) {
    e.preventDefault();

    setError("");
    setExito(false);

    if (!nombre.trim()) {
      setError("Ingresá tu nombre.");
      return;
    }

    if (!email.trim()) {
      setError("Ingresá tu email.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setRegistrando(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: nombre.trim(),
          nombre: nombre.trim(),
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setError("Ya existe una cuenta con ese email.");
      } else {
        setError(error.message);
      }

      setRegistrando(false);
      return;
    }

    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    setExito(true);
    setRegistrando(false);
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
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-[-250px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-white/[0.045] blur-[120px]" />
        <div className="absolute bottom-[-250px] right-[-100px] h-[500px] w-[500px] rounded-full bg-violet-500/[0.035] blur-[120px]" />
        <div className="absolute left-[-150px] top-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
      </div>

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
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.06] shadow-2xl">
              <div className="h-7 w-7 rounded-full border border-white/60">
                <div className="ml-2 mt-2 h-2 w-2 rounded-full bg-white" />
              </div>
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/35">
              Empezá tu espacio
            </p>

            <h1 className="text-4xl font-semibold tracking-[-0.04em]">
              Vida Privada
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Una cuenta. Todo tu mundo organizado.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-tight">
                Crear tu cuenta
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Solo necesitás unos segundos.
              </p>
            </div>

            {exito ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.07] p-5">
                  <div className="mb-3 text-2xl">✓</div>

                  <h3 className="font-semibold text-emerald-200">
                    Cuenta creada
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-200/60">
                    Revisá tu email para confirmar la cuenta y después
                    ingresá a Vida Privada.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="block w-full rounded-2xl bg-white py-3.5 text-center text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Ir al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={registrarse} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/55">
                    ¿Cómo te llamás?
                  </label>

                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
                  />
                </div>

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
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
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
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-white/35 hover:text-white/70"
                    >
                      {mostrarPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/55">
                    Repetir contraseña
                  </label>

                  <input
                    type={mostrarPassword ? "text" : "password"}
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registrando}
                  className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registrando ? "Creando cuenta..." : "Crear mi cuenta"}
                </button>
              </form>
            )}

            {!exito && (
              <>
                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/7" />
                  <span className="text-[10px] uppercase tracking-widest text-white/20">
                    ya tengo cuenta
                  </span>
                  <div className="h-px flex-1 bg-white/7" />
                </div>

                <p className="text-center text-sm text-white/35">
                  ¿Ya estás registrado?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-white/70 hover:text-white"
                  >
                    Iniciar sesión
                  </Link>
                </p>
              </>
            )}
          </div>

          <p className="mt-7 text-center text-[11px] text-white/20">
            Tu espacio. Tus datos. Tu control.
          </p>
        </div>
      </div>
    </main>
  );
}