"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { createClient } from "./lib/supabase";

/* ============================================================
   TIPOS
============================================================ */

type Movimiento = {
  id: string;
  user_id: string;
  tipo: string;
  monto: number | null;
  descripcion: string | null;
  categoria: string | null;
  fecha: string | null;
  medio_pago: string | null;
  cuenta: string | null;
  notas: string | null;
};

type Cuenta = {
  id: string;
  user_id: string;
  nombre: string;
  tipo: string;
  saldo: number | null;
  moneda: string | null;
  color: string | null;
  activa: boolean | null;
};

type Meta = {
  id: string;
  user_id: string;
  nombre: string;
  objetivo: number | null;
  ahorrado: number | null;
  fecha_objetivo: string | null;
  color: string | null;
  completada: boolean | null;
};

type Deuda = {
  id: string;
  user_id: string;
  nombre: string | null;
  descripcion: string | null;
  monto_total: number | null;
  monto_pagado: number | null;
  fecha_vencimiento: string | null;
};

type Evento = {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora: string | null;
  hora_fin: string | null;
  todo_el_dia: boolean | null;
  tipo: string | null;
  ubicacion: string | null;
  color: string | null;
  recordatorio_minutos: number | null;
  repeticion: string | null;
  completada: boolean | null;
};

type Materia = {
  id: string;
  user_id: string;
  materia: string;
  descripcion: string | null;
  nota: number | null;
  estado: string;
  profesor: string | null;
  comision: string | null;
  aula: string | null;
  color: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
};

type Examen = {
  id: string;
  user_id: string;
  materia_id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  hora: string | null;
  nota: number | null;
  estado: string;
  descripcion: string | null;
  calendario_id: string | null;
};

type Trabajo = {
  id: string;
  user_id: string;
  materia_id: string;
  titulo: string;
  descripcion: string | null;
  fecha_entrega: string;
  prioridad: string;
  estado: string;
  calendario_id: string | null;
};

type Usuario = {
  nombre: string;
  email: string;
};

/* ============================================================
   HELPERS
============================================================ */

function numero(value: number | null | undefined) {
  return Number(value ?? 0);
}

