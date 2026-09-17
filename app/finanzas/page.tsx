"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import Sidebar from "../../components/Sidebar";
import DatePicker from "../../components/DatePicker";

type Movimiento = {
  id: string;
  user_id: string;
  tipo: string;
  monto: number;
  descripcion: string | null;
  categoria: string | null;
  fecha: string | null;
  medio_pago: string | null;
  cuenta: string | null;
  notas: string | null;
};

type Deuda = {
  id: string;
  user_id: string;
  nombre: string | null;
  descripcion: string | null;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento: string | null;
};

type Cuenta = {
  id: string;
  user_id: string;
  nombre: string;
  tipo: string;
  saldo: number;
  moneda: string;
  color: string | null;
  activa: boolean;
};

type Meta = {
  id: string;
  user_id: string;
  nombre: string;
  objetivo: number;
  ahorrado: number;
  fecha_objetivo: string | null;
  color: string | null;
  completada: boolean;
};

type Tab =
  | "resumen"
  | "movimientos"
  | "deudas"
  | "cuentas"
  | "metas";

function fechaLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function dinero(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function fechaBonita(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diasPara(fecha: string | null) {
  if (!fecha) return null;

  const hoy = new Date(`${fechaLocal()}T00:00:00`);
  const objetivo = new Date(`${fecha}T00:00:00`);

  return Math.round(
    (objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function porcentaje(actual: number, total: number) {
  if (!total) return 0;

  return Math.min(Math.max((actual / total) * 100, 0), 100);
}

export default function FinanzasPage() {
  const supabase = createClient();

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [tab, setTab] = useState<Tab>("resumen");
  const [periodo, setPeriodo] = useState("actual");
  const [busqueda, setBusqueda] = useState("");

  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalDeuda, setModalDeuda] = useState(false);
  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalMeta, setModalMeta] = useState(false);
  const [modalPago, setModalPago] = useState(false);

  const [deudaSeleccionada, setDeudaSeleccionada] =
    useState<Deuda | null>(null);

  const [movTipo, setMovTipo] = useState("gasto");
  const [movMonto, setMovMonto] = useState("");
  const [movDescripcion, setMovDescripcion] = useState("");
  const [movCategoria, setMovCategoria] = useState("Otros");
  const [movFecha, setMovFecha] = useState(fechaLocal());
  const [movMedio, setMovMedio] = useState("Efectivo");
  const [movCuenta, setMovCuenta] = useState("");
  const [movNotas, setMovNotas] = useState("");

  const [deudaNombre, setDeudaNombre] = useState("");
  const [deudaDescripcion, setDeudaDescripcion] = useState("");
  const [deudaMonto, setDeudaMonto] = useState("");
  const [deudaVencimiento, setDeudaVencimiento] = useState("");

  const [cuentaNombre, setCuentaNombre] = useState("");
  const [cuentaTipo, setCuentaTipo] = useState("Efectivo");
  const [cuentaSaldo, setCuentaSaldo] = useState("");
  const [cuentaColor, setCuentaColor] = useState("white");

  const [metaNombre, setMetaNombre] = useState("");
  const [metaObjetivo, setMetaObjetivo] = useState("");
  const [metaAhorrado, setMetaAhorrado] = useState("");
  const [metaFecha, setMetaFecha] = useState("");
  const [metaColor, setMetaColor] = useState("white");

  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoFecha, setPagoFecha] = useState(fechaLocal());

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [movRes, deudaRes, cuentaRes, metaRes] = await Promise.all([
        supabase
          .from("finanzas")
          .select("*")
          .eq("user_id", user.id)
          .order("fecha", { ascending: false }),

        supabase
          .from("deudas")
          .select("*")
          .eq("user_id", user.id)
          .order("fecha_vencimiento", {
            ascending: true,
            nullsFirst: false,
          }),

        supabase
          .from("cuentas_financieras")
          .select("*")
          .eq("user_id", user.id)
          .eq("activa", true)
          .order("nombre", { ascending: true }),

        supabase
          .from("metas_financieras")
          .select("*")
          .eq("user_id", user.id)
          .order("completada", { ascending: true }),
      ]);

      if (movRes.error) console.error(movRes.error);
      if (deudaRes.error) console.error(deudaRes.error);
      if (cuentaRes.error) console.error(cuentaRes.error);
      if (metaRes.error) console.error(metaRes.error);

      setMovimientos(movRes.data || []);
      setDeudas(deudaRes.data || []);
      setCuentas(cuentaRes.data || []);
      setMetas(metaRes.data || []);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudieron cargar las finanzas.");
    } finally {
      setLoading(false);
    }
  }

  function cerrarModales() {
    setModalMovimiento(false);
    setModalDeuda(false);
    setModalCuenta(false);
    setModalMeta(false);
    setModalPago(false);
    setDeudaSeleccionada(null);
  }

  function limpiarMovimiento() {
    setMovTipo("gasto");
    setMovMonto("");
    setMovDescripcion("");
    setMovCategoria("Otros");
    setMovFecha(fechaLocal());
    setMovMedio("Efectivo");
    setMovCuenta("");
    setMovNotas("");
  }

  async function agregarMovimiento(e: React.FormEvent) {
    e.preventDefault();

    const monto = Number(movMonto);

    if (!monto || monto <= 0) {
      setMensaje("Ingresá un monto válido.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("finanzas").insert({
        user_id: user.id,
        tipo: movTipo,
        monto,
        descripcion: movDescripcion.trim() || null,
        categoria: movCategoria,
        fecha: movFecha || fechaLocal(),
        medio_pago: movMedio,
        cuenta: movCuenta || null,
        notas: movNotas.trim() || null,
      });

      if (error) {
        console.error(error);
        setMensaje("No se pudo guardar el movimiento.");
        return;
      }

      limpiarMovimiento();
      cerrarModales();
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarMovimiento(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;

    const { error } = await supabase
      .from("finanzas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar.");
      return;
    }

    setMovimientos((actual) =>
      actual.filter((movimiento) => movimiento.id !== id)
    );
  }

  async function agregarDeuda(e: React.FormEvent) {
    e.preventDefault();

    const monto = Number(deudaMonto);

    if (!monto || monto <= 0) {
      setMensaje("Ingresá un monto válido.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("deudas").insert({
        user_id: user.id,
        nombre: deudaNombre.trim() || null,
        descripcion: deudaDescripcion.trim() || null,
        monto_total: monto,
        monto_pagado: 0,
        fecha_vencimiento: deudaVencimiento || null,
      });

      if (error) {
        console.error(error);
        setMensaje("No se pudo guardar la deuda.");
        return;
      }

      setDeudaNombre("");
      setDeudaDescripcion("");
      setDeudaMonto("");
      setDeudaVencimiento("");

      cerrarModales();
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarDeuda(id: string) {
    if (!confirm("¿Eliminar esta deuda? También se eliminarán sus pagos.")) {
      return;
    }

    const { error } = await supabase
      .from("deudas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la deuda.");
      return;
    }

    setDeudas((actual) => actual.filter((deuda) => deuda.id !== id));
  }

  async function registrarPago(e: React.FormEvent) {
    e.preventDefault();

    if (!deudaSeleccionada) return;

    const monto = Number(pagoMonto);

    const pendiente =
      Number(deudaSeleccionada.monto_total) -
      Number(deudaSeleccionada.monto_pagado);

    if (!monto || monto <= 0) {
      setMensaje("Ingresá un monto válido.");
      return;
    }

    if (monto > pendiente) {
      setMensaje(
        `El pago no puede superar la deuda pendiente de ${dinero(
          pendiente
        )}.`
      );
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error: pagoError } = await supabase
        .from("pagos_deudas")
        .insert({
          deuda_id: deudaSeleccionada.id,
          user_id: user.id,
          monto,
          fecha: pagoFecha || fechaLocal(),
        });

      if (pagoError) {
        console.error(pagoError);
        setMensaje("No se pudo registrar el pago.");
        return;
      }

      const nuevoPagado =
        Number(deudaSeleccionada.monto_pagado) + monto;

      const { error: deudaError } = await supabase
        .from("deudas")
        .update({
          monto_pagado: nuevoPagado,
        })
        .eq("id", deudaSeleccionada.id)
        .eq("user_id", user.id);

      if (deudaError) {
        console.error(deudaError);
        setMensaje("El pago se guardó, pero no se pudo actualizar la deuda.");
        return;
      }

      setPagoMonto("");
      setPagoFecha(fechaLocal());
      cerrarModales();
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function agregarCuenta(e: React.FormEvent) {
    e.preventDefault();

    if (!cuentaNombre.trim()) {
      setMensaje("Ingresá un nombre para la cuenta.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("cuentas_financieras").insert({
        user_id: user.id,
        nombre: cuentaNombre.trim(),
        tipo: cuentaTipo,
        saldo: Number(cuentaSaldo) || 0,
        moneda: "ARS",
        color: cuentaColor,
        activa: true,
      });

      if (error) {
        console.error(error);
        setMensaje("No se pudo guardar la cuenta.");
        return;
      }

      setCuentaNombre("");
      setCuentaTipo("Efectivo");
      setCuentaSaldo("");
      setCuentaColor("white");

      cerrarModales();
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarCuenta(id: string) {
    if (!confirm("¿Eliminar esta cuenta?")) return;

    const { error } = await supabase
      .from("cuentas_financieras")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la cuenta.");
      return;
    }

    setCuentas((actual) =>
      actual.filter((cuenta) => cuenta.id !== id)
    );
  }

  async function agregarMeta(e: React.FormEvent) {
    e.preventDefault();

    const objetivo = Number(metaObjetivo);
    const ahorrado = Number(metaAhorrado) || 0;

    if (!metaNombre.trim() || !objetivo || objetivo <= 0) {
      setMensaje("Completá el nombre y un objetivo válido.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("metas_financieras").insert({
        user_id: user.id,
        nombre: metaNombre.trim(),
        objetivo,
        ahorrado,
        fecha_objetivo: metaFecha || null,
        color: metaColor,
        completada: ahorrado >= objetivo,
      });

      if (error) {
        console.error(error);
        setMensaje("No se pudo guardar la meta.");
        return;
      }

      setMetaNombre("");
      setMetaObjetivo("");
      setMetaAhorrado("");
      setMetaFecha("");
      setMetaColor("white");

      cerrarModales();
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarMeta(id: string) {
    if (!confirm("¿Eliminar esta meta?")) return;

    const { error } = await supabase
      .from("metas_financieras")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la meta.");
      return;
    }

    setMetas((actual) => actual.filter((meta) => meta.id !== id));
  }

  const ingresos = useMemo(
    () =>
      movimientos
        .filter((mov) => mov.tipo === "ingreso")
        .reduce((sum, mov) => sum + Number(mov.monto || 0), 0),
    [movimientos]
  );

  const gastos = useMemo(
    () =>
      movimientos
        .filter((mov) => mov.tipo === "gasto")
        .reduce((sum, mov) => sum + Number(mov.monto || 0), 0),
    [movimientos]
  );

  const balance = ingresos - gastos;

  const patrimonio = useMemo(
    () =>
      cuentas.reduce(
        (sum, cuenta) => sum + Number(cuenta.saldo || 0),
        0
      ),
    [cuentas]
  );

  const deudaPendiente = useMemo(
    () =>
      deudas.reduce(
        (sum, deuda) =>
          sum +
          Math.max(
            Number(deuda.monto_total || 0) -
              Number(deuda.monto_pagado || 0),
            0
          ),
        0
      ),
    [deudas]
  );

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    let lista = movimientos;

    if (periodo === "actual") {
      const mesActual = fechaLocal().slice(0, 7);

      lista = lista.filter(
        (mov) => mov.fecha?.slice(0, 7) === mesActual
      );
    }

    if (texto) {
      lista = lista.filter((mov) =>
        [
          mov.descripcion,
          mov.categoria,
          mov.medio_pago,
          mov.cuenta,
          mov.notas,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(texto)
      );
    }

    return lista;
  }, [movimientos, periodo, busqueda]);

  const gastosCategorias = useMemo(() => {
    const mapa: Record<string, number> = {};

    movimientosFiltrados
      .filter((mov) => mov.tipo === "gasto")
      .forEach((mov) => {
        const categoria = mov.categoria || "Otros";

        mapa[categoria] =
          (mapa[categoria] || 0) + Number(mov.monto || 0);
      });

    return Object.entries(mapa)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);
  }, [movimientosFiltrados]);

  const meses = useMemo(() => {
    const resultado = [];
    const ahora = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(
        ahora.getFullYear(),
        ahora.getMonth() - i,
        1
      );

      const clave = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;

      const nombre = fecha.toLocaleDateString("es-AR", {
        month: "short",
      });

      const lista = movimientos.filter(
        (mov) => mov.fecha?.slice(0, 7) === clave
      );

      const ingresosMes = lista
        .filter((mov) => mov.tipo === "ingreso")
        .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

      const gastosMes = lista
        .filter((mov) => mov.tipo === "gasto")
        .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

      resultado.push({
        clave,
        nombre: nombre.replace(".", ""),
        ingresos: ingresosMes,
        gastos: gastosMes,
      });
    }

    return resultado;
  }, [movimientos]);

  const maxMes = Math.max(
    1,
    ...meses.flatMap((mes) => [mes.ingresos, mes.gastos])
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "movimientos", label: "Movimientos" },
    { id: "deudas", label: "Deudas" },
    { id: "cuentas", label: "Cuentas" },
    { id: "metas", label: "Metas" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      <Sidebar />

      <main className="min-h-screen md:ml-[270px]">
        <div className="mx-auto max-w-[1700px] px-4 pb-28 pt-[88px] sm:px-6 md:px-8 md:pb-10 md:pt-8 lg:px-10">

          {/* HEADER */}
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 sm:text-xs">
                  Finanzas
                </p>

                <h1 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-4xl">
                  Tu dinero, bajo control.
                </h1>

                <p className="mt-2 max-w-xl text-xs leading-5 text-white/35 sm:text-sm">
                  Una vista clara de lo que entra, lo que sale, lo que
                  debés y lo que estás construyendo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  onClick={() => setModalMovimiento(true)}
                  className="min-h-11 rounded-xl bg-white px-3 py-3 text-xs font-medium text-black transition active:scale-[0.98] sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  + Movimiento
                </button>

                <button
                  onClick={() => setModalDeuda(true)}
                  className="min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs text-white/70 transition active:scale-[0.98] hover:bg-white/[0.08] hover:text-white sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  + Deuda
                </button>
              </div>
            </div>
          </header>

          {/* TABS */}
          <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-1 rounded-2xl border border-white/10 bg-white/[0.025] p-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`min-h-10 rounded-xl px-3.5 py-2 text-xs transition sm:px-4 sm:text-sm ${
                    tab === item.id
                      ? "bg-white text-black"
                      : "text-white/35 active:bg-white/[0.05] hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* MENSAJE */}
          {mensaje && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/60 sm:text-sm">
              <span className="flex-1">{mensaje}</span>

              <button
                onClick={() => setMensaje("")}
                className="shrink-0 text-lg leading-none text-white/30 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          {/* RESUMEN */}
          {tab === "resumen" && (
            <div className="space-y-4 sm:space-y-6">

              {/* KPIs */}
              <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                  <p className="text-[10px] text-white/30 sm:text-xs">
                    Balance
                  </p>

                  <p className="mt-4 break-words text-xl font-semibold tracking-tight sm:mt-5 sm:text-2xl">
                    {loading ? "—" : dinero(balance)}
                  </p>

                  <p className="mt-2 text-[9px] text-white/25 sm:text-[11px]">
                    ingresos − gastos
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                  <p className="text-[10px] text-white/30 sm:text-xs">
                    Ingresos
                  </p>

                  <p className="mt-4 break-words text-xl font-semibold tracking-tight sm:mt-5 sm:text-2xl">
                    {loading ? "—" : dinero(ingresos)}
                  </p>

                  <p className="mt-2 text-[9px] text-white/25 sm:text-[11px]">
                    período seleccionado
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                  <p className="text-[10px] text-white/30 sm:text-xs">
                    Gastos
                  </p>

                  <p className="mt-4 break-words text-xl font-semibold tracking-tight sm:mt-5 sm:text-2xl">
                    {loading ? "—" : dinero(gastos)}
                  </p>

                  <p className="mt-2 text-[9px] text-white/25 sm:text-[11px]">
                    período seleccionado
                  </p>
                </div>

                <div className="col-span-2 min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5 lg:col-span-1">
                  <p className="text-[10px] text-white/30 sm:text-xs">
                    Patrimonio
                  </p>

                  <p className="mt-4 break-words text-xl font-semibold tracking-tight sm:mt-5 sm:text-2xl">
                    {loading ? "—" : dinero(patrimonio)}
                  </p>

                  <p className="mt-2 text-[9px] text-white/25 sm:text-[11px]">
                    {cuentas.length} cuentas activas
                  </p>
                </div>
              </section>

              {/* GRAFICO */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                      Evolución
                    </p>

                    <h2 className="mt-1 text-base font-medium sm:text-lg">
                      Ingresos y gastos
                    </h2>
                  </div>

                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="min-h-10 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-white/50 outline-none sm:w-auto"
                  >
                    <option value="actual">Mes actual</option>
                    <option value="todo">Todos los movimientos</option>
                  </select>
                </div>

                <div className="flex h-52 items-end gap-1.5 sm:h-64 sm:gap-5">
                  {meses.map((mes) => {
                    const ingresosAltura =
                      mes.ingresos > 0
                        ? Math.max(
                            (mes.ingresos / maxMes) * 100,
                            4
                          )
                        : 2;

                    const gastosAltura =
                      mes.gastos > 0
                        ? Math.max(
                            (mes.gastos / maxMes) * 100,
                            4
                          )
                        : 2;

                    return (
                      <div
                        key={mes.clave}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        <div className="flex h-full items-end justify-center gap-0.5 sm:gap-1">
                          <div
                            title={`Ingresos ${dinero(mes.ingresos)}`}
                            className="w-2.5 rounded-t-md bg-white/60 transition hover:bg-white sm:w-6 sm:rounded-t-lg"
                            style={{
                              height: `${ingresosAltura}%`,
                            }}
                          />

                          <div
                            title={`Gastos ${dinero(mes.gastos)}`}
                            className="w-2.5 rounded-t-md bg-white/10 transition hover:bg-white/20 sm:w-6 sm:rounded-t-lg"
                            style={{
                              height: `${gastosAltura}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 truncate text-center text-[9px] capitalize text-white/25 sm:text-[10px]">
                          {mes.nombre}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-4 border-t border-white/5 pt-4 text-[10px] text-white/30 sm:mt-5 sm:gap-5 sm:text-[11px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-white/60" />
                    Ingresos
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-white/10" />
                    Gastos
                  </span>
                </div>
              </section>

              {/* DISTRIBUCION */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                  Distribución
                </p>

                <h2 className="mt-1 text-base font-medium sm:text-lg">
                  Tus gastos
                </h2>

                <div className="mt-6 space-y-5">
                  {gastosCategorias.length === 0 ? (
                    <p className="text-xs text-white/25 sm:text-sm">
                      No hay gastos en este período.
                    </p>
                  ) : (
                    gastosCategorias.map(([categoria, monto]) => {
                      const porcentajeCategoria =
                        gastos > 0 ? (monto / gastos) * 100 : 0;

                      return (
                        <div key={categoria}>
                          <div className="mb-2 flex justify-between gap-3">
                            <span className="truncate text-xs text-white/50">
                              {categoria}
                            </span>

                            <span className="shrink-0 text-xs text-white/30">
                              {Math.round(porcentajeCategoria)}%
                            </span>
                          </div>

                          <div className="h-1.5 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-white/45"
                              style={{
                                width: `${Math.min(
                                  porcentajeCategoria,
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                          <p className="mt-1 text-[10px] text-white/20">
                            {dinero(monto)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* DEUDAS + METAS */}
              <section className="grid gap-4 lg:grid-cols-2 lg:gap-6">

                {/* DEUDAS */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                        Deudas
                      </p>

                      <h2 className="mt-1 text-base font-medium sm:text-lg">
                        Lo que falta pagar
                      </h2>
                    </div>

                    <button
                      onClick={() => setTab("deudas")}
                      className="shrink-0 text-[10px] text-white/30 hover:text-white sm:text-xs"
                    >
                      Ver todas →
                    </button>
                  </div>

                  <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mb-6 sm:p-5">
                    <p className="text-[10px] text-white/30 sm:text-xs">
                      Total pendiente
                    </p>

                    <p className="mt-2 break-words text-2xl font-semibold sm:text-3xl">
                      {dinero(deudaPendiente)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {deudas
                      .filter(
                        (deuda) =>
                          Number(deuda.monto_total) >
                          Number(deuda.monto_pagado)
                      )
                      .slice(0, 4)
                      .map((deuda) => {
                        const pendiente =
                          Number(deuda.monto_total) -
                          Number(deuda.monto_pagado);

                        return (
                          <div
                            key={deuda.id}
                            className="flex min-w-0 items-center gap-3 rounded-xl p-3"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs">
                              $
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-white/70 sm:text-sm">
                                {deuda.nombre || "Deuda"}
                              </p>

                              <p className="truncate text-[9px] text-white/25 sm:text-[10px]">
                                {deuda.fecha_vencimiento
                                  ? `Vence ${fechaBonita(
                                      deuda.fecha_vencimiento
                                    )}`
                                  : "Sin vencimiento"}
                              </p>
                            </div>

                            <p className="shrink-0 text-xs text-white/50 sm:text-sm">
                              {dinero(pendiente)}
                            </p>
                          </div>
                        );
                      })}

                    {deudas.filter(
                      (deuda) =>
                        Number(deuda.monto_total) >
                        Number(deuda.monto_pagado)
                    ).length === 0 && (
                      <p className="px-3 py-5 text-center text-xs text-white/25">
                        No tenés deudas pendientes.
                      </p>
                    )}
                  </div>
                </div>

                {/* METAS */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                        Metas
                      </p>

                      <h2 className="mt-1 text-base font-medium sm:text-lg">
                        Lo que estás construyendo
                      </h2>
                    </div>

                    <button
                      onClick={() => setTab("metas")}
                      className="shrink-0 text-[10px] text-white/30 hover:text-white sm:text-xs"
                    >
                      Ver todas →
                    </button>
                  </div>

                  <div className="space-y-5">
                    {metas.slice(0, 4).map((meta) => {
                      const progreso = porcentaje(
                        Number(meta.ahorrado),
                        Number(meta.objetivo)
                      );

                      return (
                        <div key={meta.id}>
                          <div className="mb-2 flex justify-between gap-3">
                            <span className="truncate text-xs text-white/60 sm:text-sm">
                              {meta.nombre}
                            </span>

                            <span className="shrink-0 text-xs text-white/30">
                              {Math.round(progreso)}%
                            </span>
                          </div>

                          <div className="h-1.5 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-white/50"
                              style={{
                                width: `${progreso}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex justify-between text-[9px] text-white/20 sm:text-[10px]">
                            <span>{dinero(meta.ahorrado)}</span>
                            <span>{dinero(meta.objetivo)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {metas.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/25">
                        Todavía no tenés metas.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* MOVIMIENTOS */}
          {tab === "movimientos" && (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
              <div className="border-b border-white/5 p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                      Registro
                    </p>

                    <h2 className="mt-1 text-lg font-medium sm:text-xl">
                      Todos tus movimientos
                    </h2>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar movimiento..."
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                    />

                    <select
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/50 outline-none sm:w-auto"
                    >
                      <option value="actual">Mes actual</option>
                      <option value="todo">Todo</option>
                    </select>
                  </div>
                </div>
              </div>

              {movimientosFiltrados.length === 0 ? (
                <div className="p-12 text-center text-xs text-white/25 sm:text-sm">
                  No encontramos movimientos.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {movimientosFiltrados.map((mov) => (
                    <div
                      key={mov.id}
                      className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-6"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-sm sm:h-10 sm:w-10">
                        {mov.tipo === "ingreso" ? "+" : "−"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white/75 sm:text-sm">
                          {mov.descripcion ||
                            mov.categoria ||
                            "Movimiento"}
                        </p>

                        <p className="mt-1 truncate text-[9px] text-white/25 sm:text-[10px]">
                          {fechaBonita(mov.fecha)} ·{" "}
                          {mov.categoria || "Otros"}
                          {mov.medio_pago
                            ? ` · ${mov.medio_pago}`
                            : ""}
                        </p>
                      </div>

                      <p
                        className={`shrink-0 text-xs font-medium sm:text-sm ${
                          mov.tipo === "ingreso"
                            ? "text-white"
                            : "text-white/50"
                        }`}
                      >
                        {mov.tipo === "ingreso" ? "+" : "-"}
                        {dinero(mov.monto)}
                      </p>

                      <button
                        onClick={() => eliminarMovimiento(mov.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-white/15 transition active:bg-white/5 hover:text-white/60"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* DEUDAS */}
          {tab === "deudas" && (
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                    Deudas
                  </p>

                  <h2 className="mt-1 text-xl font-medium sm:text-2xl">
                    Lo que todavía falta pagar
                  </h2>
                </div>

                <button
                  onClick={() => setModalDeuda(true)}
                  className="min-h-11 w-full rounded-xl bg-white px-4 py-3 text-xs font-medium text-black sm:w-fit sm:text-sm"
                >
                  + Nueva deuda
                </button>
              </div>

              {deudas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center sm:p-14">
                  <p className="text-xs text-white/40 sm:text-sm">
                    No tenés deudas registradas.
                  </p>

                  <button
                    onClick={() => setModalDeuda(true)}
                    className="mt-3 text-xs text-white/25 hover:text-white"
                  >
                    Registrar una deuda →
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                  {deudas.map((deuda) => {
                    const total = Number(deuda.monto_total);
                    const pagado = Number(deuda.monto_pagado);
                    const pendiente = Math.max(total - pagado, 0);
                    const progreso = porcentaje(pagado, total);
                    const dias = diasPara(deuda.fecha_vencimiento);

                    return (
                      <div
                        key={deuda.id}
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-medium sm:text-base">
                              {deuda.nombre || "Deuda sin nombre"}
                            </h3>

                            {deuda.descripcion && (
                              <p className="mt-1 line-clamp-2 text-[10px] text-white/25 sm:text-xs">
                                {deuda.descripcion}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => eliminarDeuda(deuda.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-white/15 hover:text-white/60"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-3">
                          <div className="min-w-0">
                            <p className="text-[9px] text-white/25 sm:text-[10px]">
                              Total
                            </p>

                            <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">
                              {dinero(total)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[9px] text-white/25 sm:text-[10px]">
                              Pagado
                            </p>

                            <p className="mt-1 truncate text-xs text-white/60 sm:text-sm">
                              {dinero(pagado)}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[9px] text-white/25 sm:text-[10px]">
                              Falta
                            </p>

                            <p className="mt-1 truncate text-xs font-medium sm:text-sm">
                              {dinero(pendiente)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex justify-between gap-3 text-[9px] text-white/25 sm:text-[10px]">
                            <span>{Math.round(progreso)}% pagado</span>

                            <span className="truncate">
                              {deuda.fecha_vencimiento
                                ? fechaBonita(
                                    deuda.fecha_vencimiento
                                  )
                                : "Sin vencimiento"}
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-white/50 transition-all"
                              style={{
                                width: `${progreso}%`,
                              }}
                            />
                          </div>
                        </div>

                        {dias !== null && pendiente > 0 && (
                          <p
                            className={`mt-4 text-[10px] ${
                              dias < 0
                                ? "text-white/60"
                                : "text-white/25"
                            }`}
                          >
                            {dias < 0
                              ? `Vencida hace ${Math.abs(dias)} días`
                              : dias === 0
                              ? "Vence hoy"
                              : dias === 1
                              ? "Vence mañana"
                              : `Vence en ${dias} días`}
                          </p>
                        )}

                        {pendiente > 0 ? (
                          <button
                            onClick={() => {
                              setDeudaSeleccionada(deuda);
                              setPagoMonto("");
                              setPagoFecha(fechaLocal());
                              setModalPago(true);
                            }}
                            className="mt-5 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs text-white/60 transition active:scale-[0.99] hover:bg-white/[0.08] hover:text-white sm:text-sm"
                          >
                            Registrar pago
                          </button>
                        ) : (
                          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-xs text-white/45 sm:text-sm">
                            ✓ Deuda saldada
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* CUENTAS */}
          {tab === "cuentas" && (
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                    Cuentas
                  </p>

                  <h2 className="mt-1 text-xl font-medium sm:text-2xl">
                    Dónde está tu plata
                  </h2>
                </div>

                <button
                  onClick={() => setModalCuenta(true)}
                  className="min-h-11 w-full rounded-xl bg-white px-4 py-3 text-xs font-medium text-black sm:w-fit sm:text-sm"
                >
                  + Nueva cuenta
                </button>
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mb-6 sm:p-6">
                <p className="text-[10px] text-white/25 sm:text-xs">
                  Patrimonio registrado
                </p>

                <p className="mt-2 break-words text-2xl font-semibold sm:text-3xl">
                  {dinero(patrimonio)}
                </p>
              </div>

              {cuentas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-xs text-white/25 sm:p-14 sm:text-sm">
                  Todavía no tenés cuentas.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {cuentas.map((cuenta) => (
                    <div
                      key={cuenta.id}
                      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-xs">
                          $
                        </div>

                        <button
                          onClick={() => eliminarCuenta(cuenta.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-white/15 hover:text-white/60"
                        >
                          ×
                        </button>
                      </div>

                      <p className="mt-5 text-xs text-white/50">
                        {cuenta.tipo}
                      </p>

                      <h3 className="mt-1 truncate text-base font-medium sm:text-lg">
                        {cuenta.nombre}
                      </h3>

                      <p className="mt-4 break-words text-2xl font-semibold sm:mt-5">
                        {dinero(Number(cuenta.saldo))}
                      </p>

                      <p className="mt-2 text-[9px] uppercase tracking-wider text-white/20">
                        {cuenta.moneda || "ARS"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* METAS */}
          {tab === "metas" && (
            <section>
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/25 sm:text-xs">
                    Metas
                  </p>

                  <h2 className="mt-1 text-xl font-medium sm:text-2xl">
                    Construí hacia algo
                  </h2>
                </div>

                <button
                  onClick={() => setModalMeta(true)}
                  className="min-h-11 w-full rounded-xl bg-white px-4 py-3 text-xs font-medium text-black sm:w-fit sm:text-sm"
                >
                  + Nueva meta
                </button>
              </div>

              {metas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-xs text-white/25 sm:p-14 sm:text-sm">
                  Todavía no tenés metas financieras.
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                  {metas.map((meta) => {
                    const progreso = porcentaje(
                      Number(meta.ahorrado),
                      Number(meta.objetivo)
                    );

                    const falta = Math.max(
                      Number(meta.objetivo) -
                        Number(meta.ahorrado),
                      0
                    );

                    return (
                      <div
                        key={meta.id}
                        className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] text-white/25 sm:text-xs">
                              Meta financiera
                            </p>

                            <h3 className="mt-1 truncate text-base font-medium sm:text-lg">
                              {meta.nombre}
                            </h3>
                          </div>

                          <button
                            onClick={() => eliminarMeta(meta.id)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-white/15 hover:text-white/60"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-6 flex items-end justify-between gap-4 sm:mt-7">
                          <div className="min-w-0">
                            <p className="break-words text-2xl font-semibold">
                              {dinero(meta.ahorrado)}
                            </p>

                            <p className="mt-1 text-xs text-white/25">
                              de {dinero(meta.objetivo)}
                            </p>
                          </div>

                          <span className="shrink-0 text-2xl font-medium text-white/40">
                            {Math.round(progreso)}%
                          </span>
                        </div>

                        <div className="mt-5 h-2 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-white/50 transition-all"
                            style={{
                              width: `${progreso}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 flex justify-between gap-3 text-[9px] text-white/20 sm:text-[10px]">
                          <span className="truncate">
                            {falta > 0
                              ? `Faltan ${dinero(falta)}`
                              : "Objetivo alcanzado"}
                          </span>

                          <span className="shrink-0">
                            {meta.fecha_objetivo
                              ? fechaBonita(meta.fecha_objetivo)
                              : "Sin fecha"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* MODAL MOVIMIENTO */}
          {modalMovimiento && (
            <Modal
              titulo="Nuevo movimiento"
              cerrar={cerrarModales}
            >
              <form onSubmit={agregarMovimiento} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovTipo("gasto")}
                    className={`min-h-11 rounded-xl border px-4 py-3 text-sm ${
                      movTipo === "gasto"
                        ? "border-white/20 bg-white text-black"
                        : "border-white/10 bg-white/[0.03] text-white/40"
                    }`}
                  >
                    Gasto
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovTipo("ingreso")}
                    className={`min-h-11 rounded-xl border px-4 py-3 text-sm ${
                      movTipo === "ingreso"
                        ? "border-white/20 bg-white text-black"
                        : "border-white/10 bg-white/[0.03] text-white/40"
                    }`}
                  >
                    Ingreso
                  </button>
                </div>

                <Campo
                  label="Monto"
                  value={movMonto}
                  onChange={setMovMonto}
                  placeholder="0"
                  type="number"
                />

                <Campo
                  label="Descripción"
                  value={movDescripcion}
                  onChange={setMovDescripcion}
                  placeholder="Ej: supermercado"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectCampo
                    label="Categoría"
                    value={movCategoria}
                    onChange={setMovCategoria}
                    opciones={[
                      "Alimentación",
                      "Transporte",
                      "Hogar",
                      "Servicios",
                      "Salud",
                      "Estudios",
                      "Ocio",
                      "Trabajo",
                      "Compras",
                      "Otros",
                    ]}
                  />

                  <SelectCampo
                    label="Medio de pago"
                    value={movMedio}
                    onChange={setMovMedio}
                    opciones={[
                      "Efectivo",
                      "Débito",
                      "Crédito",
                      "Transferencia",
                      "Mercado Pago",
                      "Otro",
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/30">
                    Fecha
                  </label>

                  <DatePicker
                    value={movFecha}
                    onChange={setMovFecha}
                  />
                </div>

                <SelectCampo
                  label="Cuenta"
                  value={movCuenta}
                  onChange={setMovCuenta}
                  opciones={[
                    "Sin asignar",
                    ...cuentas.map((cuenta) => cuenta.nombre),
                  ]}
                />

                <Campo
                  label="Notas"
                  value={movNotas}
                  onChange={setMovNotas}
                  placeholder="Opcional"
                />

                <BotonGuardar
                  loading={guardando}
                  texto="Guardar movimiento"
                />
              </form>
            </Modal>
          )}

          {/* MODAL DEUDA */}
          {modalDeuda && (
            <Modal
              titulo="Nueva deuda"
              cerrar={cerrarModales}
            >
              <form onSubmit={agregarDeuda} className="space-y-4">
                <Campo
                  label="Nombre"
                  value={deudaNombre}
                  onChange={setDeudaNombre}
                  placeholder="Ej: Banco, tarjeta, amigo..."
                />

                <Campo
                  label="Descripción"
                  value={deudaDescripcion}
                  onChange={setDeudaDescripcion}
                  placeholder="Opcional"
                />

                <Campo
                  label="Monto total"
                  value={deudaMonto}
                  onChange={setDeudaMonto}
                  placeholder="0"
                  type="number"
                />

                <div>
                  <label className="mb-2 block text-xs text-white/30">
                    Vencimiento
                  </label>

                  <DatePicker
                    value={deudaVencimiento}
                    onChange={setDeudaVencimiento}
                    placeholder="Sin vencimiento"
                  />
                </div>

                <BotonGuardar
                  loading={guardando}
                  texto="Guardar deuda"
                />
              </form>
            </Modal>
          )}

          {/* MODAL PAGO */}
          {modalPago && deudaSeleccionada && (
            <Modal
              titulo="Registrar pago"
              cerrar={cerrarModales}
            >
              <form onSubmit={registrarPago} className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-white/30">
                    Deuda
                  </p>

                  <p className="mt-1 truncate text-sm font-medium">
                    {deudaSeleccionada.nombre || "Deuda"}
                  </p>

                  <p className="mt-3 text-xs text-white/30">
                    Pendiente
                  </p>

                  <p className="break-words text-xl font-semibold">
                    {dinero(
                      Number(deudaSeleccionada.monto_total) -
                        Number(deudaSeleccionada.monto_pagado)
                    )}
                  </p>
                </div>

                <Campo
                  label="Monto del pago"
                  value={pagoMonto}
                  onChange={setPagoMonto}
                  placeholder="0"
                  type="number"
                />

                <div>
                  <label className="mb-2 block text-xs text-white/30">
                    Fecha del pago
                  </label>

                  <DatePicker
                    value={pagoFecha}
                    onChange={setPagoFecha}
                  />
                </div>

                <BotonGuardar
                  loading={guardando}
                  texto="Registrar pago"
                />
              </form>
            </Modal>
          )}

          {/* MODAL CUENTA */}
          {modalCuenta && (
            <Modal
              titulo="Nueva cuenta"
              cerrar={cerrarModales}
            >
              <form onSubmit={agregarCuenta} className="space-y-4">
                <Campo
                  label="Nombre"
                  value={cuentaNombre}
                  onChange={setCuentaNombre}
                  placeholder="Ej: Banco, efectivo..."
                />

                <SelectCampo
                  label="Tipo"
                  value={cuentaTipo}
                  onChange={setCuentaTipo}
                  opciones={[
                    "Efectivo",
                    "Banco",
                    "Billetera virtual",
                    "Tarjeta",
                    "Ahorro",
                    "Otro",
                  ]}
                />

                <Campo
                  label="Saldo inicial"
                  value={cuentaSaldo}
                  onChange={setCuentaSaldo}
                  placeholder="0"
                  type="number"
                />

                <BotonGuardar
                  loading={guardando}
                  texto="Guardar cuenta"
                />
              </form>
            </Modal>
          )}

          {/* MODAL META */}
          {modalMeta && (
            <Modal
              titulo="Nueva meta"
              cerrar={cerrarModales}
            >
              <form onSubmit={agregarMeta} className="space-y-4">
                <Campo
                  label="Nombre"
                  value={metaNombre}
                  onChange={setMetaNombre}
                  placeholder="Ej: Viaje, moto, PC..."
                />

                <Campo
                  label="Objetivo"
                  value={metaObjetivo}
                  onChange={setMetaObjetivo}
                  placeholder="0"
                  type="number"
                />

                <Campo
                  label="Ya ahorrado"
                  value={metaAhorrado}
                  onChange={setMetaAhorrado}
                  placeholder="0"
                  type="number"
                />

                <div>
                  <label className="mb-2 block text-xs text-white/30">
                    Fecha objetivo
                  </label>

                  <DatePicker
                    value={metaFecha}
                    onChange={setMetaFecha}
                    placeholder="Sin fecha"
                  />
                </div>

                <BotonGuardar
                  loading={guardando}
                  texto="Guardar meta"
                />
              </form>
            </Modal>
          )}

          <footer className="mt-10 border-t border-white/5 pt-6 text-center text-[9px] uppercase tracking-[0.18em] text-white/15 sm:mt-12 sm:text-[10px]">
            Vida Privada · Finanzas
          </footer>
        </div>
      </main>
    </div>
  );
}

function Modal({
  titulo,
  cerrar,
  children,
}: {
  titulo: string;
  cerrar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b0b] p-5 pb-8 shadow-2xl sm:rounded-[28px] sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="truncate text-lg font-medium">
            {titulo}
          </h2>

          <button
            type="button"
            onClick={cerrar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-white/40 hover:text-white"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-white/30">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="min-h-11 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
      />
    </div>
  );
}

function SelectCampo({
  label,
  value,
  onChange,
  opciones,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  opciones: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs text-white/30">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60 outline-none focus:border-white/25"
      >
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

function BotonGuardar({
  loading,
  texto,
}: {
  loading: boolean;
  texto: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 min-h-12 w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition active:scale-[0.99] hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Guardando..." : texto}
    </button>
  );
}