"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import Sidebar from "../../components/Sidebar";

type Evento = {
  id: string;
  user_id?: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora: string | null;
  hora_fin: string | null;
  todo_el_dia: boolean;
  tipo: string;
  ubicacion: string | null;
  color: string | null;
  recordatorio_minutos: number | null;
  repeticion: string | null;
  completada: boolean;
};

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const diasSemana = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

const tipos = [
  {
    value: "tarea",
    label: "Tarea",
    icon: "✓",
  },
  {
    value: "evento",
    label: "Evento",
    icon: "●",
  },
  {
    value: "examen",
    label: "Examen",
    icon: "📚",
  },
  {
    value: "recordatorio",
    label: "Recordatorio",
    icon: "🔔",
  },
  {
    value: "pago",
    label: "Pago",
    icon: "💰",
  },
];

const colores = [
  {
    value: "zinc",
    label: "Gris",
    bg: "bg-zinc-700",
    text: "text-zinc-200",
    border: "border-zinc-600",
  },
  {
    value: "blue",
    label: "Azul",
    bg: "bg-blue-600",
    text: "text-blue-200",
    border: "border-blue-500",
  },
  {
    value: "red",
    label: "Rojo",
    bg: "bg-red-600",
    text: "text-red-200",
    border: "border-red-500",
  },
  {
    value: "green",
    label: "Verde",
    bg: "bg-green-600",
    text: "text-green-200",
    border: "border-green-500",
  },
  {
    value: "yellow",
    label: "Amarillo",
    bg: "bg-yellow-500",
    text: "text-yellow-100",
    border: "border-yellow-400",
  },
  {
    value: "purple",
    label: "Violeta",
    bg: "bg-purple-600",
    text: "text-purple-200",
    border: "border-purple-500",
  },
];