function dinero(value: number | null | undefined) {
  return numero(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

function fechaLegible(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  const fecha = new Date(`${value}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    return value;
  }

  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

function hoyISO() {
  const ahora = new Date();

  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, "0");
  const day = String(ahora.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sumarDiasISO(cantidad: number) {
  const fecha = new Date();

  fecha.setDate(fecha.getDate() + cantidad);

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function inicioMesISO() {
  const fecha = new Date();

  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function formatearHora(hora: string | null | undefined) {
  if (!hora) return "";

  return hora.slice(0, 5);
}

function porcentaje(valor: number, total: number) {
  if (!total || total <= 0) return 0;

  return Math.min(100, Math.max(0, (valor / total) * 100));
}

/* ============================================================
   COMPONENTE
============================================================ */

export default function InicioPage() {
  const supabase = useMemo(() => createClient(), []);

  const [usuario, setUsuario] = useState<Usuario>({
    nombre: "Tu espacio",
    email: "",
  });

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);

  const [resumenIA, setResumenIA] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [actualizado, setActualizado] = useState<Date | null>(null);

  /* ============================================================
     CARGAR TODO
  ============================================================ */

  useEffect(() => {
    let activo = true;

    async function cargarTodo() {
      setCargando(true);
      setError("");

      try {
        const {
          data: { user },
          error: errorUsuario,
        } = await supabase.auth.getUser();

        if (errorUsuario) {
          throw errorUsuario;
        }

        if (!user) {
          setCargando(false);
          return;
        }

        const metadata = user.user_metadata ?? {};

        const nombre =
          metadata.nombre ||
          metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "Tu espacio";

        setUsuario({
          nombre,
          email: user.email ?? "",
        });

        /* ======================================================
           CONSULTAS
        ====================================================== */

        const [
          movimientosResponse,
          cuentasResponse,
          metasResponse,
          deudasResponse,
          eventosResponse,
          materiasResponse,
          examenesResponse,
          trabajosResponse,
        ] = await Promise.all([
          supabase
            .from("finanzas")
            .select(
              "id,user_id,tipo,monto,descripcion,categoria,fecha,medio_pago,cuenta,notas"
            )
            .eq("user_id", user.id)
            .order("fecha", { ascending: false })
            .limit(50),

          supabase
            .from("cuentas_financieras")
            .select(
              "id,user_id,nombre,tipo,saldo,moneda,color,activa"
            )
            .eq("user_id", user.id)
            .order("nombre", { ascending: true }),

          supabase
            .from("metas_financieras")
            .select(
              "id,user_id,nombre,objetivo,ahorrado,fecha_objetivo,color,completada"
            )
            .eq("user_id", user.id)
            .order("completada", { ascending: true })
            .limit(10),

          supabase
            .from("deudas")
            .select(
              "id,user_id,nombre,descripcion,monto_total,monto_pagado,fecha_vencimiento"
            )
            .eq("user_id", user.id)
            .order("fecha_vencimiento", {
              ascending: true,
            })
            .limit(20),

          supabase
            .from("calendario_tareas")
            .select(
              "id,user_id,titulo,descripcion,fecha,hora,hora_fin,todo_el_dia,tipo,ubicacion,color,recordatorio_minutos,repeticion,completada"
            )
            .eq("user_id", user.id)
            .gte("fecha", hoyISO())
            .lte("fecha", sumarDiasISO(30))
            .order("fecha", { ascending: true })
            .order("hora", { ascending: true })
            .limit(30),

          supabase
            .from("estudios")
            .select(
              "id,user_id,materia,descripcion,nota,estado,profesor,comision,aula,color,fecha_inicio,fecha_fin"
            )
            .eq("user_id", user.id)
            .limit(30),

          supabase
            .from("estudios_examenes")
            .select(
              "id,user_id,materia_id,titulo,tipo,fecha,hora,nota,estado,descripcion,calendario_id"
            )
            .eq("user_id", user.id)
            .gte("fecha", hoyISO())
            .lte("fecha", sumarDiasISO(30))
            .order("fecha", { ascending: true })
            .limit(30),

          supabase
            .from("estudios_trabajos")
            .select(
              "id,user_id,materia_id,titulo,descripcion,fecha_entrega,prioridad,estado,calendario_id"
            )
            .eq("user_id", user.id)
            .gte("fecha_entrega", hoyISO())
            .lte("fecha_entrega", sumarDiasISO(30))
            .order("fecha_entrega", {
              ascending: true,
            })
            .limit(30),
        ]);

        /* ======================================================
           ERRORES INDIVIDUALES
        ====================================================== */

        if (movimientosResponse.error) {
          console.error(
            "Error cargando finanzas:",
            movimientosResponse.error
          );
        }

        if (cuentasResponse.error) {
          console.error(
            "Error cargando cuentas:",
            cuentasResponse.error
          );
        }

        if (metasResponse.error) {
          console.error(
            "Error cargando metas:",
            metasResponse.error
          );
        }

        if (deudasResponse.error) {
          console.error(
            "Error cargando deudas:",
            deudasResponse.error
          );
        }

        if (eventosResponse.error) {
          console.error(
            "Error cargando calendario:",
            eventosResponse.error
          );
        }

        if (materiasResponse.error) {
          console.error(
            "Error cargando estudios:",
            materiasResponse.error
          );
        }

        if (examenesResponse.error) {
          console.error(
            "Error cargando exámenes:",
            examenesResponse.error
          );
        }

        if (trabajosResponse.error) {
          console.error(
            "Error cargando trabajos:",
            trabajosResponse.error
          );
        }

        if (!activo) return;

        setMovimientos(
          (movimientosResponse.data ?? []) as Movimiento[]
        );

        setCuentas(
          (cuentasResponse.data ?? []) as Cuenta[]
        );

        setMetas(
          (metasResponse.data ?? []) as Meta[]
        );

        setDeudas(
          (deudasResponse.data ?? []) as Deuda[]
        );

        setEventos(
          (eventosResponse.data ?? []) as Evento[]
        );

        setMaterias(
          (materiasResponse.data ?? []) as Materia[]
        );

        setExamenes(
          (examenesResponse.data ?? []) as Examen[]
        );

        setTrabajos(
          (trabajosResponse.data ?? []) as Trabajo[]
        );

        setActualizado(new Date());
      } catch (err) {
        console.error(
          "Error cargando dashboard:",
          err
        );

        if (activo) {
          setError(
            "No se pudieron cargar todos los datos de tu espacio."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarTodo();

    return () => {
      activo = false;
    };
  }, [supabase]);

  /* ============================================================
     DATOS FINANCIEROS
  ============================================================ */

  const resumenFinanciero = useMemo(() => {
    const mes = inicioMesISO();

    const movimientosMes = movimientos.filter(
      (movimiento) =>
        movimiento.fecha &&
        movimiento.fecha >= mes
    );

    const ingresos = movimientosMes
      .filter((movimiento) => {
        const tipo =
          movimiento.tipo?.toLowerCase();

        return (
          tipo === "ingreso" ||
          tipo === "ingresos" ||
          tipo === "entrada"
        );
      })
      .reduce(
        (total, movimiento) =>
          total + numero(movimiento.monto),
        0
      );

    const gastos = movimientosMes
      .filter((movimiento) => {
        const tipo =
          movimiento.tipo?.toLowerCase();

        return (
          tipo === "gasto" ||
          tipo === "gastos" ||
          tipo === "egreso" ||
          tipo === "egresos" ||
          tipo === "salida"
        );
      })
      .reduce(
        (total, movimiento) =>
          total + numero(movimiento.monto),
        0
      );

    const saldoCuentas = cuentas
      .filter(
        (cuenta) => cuenta.activa !== false
      )
      .reduce(
        (total, cuenta) =>
          total + numero(cuenta.saldo),
        0
      );

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      saldoCuentas,
    };
  }, [movimientos, cuentas]);

  const deudasPendientes = useMemo(() => {
    return deudas.filter((deuda) => {
      return (
        numero(deuda.monto_total) -
          numero(deuda.monto_pagado) >
        0
      );
    });
  }, [deudas]);

  const totalDeudaPendiente = useMemo(() => {
    return deudasPendientes.reduce(
      (total, deuda) =>
        total +
        Math.max(
          0,
          numero(deuda.monto_total) -
            numero(deuda.monto_pagado)
        ),
      0
    );
  }, [deudasPendientes]);

  const eventosProximos = useMemo(() => {
    return eventos
      .filter((evento) => !evento.completada)
      .slice(0, 6);
  }, [eventos]);

  const metasActivas = useMemo(() => {
    return metas
      .filter((meta) => !meta.completada)
      .slice(0, 4);
  }, [metas]);

  const movimientosRecientes = useMemo(() => {
    return movimientos.slice(0, 6);
  }, [movimientos]);

  const deudaMasProxima = useMemo(() => {
    if (!deudasPendientes.length) {
      return null;
    }

    return [...deudasPendientes].sort((a, b) => {
      if (!a.fecha_vencimiento) return 1;
      if (!b.fecha_vencimiento) return -1;

      return a.fecha_vencimiento.localeCompare(
        b.fecha_vencimiento
      );
    })[0];
  }, [deudasPendientes]);

  const diasParaDeuda = useMemo(() => {
    if (!deudaMasProxima?.fecha_vencimiento) {
      return null;
    }

    const hoy = new Date(
      `${hoyISO()}T00:00:00`
    );

    const vencimiento = new Date(
      `${deudaMasProxima.fecha_vencimiento}T00:00:00`
    );

    return Math.ceil(
      (vencimiento.getTime() - hoy.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }, [deudaMasProxima]);

  /* ============================================================
     DATOS DE ESTUDIOS PARA IA
  ============================================================ */

  const examenesIA = useMemo(() => {
    return examenes.map((examen) => {
      const materia = materias.find(
        (item) =>
          item.id === examen.materia_id
      );

      return {
        ...examen,
        materia: materia?.materia || "Sin materia",
      };
    });
  }, [examenes, materias]);

  const trabajosIA = useMemo(() => {
    return trabajos.map((trabajo) => {
      const materia = materias.find(
        (item) =>
          item.id === trabajo.materia_id
      );

      return {
        ...trabajo,
        materia: materia?.materia || "Sin materia",
      };
    });
  }, [trabajos, materias]);

  /* ============================================================
     GENERAR RESUMEN IA
  ============================================================ */

  async function generarResumenIA() {
    if (cargandoIA) return;

    setCargandoIA(true);
    setErrorIA("");

    try {
      const respuesta = await fetch(
        "/api/resumen",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fechaActual: hoyISO(),

            finanzas: {
              ingresosMes:
                resumenFinanciero.ingresos,

              gastosMes:
                resumenFinanciero.gastos,

              balanceMes:
                resumenFinanciero.balance,

              saldoCuentas:
                resumenFinanciero.saldoCuentas,

              movimientosRecientes:
                movimientos.slice(0, 10),
            },

            calendario: eventos.slice(0, 15),

            deudas: deudasPendientes.slice(
              0,
              10
            ),

            metas: metasActivas.slice(
              0,
              10
            ),

            estudios: {
              materias: materias.slice(
                0,
                20
              ),

              examenes: examenesIA.slice(
                0,
                10
              ),

              trabajos: trabajosIA.slice(
                0,
                10
              ),
            },
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        console.error(
          "ERROR DETALLADO DE RESUMEN:",
          data
        );

        throw new Error(
          `${data?.error || "Error desconocido"}${
            data?.status
              ? ` (${data.status})`
              : ""
          }${
            data?.detalle
              ? ` — ${data.detalle}`
              : ""
          }`
        );
      }

      const texto =
        data?.resumen ||
        data?.mensaje ||
        data?.texto ||
        "";

      if (!texto) {
        throw new Error(
          "La IA no devolvió un resumen."
        );
      }

      setResumenIA(texto);
    } catch (err) {
      console.error(
        "Error generando resumen IA:",
        err
      );

      setErrorIA(
        err instanceof Error
          ? err.message
          : "No se pudo generar el resumen."
      );
    } finally {
      setCargandoIA(false);
    }
  }

  /* ============================================================
     GENERACIÓN AUTOMÁTICA
  ============================================================ */

  useEffect(() => {
    if (
      !cargando &&
      !resumenIA &&
      !cargandoIA &&
      !error
    ) {
      generarResumenIA();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando]);

  /* ============================================================
     SALUDO
  ============================================================ */

  const saludo = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 6) return "Buenas noches";
    if (hora < 12) return "Buenos días";
    if (hora < 19) return "Buenas tardes";

    return "Buenas noches";
  }, []);

  /* ============================================================
     LOADING
  ============================================================ */

  if (cargando) {
    return (
      <>
        <Sidebar />

        <main className="min-h-screen bg-black md:ml-[270px]">
          <div className="flex min-h-screen items-center justify-center px-6 pt-[68px] md:pt-0">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-2xl bg-white/[0.03]" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <div className="h-5 w-5 rounded-full border border-white/60">
                    <div className="ml-[6px] mt-[6px] h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              <p className="text-sm font-medium text-white/70">
                Vida Privada
              </p>

              <p className="mt-2 text-xs text-white/25">
                Preparando tu espacio...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* ============================================================
     DASHBOARD
  ============================================================ */

  return (
    <>
      <Sidebar />

      <main className="min-h-screen overflow-x-hidden bg-black md:ml-[270px]">
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-32 pt-[92px] sm:px-6 md:px-8 md:pb-12 md:pt-10 xl:px-10">

          {/* HEADER */}

          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />

                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/25">
                  Espacio personal
                </span>
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {saludo},{" "}
                <span className="text-white/45">
                  {usuario.nombre}
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/35">
                Todo lo importante de tu vida,
                reunido en un solo lugar.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {actualizado && (
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/20">
                    Actualizado
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    {actualizado.toLocaleTimeString(
                      "es-AR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              )}

              <Link
                href="/calendario"
                className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white/65 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                <span>▣</span>
                <span>Calendario</span>
              </Link>
            </div>
          </header>

          {/* ERROR GENERAL */}

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-4">
              <div className="flex gap-3">
                <span className="mt-0.5 text-sm text-red-400">
                  !
                </span>

                <div>
                  <p className="text-sm font-medium text-red-300">
                    Atención
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-300/60">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* KPIS */}

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.035]">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/[0.02] blur-2xl" />

              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                    Saldo total
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-white/40">
                    $
                  </span>
                </div>

                <p className="text-2xl font-semibold tracking-tight text-white">
                  {dinero(
                    resumenFinanciero.saldoCuentas
                  )}
                </p>

                <p className="mt-2 text-xs text-white/25">
                  En tus cuentas activas
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.035]">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Ingresos del mes
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-white/40">
                  ↗
                </span>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-white">
                {dinero(
                  resumenFinanciero.ingresos
                )}
              </p>

              <p className="mt-2 text-xs text-white/25">
                Dinero que entró este mes
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.035]">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Gastos del mes
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-white/40">
                  ↘
                </span>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-white">
                {dinero(
                  resumenFinanciero.gastos
                )}
              </p>

              <p className="mt-2 text-xs text-white/25">
                Dinero que salió este mes
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.035]">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Balance mensual
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-white/40">
                  ≈
                </span>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-white">
                {dinero(
                  resumenFinanciero.balance
                )}
              </p>

              <p className="mt-2 text-xs text-white/25">
                Ingresos menos gastos
              </p>
            </div>
          </section>

          {/* =====================================================
              IA
          ===================================================== */}

          <section className="mt-4">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-transparent">
              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.025] blur-3xl" />

              <div className="relative p-5 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm text-white">
                      AI
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold text-white">
                          Tu resumen inteligente
                        </h2>

                        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-white/30">
                          Gemini
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-white/30">
                        Una lectura rápida de lo
                        importante en tu vida.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generarResumenIA}
                    disabled={cargandoIA}
                    className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.11] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {cargandoIA ? (
                      <>
                        <span className="animate-pulse">
                          •
                        </span>
                        Analizando...
                      </>
                    ) : (
                      <>
                        <span>✦</span>
                        {resumenIA
                          ? "Actualizar resumen"
                          : "Generar resumen"}
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/20 p-4 sm:p-5">
                  {resumenIA ? (
                    <p className="whitespace-pre-line text-sm leading-7 text-white/65">
                      {resumenIA}
                    </p>
                  ) : cargandoIA ? (
                    <div className="space-y-3">
                      <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/[0.06]" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.05]" />
                      <div className="h-3 w-3/5 animate-pulse rounded-full bg-white/[0.04]" />
                    </div>
                  ) : errorIA ? (
                    <div>
                      <p className="text-sm font-medium text-white/65">
                        No se pudo generar el resumen.
                      </p>

                      <p className="mt-2 break-words text-xs leading-5 text-red-300/50">
                        {errorIA}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-white/40">
                        Todavía no hay un resumen
                        generado.
                      </p>

                      <p className="mt-2 text-xs leading-5 text-white/20">
                        La IA analizará automáticamente
                        tus eventos, finanzas, deudas,
                        metas y estudios.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              MOVIMIENTOS + EVENTOS
          ===================================================== */}

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.8fr]">

            <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5 sm:px-6">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">
                    Finanzas
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-white">
                    Movimientos recientes
                  </h2>
                </div>

                <Link
                  href="/finanzas"
                  className="text-xs text-white/30 transition hover:text-white/70"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {movimientosRecientes.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/30">
                      $
                    </div>

                    <p className="text-sm text-white/50">
                      Todavía no tenés movimientos.
                    </p>

                    <Link
                      href="/finanzas"
                      className="mt-3 inline-block text-xs text-white/30 underline-offset-4 hover:text-white/70 hover:underline"
                    >
                      Agregar movimiento
                    </Link>
                  </div>
                ) : (
                  movimientosRecientes.map(
                    (movimiento) => {
                      const tipo =
                        movimiento.tipo?.toLowerCase();

                      const ingreso =
                        tipo === "ingreso" ||
                        tipo === "ingresos" ||
                        tipo === "entrada";

                      const descripcion =
                        movimiento.descripcion ||
                        movimiento.categoria ||
                        "Movimiento";

                      return (
                        <div
                          key={movimiento.id}
                          className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.015] sm:px-6"
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm ${
                              ingreso
                                ? "border-white/10 bg-white/[0.05] text-white/70"
                                : "border-white/[0.06] bg-white/[0.025] text-white/35"
                            }`}
                          >
                            {ingreso ? "↗" : "↘"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white/70">
                              {descripcion}
                            </p>

                            <p className="mt-1 truncate text-[11px] text-white/20">
                              {fechaLegible(
                                movimiento.fecha
                              )}

                              {movimiento.cuenta
                                ? ` · ${movimiento.cuenta}`
                                : ""}
                            </p>
                          </div>

                          <p
                            className={`shrink-0 text-sm font-medium ${
                              ingreso
                                ? "text-white/75"
                                : "text-white/45"
                            }`}
                          >
                            {ingreso ? "+" : "-"}
                            {dinero(
                              movimiento.monto
                            )}
                          </p>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">
                    Agenda
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-white">
                    Próximamente
                  </h2>
                </div>

                <Link
                  href="/calendario"
                  className="text-xs text-white/30 transition hover:text-white/70"
                >
                  Calendario →
                </Link>
              </div>

              <div className="p-4">
                {eventosProximos.length === 0 ? (
                  <div className="px-2 py-10 text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/30">
                      ▣
                    </div>

                    <p className="text-sm text-white/45">
                      No tenés eventos próximos.
                    </p>

                    <Link
                      href="/calendario"
                      className="mt-3 inline-block text-xs text-white/25 hover:text-white/60"
                    >
                      Crear evento
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventosProximos.map(
                      (evento) => (
                        <Link
                          key={evento.id}
                          href="/calendario"
                          className="block rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition hover:border-white/[0.1] hover:bg-white/[0.04]"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.05]">
                              <span className="text-[9px] uppercase text-white/25">
                                {new Date(
                                  `${evento.fecha}T00:00:00`
                                ).toLocaleDateString(
                                  "es-AR",
                                  {
                                    month: "short",
                                  }
                                )}
                              </span>

                              <span className="text-sm font-semibold text-white/70">
                                {new Date(
                                  `${evento.fecha}T00:00:00`
                                ).getDate()}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white/65">
                                {evento.titulo}
                              </p>

                              <p className="mt-1 truncate text-[11px] text-white/25">
                                {evento.todo_el_dia
                                  ? "Todo el día"
                                  : formatearHora(
                                      evento.hora
                                    )}

                                {evento.tipo
                                  ? ` · ${evento.tipo}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* =====================================================
              SEGUNDA FILA
          ===================================================== */}

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">

            {/* METAS */}

            <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">
                    Objetivos
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-white">
                    Metas financieras
                  </h2>
                </div>

                <Link
                  href="/finanzas"
                  className="text-xs text-white/30 hover:text-white/70"
                >
                  Ver →
                </Link>
              </div>

              <div className="space-y-3 p-4">
                {metasActivas.length === 0 ? (
                  <div className="px-2 py-9 text-center">
                    <p className="text-sm text-white/40">
                      No tenés metas activas.
                    </p>

                    <p className="mt-2 text-xs text-white/20">
                      Crear una meta te ayuda a seguir
                      un objetivo concreto.
                    </p>
                  </div>
                ) : (
                  metasActivas.map((meta) => {
                    const objetivo =
                      numero(meta.objetivo);

                    const ahorrado =
                      numero(meta.ahorrado);

                    const progreso =
                      porcentaje(
                        ahorrado,
                        objetivo
                      );

                    return (
                      <div
                        key={meta.id}
                        className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white/65">
                              {meta.nombre}
                            </p>

                            <p className="mt-1 text-[11px] text-white/20">
                              {dinero(ahorrado)} de{" "}
                              {dinero(objetivo)}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs font-medium text-white/40">
                            {Math.round(
                              progreso
                            )}
                            %
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-white/60 transition-all"
                            style={{
                              width: `${progreso}%`,
                            }}
                          />
                        </div>

                        {meta.fecha_objetivo && (
                          <p className="mt-3 text-[10px] text-white/20">
                            Objetivo:{" "}
                            {fechaLegible(
                              meta.fecha_objetivo
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* DEUDAS */}

            <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">
                    Pendientes
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-white">
                    Deudas
                  </h2>
                </div>

                <Link
                  href="/deudas"
                  className="text-xs text-white/30 hover:text-white/70"
                >
                  Ver →
                </Link>
              </div>

              <div className="p-5">
                {deudasPendientes.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/30">
                      ✓
                    </div>

                    <p className="text-sm text-white/50">
                      No tenés deudas pendientes.
                    </p>

                    <p className="mt-2 text-xs text-white/20">
                      Todo está al día.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/20">
                        Total pendiente
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-white">
                        {dinero(
                          totalDeudaPendiente
                        )}
                      </p>

                      <p className="mt-1 text-xs text-white/25">
                        {deudasPendientes.length}{" "}
                        deuda
                        {deudasPendientes.length ===
                        1
                          ? ""
                          : "s"}{" "}
                        pendiente
                        {deudasPendientes.length ===
                        1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    {deudaMasProxima && (
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white/65">
                              {deudaMasProxima.nombre ||
                                deudaMasProxima.descripcion ||
                                "Deuda"}
                            </p>

                            <p className="mt-1 text-[11px] text-white/25">
                              Vence{" "}
                              {fechaLegible(
                                deudaMasProxima.fecha_vencimiento
                              )}
                            </p>
                          </div>

                          <span className="shrink-0 text-sm font-medium text-white/60">
                            {dinero(
                              Math.max(
                                0,
                                numero(
                                  deudaMasProxima.monto_total
                                ) -
                                  numero(
                                    deudaMasProxima.monto_pagado
                                  )
                              )
                            )}
                          </span>
                        </div>

                        {diasParaDeuda !== null && (
                          <div className="mt-4 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />

                            <span className="text-[10px] text-white/25">
                              {diasParaDeuda < 0
                                ? `Vencida hace ${Math.abs(
                                    diasParaDeuda
                                  )} días`
                                : diasParaDeuda ===
                                  0
                                ? "Vence hoy"
                                : diasParaDeuda ===
                                  1
                                ? "Vence mañana"
                                : `Faltan ${diasParaDeuda} días`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* CUENTAS */}

            <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025] lg:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">
                    Patrimonio
                  </p>

                  <h2 className="mt-1 text-sm font-semibold text-white">
                    Tus cuentas
                  </h2>
                </div>

                <Link
                  href="/finanzas"
                  className="text-xs text-white/30 hover:text-white/70"
                >
                  Finanzas →
                </Link>
              </div>

              <div className="space-y-2 p-4">
                {cuentas.filter(
                  (cuenta) =>
                    cuenta.activa !== false
                ).length === 0 ? (
                  <div className="px-2 py-9 text-center">
                    <p className="text-sm text-white/40">
                      No tenés cuentas agregadas.
                    </p>

                    <Link
                      href="/finanzas"
                      className="mt-3 inline-block text-xs text-white/25 hover:text-white/60"
                    >
                      Agregar cuenta
                    </Link>
                  </div>
                ) : (
                  cuentas
                    .filter(
                      (cuenta) =>
                        cuenta.activa !== false
                    )
                    .slice(0, 5)
                    .map((cuenta) => (
                      <div
                        key={cuenta.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs text-white/40">
                          $
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white/60">
                            {cuenta.nombre}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-white/20">
                            {cuenta.tipo}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs font-medium text-white/55">
                          {dinero(cuenta.saldo)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </section>
          </div>

          {/* =====================================================
              ACCIONES
          ===================================================== */}

          <section className="mt-4">
            <div className="mb-3 px-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/20">
                Acciones rápidas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

              {[
                [
                  "/finanzas",
                  "$",
                  "Finanzas",
                  "Registrar",
                ],
                [
                  "/calendario",
                  "▣",
                  "Evento",
                  "Agendar",
                ],
                [
                  "/deudas",
                  "◈",
                  "Deuda",
                  "Registrar",
                ],
                [
                  "/estudios",
                  "▤",
                  "Estudios",
                  "Organizar",
                ],
                [
                  "/relaciones",
                  "♡",
                  "Relaciones",
                  "Personas",
                ],
                [
                  "/finanzas",
                  "+",
                  "Agregar",
                  "Nuevo registro",
                ],
              ].map(
                ([href, icon, titulo, subtitulo]) => (
                  <Link
                    key={titulo}
                    href={href}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.045]"
                  >
                    <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-sm text-white/50 group-hover:bg-white/[0.09] group-hover:text-white">
                      {icon}
                    </span>

                    <p className="text-xs font-medium text-white/55 group-hover:text-white/80">
                      {titulo}
                    </p>

                    <p className="mt-1 text-[10px] text-white/20">
                      {subtitulo}
                    </p>
                  </Link>
                )
              )}
            </div>
          </section>

          {/* FOOTER */}

          <footer className="mt-10 border-t border-white/[0.05] pt-5">
            <div className="flex flex-col gap-2 text-[10px] text-white/15 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Vida Privada · Tu espacio personal
              </p>

              <p>
                Todo organizado. Todo en un solo lugar.
              </p>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}