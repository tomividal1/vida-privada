"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import Sidebar from "../../components/Sidebar";
import DatePicker from "../../components/DatePicker";

type Deuda = {
  id: string;
  user_id: string;
  nombre: string | null;
  descripcion: string | null;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento: string | null;
};

type Pago = {
  id: string;
  deuda_id: string;
  user_id: string;
  monto: number;
  fecha: string | null;
  created_at: string;
};

type Filtro = "todas" | "pendientes" | "vencidas" | "pagadas";

function fechaLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fechaBonita(fecha: string | null) {
  if (!fecha) return "Sin vencimiento";

  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dinero(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

function diasPara(fecha: string | null) {
  if (!fecha) return null;

  const hoy = new Date(`${fechaLocal()}T00:00:00`);
  const vencimiento = new Date(`${fecha}T00:00:00`);

  return Math.ceil(
    (vencimiento.getTime() - hoy.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export default function DeudasPage() {
  const supabase = createClient();

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");

  const [modalDeuda, setModalDeuda] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [detalle, setDetalle] = useState<Deuda | null>(null);

  const [editando, setEditando] = useState<Deuda | null>(null);
  const [deudaPago, setDeudaPago] = useState<Deuda | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [vencimiento, setVencimiento] = useState("");

  const [montoPago, setMontoPago] = useState("");
  const [fechaPago, setFechaPago] = useState(fechaLocal());

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [mensaje]);

  async function cargarDatos() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [deudasResponse, pagosResponse] =
        await Promise.all([
          supabase
            .from("deudas")
            .select("*")
            .eq("user_id", user.id)
            .order("fecha_vencimiento", {
              ascending: true,
              nullsFirst: false,
            }),

          supabase
            .from("pagos_deudas")
            .select("*")
            .eq("user_id", user.id)
            .order("fecha", { ascending: false }),
        ]);

      if (deudasResponse.error) {
        console.error(deudasResponse.error);
        setMensaje("No se pudieron cargar las deudas.");
        return;
      }

      if (pagosResponse.error) {
        console.error(pagosResponse.error);
      }

      setDeudas(deudasResponse.data || []);
      setPagos(pagosResponse.data || []);
    } finally {
      setLoading(false);
    }
  }

  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setMonto("");
    setVencimiento("");
    setEditando(null);
  }

  function abrirNueva() {
    limpiarFormulario();
    setMensaje("");
    setModalDeuda(true);
  }

  function abrirEditar(deuda: Deuda) {
    setEditando(deuda);
    setNombre(deuda.nombre || "");
    setDescripcion(deuda.descripcion || "");
    setMonto(String(deuda.monto_total));
    setVencimiento(deuda.fecha_vencimiento || "");
    setDetalle(null);
    setMensaje("");
    setModalDeuda(true);
  }

  function cerrarModalDeuda() {
    setModalDeuda(false);
    limpiarFormulario();
  }

  async function guardarDeuda(e: React.FormEvent) {
    e.preventDefault();

    const montoNumerico = Number(monto);

    if (!montoNumerico || montoNumerico <= 0) {
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

      const datos = {
        nombre: nombre.trim() || null,
        descripcion: descripcion.trim() || null,
        monto_total: montoNumerico,
        fecha_vencimiento: vencimiento || null,
      };

      if (editando) {
        if (montoNumerico < editando.monto_pagado) {
          setMensaje(
            "El monto total no puede ser menor a lo que ya pagaste."
          );
          return;
        }

        const { error } = await supabase
          .from("deudas")
          .update(datos)
          .eq("id", editando.id)
          .eq("user_id", user.id);

        if (error) {
          console.error(error);
          setMensaje("No se pudo actualizar la deuda.");
          return;
        }
      } else {
        const { error } = await supabase
          .from("deudas")
          .insert({
            ...datos,
            user_id: user.id,
            monto_pagado: 0,
          });

        if (error) {
          console.error(error);
          setMensaje("No se pudo crear la deuda.");
          return;
        }
      }

      cerrarModalDeuda();
      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarDeuda(deuda: Deuda) {
    if (
      !confirm(
        `¿Eliminar la deuda "${deuda.nombre || "Sin nombre"}"?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("deudas")
      .delete()
      .eq("id", deuda.id)
      .eq("user_id", deuda.user_id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar la deuda.");
      return;
    }

    setDeudas((actual) =>
      actual.filter((item) => item.id !== deuda.id)
    );

    setPagos((actual) =>
      actual.filter((pago) => pago.deuda_id !== deuda.id)
    );

    setDetalle(null);
  }

  function abrirPago(deuda: Deuda) {
    const pendiente = Math.max(
      deuda.monto_total - deuda.monto_pagado,
      0
    );

    setDeudaPago(deuda);
    setMontoPago(String(pendiente));
    setFechaPago(fechaLocal());
    setDetalle(null);
    setMensaje("");
    setModalPago(true);
  }

  async function registrarPago(e: React.FormEvent) {
    e.preventDefault();

    if (!deudaPago) return;

    const montoNumerico = Number(montoPago);
    const pendiente =
      deudaPago.monto_total - deudaPago.monto_pagado;

    if (!montoNumerico || montoNumerico <= 0) {
      setMensaje("Ingresá un monto válido.");
      return;
    }

    if (montoNumerico > pendiente) {
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
          deuda_id: deudaPago.id,
          user_id: user.id,
          monto: montoNumerico,
          fecha: fechaPago || fechaLocal(),
        });

      if (pagoError) {
        console.error(pagoError);
        setMensaje("No se pudo registrar el pago.");
        return;
      }

      const nuevoPagado =
        Number(deudaPago.monto_pagado || 0) +
        montoNumerico;

      const { error: deudaError } = await supabase
        .from("deudas")
        .update({
          monto_pagado: nuevoPagado,
        })
        .eq("id", deudaPago.id)
        .eq("user_id", user.id);

      if (deudaError) {
        console.error(deudaError);
        setMensaje(
          "El pago se registró, pero no se pudo actualizar la deuda."
        );
        return;
      }

      setModalPago(false);
      setDeudaPago(null);
      setMontoPago("");

      await cargarDatos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarPago(pago: Pago) {
    const deuda = deudas.find(
      (item) => item.id === pago.deuda_id
    );

    if (!deuda) return;

    if (!confirm("¿Eliminar este pago?")) return;

    const { error } = await supabase
      .from("pagos_deudas")
      .delete()
      .eq("id", pago.id)
      .eq("user_id", pago.user_id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar el pago.");
      return;
    }

    const nuevoPagado = Math.max(
      Number(deuda.monto_pagado || 0) -
        Number(pago.monto || 0),
      0
    );

    const { error: updateError } = await supabase
      .from("deudas")
      .update({
        monto_pagado: nuevoPagado,
      })
      .eq("id", deuda.id)
      .eq("user_id", deuda.user_id);

    if (updateError) {
      console.error(updateError);
      setMensaje(
        "Se eliminó el pago, pero no se pudo actualizar la deuda."
      );
      return;
    }

    await cargarDatos();

    setDetalle((actual) =>
      actual?.id === deuda.id
        ? {
            ...actual,
            monto_pagado: nuevoPagado,
          }
        : actual
    );
  }

  const resumen = useMemo(() => {
    const total = deudas.reduce(
      (acc, deuda) => acc + Number(deuda.monto_total || 0),
      0
    );

    const pagado = deudas.reduce(
      (acc, deuda) => acc + Number(deuda.monto_pagado || 0),
      0
    );

    const pendiente = deudas.reduce(
      (acc, deuda) =>
        acc +
        Math.max(
          Number(deuda.monto_total || 0) -
            Number(deuda.monto_pagado || 0),
          0
        ),
      0
    );

    const vencidas = deudas.filter((deuda) => {
      const pendienteDeuda =
        deuda.monto_total - deuda.monto_pagado;

      return (
        pendienteDeuda > 0 &&
        deuda.fecha_vencimiento &&
        diasPara(deuda.fecha_vencimiento)! < 0
      );
    }).length;

    const proximas = deudas.filter((deuda) => {
      const pendienteDeuda =
        deuda.monto_total - deuda.monto_pagado;

      const dias = diasPara(deuda.fecha_vencimiento);

      return (
        pendienteDeuda > 0 &&
        dias !== null &&
        dias >= 0 &&
        dias <= 7
      );
    }).length;

    const porcentaje =
      total > 0 ? Math.min((pagado / total) * 100, 100) : 0;

    return {
      total,
      pagado,
      pendiente,
      vencidas,
      proximas,
      porcentaje,
    };
  }, [deudas]);

  const deudasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return deudas.filter((deuda) => {
      const pendiente =
        deuda.monto_total - deuda.monto_pagado;

      const dias = diasPara(deuda.fecha_vencimiento);

      const coincideBusqueda =
        !texto ||
        [
          deuda.nombre,
          deuda.descripcion,
          deuda.monto_total.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(texto);

      if (!coincideBusqueda) return false;

      if (filtro === "pendientes") {
        return pendiente > 0;
      }

      if (filtro === "pagadas") {
        return pendiente <= 0;
      }

      if (filtro === "vencidas") {
        return pendiente > 0 && dias !== null && dias < 0;
      }

      return true;
    });
  }, [deudas, busqueda, filtro]);

  const pagosDetalle = detalle
    ? pagos.filter((pago) => pago.deuda_id === detalle.id)
    : [];

  const porcentajeDetalle = detalle
    ? Math.min(
        (detalle.monto_pagado / detalle.monto_total) * 100,
        100
      )
    : 0;

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
                  Finanzas · Deudas
                </p>

                <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Todo lo que debés,
                  <br className="sm:hidden" /> bajo control.
                </h1>

                <p className="mt-3 max-w-xl text-xs leading-5 text-white/35 sm:text-sm sm:leading-6">
                  Registrá obligaciones, vencimientos y pagos para
                  saber exactamente cuánto te queda por pagar.
                </p>
              </div>

              <button
                type="button"
                onClick={abrirNueva}
                className="min-h-[48px] w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 active:scale-[0.99] sm:w-fit"
              >
                + Nueva deuda
              </button>
            </div>
          </header>

          {/* RESUMEN */}
          <section className="mb-4 grid grid-cols-2 gap-3 lg:mb-6 lg:grid-cols-5">
            <Stat
              label="Deuda total"
              value={dinero(resumen.total)}
            />

            <Stat
              label="Pendiente"
              value={dinero(resumen.pendiente)}
              destacado
            />

            <Stat
              label="Pagado"
              value={dinero(resumen.pagado)}
            />

            <Stat
              label="Vencidas"
              value={String(resumen.vencidas)}
            />

            <Stat
              label="Próximas 7 días"
              value={String(resumen.proximas)}
            />
          </section>

          {/* PROGRESO */}
          <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mb-6 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                  Progreso
                </p>

                <h2 className="mt-1 truncate text-sm font-medium sm:text-lg">
                  Estado general de tus deudas
                </h2>
              </div>

              <p className="shrink-0 text-2xl font-semibold sm:text-3xl">
                {resumen.porcentaje.toFixed(0)}%
              </p>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${resumen.porcentaje}%`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between gap-4 text-[9px] text-white/20 sm:text-[10px]">
              <span className="truncate">
                {dinero(resumen.pagado)} pagado
              </span>

              <span className="truncate text-right">
                {dinero(resumen.pendiente)} pendiente
              </span>
            </div>
          </section>

          {/* ALERTAS */}
          {(resumen.vencidas > 0 ||
            resumen.proximas > 0) && (
            <section className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2">
              {resumen.vencidas > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                    Atención
                  </p>

                  <p className="mt-2 text-base font-medium sm:text-lg">
                    {resumen.vencidas} deuda
                    {resumen.vencidas !== 1 ? "s" : ""} vencida
                    {resumen.vencidas !== 1 ? "s" : ""}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/30">
                    Revisá los vencimientos pendientes.
                  </p>
                </div>
              )}

              {resumen.proximas > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                    Próximamente
                  </p>

                  <p className="mt-2 text-base font-medium sm:text-lg">
                    {resumen.proximas} por vencer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/30">
                    Hay obligaciones dentro de los próximos 7 días.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* FILTROS */}
          <section className="mb-4">
            <div className="flex flex-col gap-3">
              <div className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="inline-flex min-w-max rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  {[
                    ["todas", "Todas"],
                    ["pendientes", "Pendientes"],
                    ["vencidas", "Vencidas"],
                    ["pagadas", "Pagadas"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFiltro(id as Filtro)}
                      className={`min-h-[40px] whitespace-nowrap rounded-lg px-4 text-[11px] transition ${
                        filtro === id
                          ? "bg-white text-black"
                          : "text-white/30 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar deuda..."
                className="min-h-[48px] w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
              />
            </div>
          </section>

          {/* LISTADO */}
          <section>
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-12 text-center text-sm text-white/25 sm:p-16">
                Cargando deudas...
              </div>
            ) : deudasFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-10 text-center sm:p-16">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-lg text-white/30">
                  ◈
                </div>

                <p className="mt-4 text-sm text-white/35">
                  No hay deudas para mostrar.
                </p>

                <button
                  type="button"
                  onClick={abrirNueva}
                  className="mt-3 min-h-[40px] text-xs text-white/25 transition hover:text-white/60"
                >
                  Crear una deuda →
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {deudasFiltradas.map((deuda) => {
                  const pendiente = Math.max(
                    deuda.monto_total - deuda.monto_pagado,
                    0
                  );

                  const porcentaje =
                    deuda.monto_total > 0
                      ? Math.min(
                          (deuda.monto_pagado /
                            deuda.monto_total) *
                            100,
                          100
                        )
                      : 0;

                  const dias = diasPara(
                    deuda.fecha_vencimiento
                  );

                  const vencida =
                    pendiente > 0 &&
                    dias !== null &&
                    dias < 0;

                  const proxima =
                    pendiente > 0 &&
                    dias !== null &&
                    dias >= 0 &&
                    dias <= 7;

                  const pagada = pendiente <= 0;

                  return (
                    <article
                      key={deuda.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition sm:p-5 md:hover:border-white/15 md:hover:bg-white/[0.035]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-medium text-white/80">
                            {deuda.nombre || "Deuda sin nombre"}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/25">
                            {deuda.descripcion ||
                              "Sin descripción"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[8px] uppercase tracking-wider sm:px-2.5 sm:text-[9px] ${
                            pagada
                              ? "border-white/10 bg-white/[0.05] text-white/45"
                              : vencida
                              ? "border-white/20 bg-white/[0.08] text-white/70"
                              : proxima
                              ? "border-white/15 bg-white/[0.05] text-white/55"
                              : "border-white/8 text-white/25"
                          }`}
                        >
                          {pagada
                            ? "Pagada"
                            : vencida
                            ? "Vencida"
                            : proxima
                            ? "Próxima"
                            : "Pendiente"}
                        </span>
                      </div>

                      <div className="mt-5">
                        <p className="text-[9px] uppercase tracking-wider text-white/20">
                          Pendiente
                        </p>

                        <p className="mt-1 text-2xl font-semibold">
                          {dinero(pendiente)}
                        </p>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex justify-between gap-3 text-[9px] text-white/25">
                          <span className="truncate">
                            Pagado {dinero(deuda.monto_pagado)}
                          </span>

                          <span className="shrink-0">
                            {porcentaje.toFixed(0)}%
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-white transition-all duration-500"
                            style={{
                              width: `${porcentaje}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-xl border border-white/6 bg-black/30 p-3">
                          <p className="text-[8px] uppercase tracking-wider text-white/20">
                            Total
                          </p>

                          <p className="mt-1 truncate text-xs text-white/45">
                            {dinero(deuda.monto_total)}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-xl border border-white/6 bg-black/30 p-3">
                          <p className="text-[8px] uppercase tracking-wider text-white/20">
                            Vencimiento
                          </p>

                          <p className="mt-1 truncate text-xs text-white/45">
                            {deuda.fecha_vencimiento
                              ? fechaBonita(
                                  deuda.fecha_vencimiento
                                )
                              : "Sin fecha"}
                          </p>
                        </div>
                      </div>

                      {deuda.fecha_vencimiento &&
                        !pagada && (
                          <p
                            className={`mt-3 text-[10px] ${
                              vencida
                                ? "text-white/60"
                                : "text-white/25"
                            }`}
                          >
                            {vencida
                              ? `Vencida hace ${Math.abs(
                                  dias || 0
                                )} días`
                              : dias === 0
                              ? "Vence hoy"
                              : `Vence en ${dias} días`}
                          </p>
                        )}

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                        {!pagada && (
                          <button
                            type="button"
                            onClick={() => abrirPago(deuda)}
                            className="col-span-2 min-h-[46px] rounded-xl bg-white py-3 text-xs font-medium text-black transition hover:bg-white/90 active:scale-[0.99] sm:col-span-1 sm:flex-1"
                          >
                            + Registrar pago
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDetalle(deuda)}
                          className="min-h-[46px] rounded-xl border border-white/10 px-4 py-3 text-xs text-white/40 transition hover:bg-white/[0.06] hover:text-white active:scale-[0.99]"
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirEditar(deuda)}
                          className="min-h-[46px] rounded-xl border border-white/10 px-4 py-3 text-xs text-white/40 transition hover:bg-white/[0.06] hover:text-white active:scale-[0.99]"
                        >
                          Editar
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* MENSAJE */}
          {mensaje && (
            <div className="fixed bottom-[88px] left-4 right-4 z-[200] rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-center text-xs text-white/65 shadow-2xl sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2 sm:px-5 sm:text-sm md:bottom-6">
              {mensaje}
            </div>
          )}

          {/* MODAL DEUDA */}
          {modalDeuda && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
              <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b0b] p-5 pb-8 shadow-2xl sm:rounded-[28px] sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                      Deudas
                    </p>

                    <h2 className="mt-1 text-lg font-medium">
                      {editando
                        ? "Editar deuda"
                        : "Nueva deuda"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={cerrarModalDeuda}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg text-white/40 transition hover:text-white active:scale-95"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={guardarDeuda}
                  className="space-y-5"
                >
                  <Campo
                    label="Nombre"
                    value={nombre}
                    onChange={setNombre}
                    placeholder="Ej: Tarjeta, préstamo, alquiler..."
                  />

                  <Campo
                    label="Monto total *"
                    value={monto}
                    onChange={setMonto}
                    placeholder="0"
                    type="number"
                  />

                  <div>
                    <label className="mb-2 block text-xs text-white/30">
                      Vencimiento
                    </label>

                    <DatePicker
                      value={vencimiento}
                      onChange={setVencimiento}
                      placeholder="Sin vencimiento"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/30">
                      Descripción
                    </label>

                    <textarea
                      value={descripcion}
                      onChange={(e) =>
                        setDescripcion(e.target.value)
                      }
                      rows={4}
                      placeholder="Detalles de esta deuda..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                    />
                  </div>

                  {editando &&
                    editando.monto_pagado > 0 && (
                      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                        <p className="text-[9px] uppercase tracking-wider text-white/20">
                          Ya pagado
                        </p>

                        <p className="mt-1 text-sm text-white/50">
                          {dinero(editando.monto_pagado)}
                        </p>
                      </div>
                    )}

                  <button
                    type="submit"
                    disabled={guardando}
                    className="min-h-[50px] w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardando
                      ? "Guardando..."
                      : editando
                      ? "Guardar cambios"
                      : "Crear deuda"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MODAL PAGO */}
          {modalPago && deudaPago && (
            <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
              <div className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b0b] p-5 pb-8 shadow-2xl sm:rounded-[28px] sm:p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                      Registrar pago
                    </p>

                    <h2 className="mt-1 truncate text-lg font-medium">
                      {deudaPago.nombre ||
                        "Deuda sin nombre"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setModalPago(false);
                      setDeudaPago(null);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg text-white/40 hover:text-white active:scale-95"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-wider text-white/20">
                    Pendiente actual
                  </p>

                  <p className="mt-2 text-2xl font-semibold">
                    {dinero(
                      deudaPago.monto_total -
                        deudaPago.monto_pagado
                    )}
                  </p>
                </div>

                <form
                  onSubmit={registrarPago}
                  className="space-y-5"
                >
                  <Campo
                    label="Monto del pago *"
                    value={montoPago}
                    onChange={setMontoPago}
                    type="number"
                    placeholder="0"
                  />

                  <div>
                    <label className="mb-2 block text-xs text-white/30">
                      Fecha del pago
                    </label>

                    <DatePicker
                      value={fechaPago}
                      onChange={setFechaPago}
                      placeholder="Seleccionar fecha"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={guardando}
                    className="min-h-[50px] w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardando
                      ? "Registrando..."
                      : "Registrar pago"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* DETALLE */}
          {detalle && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
              <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b0b] p-5 pb-8 shadow-2xl sm:rounded-[28px] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                      Detalle
                    </p>

                    <h2 className="mt-1 truncate text-xl font-medium">
                      {detalle.nombre ||
                        "Deuda sin nombre"}
                    </h2>

                    {detalle.descripcion && (
                      <p className="mt-1 text-xs leading-5 text-white/30">
                        {detalle.descripcion}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetalle(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg text-white/40 hover:text-white active:scale-95"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-7 sm:grid-cols-4 sm:gap-3">
                  <Info
                    label="Total"
                    value={dinero(detalle.monto_total)}
                  />

                  <Info
                    label="Pagado"
                    value={dinero(detalle.monto_pagado)}
                  />

                  <Info
                    label="Pendiente"
                    value={dinero(
                      Math.max(
                        detalle.monto_total -
                          detalle.monto_pagado,
                        0
                      )
                    )}
                  />

                  <Info
                    label="Vencimiento"
                    value={fechaBonita(
                      detalle.fecha_vencimiento
                    )}
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-[10px] text-white/25">
                    <span>Progreso</span>

                    <span>
                      {porcentajeDetalle.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{
                        width: `${porcentajeDetalle}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-7">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/20">
                        Historial
                      </p>

                      <h3 className="mt-1 text-sm font-medium">
                        Pagos realizados
                      </h3>
                    </div>

                    {detalle.monto_total >
                      detalle.monto_pagado && (
                      <button
                        type="button"
                        onClick={() => abrirPago(detalle)}
                        className="min-h-[44px] w-full rounded-xl bg-white px-4 py-2 text-[11px] font-medium text-black sm:w-fit"
                      >
                        + Pago
                      </button>
                    )}
                  </div>

                  {pagosDetalle.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-white/20">
                      Todavía no hay pagos registrados.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pagosDetalle.map((pago) => (
                        <div
                          key={pago.id}
                          className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xs text-white/40">
                            ✓
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white/60">
                              {dinero(pago.monto)}
                            </p>

                            <p className="mt-0.5 text-[10px] text-white/20">
                              {fechaBonita(pago.fecha)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarPago(pago)
                            }
                            className="min-h-[40px] shrink-0 px-2 text-[10px] text-white/20 transition hover:text-white/60"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {detalle.monto_total >
                    detalle.monto_pagado && (
                    <button
                      type="button"
                      onClick={() => abrirPago(detalle)}
                      className="min-h-[48px] rounded-xl bg-white py-3 text-sm font-medium text-black"
                    >
                      Registrar pago
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => abrirEditar(detalle)}
                    className="min-h-[48px] rounded-xl border border-white/10 py-3 text-sm text-white/40 transition hover:text-white"
                  >
                    Editar deuda
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => eliminarDeuda(detalle)}
                  className="mt-5 min-h-[40px] w-full py-2 text-xs text-white/15 transition hover:text-white/50"
                >
                  Eliminar deuda
                </button>
              </div>
            </div>
          )}

          <footer className="mt-10 border-t border-white/5 pt-6 text-center text-[9px] uppercase tracking-[0.18em] text-white/15 sm:mt-12 sm:text-[10px]">
            Vida Privada · Deudas
          </footer>
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  destacado = false,
}: {
  label: string;
  value: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${
        destacado
          ? "border-white/15 bg-white/[0.055]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="truncate text-[10px] text-white/30 sm:text-xs">
        {label}
      </p>

      <p className="mt-4 truncate text-base font-semibold sm:mt-5 sm:text-2xl">
        {value}
      </p>
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
        className="min-h-[48px] w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
      />
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/8 bg-white/[0.025] p-3 sm:p-4">
      <p className="truncate text-[8px] uppercase tracking-wider text-white/20 sm:text-[9px]">
        {label}
      </p>

      <p className="mt-2 truncate text-[11px] text-white/50 sm:text-xs">
        {value}
      </p>
    </div>
  );
}