function formatoFecha(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fechaDesdeString(fecha: string) {
  return new Date(`${fecha}T12:00:00`);
}

function primerDiaDelMes(fecha: Date) {
  const dia = fecha.getDay();

  return dia === 0 ? 6 : dia - 1;
}

function nombreTipo(tipo: string) {
  return tipos.find((item) => item.value === tipo)?.label || "Evento";
}

function iconoTipo(tipo: string) {
  return tipos.find((item) => item.value === tipo)?.icon || "●";
}

function obtenerColor(color: string | null) {
  return colores.find((item) => item.value === color) || colores[0];
}

function formatearHora(hora: string | null) {
  if (!hora) return "";

  return hora.slice(0, 5);
}

function formatearFechaLarga(fecha: string) {
  return fechaDesdeString(fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Calendario() {
  const supabase = createClient();

  const hoy = new Date();
  const fechaHoy = formatoFecha(hoy);

  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [añoActual, setAñoActual] = useState(hoy.getFullYear());

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [errorMensaje, setErrorMensaje] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] =
    useState<Evento | null>(null);

  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(fechaHoy);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(fechaHoy);
  const [hora, setHora] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [todoElDia, setTodoElDia] = useState(false);
  const [tipo, setTipo] = useState("tarea");
  const [ubicacion, setUbicacion] = useState("");
  const [color, setColor] = useState("zinc");
  const [recordatorio, setRecordatorio] = useState("0");
  const [repeticion, setRepeticion] = useState("ninguna");

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarSelectorMes, setMostrarSelectorMes] = useState(false);

  async function cargarEventos() {
    setLoading(true);
    setErrorMensaje("");

    const inicio = `${añoActual}-${String(mesActual + 1).padStart(
      2,
      "0"
    )}-01`;

    const ultimoDia = new Date(
      añoActual,
      mesActual + 1,
      0
    ).getDate();

    const fin = `${añoActual}-${String(mesActual + 1).padStart(
      2,
      "0"
    )}-${String(ultimoDia).padStart(2, "0")}`;

    const {
      data: usuarioData,
      error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !usuarioData.user) {
      console.error("ERROR OBTENIENDO USUARIO:", usuarioError);

      setErrorMensaje("No se pudo identificar al usuario.");
      setEventos([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("calendario_tareas")
      .select("*")
      .eq("user_id", usuarioData.user.id)
      .gte("fecha", inicio)
      .lte("fecha", fin)
      .order("fecha", {
        ascending: true,
      })
      .order("hora", {
        ascending: true,
      });

    if (error) {
      console.error("ERROR CARGANDO CALENDARIO:", error);

      setErrorMensaje(
        "No se pudieron cargar los eventos: " + error.message
      );

      setEventos([]);
      setLoading(false);
      return;
    }

    setEventos((data || []) as Evento[]);
    setLoading(false);
  }

  useEffect(() => {
    cargarEventos();
  }, [mesActual, añoActual]);

  function cambiarMes(valor: number) {
    let nuevoMes = mesActual + valor;
    let nuevoAño = añoActual;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAño--;
    }

    if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAño++;
    }

    setMesActual(nuevoMes);
    setAñoActual(nuevoAño);
    setMostrarSelectorMes(false);
  }

  function irAHoy() {
    setMesActual(hoy.getMonth());
    setAñoActual(hoy.getFullYear());
    setFechaSeleccionada(fechaHoy);
    setMostrarSelectorMes(false);
  }

  function seleccionarMes(mes: number) {
    setMesActual(mes);
    setMostrarSelectorMes(false);
  }

  function abrirNuevoEvento(fechaNueva?: string) {
    const fechaFinal = fechaNueva || fechaSeleccionada;

    setEventoSeleccionado(null);

    setTitulo("");
    setDescripcion("");
    setFecha(fechaFinal);
    setHora("");
    setHoraFin("");
    setTodoElDia(false);
    setTipo("tarea");
    setUbicacion("");
    setColor("zinc");
    setRecordatorio("0");
    setRepeticion("ninguna");

    setMostrarFormulario(true);
  }

  function editarEvento(evento: Evento) {
    setEventoSeleccionado(evento);

    setTitulo(evento.titulo);
    setDescripcion(evento.descripcion || "");
    setFecha(evento.fecha);
    setHora(evento.hora || "");
    setHoraFin(evento.hora_fin || "");
    setTodoElDia(evento.todo_el_dia || false);
    setTipo(evento.tipo || "tarea");
    setUbicacion(evento.ubicacion || "");
    setColor(evento.color || "zinc");
    setRecordatorio(String(evento.recordatorio_minutos || 0));
    setRepeticion(evento.repeticion || "ninguna");

    setMostrarFormulario(true);
  }

  async function guardarEvento(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim()) {
      alert("Escribí un título para el evento.");
      return;
    }

    if (!fecha) {
      alert("Seleccioná una fecha.");
      return;
    }

    if (!todoElDia && hora && horaFin && horaFin < hora) {
      alert(
        "La hora de finalización no puede ser anterior a la hora de inicio."
      );
      return;
    }

    setGuardando(true);
    setErrorMensaje("");

    const {
      data: usuarioData,
      error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !usuarioData.user) {
      alert("No hay un usuario iniciado.");
      setGuardando(false);
      return;
    }

    const datos = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha,
      hora: todoElDia ? null : hora || null,
      hora_fin: todoElDia ? null : horaFin || null,
      todo_el_dia: todoElDia,
      tipo,
      ubicacion: ubicacion.trim() || null,
      color,
      recordatorio_minutos: Number(recordatorio),
      repeticion,
    };

    if (eventoSeleccionado) {
      const { error } = await supabase
        .from("calendario_tareas")
        .update(datos)
        .eq("id", eventoSeleccionado.id)
        .eq("user_id", usuarioData.user.id);

      if (error) {
        console.error("ERROR ACTUALIZANDO EVENTO:", error);

        alert("Error actualizando evento: " + error.message);
        setGuardando(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("calendario_tareas")
        .insert({
          ...datos,
          user_id: usuarioData.user.id,
          completada: false,
        });

      if (error) {
        console.error("ERROR CREANDO EVENTO:", error);

        alert("Error creando evento: " + error.message);
        setGuardando(false);
        return;
      }
    }

    setMostrarFormulario(false);
    setFechaSeleccionada(fecha);

    const fechaGuardada = fechaDesdeString(fecha);

    setMesActual(fechaGuardada.getMonth());
    setAñoActual(fechaGuardada.getFullYear());

    setGuardando(false);

    await cargarEventos();
  }

  async function eliminarEvento(id: string) {
    const confirmar = confirm(
      "¿Querés eliminar este evento?\n\nEsta acción no se puede deshacer."
    );

    if (!confirmar) return;

    const {
      data: usuarioData,
      error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !usuarioData.user) {
      alert("No hay un usuario iniciado.");
      return;
    }

    const { error } = await supabase
      .from("calendario_tareas")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioData.user.id);

    if (error) {
      console.error("ERROR ELIMINANDO:", error);

      alert("Error eliminando evento: " + error.message);
      return;
    }

    await cargarEventos();
  }

  async function completarEvento(evento: Evento) {
    const {
      data: usuarioData,
      error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !usuarioData.user) {
      alert("No hay un usuario iniciado.");
      return;
    }

    const { error } = await supabase
      .from("calendario_tareas")
      .update({
        completada: !evento.completada,
      })
      .eq("id", evento.id)
      .eq("user_id", usuarioData.user.id);

    if (error) {
      console.error("ERROR COMPLETANDO:", error);

      alert("Error actualizando evento: " + error.message);
      return;
    }

    await cargarEventos();
  }

  const diasDelMes = useMemo(() => {
    const cantidad = new Date(
      añoActual,
      mesActual + 1,
      0
    ).getDate();

    const espacios = primerDiaDelMes(
      new Date(añoActual, mesActual, 1)
    );

    const total = Math.ceil((espacios + cantidad) / 7) * 7;

    return Array.from({ length: total }, (_, index) => {
      const numero = index - espacios + 1;

      if (numero < 1 || numero > cantidad) {
        return null;
      }

      return numero;
    });
  }, [mesActual, añoActual]);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const texto = busqueda.toLowerCase().trim();

      const coincideBusqueda =
        !texto ||
        evento.titulo.toLowerCase().includes(texto) ||
        evento.descripcion?.toLowerCase().includes(texto) ||
        evento.ubicacion?.toLowerCase().includes(texto);

      const coincideTipo =
        filtroTipo === "todos" || evento.tipo === filtroTipo;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "pendientes" && !evento.completada) ||
        (filtroEstado === "completadas" && evento.completada);

      return coincideBusqueda && coincideTipo && coincideEstado;
    });
  }, [eventos, busqueda, filtroTipo, filtroEstado]);

  const eventosSeleccionados = eventosFiltrados.filter(
    (evento) => evento.fecha === fechaSeleccionada
  );

  function eventosDelDia(numero: number) {
    const fechaDia = `${añoActual}-${String(
      mesActual + 1
    ).padStart(2, "0")}-${String(numero).padStart(2, "0")}`;

    return eventosFiltrados.filter(
      (evento) => evento.fecha === fechaDia
    );
  }

  function esHoy(numero: number) {
    return (
      numero === hoy.getDate() &&
      mesActual === hoy.getMonth() &&
      añoActual === hoy.getFullYear()
    );
  }

  const cantidadPendientes = eventos.filter(
    (evento) => !evento.completada
  ).length;

  const cantidadCompletadas = eventos.filter(
    (evento) => evento.completada
  ).length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Sidebar />

      <div className="min-h-screen px-3 pb-28 pt-[88px] sm:px-4 md:ml-64 md:px-8 md:py-10 md:pb-10">

        {/* CABECERA */}

        <header className="mb-5 sm:mb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0">
              <p className="text-[10px] font-medium tracking-[0.3em] text-zinc-600 sm:text-xs">
                ORGANIZACIÓN
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Calendario
                </h1>

                <div className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[10px] text-zinc-500 sm:px-3 sm:text-xs">
                  {eventos.length}{" "}
                  {eventos.length === 1 ? "evento" : "eventos"}
                </div>
              </div>

              <p className="mt-2 max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-sm">
                Organizá tus días, eventos, tareas y pendientes desde un solo lugar.
              </p>
            </div>

            <button
              onClick={() => abrirNuevoEvento()}
              className="flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black shadow-lg shadow-white/5 transition hover:bg-zinc-200 active:scale-[0.98] sm:w-auto sm:px-6"
            >
              + Nuevo evento
            </button>
          </div>
        </header>

        {/* RESUMEN */}

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:grid-cols-4 sm:gap-3">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4">
            <p className="text-[9px] font-medium tracking-wider text-zinc-600 sm:text-xs">
              ESTE MES
            </p>

            <p className="mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl">
              {eventos.length}
            </p>

            <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
              eventos
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4">
            <p className="text-[9px] font-medium tracking-wider text-zinc-600 sm:text-xs">
              PENDIENTES
            </p>

            <p className="mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl">
              {cantidadPendientes}
            </p>

            <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
              por completar
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4">
            <p className="text-[9px] font-medium tracking-wider text-zinc-600 sm:text-xs">
              COMPLETADOS
            </p>

            <p className="mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl">
              {cantidadCompletadas}
            </p>

            <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
              terminados
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 sm:col-span-1 sm:p-4">
            <p className="text-[9px] font-medium tracking-wider text-zinc-600 sm:text-xs">
              SELECCIONADO
            </p>

            <p className="mt-1.5 truncate text-xs font-semibold capitalize sm:mt-2 sm:text-sm">
              {formatearFechaLarga(fechaSeleccionada)}
            </p>
          </div>
        </div>

        {/* BÚSQUEDA */}

        <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:mb-5 sm:p-4">

          <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row">

            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600">
                ⌕
              </span>

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar eventos..."
                className="w-full rounded-xl border border-zinc-800 bg-black py-3.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-600"
              />
            </div>

            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`rounded-xl border px-4 py-3.5 text-sm transition ${
                mostrarFiltros
                  ? "border-white bg-white text-black"
                  : "border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              ⚙ Filtros
            </button>
          </div>

          {mostrarFiltros && (
            <div className="mt-3 grid gap-3 border-t border-zinc-900 pt-3 sm:mt-4 sm:grid-cols-2 sm:pt-4">

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Tipo
                </label>

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm text-white outline-none"
                >
                  <option value="todos">Todos los tipos</option>

                  {tipos.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.icon} {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Estado
                </label>

                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-sm text-white outline-none"
                >
                  <option value="todos">Todos</option>
                  <option value="pendientes">Pendientes</option>
                  <option value="completadas">Completadas</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* NAVEGACIÓN DEL MES */}

        <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:mb-5 sm:p-4">

          <div className="flex items-center justify-between gap-2">

            <div className="flex items-center gap-1.5 sm:gap-2">

              <button
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white active:scale-95"
              >
                ←
              </button>

              <button
                onClick={() => irAHoy()}
                className="rounded-xl border border-zinc-800 px-3 py-2.5 text-xs font-medium transition hover:bg-zinc-900 sm:px-4 sm:text-sm"
              >
                Hoy
              </button>

              <button
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white active:scale-95"
              >
                →
              </button>
            </div>

            <div className="relative min-w-0">

              <button
                onClick={() =>
                  setMostrarSelectorMes(!mostrarSelectorMes)
                }
                className="max-w-[170px] truncate rounded-xl px-2 py-2 text-base font-semibold transition hover:bg-zinc-900 sm:max-w-none sm:px-5 sm:text-xl"
              >
                {meses[mesActual]} {añoActual}
                <span className="ml-1 text-[9px] text-zinc-600 sm:ml-2 sm:text-xs">
                  ▼
                </span>
              </button>

              {mostrarSelectorMes && (
                <div className="absolute right-0 top-full z-40 mt-2 w-[min(260px,calc(100vw-32px))] rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">

                  <div className="mb-3 grid grid-cols-3 gap-2">
                    {meses.map((nombre, index) => (
                      <button
                        key={nombre}
                        onClick={() => seleccionarMes(index)}
                        className={`rounded-lg px-2 py-2.5 text-xs transition ${
                          mesActual === index
                            ? "bg-white font-semibold text-black"
                            : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        {nombre.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 border-t border-zinc-900 pt-3">

                    <button
                      onClick={() => setAñoActual(añoActual - 1)}
                      className="flex-1 rounded-lg border border-zinc-800 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                      −
                    </button>

                    <span className="px-3 text-sm">
                      {añoActual}
                    </span>

                    <button
                      onClick={() => setAñoActual(añoActual + 1)}
                      className="flex-1 rounded-lg border border-zinc-800 py-2.5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-900 pt-3 text-[10px] text-zinc-500 sm:mt-4 sm:border-0 sm:pt-0 sm:text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
              Tarea
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Evento
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Examen
            </span>
          </div>
        </section>

        {/* ERROR */}

        {errorMensaje && (
          <div className="mb-4 rounded-2xl border border-red-900/50 bg-red-950/20 p-4 sm:mb-5">
            <p className="text-sm font-medium text-red-400">
              No se pudo cargar el calendario
            </p>

            <p className="mt-1 text-xs text-red-500/80">
              {errorMensaje}
            </p>

            <button
              onClick={() => cargarEventos()}
              className="mt-3 rounded-lg border border-red-900 px-3 py-2 text-xs text-red-400 hover:bg-red-950"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* CALENDARIO */}

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">

          {/* DÍAS */}

          <div className="grid grid-cols-7 border-b border-zinc-800 bg-black">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="border-r border-zinc-900 p-2 text-center text-[8px] font-semibold uppercase tracking-wider text-zinc-600 last:border-r-0 sm:p-4 sm:text-xs sm:tracking-widest"
              >
                {dia}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex h-[320px] items-center justify-center sm:h-[500px]">
              <div className="text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />

                <p className="text-sm text-zinc-600">
                  Cargando calendario...
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7">

              {diasDelMes.map((numero, index) => {

                if (!numero) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[58px] border-b border-r border-zinc-900 bg-black/40 sm:min-h-36"
                    />
                  );
                }

                const fechaDia = `${añoActual}-${String(
                  mesActual + 1
                ).padStart(2, "0")}-${String(numero).padStart(
                  2,
                  "0"
                )}`;

                const eventosDia = eventosDelDia(numero);
                const seleccionado =
                  fechaSeleccionada === fechaDia;

                const hayEventos = eventosDia.length > 0;

                return (
                  <div
                    key={fechaDia}
                    onClick={() => setFechaSeleccionada(fechaDia)}
                    onDoubleClick={() => abrirNuevoEvento(fechaDia)}
                    className={`group relative min-h-[58px] cursor-pointer border-b border-r border-zinc-900 p-1 transition sm:min-h-36 sm:p-2 ${
                      seleccionado
                        ? "bg-zinc-900/70"
                        : "hover:bg-zinc-900/50"
                    }`}
                  >

                    {seleccionado && (
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-white" />
                    )}

                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium sm:h-8 sm:w-8 sm:text-sm ${
                          esHoy(numero)
                            ? "bg-white font-bold text-black shadow-lg shadow-white/10"
                            : seleccionado
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-500 group-hover:text-white"
                        }`}
                      >
                        {numero}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirNuevoEvento(fechaDia);
                        }}
                        aria-label="Agregar evento"
                        className="hidden h-7 w-7 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-800 hover:text-white group-hover:flex"
                      >
                        +
                      </button>
                    </div>

                    {/* MOBILE */}

                    {hayEventos && (
                      <div className="mt-1.5 flex flex-wrap gap-1 px-0.5 sm:hidden">
                        {eventosDia.slice(0, 5).map((evento) => {
                          const colorEvento = obtenerColor(evento.color);

                          return (
                            <button
                              key={evento.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                editarEvento(evento);
                              }}
                              aria-label={evento.titulo}
                              className={`h-1.5 w-1.5 rounded-full ${colorEvento.bg} ${
                                evento.completada ? "opacity-30" : ""
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* DESKTOP */}

                    <div className="mt-2 hidden space-y-1 sm:block">
                      {eventosDia.slice(0, 4).map((evento) => {
                        const colorEvento = obtenerColor(evento.color);

                        return (
                          <button
                            key={evento.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              editarEvento(evento);
                            }}
                            className={`flex w-full items-center gap-2 truncate rounded-lg border px-2 py-1.5 text-left text-[11px] transition hover:brightness-125 ${colorEvento.border} bg-black/40 ${colorEvento.text} ${
                              evento.completada
                                ? "opacity-40 line-through"
                                : ""
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${colorEvento.bg}`}
                            />

                            <span className="truncate">
                              {evento.hora &&
                                `${formatearHora(evento.hora)} · `}
                              {evento.titulo}
                            </span>
                          </button>
                        );
                      })}

                      {eventosDia.length > 4 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFechaSeleccionada(fechaDia);
                          }}
                          className="px-2 text-[10px] text-zinc-600 hover:text-white"
                        >
                          +{eventosDia.length - 4} más
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DETALLE DEL DÍA */}

        <section className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:mt-6 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-white" />

                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                  Día seleccionado
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold capitalize sm:text-2xl">
                {formatearFechaLarga(fechaSeleccionada)}
              </h2>

              <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                {eventosSeleccionados.length}{" "}
                {eventosSeleccionados.length === 1
                  ? "actividad"
                  : "actividades"}
              </p>
            </div>

            <button
              onClick={() => abrirNuevoEvento(fechaSeleccionada)}
              className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm transition hover:bg-zinc-900 sm:w-auto sm:py-2.5"
            >
              + Agregar
            </button>
          </div>

          <div className="mt-5 space-y-3 sm:mt-6">

            {eventosSeleccionados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-7 text-center sm:p-8">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-xl text-zinc-600">
                  +
                </div>

                <p className="mt-4 text-sm font-medium text-zinc-400">
                  Día libre
                </p>

                <p className="mt-1 text-xs text-zinc-700">
                  No hay nada programado para este día.
                </p>
              </div>
            ) : (
              eventosSeleccionados.map((evento) => {
                const colorEvento = obtenerColor(evento.color);

                return (
                  <div
                    key={evento.id}
                    className={`rounded-2xl border border-zinc-800 bg-black/40 p-4 transition hover:border-zinc-700 sm:p-4 ${
                      evento.completada ? "opacity-60" : ""
                    }`}
                  >

                    <div className="flex flex-col gap-4">

                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">

                        <button
                          onClick={() => completarEvento(evento)}
                          aria-label={
                            evento.completada
                              ? "Marcar como pendiente"
                              : "Completar evento"
                          }
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                            evento.completada
                              ? "border-white bg-white text-black"
                              : `${colorEvento.border} hover:bg-zinc-900`
                          }`}
                        >
                          {evento.completada ? "✓" : ""}
                        </button>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3
                              className={`min-w-0 text-sm font-medium sm:text-base ${
                                evento.completada
                                  ? "text-zinc-600 line-through"
                                  : "text-white"
                              }`}
                            >
                              {evento.titulo}
                            </h3>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] ${colorEvento.border} ${colorEvento.text}`}
                            >
                              {iconoTipo(evento.tipo)}{" "}
                              {nombreTipo(evento.tipo)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-600 sm:flex-row sm:flex-wrap sm:gap-x-4">

                            <span>
                              {evento.todo_el_dia
                                ? "Todo el día"
                                : evento.hora
                                ? `${formatearHora(evento.hora)}${
                                    evento.hora_fin
                                      ? ` → ${formatearHora(
                                          evento.hora_fin
                                        )}`
                                      : ""
                                  }`
                                : "Sin horario"}
                            </span>

                            {evento.ubicacion && (
                              <span className="truncate">
                                📍 {evento.ubicacion}
                              </span>
                            )}
                          </div>

                          {evento.descripcion && (
                            <p className="mt-3 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                              {evento.descripcion}
                            </p>
                          )}

                          {evento.recordatorio_minutos &&
                            evento.recordatorio_minutos > 0 && (
                              <p className="mt-2 text-[10px] text-zinc-700 sm:text-xs">
                                🔔 Recordatorio{" "}
                                {evento.recordatorio_minutos < 60
                                  ? `${evento.recordatorio_minutos} min antes`
                                  : evento.recordatorio_minutos === 60
                                  ? "1 hora antes"
                                  : `${evento.recordatorio_minutos / 60} horas antes`}
                              </p>
                            )}

                          {evento.repeticion &&
                            evento.repeticion !== "ninguna" && (
                              <p className="mt-2 text-[10px] text-zinc-700 sm:text-xs">
                                ↻ Repite {evento.repeticion}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="flex w-full gap-2 border-t border-zinc-900 pt-3 sm:justify-end sm:border-0 sm:pt-0">

                        <button
                          onClick={() => editarEvento(evento)}
                          className="flex-1 rounded-lg border border-zinc-800 px-3 py-2.5 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-white sm:flex-none"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => eliminarEvento(evento.id)}
                          className="flex-1 rounded-lg border border-red-950 px-3 py-2.5 text-xs text-red-500 transition hover:bg-red-950/40 sm:flex-none"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* MODAL */}

      {mostrarFormulario && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4">

          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl sm:max-h-[92vh] sm:max-w-2xl sm:rounded-3xl sm:p-7">

            {/* CABECERA */}

            <div className="mb-6 flex items-start justify-between sm:mb-7">

              <div className="min-w-0">
                <p className="text-[9px] font-medium tracking-[0.3em] text-zinc-600 sm:text-[10px]">
                  CALENDARIO
                </p>

                <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                  {eventoSeleccionado
                    ? "Editar evento"
                    : "Nuevo evento"}
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Completá los datos de tu actividad.
                </p>
              </div>

              <button
                onClick={() => setMostrarFormulario(false)}
                aria-label="Cerrar"
                className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-900 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={guardarEvento}
              className="space-y-4 sm:space-y-5"
            >

              {/* TÍTULO */}

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Título
                </label>

                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Entrenamiento, examen, pagar cuota..."
                  required
                  autoFocus
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              {/* FECHA + TIPO */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Tipo
                  </label>

                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none transition focus:border-zinc-600"
                  >
                    {tipos.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TODO EL DÍA */}

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-zinc-800 bg-black p-4 transition hover:border-zinc-700">

                <input
                  type="checkbox"
                  checked={todoElDia}
                  onChange={(e) => setTodoElDia(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />

                <div>
                  <p className="text-sm font-medium">
                    Todo el día
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    No mostrar horario para este evento.
                  </p>
                </div>
              </label>

              {/* HORARIOS */}

              {!todoElDia && (
                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Desde
                    </label>

                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Hasta
                    </label>

                    <input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
              )}

              {/* UBICACIÓN */}

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Ubicación
                </label>

                <input
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej: Facultad, cancha, casa..."
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              {/* DESCRIPCIÓN */}

              <div>
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Notas, detalles, cosas que recordar..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none placeholder:text-zinc-700 focus:border-zinc-600"
                />
              </div>

              {/* RECORDATORIO + REPETICIÓN */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Recordatorio
                  </label>

                  <select
                    value={recordatorio}
                    onChange={(e) =>
                      setRecordatorio(e.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none focus:border-zinc-600"
                  >
                    <option value="0">Sin recordatorio</option>
                    <option value="5">5 minutos antes</option>
                    <option value="15">15 minutos antes</option>
                    <option value="30">30 minutos antes</option>
                    <option value="60">1 hora antes</option>
                    <option value="1440">1 día antes</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Repetición
                  </label>

                  <select
                    value={repeticion}
                    onChange={(e) =>
                      setRepeticion(e.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3.5 text-white outline-none focus:border-zinc-600"
                  >
                    <option value="ninguna">No repetir</option>
                    <option value="diaria">Todos los días</option>
                    <option value="semanal">Todas las semanas</option>
                    <option value="mensual">Todos los meses</option>
                    <option value="anual">Todos los años</option>
                  </select>
                </div>
              </div>

              {/* COLOR */}

              <div>
                <label className="mb-3 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Color del evento
                </label>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {colores.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setColor(item.value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition ${
                        color === item.value
                          ? "border-white bg-zinc-900"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full ${item.bg}`}
                      />

                      <span className="text-[10px] text-zinc-500">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PREVISUALIZACIÓN */}

              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="mb-3 text-[9px] font-medium uppercase tracking-widest text-zinc-700">
                  Vista previa
                </p>

                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      obtenerColor(color).bg
                    }`}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {titulo.trim() || "Tu evento"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {fecha
                        ? formatearFechaLarga(fecha)
                        : "Sin fecha"}

                      {!todoElDia &&
                        hora &&
                        ` · ${formatearHora(hora)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* BOTONES */}

              <div className="flex flex-col-reverse gap-2.5 border-t border-zinc-900 pt-4 sm:flex-row sm:justify-end sm:pt-5">

                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={guardando}
                  className="w-full rounded-xl border border-zinc-800 px-5 py-3.5 text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50 sm:w-auto sm:py-3"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-3"
                >
                  {guardando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      Guardando...
                    </>
                  ) : eventoSeleccionado ? (
                    "Guardar cambios"
                  ) : (
                    "Crear evento"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}