"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import Sidebar from "../../components/Sidebar";
import DatePicker from "../../components/DatePicker";

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

export default function Estudios() {
  const supabase = createClient();

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);

  const [tab, setTab] = useState<
    "resumen" | "materias" | "examenes" | "trabajos"
  >("resumen");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // =========================
  // MODAL MATERIA
  // =========================

  const [modalMateria, setModalMateria] = useState(false);

  const [materia, setMateria] = useState("");
  const [profesor, setProfesor] = useState("");
  const [comision, setComision] = useState("");
  const [aula, setAula] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estadoMateria, setEstadoMateria] = useState("pendiente");
  const [color, setColor] = useState("#ffffff");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // =========================
  // MODAL EXAMEN
  // =========================

  const [modalExamen, setModalExamen] = useState(false);

  const [examenTitulo, setExamenTitulo] = useState("");
  const [examenMateria, setExamenMateria] = useState("");
  const [examenTipo, setExamenTipo] = useState("parcial");
  const [examenFecha, setExamenFecha] = useState("");
  const [examenHora, setExamenHora] = useState("");
  const [examenNota, setExamenNota] = useState("");
  const [examenEstado, setExamenEstado] = useState("pendiente");
  const [examenDescripcion, setExamenDescripcion] = useState("");

  // =========================
  // MODAL TRABAJO
  // =========================

  const [modalTrabajo, setModalTrabajo] = useState(false);

  const [trabajoTitulo, setTrabajoTitulo] = useState("");
  const [trabajoMateria, setTrabajoMateria] = useState("");
  const [trabajoDescripcion, setTrabajoDescripcion] = useState("");
  const [trabajoFecha, setTrabajoFecha] = useState("");
  const [trabajoPrioridad, setTrabajoPrioridad] = useState("media");
  const [trabajoEstado, setTrabajoEstado] = useState("pendiente");

  // =========================
  // DETALLE
  // =========================

  const [materiaSeleccionada, setMateriaSeleccionada] =
    useState<Materia | null>(null);

  // =========================
  // CARGAR DATOS
  // =========================

  async function cargarDatos() {
    setLoading(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("No hay una sesión iniciada.");
      setLoading(false);
      return;
    }

    const [materiasRes, examenesRes, trabajosRes] = await Promise.all([
      supabase
        .from("estudios")
        .select("*")
        .eq("user_id", user.id)
        .order("materia", { ascending: true }),

      supabase
        .from("estudios_examenes")
        .select("*")
        .eq("user_id", user.id)
        .order("fecha", { ascending: true }),

      supabase
        .from("estudios_trabajos")
        .select("*")
        .eq("user_id", user.id)
        .order("fecha_entrega", { ascending: true }),
    ]);

    if (materiasRes.error) {
      console.error("Error materias:", materiasRes.error);
      setMensaje(materiasRes.error.message);
    }

    if (examenesRes.error) {
      console.error("Error exámenes:", examenesRes.error);
      setMensaje(examenesRes.error.message);
    }

    if (trabajosRes.error) {
      console.error("Error trabajos:", trabajosRes.error);
      setMensaje(trabajosRes.error.message);
    }

    setMaterias((materiasRes.data || []) as Materia[]);
    setExamenes((examenesRes.data || []) as Examen[]);
    setTrabajos((trabajosRes.data || []) as Trabajo[]);

    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // =========================
  // AGREGAR MATERIA
  // =========================

  async function agregarMateria(e: React.FormEvent) {
    e.preventDefault();

    if (!materia.trim()) {
      setMensaje("Escribí el nombre de la materia.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("No hay una sesión iniciada.");
      setGuardando(false);
      return;
    }

    const { error } = await supabase.from("estudios").insert({
      user_id: user.id,
      materia: materia.trim(),
      profesor: profesor.trim() || null,
      comision: comision.trim() || null,
      aula: aula.trim() || null,
      descripcion: descripcion.trim() || null,
      estado: estadoMateria,
      color,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      nota: null,
    });

    if (error) {
      console.error(error);
      setMensaje("No se pudo guardar la materia: " + error.message);
      setGuardando(false);
      return;
    }

    limpiarMateria();
    setModalMateria(false);

    await cargarDatos();

    setGuardando(false);
  }

  function limpiarMateria() {
    setMateria("");
    setProfesor("");
    setComision("");
    setAula("");
    setDescripcion("");
    setEstadoMateria("pendiente");
    setColor("#ffffff");
    setFechaInicio("");
    setFechaFin("");
  }

  // =========================
  // CAMBIAR ESTADO MATERIA
  // =========================

  async function cambiarEstadoMateria(id: string, nuevoEstado: string) {
    const { error } = await supabase
      .from("estudios")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje(error.message);
      return;
    }

    await cargarDatos();
  }

  // =========================
  // ELIMINAR MATERIA
  // =========================

  async function eliminarMateria(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar esta materia?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("estudios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje(error.message);
      return;
    }

    setMateriaSeleccionada(null);
    await cargarDatos();
  }

  // =========================
  // AGREGAR EXAMEN
  // =========================

  async function agregarExamen(e: React.FormEvent) {
    e.preventDefault();

    if (!examenTitulo.trim()) {
      setMensaje("Poné un título para el examen.");
      return;
    }

    if (!examenMateria) {
      setMensaje("Seleccioná una materia.");
      return;
    }

    if (!examenFecha) {
      setMensaje("Seleccioná una fecha.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("No hay una sesión iniciada.");
      setGuardando(false);
      return;
    }

    const { data: examen, error } = await supabase
      .from("estudios_examenes")
      .insert({
        user_id: user.id,
        materia_id: examenMateria,
        titulo: examenTitulo.trim(),
        tipo: examenTipo,
        fecha: examenFecha,
        hora: examenHora || null,
        nota: examenNota ? Number(examenNota) : null,
        estado: examenEstado,
        descripcion: examenDescripcion.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setMensaje("No se pudo guardar el examen: " + error.message);
      setGuardando(false);
      return;
    }

    const materiaEncontrada = materias.find(
      (m) => m.id === examenMateria
    );

    const { data: evento, error: calendarioError } = await supabase
      .from("calendario_tareas")
      .insert({
        user_id: user.id,
        titulo: `📚 ${examenTitulo.trim()}`,
        descripcion:
          examenDescripcion.trim() ||
          `Examen de ${materiaEncontrada?.materia || "materia"}`,
        fecha: examenFecha,
        hora: examenHora || null,
        hora_fin: null,
        todo_el_dia: !examenHora,
        tipo: "examen",
        ubicacion: null,
        color: materiaEncontrada?.color || "#ffffff",
        recordatorio_minutos: 60,
        repeticion: null,
        completada: false,
      })
      .select()
      .single();

    if (calendarioError) {
      console.error("Error calendario:", calendarioError);
    } else if (evento && examen) {
      await supabase
        .from("estudios_examenes")
        .update({
          calendario_id: evento.id,
        })
        .eq("id", examen.id);
    }

    limpiarExamen();
    setModalExamen(false);

    await cargarDatos();

    setGuardando(false);
  }

  function limpiarExamen() {
    setExamenTitulo("");
    setExamenMateria("");
    setExamenTipo("parcial");
    setExamenFecha("");
    setExamenHora("");
    setExamenNota("");
    setExamenEstado("pendiente");
    setExamenDescripcion("");
  }

  // =========================
  // CAMBIAR ESTADO EXAMEN
  // =========================

  async function cambiarEstadoExamen(id: string, estado: string) {
    const { error } = await supabase
      .from("estudios_examenes")
      .update({ estado })
      .eq("id", id);

    if (error) {
      setMensaje(error.message);
      return;
    }

    await cargarDatos();
  }

  // =========================
  // ELIMINAR EXAMEN
  // =========================

  async function eliminarExamen(id: string) {
    const confirmar = window.confirm("¿Eliminar este examen?");

    if (!confirmar) return;

    const examen = examenes.find((e) => e.id === id);

    if (examen?.calendario_id) {
      await supabase
        .from("calendario_tareas")
        .delete()
        .eq("id", examen.calendario_id);
    }

    const { error } = await supabase
      .from("estudios_examenes")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje(error.message);
      return;
    }

    await cargarDatos();
  }

  // =========================
  // AGREGAR TRABAJO
  // =========================

  async function agregarTrabajo(e: React.FormEvent) {
    e.preventDefault();

    if (!trabajoTitulo.trim()) {
      setMensaje("Poné un título para el trabajo.");
      return;
    }

    if (!trabajoMateria) {
      setMensaje("Seleccioná una materia.");
      return;
    }

    if (!trabajoFecha) {
      setMensaje("Seleccioná la fecha de entrega.");
      return;
    }

    setGuardando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("No hay una sesión iniciada.");
      setGuardando(false);
      return;
    }

    const { data: trabajo, error } = await supabase
      .from("estudios_trabajos")
      .insert({
        user_id: user.id,
        materia_id: trabajoMateria,
        titulo: trabajoTitulo.trim(),
        descripcion: trabajoDescripcion.trim() || null,
        fecha_entrega: trabajoFecha,
        prioridad: trabajoPrioridad,
        estado: trabajoEstado,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setMensaje("No se pudo guardar el trabajo: " + error.message);
      setGuardando(false);
      return;
    }

    const materiaEncontrada = materias.find(
      (m) => m.id === trabajoMateria
    );

    const { data: evento, error: calendarioError } = await supabase
      .from("calendario_tareas")
      .insert({
        user_id: user.id,
        titulo: `📝 ${trabajoTitulo.trim()}`,
        descripcion:
          trabajoDescripcion.trim() ||
          `Entrega de ${materiaEncontrada?.materia || "materia"}`,
        fecha: trabajoFecha,
        hora: null,
        hora_fin: null,
        todo_el_dia: true,
        tipo: "trabajo",
        ubicacion: null,
        color: materiaEncontrada?.color || "#ffffff",
        recordatorio_minutos: 1440,
        repeticion: null,
        completada: false,
      })
      .select()
      .single();

    if (calendarioError) {
      console.error("Error calendario:", calendarioError);
    } else if (evento && trabajo) {
      await supabase
        .from("estudios_trabajos")
        .update({
          calendario_id: evento.id,
        })
        .eq("id", trabajo.id);
    }

    limpiarTrabajo();
    setModalTrabajo(false);

    await cargarDatos();

    setGuardando(false);
  }

  function limpiarTrabajo() {
    setTrabajoTitulo("");
    setTrabajoMateria("");
    setTrabajoDescripcion("");
    setTrabajoFecha("");
    setTrabajoPrioridad("media");
    setTrabajoEstado("pendiente");
  }

  // =========================
  // CAMBIAR ESTADO TRABAJO
  // =========================

  async function cambiarEstadoTrabajo(id: string, estado: string) {
    const { error } = await supabase
      .from("estudios_trabajos")
      .update({ estado })
      .eq("id", id);

    if (error) {
      setMensaje(error.message);
      return;
    }

    await cargarDatos();
  }

  // =========================
  // ELIMINAR TRABAJO
  // =========================

  async function eliminarTrabajo(id: string) {
    const confirmar = window.confirm("¿Eliminar este trabajo?");

    if (!confirmar) return;

    const trabajo = trabajos.find((t) => t.id === id);

    if (trabajo?.calendario_id) {
      await supabase
        .from("calendario_tareas")
        .delete()
        .eq("id", trabajo.calendario_id);
    }

    const { error } = await supabase
      .from("estudios_trabajos")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje(error.message);
      return;
    }

    await cargarDatos();
  }

  // =========================
  // FILTROS
  // =========================

  const materiasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return materias;

    return materias.filter(
      (m) =>
        m.materia.toLowerCase().includes(texto) ||
        m.profesor?.toLowerCase().includes(texto) ||
        m.comision?.toLowerCase().includes(texto) ||
        m.aula?.toLowerCase().includes(texto)
    );
  }, [materias, busqueda]);

  const examenesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return examenes;

    return examenes.filter((e) => {
      const mat = materias.find((m) => m.id === e.materia_id);

      return (
        e.titulo.toLowerCase().includes(texto) ||
        e.tipo.toLowerCase().includes(texto) ||
        mat?.materia.toLowerCase().includes(texto)
      );
    });
  }, [examenes, materias, busqueda]);

  const trabajosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return trabajos;

    return trabajos.filter((t) => {
      const mat = materias.find((m) => m.id === t.materia_id);

      return (
        t.titulo.toLowerCase().includes(texto) ||
        mat?.materia.toLowerCase().includes(texto)
      );
    });
  }, [trabajos, materias, busqueda]);

  // =========================
  // ESTADÍSTICAS
  // =========================

  const materiasAprobadas = materias.filter(
    (m) => m.estado === "aprobada"
  ).length;

  const materiasPendientes = materias.filter(
    (m) => m.estado === "pendiente"
  ).length;

  const examenesPendientes = examenes.filter(
    (e) => e.estado === "pendiente"
  ).length;

  const trabajosPendientes = trabajos.filter(
    (t) => t.estado === "pendiente"
  ).length;

  const examenesConNota = examenes.filter(
    (e) => e.nota !== null
  );

  const promedio =
    examenesConNota.length > 0
      ? (
          examenesConNota.reduce(
            (total, examen) => total + Number(examen.nota),
            0
          ) / examenesConNota.length
        ).toFixed(2)
      : "—";

  const progreso =
    materias.length > 0
      ? Math.round((materiasAprobadas / materias.length) * 100)
      : 0;

  const proximoExamen = [...examenes]
    .filter((e) => e.estado === "pendiente")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

  const proximoTrabajo = [...trabajos]
    .filter((t) => t.estado === "pendiente")
    .sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega))[0];

  // =========================
  // HELPERS
  // =========================

  function nombreMateria(id: string) {
    return materias.find((m) => m.id === id)?.materia || "Materia";
  }

  function formatearFecha(fecha: string | null) {
    if (!fecha) return "Sin fecha";

    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function estadoTexto(estado: string) {
    switch (estado) {
      case "aprobada":
        return "Aprobada";
      case "cursando":
        return "Cursando";
      case "pendiente":
        return "Pendiente";
      case "regular":
        return "Regular";
      case "aprobado":
        return "Aprobado";
      case "entregado":
        return "Entregado";
      case "vencido":
        return "Vencido";
      default:
        return estado;
    }
  }

  function prioridadTexto(prioridad: string) {
    switch (prioridad) {
      case "alta":
        return "Alta";
      case "media":
        return "Media";
      case "baja":
        return "Baja";
      default:
        return prioridad;
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-black text-white">
        <Sidebar />

        <section className="min-h-screen px-4 pb-28 pt-[88px] md:ml-64 md:p-8">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white" />

              <p className="text-sm text-gray-500">
                Cargando estudios...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // =========================
  // RENDER
  // =========================

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Sidebar />

      <section className="min-h-screen px-4 pb-28 pt-[88px] sm:px-6 md:ml-64 md:px-8 md:pb-10 md:pt-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}

          <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
                Organización
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Estudios
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
                Materias, exámenes, trabajos y progreso académico en un solo
                lugar.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={() => {
                  limpiarMateria();
                  setModalMateria(true);
                }}
                className="min-h-11 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-gray-200 active:scale-[0.98]"
              >
                + Materia
              </button>

              <button
                onClick={() => {
                  limpiarExamen();
                  setModalExamen(true);
                }}
                className="min-h-11 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.1] active:scale-[0.98]"
              >
                + Examen
              </button>

              <button
                onClick={() => {
                  limpiarTrabajo();
                  setModalTrabajo(true);
                }}
                className="min-h-11 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium transition hover:bg-white/[0.1] active:scale-[0.98]"
              >
                + Trabajo
              </button>
            </div>
          </div>

          {/* MENSAJE */}

          {mensaje && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
              {mensaje}
            </div>
          )}

          {/* BUSCADOR */}

          <div className="mb-5">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/25">
                ⌕
              </span>

              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar materias, exámenes, trabajos..."
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-600 focus:border-white/20"
              />
            </div>
          </div>

          {/* TABS */}

          <div className="mb-6 overflow-x-auto border-b border-white/10 pb-2">
            <div className="flex min-w-max gap-1">
              {[
                ["resumen", "Resumen"],
                ["materias", "Materias"],
                ["examenes", "Exámenes"],
                ["trabajos", "Trabajos"],
              ].map(([id, texto]) => (
                <button
                  key={id}
                  onClick={() =>
                    setTab(
                      id as
                        | "resumen"
                        | "materias"
                        | "examenes"
                        | "trabajos"
                    )
                  }
                  className={`min-h-10 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition active:scale-[0.98] ${
                    tab === id
                      ? "bg-white text-black"
                      : "text-gray-500 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          {/* ========================= */}
          {/* RESUMEN */}
          {/* ========================= */}

          {tab === "resumen" && (
            <div className="space-y-4 sm:space-y-6">
              {/* STATS */}

              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Materias
                  </p>

                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {materias.length}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-gray-600 sm:text-xs">
                    {materiasAprobadas} aprobadas · {materiasPendientes}{" "}
                    pendientes
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Exámenes
                  </p>

                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {examenesPendientes}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-gray-600 sm:text-xs">
                    pendientes · {examenes.length} registrados
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Trabajos
                  </p>

                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {trabajosPendientes}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-gray-600 sm:text-xs">
                    pendientes · {trabajos.length} registrados
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Promedio
                  </p>

                  <p className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {promedio}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-gray-600 sm:text-xs">
                    Sobre {examenesConNota.length} notas
                  </p>
                </div>
              </div>

              {/* PROGRESO */}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-medium">Progreso académico</h2>

                    <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                      Materias aprobadas sobre el total registrado.
                    </p>
                  </div>

                  <span className="shrink-0 text-xl font-semibold sm:text-2xl">
                    {progreso}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-white/10 sm:h-3">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>

              {/* PRÓXIMOS */}

              <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                    Próximo examen
                  </p>

                  {proximoExamen ? (
                    <div className="mt-4">
                      <h3 className="break-words text-lg font-medium sm:text-xl">
                        {proximoExamen.titulo}
                      </h3>

                      <p className="mt-2 text-sm text-gray-400">
                        {nombreMateria(proximoExamen.materia_id)}
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-gray-300 sm:text-sm">
                          📅 {formatearFecha(proximoExamen.fecha)}
                        </span>

                        {proximoExamen.hora && (
                          <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-gray-300 sm:text-sm">
                            🕐 {proximoExamen.hora}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-600">
                      No tenés exámenes pendientes.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                    Próxima entrega
                  </p>

                  {proximoTrabajo ? (
                    <div className="mt-4">
                      <h3 className="break-words text-lg font-medium sm:text-xl">
                        {proximoTrabajo.titulo}
                      </h3>

                      <p className="mt-2 text-sm text-gray-400">
                        {nombreMateria(proximoTrabajo.materia_id)}
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-gray-300 sm:text-sm">
                          📅 {formatearFecha(proximoTrabajo.fecha_entrega)}
                        </span>

                        <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-gray-300 sm:text-sm">
                          Prioridad{" "}
                          {prioridadTexto(proximoTrabajo.prioridad)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-600">
                      No tenés trabajos pendientes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================= */}
          {/* MATERIAS */}
          {/* ========================= */}

          {tab === "materias" && (
            <div>
              {materiasFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
                  <p className="text-sm text-gray-500">
                    No hay materias para mostrar.
                  </p>

                  <button
                    onClick={() => {
                      limpiarMateria();
                      setModalMateria(true);
                    }}
                    className="mt-4 min-h-10 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
                  >
                    Agregar materia
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {materiasFiltradas.map((m) => (
                    <div
                      key={m.id}
                      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05] sm:p-5"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className="mt-1 h-3 w-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor: m.color || "#ffffff",
                            }}
                          />

                          <div className="min-w-0">
                            <h3 className="break-words font-medium">
                              {m.materia}
                            </h3>

                            {m.profesor && (
                              <p className="mt-1 break-words text-sm text-gray-500">
                                {m.profesor}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="shrink-0 rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-gray-400 sm:px-2.5 sm:text-xs">
                          {estadoTexto(m.estado)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs leading-5 text-gray-500 sm:text-sm">
                        {m.comision && (
                          <p className="break-words">
                            <span className="text-gray-700">
                              Comisión:
                            </span>{" "}
                            {m.comision}
                          </p>
                        )}

                        {m.aula && (
                          <p className="break-words">
                            <span className="text-gray-700">Aula:</span>{" "}
                            {m.aula}
                          </p>
                        )}

                        {m.fecha_inicio && (
                          <p>
                            <span className="text-gray-700">Inicio:</span>{" "}
                            {formatearFecha(m.fecha_inicio)}
                          </p>
                        )}

                        {m.fecha_fin && (
                          <p>
                            <span className="text-gray-700">Fin:</span>{" "}
                            {formatearFecha(m.fecha_fin)}
                          </p>
                        )}
                      </div>

                      {m.descripcion && (
                        <p className="mt-4 line-clamp-2 break-words text-sm leading-6 text-gray-500">
                          {m.descripcion}
                        </p>
                      )}

                      <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row">
                        <button
                          onClick={() => setMateriaSeleccionada(m)}
                          className="min-h-10 flex-1 rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-gray-300 transition hover:bg-white/[0.1] active:scale-[0.98]"
                        >
                          Ver detalles
                        </button>

                        <select
                          value={m.estado}
                          onChange={(e) =>
                            cambiarEstadoMateria(m.id, e.target.value)
                          }
                          className="min-h-10 w-full rounded-lg border border-white/10 bg-black px-3 text-xs text-gray-400 outline-none sm:w-auto"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="cursando">Cursando</option>
                          <option value="regular">Regular</option>
                          <option value="aprobada">Aprobada</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================= */}
          {/* EXAMENES */}
          {/* ========================= */}

          {tab === "examenes" && (
            <div>
              {examenesFiltrados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
                  <p className="text-sm text-gray-500">
                    No hay exámenes registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examenesFiltrados.map((e) => (
                    <div
                      key={e.id}
                      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:flex lg:items-center lg:justify-between lg:gap-4"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div className="shrink-0 rounded-xl bg-white/[0.06] p-2.5 text-lg sm:p-3 sm:text-xl">
                          📚
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-medium">
                              {e.titulo}
                            </h3>

                            <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-gray-500 sm:text-xs">
                              {e.tipo}
                            </span>
                          </div>

                          <p className="mt-1 break-words text-sm text-gray-500">
                            {nombreMateria(e.materia_id)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span>
                              📅 {formatearFecha(e.fecha)}
                            </span>

                            {e.hora && <span>🕐 {e.hora}</span>}

                            {e.nota !== null && (
                              <span>Nota: {e.nota}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row lg:mt-0 lg:border-0 lg:pt-0">
                        <select
                          value={e.estado}
                          onChange={(ev) =>
                            cambiarEstadoExamen(e.id, ev.target.value)
                          }
                          className="min-h-10 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-gray-400 outline-none sm:w-auto"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="desaprobado">
                            Desaprobado
                          </option>
                        </select>

                        <button
                          onClick={() => eliminarExamen(e.id)}
                          className="min-h-10 rounded-lg px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10 active:scale-[0.98]"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================= */}
          {/* TRABAJOS */}
          {/* ========================= */}

          {tab === "trabajos" && (
            <div>
              {trabajosFiltrados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center sm:p-12">
                  <p className="text-sm text-gray-500">
                    No hay trabajos registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trabajosFiltrados.map((t) => (
                    <div
                      key={t.id}
                      className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 lg:flex lg:items-center lg:justify-between lg:gap-4"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div className="shrink-0 rounded-xl bg-white/[0.06] p-2.5 text-lg sm:p-3 sm:text-xl">
                          📝
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-medium">
                              {t.titulo}
                            </h3>

                            <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-gray-500 sm:text-xs">
                              {prioridadTexto(t.prioridad)}
                            </span>
                          </div>

                          <p className="mt-1 break-words text-sm text-gray-500">
                            {nombreMateria(t.materia_id)}
                          </p>

                          <p className="mt-3 text-xs text-gray-500">
                            📅 Entrega: {formatearFecha(t.fecha_entrega)}
                          </p>

                          {t.descripcion && (
                            <p className="mt-2 break-words text-sm leading-5 text-gray-600">
                              {t.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row lg:mt-0 lg:border-0 lg:pt-0">
                        <select
                          value={t.estado}
                          onChange={(e) =>
                            cambiarEstadoTrabajo(t.id, e.target.value)
                          }
                          className="min-h-10 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-gray-400 outline-none sm:w-auto"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="entregado">Entregado</option>
                          <option value="vencido">Vencido</option>
                        </select>

                        <button
                          onClick={() => eliminarTrabajo(t.id)}
                          className="min-h-10 rounded-lg px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10 active:scale-[0.98]"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================================================= */}
      {/* MODAL MATERIA */}
      {/* ================================================= */}

      {modalMateria && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  Nueva materia
                </h2>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Agregá toda la información de la cursada.
                </p>
              </div>

              <button
                onClick={() => setModalMateria(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-white/[0.05] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={agregarMateria} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Materia *
                </label>

                <input
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  placeholder="Ej: Anatomía"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Profesor
                  </label>

                  <input
                    value={profesor}
                    onChange={(e) => setProfesor(e.target.value)}
                    placeholder="Nombre del profesor"
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Comisión
                  </label>

                  <input
                    value={comision}
                    onChange={(e) => setComision(e.target.value)}
                    placeholder="Ej: Comisión A"
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Aula
                </label>

                <input
                  value={aula}
                  onChange={(e) => setAula(e.target.value)}
                  placeholder="Ej: Aula 12"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Descripción / apuntes
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Información importante de la materia..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Estado
                  </label>

                  <select
                    value={estadoMateria}
                    onChange={(e) => setEstadoMateria(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="cursando">Cursando</option>
                    <option value="regular">Regular</option>
                    <option value="aprobada">Aprobada</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Color
                  </label>

                  <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black px-4">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-12 cursor-pointer bg-transparent"
                    />

                    <span className="text-sm text-gray-500">
                      {color}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Fecha de inicio
                  </label>

                  <DatePicker
                    value={fechaInicio}
                    onChange={setFechaInicio}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Fecha de finalización
                  </label>

                  <DatePicker
                    value={fechaFin}
                    onChange={setFechaFin}
                    placeholder="Seleccionar fecha"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end sm:pt-5">
                <button
                  type="button"
                  onClick={() => setModalMateria(false)}
                  className="min-h-11 rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-white/[0.05] hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar materia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL EXAMEN */}
      {/* ================================================= */}

      {modalExamen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  Nuevo examen
                </h2>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  Se agregará automáticamente al calendario.
                </p>
              </div>

              <button
                onClick={() => setModalExamen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-white/[0.05] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={agregarExamen} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Título *
                </label>

                <input
                  value={examenTitulo}
                  onChange={(e) => setExamenTitulo(e.target.value)}
                  placeholder="Ej: Primer parcial"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Materia *
                  </label>

                  <select
                    value={examenMateria}
                    onChange={(e) => setExamenMateria(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="">Seleccionar...</option>

                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.materia}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Tipo
                  </label>

                  <select
                    value={examenTipo}
                    onChange={(e) => setExamenTipo(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="parcial">Parcial</option>
                    <option value="final">Final</option>
                    <option value="recuperatorio">
                      Recuperatorio
                    </option>
                    <option value="practico">Práctico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Fecha *
                  </label>

                  <DatePicker
                    value={examenFecha}
                    onChange={setExamenFecha}
                    placeholder="Seleccionar fecha"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Hora
                  </label>

                  <input
                    type="time"
                    value={examenHora}
                    onChange={(e) => setExamenHora(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Nota
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={examenNota}
                    onChange={(e) => setExamenNota(e.target.value)}
                    placeholder="Ej: 8"
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Estado
                  </label>

                  <select
                    value={examenEstado}
                    onChange={(e) => setExamenEstado(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="desaprobado">
                      Desaprobado
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Descripción
                </label>

                <textarea
                  value={examenDescripcion}
                  onChange={(e) =>
                    setExamenDescripcion(e.target.value)
                  }
                  placeholder="Temas, observaciones, aula..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end sm:pt-5">
                <button
                  type="button"
                  onClick={() => setModalExamen(false)}
                  className="min-h-11 rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-white/[0.05] hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar examen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* MODAL TRABAJO */}
      {/* ================================================= */}

      {modalTrabajo && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  Nuevo trabajo
                </h2>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  La fecha de entrega también aparecerá en el calendario.
                </p>
              </div>

              <button
                onClick={() => setModalTrabajo(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-white/[0.05] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={agregarTrabajo} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Título *
                </label>

                <input
                  value={trabajoTitulo}
                  onChange={(e) => setTrabajoTitulo(e.target.value)}
                  placeholder="Ej: Trabajo práctico Nº1"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-white/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Materia *
                </label>

                <select
                  value={trabajoMateria}
                  onChange={(e) => setTrabajoMateria(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                >
                  <option value="">Seleccionar...</option>

                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.materia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Descripción
                </label>

                <textarea
                  value={trabajoDescripcion}
                  onChange={(e) =>
                    setTrabajoDescripcion(e.target.value)
                  }
                  placeholder="Qué tenés que hacer, temas, integrantes..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Entrega *
                  </label>

                  <DatePicker
                    value={trabajoFecha}
                    onChange={setTrabajoFecha}
                    placeholder="Seleccionar"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Prioridad
                  </label>

                  <select
                    value={trabajoPrioridad}
                    onChange={(e) =>
                      setTrabajoPrioridad(e.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">
                    Estado
                  </label>

                  <select
                    value={trabajoEstado}
                    onChange={(e) =>
                      setTrabajoEstado(e.target.value)
                    }
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="entregado">Entregado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end sm:pt-5">
                <button
                  type="button"
                  onClick={() => setModalTrabajo(false)}
                  className="min-h-11 rounded-xl px-4 py-3 text-sm text-gray-500 hover:bg-white/[0.05] hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200 disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar trabajo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* DETALLE MATERIA */}
      {/* ================================================= */}

      {materiaSeleccionada && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0d0d0d] p-5 shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="mt-2 h-4 w-4 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      materiaSeleccionada.color || "#ffffff",
                  }}
                />

                <div className="min-w-0">
                  <h2 className="break-words text-xl font-semibold sm:text-2xl">
                    {materiaSeleccionada.materia}
                  </h2>

                  {materiaSeleccionada.profesor && (
                    <p className="mt-1 break-words text-sm text-gray-500 sm:text-base">
                      {materiaSeleccionada.profesor}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setMateriaSeleccionada(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 hover:bg-white/[0.05] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-600">Estado</p>

                <p className="mt-2 text-sm">
                  {estadoTexto(materiaSeleccionada.estado)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-600">Comisión</p>

                <p className="mt-2 break-words text-sm">
                  {materiaSeleccionada.comision || "Sin asignar"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-600">Aula</p>

                <p className="mt-2 break-words text-sm">
                  {materiaSeleccionada.aula || "Sin asignar"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-gray-600">Período</p>

                <p className="mt-2 text-sm leading-5">
                  {materiaSeleccionada.fecha_inicio
                    ? formatearFecha(materiaSeleccionada.fecha_inicio)
                    : "Sin fecha"}
                  {" → "}
                  {materiaSeleccionada.fecha_fin
                    ? formatearFecha(materiaSeleccionada.fecha_fin)
                    : "Sin fecha"}
                </p>
              </div>
            </div>

            {materiaSeleccionada.descripcion && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="mb-2 text-xs text-gray-600">
                  Descripción
                </p>

                <p className="break-words text-sm leading-6 text-gray-400">
                  {materiaSeleccionada.descripcion}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
              <button
                onClick={() =>
                  eliminarMateria(materiaSeleccionada.id)
                }
                className="min-h-11 rounded-xl px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                Eliminar materia
              </button>

              <button
                onClick={() => setMateriaSeleccionada(null)}
                className="min-h-11 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}