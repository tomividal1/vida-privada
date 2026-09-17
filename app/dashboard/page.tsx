"use client";

import Link from "next/link";
import Vida3D from "../../components/Vida3D";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import Sidebar from "../../components/sidebar";

type Movimiento = {
  tipo: "ingreso" | "gasto";
  monto: number;
};

type Deuda = {
  monto_total: number;
  monto_pagado: number;
};

type Tarea = {
  id: string;
  titulo: string;
  fecha: string;
  hora: string | null;
  tipo: string;
  completada: boolean;
};

type Estudio = {
  id: string;
  materia: string;
  estado: string;
  fecha_examen: string | null;
};

type Contacto = {
  id: string;
  nombre: string;
  relacion: string | null;
  fecha_importante: string | null;
};

function dinero(valor: number) {
  return `$${valor.toLocaleString("es-AR")}`;
}

function fechaBonita(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default function Dashboard() {
  const supabase = createClient();

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function cargarDashboard() {
    setLoading(true);
    setError("");

    const [
      movimientosResult,
      deudasResult,
      tareasResult,
      estudiosResult,
      contactosResult,
    ] = await Promise.all([
      supabase
        .from("finanzas")
        .select("tipo, monto")
        .order("created_at", { ascending: false }),

      supabase
        .from("deudas")
        .select("monto_total, monto_pagado"),

      supabase
        .from("calendario_tareas")
        .select("id, titulo, fecha, hora, tipo, completada")
        .eq("completada", false)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true })
        .limit(10),

      supabase
        .from("estudios")
        .select("id, materia, estado, fecha_examen")
        .neq("estado", "aprobada")
        .order("fecha_examen", { ascending: true })
        .limit(10),

      supabase
        .from("contactos")
        .select("id, nombre, relacion, fecha_importante")
        .order("nombre", { ascending: true }),
    ]);

    if (movimientosResult.error) {
      setError("No pudimos cargar tus finanzas.");
    }

    if (deudasResult.error) {
      setError("No pudimos cargar tus deudas.");
    }

    if (tareasResult.error) {
      setError("No pudimos cargar tu calendario.");
    }

    if (movimientosResult.data) setMovimientos(movimientosResult.data);
    if (deudasResult.data) setDeudas(deudasResult.data);
    if (tareasResult.data) setTareas(tareasResult.data);
    if (estudiosResult.data) setEstudios(estudiosResult.data);
    if (contactosResult.data) setContactos(contactosResult.data);

    setLoading(false);
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  const ingresos = useMemo(
    () =>
      movimientos
        .filter((m) => m.tipo === "ingreso")
        .reduce((total, m) => total + Number(m.monto), 0),
    [movimientos]
  );

  const gastos = useMemo(
    () =>
      movimientos
        .filter((m) => m.tipo === "gasto")
        .reduce((total, m) => total + Number(m.monto), 0),
    [movimientos]
  );

  const balance = ingresos - gastos;

  const deudaPendiente = useMemo(
    () =>
      deudas.reduce(
        (total, deuda) =>
          total +
          Math.max(
            Number(deuda.monto_total) - Number(deuda.monto_pagado),
            0
          ),
        0
      ),
    [deudas]
  );

  const deudaTotal = deudas.reduce(
    (total, deuda) => total + Number(deuda.monto_total),
    0
  );

  const porcentajeDeuda =
    deudaTotal > 0
      ? Math.min(
          100,
          Math.round(((deudaTotal - deudaPendiente) / deudaTotal) * 100)
        )
      : 0;

  const hoy = new Date();
  const fechaHoy = hoy.toISOString().split("T")[0];

  const tareasHoy = tareas.filter((t) => t.fecha === fechaHoy);

  const proximasTareas = tareas.slice(0, 5);
  const proximosEstudios = estudios.slice(0, 4);

  const mensajePrincipal =
    tareasHoy.length > 0
      ? `Tenés ${tareasHoy.length} pendiente${
          tareasHoy.length === 1 ? "" : "s"
        } para hoy.`
      : tareas.length > 0
      ? "Tu día está bastante despejado."
      : "No tenés pendientes importantes.";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <Sidebar />

        <div className="flex min-h-screen items-center justify-center md:ml-64">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
            <p className="text-sm text-zinc-600">
              Preparando tu espacio...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Sidebar />

      <div className="min-h-screen px-4 py-6 pb-24 md:ml-64 md:px-8 md:py-8 md:pb-10">
        <div className="mx-auto max-w-[1500px]">
          {/* HEADER */}
          <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-zinc-700">
                VIDA PRIVADA
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Buenas 👋
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                {mensajePrincipal}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/calendario"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                Ver calendario
              </Link>

              <Link
                href="/finanzas"
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                + Movimiento
              </Link>
            </div>
          </header>

          {error && (
            <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* 3D */}
          <Vida3D />

          {/* RESUMEN */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* BALANCE */}
            <Link
              href="/finanzas"
              className="group rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-5 transition hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-600">Balance</p>

                  <p
                    className={`mt-3 text-2xl font-semibold ${
                      balance >= 0 ? "text-white" : "text-red-400"
                    }`}
                  >
                    {dinero(balance)}
                  </p>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500">
                  $
                </span>
              </div>

              <div className="mt-4 flex justify-between text-[11px]">
                <span className="text-zinc-600">
                  Ingresos {dinero(ingresos)}
                </span>

                <span className="text-zinc-600">
                  Gastos {dinero(gastos)}
                </span>
              </div>
            </Link>

            {/* DEUDAS */}
            <Link
              href="/deudas"
              className="group rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-5 transition hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-600">
                    Deuda pendiente
                  </p>

                  <p className="mt-3 text-2xl font-semibold">
                    {dinero(deudaPendiente)}
                  </p>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500">
                  ◈
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[10px] text-zinc-600">
                  <span>Pagado</span>
                  <span>{porcentajeDeuda}%</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${porcentajeDeuda}%` }}
                  />
                </div>
              </div>
            </Link>

            {/* TAREAS */}
            <Link
              href="/calendario"
              className="group rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-5 transition hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-600">
                    Pendientes
                  </p>

                  <p className="mt-3 text-2xl font-semibold">
                    {tareas.length}
                  </p>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500">
                  ✓
                </span>
              </div>

              <p className="mt-4 text-[11px] text-zinc-600">
                {tareasHoy.length > 0
                  ? `${tareasHoy.length} para hoy`
                  : "Nada urgente hoy"}
              </p>
            </Link>

            {/* PERSONAS */}
            <Link
              href="/relaciones"
              className="group rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-5 transition hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-600">
                    Personas
                  </p>

                  <p className="mt-3 text-2xl font-semibold">
                    {contactos.length}
                  </p>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500">
                  ♡
                </span>
              </div>

              <p className="mt-4 text-[11px] text-zinc-600">
                Personas importantes
              </p>
            </Link>
          </section>

          {/* CENTRO DE CONTROL */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            {/* AGENDA */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                    Agenda
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Próximos días
                  </h2>
                </div>

                <Link
                  href="/calendario"
                  className="text-xs text-zinc-600 transition hover:text-white"
                >
                  Ver todo →
                </Link>
              </div>

              <div className="mt-5">
                {proximasTareas.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.06] p-8 text-center">
                    <p className="text-sm text-zinc-500">
                      No tenés eventos próximos.
                    </p>

                    <Link
                      href="/calendario"
                      className="mt-3 inline-block text-xs text-zinc-400 underline underline-offset-4"
                    >
                      Crear uno
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proximasTareas.map((tarea) => (
                      <Link
                        key={tarea.id}
                        href="/calendario"
                        className="flex items-center gap-4 rounded-xl border border-transparent bg-white/[0.025] p-4 transition hover:border-white/[0.07] hover:bg-white/[0.04]"
                      >
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-white/[0.04]">
                          <span className="text-[10px] uppercase text-zinc-600">
                            {new Date(
                              `${tarea.fecha}T12:00:00`
                            ).toLocaleDateString("es-AR", {
                              weekday: "short",
                            })}
                          </span>

                          <span className="text-sm font-semibold">
                            {new Date(
                              `${tarea.fecha}T12:00:00`
                            ).getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {tarea.titulo}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {tarea.hora
                              ? tarea.hora.slice(0, 5)
                              : "Todo el día"}{" "}
                            · {tarea.tipo}
                          </p>
                        </div>

                        <span className="text-zinc-700">→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RESUMEN */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                Estado
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Tu situación
              </h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-white/[0.025] p-4">
                  <p className="text-xs text-zinc-600">
                    Finanzas
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {balance >= 0
                      ? "Tu balance está positivo."
                      : "Tus gastos superan tus ingresos."}
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.025] p-4">
                  <p className="text-xs text-zinc-600">
                    Organización
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {tareas.length === 0
                      ? "No tenés pendientes."
                      : `${tareas.length} pendiente${
                          tareas.length === 1 ? "" : "s"
                        } en tu agenda.`}
                  </p>
                </div>

                <div className="rounded-xl bg-white/[0.025] p-4">
                  <p className="text-xs text-zinc-600">
                    Estudios
                  </p>

                  <p className="mt-1 text-sm text-zinc-300">
                    {estudios.length === 0
                      ? "No hay actividades pendientes."
                      : `${estudios.length} actividad${
                          estudios.length === 1 ? "" : "es"
                        } académica${
                          estudios.length === 1 ? "" : "s"
                        }.`}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ESTUDIOS + PERSONAS */}
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* ESTUDIOS */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                    Formación
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Estudios
                  </h2>
                </div>

                <Link
                  href="/estudios"
                  className="text-xs text-zinc-600 hover:text-white"
                >
                  Ver todo →
                </Link>
              </div>

              <div className="mt-5 space-y-2">
                {proximosEstudios.length === 0 ? (
                  <p className="rounded-xl bg-white/[0.025] p-5 text-sm text-zinc-600">
                    No hay materias pendientes.
                  </p>
                ) : (
                  proximosEstudios.map((estudio) => (
                    <Link
                      href="/estudios"
                      key={estudio.id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {estudio.materia}
                        </p>

                        {estudio.fecha_examen && (
                          <p className="mt-1 text-xs text-zinc-600">
                            Examen ·{" "}
                            {fechaBonita(estudio.fecha_examen)}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[10px] text-zinc-500">
                        {estudio.estado}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* PERSONAS */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                    Personas
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Personas importantes
                  </h2>
                </div>

                <Link
                  href="/relaciones"
                  className="text-xs text-zinc-600 hover:text-white"
                >
                  Ver todo →
                </Link>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {contactos.length === 0 ? (
                  <p className="col-span-full rounded-xl bg-white/[0.025] p-5 text-sm text-zinc-600">
                    Todavía no agregaste personas.
                  </p>
                ) : (
                  contactos.slice(0, 6).map((contacto) => (
                    <Link
                      href="/relaciones"
                      key={contacto.id}
                      className="rounded-xl bg-white/[0.025] p-4 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-sm text-zinc-500">
                          {contacto.nombre.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {contacto.nombre}
                          </p>

                          {contacto.relacion && (
                            <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                              {contacto.relacion}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ACCIONES RÁPIDAS */}
          <section className="mt-6">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-700">
              Acciones rápidas
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/calendario"
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
              >
                <span className="text-lg">+</span>
                <p className="mt-2 font-medium">Nuevo evento</p>
                <p className="mt-1 text-[11px] text-zinc-700">
                  Agregar a tu calendario
                </p>
              </Link>

              <Link
                href="/finanzas"
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
              >
                <span className="text-lg">$</span>
                <p className="mt-2 font-medium">Registrar movimiento</p>
                <p className="mt-1 text-[11px] text-zinc-700">
                  Ingreso o gasto
                </p>
              </Link>

              <Link
                href="/deudas"
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
              >
                <span className="text-lg">◈</span>
                <p className="mt-2 font-medium">Nueva deuda</p>
                <p className="mt-1 text-[11px] text-zinc-700">
                  Registrar una obligación
                </p>
              </Link>

              <Link
                href="/estudios"
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white"
              >
                <span className="text-lg">▤</span>
                <p className="mt-2 font-medium">Agregar estudio</p>
                <p className="mt-1 text-[11px] text-zinc-700">
                  Materia o examen
                </p>
              </Link>
            </div>
          </section>

          <footer className="pb-4 pt-10 text-center text-[10px] text-zinc-800">
            Vida Privada · Tu espacio personal
          </footer>
        </div>
      </div>
    </main>
  );
}