"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";
import Sidebar from "../../components/Sidebar";
import DatePicker from "../../components/DatePicker";

type Contacto = {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string | null;
  relacion: string | null;
  telefono: string | null;
  email: string | null;
  fecha_importante: string | null;
  fecha_nacimiento: string | null;
  notas: string | null;
  frecuencia_contacto: number | null;
  ultimo_contacto: string | null;
  color: string | null;
  favorito: boolean | null;
};

type Filtro = "todos" | "favoritos" | "pendientes";

function fechaLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function fechaBonita(fecha: string | null) {
  if (!fecha) return "Sin fecha";

  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function diasDesde(fecha: string | null) {
  if (!fecha) return null;

  const hoy = new Date(`${fechaLocal()}T00:00:00`);
  const anterior = new Date(`${fecha}T00:00:00`);

  return Math.floor(
    (hoy.getTime() - anterior.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function iniciales(nombre: string, apellido: string | null) {
  return `${nombre?.charAt(0) || ""}${
    apellido?.charAt(0) || ""
  }`.toUpperCase();
}

function proximaFechaAnual(fecha: string) {
  const original = new Date(`${fecha}T00:00:00`);
  const hoy = new Date(`${fechaLocal()}T00:00:00`);

  let proxima = new Date(
    hoy.getFullYear(),
    original.getMonth(),
    original.getDate()
  );

  if (proxima < hoy) {
    proxima = new Date(
      hoy.getFullYear() + 1,
      original.getMonth(),
      original.getDate()
    );
  }

  return proxima;
}

function diasHastaFechaAnual(fecha: string | null) {
  if (!fecha) return null;

  const proxima = proximaFechaAnual(fecha);
  const hoy = new Date(`${fechaLocal()}T00:00:00`);

  return Math.round(
    (proxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function RelacionesPage() {
  const supabase = createClient();

  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState<Contacto | null>(null);
  const [editando, setEditando] = useState<Contacto | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [relacion, setRelacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaImportante, setFechaImportante] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [frecuencia, setFrecuencia] = useState("30");
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    cargarContactos();
  }, []);

  async function cargarContactos() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("contactos")
        .select("*")
        .eq("user_id", user.id)
        .order("favorito", { ascending: false })
        .order("nombre", { ascending: true });

      if (error) {
        console.error(error);
        setMensaje("No se pudieron cargar los contactos.");
        return;
      }

      setContactos(data || []);
    } finally {
      setLoading(false);
    }
  }

  function limpiarFormulario() {
    setNombre("");
    setApellido("");
    setRelacion("");
    setTelefono("");
    setEmail("");
    setFechaImportante("");
    setFechaNacimiento("");
    setNotas("");
    setFrecuencia("30");
    setFavorito(false);
    setEditando(null);
  }

  function abrirNuevo() {
    limpiarFormulario();
    setModal(true);
  }

  function abrirEditar(contacto: Contacto) {
    setEditando(contacto);

    setNombre(contacto.nombre || "");
    setApellido(contacto.apellido || "");
    setRelacion(contacto.relacion || "");
    setTelefono(contacto.telefono || "");
    setEmail(contacto.email || "");
    setFechaImportante(contacto.fecha_importante || "");
    setFechaNacimiento(contacto.fecha_nacimiento || "");
    setNotas(contacto.notas || "");
    setFrecuencia(String(contacto.frecuencia_contacto || 30));
    setFavorito(Boolean(contacto.favorito));

    setDetalle(null);
    setModal(true);
  }

  function cerrarModal() {
    setModal(false);
    limpiarFormulario();
  }

  async function guardarContacto(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
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
        nombre: nombre.trim(),
        apellido: apellido.trim() || null,
        relacion: relacion.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        fecha_importante: fechaImportante || null,
        fecha_nacimiento: fechaNacimiento || null,
        notas: notas.trim() || null,
        frecuencia_contacto: Number(frecuencia) || 30,
        favorito,
      };

      if (editando) {
        const { error } = await supabase
          .from("contactos")
          .update(datos)
          .eq("id", editando.id)
          .eq("user_id", user.id);

        if (error) {
          console.error(error);
          setMensaje("No se pudo actualizar el contacto.");
          return;
        }
      } else {
        const { error } = await supabase.from("contactos").insert({
          ...datos,
          user_id: user.id,
          ultimo_contacto: null,
          color: "white",
        });

        if (error) {
          console.error(error);
          setMensaje("No se pudo guardar el contacto.");
          return;
        }
      }

      cerrarModal();
      await cargarContactos();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarContacto(id: string) {
    if (!confirm("¿Eliminar este contacto?")) return;

    const { error } = await supabase
      .from("contactos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo eliminar.");
      return;
    }

    setContactos((actual) =>
      actual.filter((contacto) => contacto.id !== id)
    );

    setDetalle(null);
  }

  async function cambiarFavorito(contacto: Contacto) {
    const nuevoValor = !contacto.favorito;

    const { error } = await supabase
      .from("contactos")
      .update({ favorito: nuevoValor })
      .eq("id", contacto.id);

    if (error) {
      console.error(error);
      return;
    }

    setContactos((actual) =>
      actual
        .map((item) =>
          item.id === contacto.id
            ? { ...item, favorito: nuevoValor }
            : item
        )
        .sort((a, b) => {
          if (Boolean(a.favorito) !== Boolean(b.favorito)) {
            return a.favorito ? -1 : 1;
          }

          return a.nombre.localeCompare(b.nombre);
        })
    );

    if (detalle?.id === contacto.id) {
      setDetalle({
        ...contacto,
        favorito: nuevoValor,
      });
    }
  }

  async function marcarContacto(contacto: Contacto) {
    const hoy = fechaLocal();

    const { error } = await supabase
      .from("contactos")
      .update({
        ultimo_contacto: hoy,
      })
      .eq("id", contacto.id);

    if (error) {
      console.error(error);
      setMensaje("No se pudo actualizar el último contacto.");
      return;
    }

    setContactos((actual) =>
      actual.map((item) =>
        item.id === contacto.id
          ? { ...item, ultimo_contacto: hoy }
          : item
      )
    );

    if (detalle?.id === contacto.id) {
      setDetalle({
        ...contacto,
        ultimo_contacto: hoy,
      });
    }
  }

  const pendientes = useMemo(() => {
    return contactos.filter((contacto) => {
      const dias = diasDesde(contacto.ultimo_contacto);

      if (!contacto.ultimo_contacto) return true;

      return (
        dias !== null &&
        dias >= Number(contacto.frecuencia_contacto || 30)
      );
    });
  }, [contactos]);

  const fechasProximas = useMemo(() => {
    return contactos
      .filter(
        (contacto) =>
          contacto.fecha_nacimiento || contacto.fecha_importante
      )
      .map((contacto) => {
        const fechas = [];

        if (contacto.fecha_nacimiento) {
          fechas.push({
            tipo: "Cumpleaños",
            fecha: contacto.fecha_nacimiento,
          });
        }

        if (contacto.fecha_importante) {
          fechas.push({
            tipo: "Fecha importante",
            fecha: contacto.fecha_importante,
          });
        }

        return fechas.map((fecha) => ({
          contacto,
          ...fecha,
          dias: diasHastaFechaAnual(fecha.fecha),
        }));
      })
      .flat()
      .filter((item) => item.dias !== null)
      .sort((a, b) => (a.dias || 0) - (b.dias || 0))
      .slice(0, 6);
  }, [contactos]);

  const contactosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return contactos.filter((contacto) => {
      const coincideTexto =
        !texto ||
        [
          contacto.nombre,
          contacto.apellido,
          contacto.relacion,
          contacto.telefono,
          contacto.email,
          contacto.notas,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(texto);

      if (!coincideTexto) return false;

      if (filtro === "favoritos") {
        return Boolean(contacto.favorito);
      }

      if (filtro === "pendientes") {
        return pendientes.some((item) => item.id === contacto.id);
      }

      return true;
    });
  }, [contactos, busqueda, filtro, pendientes]);

  const estadisticas = [
    {
      label: "Personas",
      valor: contactos.length,
      detalle: "contactos registrados",
    },
    {
      label: "Favoritos",
      valor: contactos.filter((c) => c.favorito).length,
      detalle: "personas destacadas",
    },
    {
      label: "Para contactar",
      valor: pendientes.length,
      detalle: "según tu frecuencia",
    },
    {
      label: "Próximas fechas",
      valor: fechasProximas.filter((f) => (f.dias || 0) <= 30).length,
      detalle: "en los próximos 30 días",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="min-h-screen md:ml-[270px]">
        <div className="mx-auto max-w-[1700px] px-4 pb-24 pt-[92px] sm:px-6 md:px-8 md:pb-10 md:pt-8 lg:px-10">
          {/* HEADER */}
          <header className="mb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/25">
                  Relaciones
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Las personas que importan.
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/35">
                  Guardá contactos, fechas importantes y mantené presentes
                  las relaciones que querés cuidar.
                </p>
              </div>

              <button
                onClick={abrirNuevo}
                className="w-fit rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
              >
                + Nueva persona
              </button>
            </div>
          </header>

          {/* STATS */}
          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {estadisticas.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <p className="text-xs text-white/30">
                  {item.label}
                </p>

                <p className="mt-5 text-2xl font-semibold">
                  {loading ? "—" : item.valor}
                </p>

                <p className="mt-2 text-[11px] text-white/20">
                  {item.detalle}
                </p>
              </div>
            ))}
          </section>

          {/* DESTACADOS */}
          <section className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.16em] text-white/25">
                  Seguimiento
                </p>

                <h2 className="mt-1 text-lg font-medium">
                  Personas para contactar
                </h2>

                <p className="mt-1 text-xs text-white/25">
                  Basado en la frecuencia que configuraste para cada
                  persona.
                </p>
              </div>

              {pendientes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-5 py-10 text-center">
                  <p className="text-sm text-white/40">
                    Estás al día con tus contactos.
                  </p>

                  <p className="mt-1 text-xs text-white/20">
                    Cuando pase la frecuencia configurada aparecerán acá.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {pendientes.slice(0, 6).map((contacto) => {
                    const dias = diasDesde(contacto.ultimo_contacto);

                    return (
                      <div
                        key={contacto.id}
                        className="group rounded-xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setDetalle(contacto)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-xs font-medium text-white/60"
                          >
                            {iniciales(
                              contacto.nombre,
                              contacto.apellido
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => setDetalle(contacto)}
                              className="block max-w-full truncate text-left text-sm text-white/70 hover:text-white"
                            >
                              {contacto.nombre}{" "}
                              {contacto.apellido || ""}
                            </button>

                            <p className="mt-0.5 text-[10px] text-white/25">
                              {!contacto.ultimo_contacto
                                ? "Nunca registrado"
                                : `Hace ${dias} días`}
                            </p>
                          </div>

                          <button
                            onClick={() => marcarContacto(contacto)}
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-white/35 transition hover:bg-white/10 hover:text-white"
                          >
                            Hoy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.16em] text-white/25">
                  Próximamente
                </p>

                <h2 className="mt-1 text-lg font-medium">
                  Fechas importantes
                </h2>
              </div>

              {fechasProximas.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/25">
                  No hay fechas importantes cargadas.
                </div>
              ) : (
                <div className="space-y-2">
                  {fechasProximas.map((item, index) => (
                    <button
                      key={`${item.contacto.id}-${item.tipo}-${index}`}
                      onClick={() => setDetalle(item.contacto)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.04]"
                    >
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.06]">
                        <span className="text-sm font-medium">
                          {item.dias === 0
                            ? "!"
                            : item.dias}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white/60">
                          {item.contacto.nombre}{" "}
                          {item.contacto.apellido || ""}
                        </p>

                        <p className="mt-0.5 text-[10px] text-white/25">
                          {item.tipo}
                        </p>
                      </div>

                      <span className="text-[10px] text-white/20">
                        {fechaBonita(item.fecha)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* LISTADO */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/25">
                    Personas
                  </p>

                  <h2 className="mt-1 text-lg font-medium">
                    Todos tus contactos
                  </h2>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar persona..."
                    className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                  />

                  <div className="flex rounded-xl border border-white/10 bg-black p-1">
                    {[
                      ["todos", "Todos"],
                      ["favoritos", "Favoritos"],
                      ["pendientes", "Pendientes"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setFiltro(id as Filtro)}
                        className={`rounded-lg px-3 py-2 text-[11px] transition ${
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
              </div>
            </div>

            {loading ? (
              <div className="p-14 text-center text-sm text-white/25">
                Cargando contactos...
              </div>
            ) : contactosFiltrados.length === 0 ? (
              <div className="p-14 text-center">
                <p className="text-sm text-white/35">
                  No encontramos personas.
                </p>

                <button
                  onClick={abrirNuevo}
                  className="mt-3 text-xs text-white/20 hover:text-white/60"
                >
                  Agregar una persona →
                </button>
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2 xl:grid-cols-3">
                {contactosFiltrados.map((contacto) => {
                  const dias = diasDesde(contacto.ultimo_contacto);
                  const necesitaContacto =
                    !contacto.ultimo_contacto ||
                    (dias !== null &&
                      dias >=
                        Number(contacto.frecuencia_contacto || 30));

                  const fechaImportanteDias =
                    diasHastaFechaAnual(contacto.fecha_importante);

                  const cumpleDias =
                    diasHastaFechaAnual(contacto.fecha_nacimiento);

                  return (
                    <div
                      key={contacto.id}
                      className="group rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.035]"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => setDetalle(contacto)}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-sm font-medium text-white/60 transition hover:bg-white/10"
                        >
                          {iniciales(
                            contacto.nombre,
                            contacto.apellido
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => setDetalle(contacto)}
                            className="block max-w-full truncate text-left text-sm font-medium text-white/75 hover:text-white"
                          >
                            {contacto.nombre}{" "}
                            {contacto.apellido || ""}
                          </button>

                          <p className="mt-1 truncate text-[11px] text-white/25">
                            {contacto.relacion || "Sin relación"}
                          </p>
                        </div>

                        <button
                          onClick={() => cambiarFavorito(contacto)}
                          className={`text-lg transition ${
                            contacto.favorito
                              ? "text-white/70"
                              : "text-white/15 hover:text-white/50"
                          }`}
                        >
                          ★
                        </button>
                      </div>

                      <div className="mt-5 space-y-2">
                        {contacto.telefono && (
                          <a
                            href={`tel:${contacto.telefono}`}
                            className="flex items-center gap-2 text-xs text-white/35 hover:text-white/70"
                          >
                            <span className="w-4 text-center">☎</span>
                            <span className="truncate">
                              {contacto.telefono}
                            </span>
                          </a>
                        )}

                        {contacto.email && (
                          <a
                            href={`mailto:${contacto.email}`}
                            className="flex items-center gap-2 text-xs text-white/35 hover:text-white/70"
                          >
                            <span className="w-4 text-center">@</span>
                            <span className="truncate">
                              {contacto.email}
                            </span>
                          </a>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/6 bg-black/30 p-3">
                          <p className="text-[9px] uppercase tracking-wider text-white/20">
                            Último contacto
                          </p>

                          <p className="mt-1 text-[11px] text-white/40">
                            {!contacto.ultimo_contacto
                              ? "Nunca"
                              : dias === 0
                              ? "Hoy"
                              : `Hace ${dias} días`}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/6 bg-black/30 p-3">
                          <p className="text-[9px] uppercase tracking-wider text-white/20">
                            Frecuencia
                          </p>

                          <p className="mt-1 text-[11px] text-white/40">
                            Cada{" "}
                            {contacto.frecuencia_contacto || 30} días
                          </p>
                        </div>
                      </div>

                      {(contacto.fecha_nacimiento ||
                        contacto.fecha_importante) && (
                        <div className="mt-3 rounded-xl border border-white/6 bg-black/30 p-3">
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-white/30">
                            {contacto.fecha_nacimiento && (
                              <span>
                                Cumpleaños en{" "}
                                {cumpleDias === 0
                                  ? "hoy"
                                  : `${cumpleDias} días`}
                              </span>
                            )}

                            {contacto.fecha_importante && (
                              <span>
                                Fecha importante en{" "}
                                {fechaImportanteDias === 0
                                  ? "hoy"
                                  : `${fechaImportanteDias} días`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => marcarContacto(contacto)}
                          className={`flex-1 rounded-xl border py-2 text-[11px] transition ${
                            necesitaContacto
                              ? "border-white/20 bg-white/[0.06] text-white/60 hover:bg-white/[0.1]"
                              : "border-white/8 text-white/25 hover:text-white/50"
                          }`}
                        >
                          ✓ Hablé hoy
                        </button>

                        <button
                          onClick={() => abrirEditar(contacto)}
                          className="rounded-xl border border-white/8 px-3 py-2 text-[11px] text-white/25 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {mensaje && (
            <div className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-white/10 bg-[#111] px-5 py-3 text-sm text-white/60 shadow-2xl">
              {mensaje}
            </div>
          )}

          {/* MODAL CREAR / EDITAR */}
          {modal && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
              <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-white/25">
                      Relaciones
                    </p>

                    <h2 className="mt-1 text-lg font-medium">
                      {editando
                        ? "Editar persona"
                        : "Nueva persona"}
                    </h2>
                  </div>

                  <button
                    onClick={cerrarModal}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={guardarContacto}
                  className="space-y-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      label="Nombre *"
                      value={nombre}
                      onChange={setNombre}
                      placeholder="Nombre"
                    />

                    <Campo
                      label="Apellido"
                      value={apellido}
                      onChange={setApellido}
                      placeholder="Apellido"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      label="Relación"
                      value={relacion}
                      onChange={setRelacion}
                      placeholder="Amigo, familia, trabajo..."
                    />

                    <Campo
                      label="Teléfono"
                      value={telefono}
                      onChange={setTelefono}
                      placeholder="342..."
                    />
                  </div>

                  <Campo
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    placeholder="correo@ejemplo.com"
                    type="email"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs text-white/30">
                        Cumpleaños
                      </label>

                      <DatePicker
                        value={fechaNacimiento}
                        onChange={setFechaNacimiento}
                        placeholder="Sin fecha"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-white/30">
                        Fecha importante
                      </label>

                      <DatePicker
                        value={fechaImportante}
                        onChange={setFechaImportante}
                        placeholder="Sin fecha"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/30">
                      Cada cuánto querés mantener contacto
                    </label>

                    <select
                      value={frecuencia}
                      onChange={(e) => setFrecuencia(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60 outline-none focus:border-white/25"
                    >
                      <option value="7">Cada semana</option>
                      <option value="14">Cada 2 semanas</option>
                      <option value="30">Cada mes</option>
                      <option value="60">Cada 2 meses</option>
                      <option value="90">Cada 3 meses</option>
                      <option value="180">Cada 6 meses</option>
                      <option value="365">Una vez al año</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/30">
                      Notas
                    </label>

                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Cosas que quieras recordar..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setFavorito(!favorito)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      favorito
                        ? "border-white/20 bg-white/[0.07] text-white"
                        : "border-white/10 bg-white/[0.02] text-white/35"
                    }`}
                  >
                    <span>Persona favorita</span>
                    <span>{favorito ? "★" : "☆"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
                  >
                    {guardando
                      ? "Guardando..."
                      : editando
                      ? "Guardar cambios"
                      : "Crear persona"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* DETALLE */}
          {detalle && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-5">
              <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08] text-lg font-medium text-white/60">
                      {iniciales(
                        detalle.nombre,
                        detalle.apellido
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-medium">
                        {detalle.nombre}{" "}
                        {detalle.apellido || ""}
                      </h2>

                      <p className="mt-1 text-xs text-white/30">
                        {detalle.relacion || "Sin relación"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetalle(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <Info
                    label="Último contacto"
                    valor={
                      detalle.ultimo_contacto
                        ? fechaBonita(
                            detalle.ultimo_contacto
                          )
                        : "Nunca"
                    }
                  />

                  <Info
                    label="Frecuencia"
                    valor={`Cada ${
                      detalle.frecuencia_contacto || 30
                    } días`}
                  />

                  <Info
                    label="Cumpleaños"
                    valor={fechaBonita(
                      detalle.fecha_nacimiento
                    )}
                  />

                  <Info
                    label="Fecha importante"
                    valor={fechaBonita(
                      detalle.fecha_importante
                    )}
                  />
                </div>

                {detalle.telefono && (
                  <a
                    href={`tel:${detalle.telefono}`}
                    className="mt-4 block rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50 hover:bg-white/[0.06] hover:text-white"
                  >
                    ☎ {detalle.telefono}
                  </a>
                )}

                {detalle.email && (
                  <a
                    href={`mailto:${detalle.email}`}
                    className="mt-2 block rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50 hover:bg-white/[0.06] hover:text-white"
                  >
                    @ {detalle.email}
                  </a>
                )}

                {detalle.notas && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-[10px] uppercase tracking-wider text-white/20">
                      Notas
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/45">
                      {detalle.notas}
                    </p>
                  </div>
                )}

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => marcarContacto(detalle)}
                    className="rounded-xl bg-white py-3 text-sm font-medium text-black"
                  >
                    ✓ Hablé con esta persona hoy
                  </button>

                  <button
                    onClick={() => abrirEditar(detalle)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white/50 hover:text-white"
                  >
                    Editar
                  </button>
                </div>

                <button
                  onClick={() => cambiarFavorito(detalle)}
                  className="mt-2 w-full rounded-xl border border-white/10 py-3 text-sm text-white/30 hover:text-white"
                >
                  {detalle.favorito
                    ? "★ Quitar de favoritos"
                    : "☆ Agregar a favoritos"}
                </button>

                <button
                  onClick={() => eliminarContacto(detalle.id)}
                  className="mt-5 w-full py-2 text-xs text-white/15 hover:text-white/50"
                >
                  Eliminar contacto
                </button>
              </div>
            </div>
          )}

          <footer className="mt-12 border-t border-white/5 pt-6 text-center text-[10px] uppercase tracking-[0.18em] text-white/15">
            Vida Privada · Relaciones
          </footer>
        </div>
      </main>
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
        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
      />
    </div>
  );
}

function Info({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
      <p className="text-[9px] uppercase tracking-wider text-white/20">
        {label}
      </p>

      <p className="mt-2 truncate text-xs text-white/45">
        {valor}
      </p>
    </div>
  );
}