"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../app/lib/supabase";

const links = [
  {
    href: "/",
    label: "Inicio",
    icon: "⌂",
    description: "Resumen general",
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: "$",
    description: "Tu dinero",
  },
  {
    href: "/calendario",
    label: "Calendario",
    icon: "▣",
    description: "Tu agenda",
  },
  {
    href: "/estudios",
    label: "Estudios",
    icon: "▤",
    description: "Tu formación",
  },
  {
    href: "/relaciones",
    label: "Relaciones",
    icon: "♡",
    description: "Personas importantes",
  },
  {
    href: "/deudas",
    label: "Deudas",
    icon: "◈",
    description: "Pagos pendientes",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [nombre, setNombre] = useState("Tu espacio");
  const [email, setEmail] = useState("");
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function cargarUsuario() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const metadata = user.user_metadata ?? {};

        const nombreUsuario =
          metadata.nombre ||
          metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "Tu espacio";

        setNombre(nombreUsuario);
        setEmail(user.email ?? "");
      } catch (error) {
        console.error("Error cargando usuario:", error);
      }
    }

    cargarUsuario();
  }, []);

  async function cerrarSesion() {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);

    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      setCerrandoSesion(false);
    }
  }

  function estaActivo(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  const inicial =
    nombre?.charAt(0)?.toUpperCase() || "T";

  return (
    <>
      {/* =====================================================
          SIDEBAR DESKTOP
      ===================================================== */}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[270px] border-r border-white/[0.07] bg-[#050505] md:flex md:flex-col">
        <div className="flex h-full flex-col px-5 py-6">

          {/* LOGO */}

          <div className="mb-9 px-2">
            <Link
              href="/"
              className="group flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.08]">
                <div className="relative h-4 w-4 rounded-full border border-white/70">
                  <div className="absolute left-[5px] top-[5px] h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-white">
                  Vida Privada
                </p>

                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/25">
                  Tu espacio
                </p>
              </div>
            </Link>
          </div>

          {/* NAVEGACIÓN */}

          <nav className="flex-1 overflow-y-auto pr-1">
            <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">
              Principal
            </p>

            <div className="space-y-1">
              {links.map((link) => {
                const activo = estaActivo(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                      activo
                        ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white/80"
                    }`}
                  >
                    {activo && (
                      <span className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-r-full bg-white" />
                    )}

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm transition-all duration-200 ${
                        activo
                          ? "bg-white text-black shadow-lg shadow-white/5"
                          : "bg-white/[0.04] text-white/40 group-hover:bg-white/[0.07] group-hover:text-white"
                      }`}
                    >
                      {link.icon}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          activo
                            ? "text-white"
                            : "text-white/50 group-hover:text-white/80"
                        }`}
                      >
                        {link.label}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-[10px] ${
                          activo
                            ? "text-white/30"
                            : "text-white/15 group-hover:text-white/25"
                        }`}
                      >
                        {link.description}
                      </p>
                    </div>

                    {activo && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* USUARIO */}

          <div className="mt-5 border-t border-white/[0.07] pt-4">
            <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-white/[0.1] hover:bg-white/[0.04]">
              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-semibold text-white">
                  {inicial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/80">
                    {nombre}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-white/25">
                    {email || "Sesión privada"}
                  </p>
                </div>

                <span className="h-2 w-2 shrink-0 rounded-full bg-white/60" />
              </div>
            </div>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={cerrarSesion}
              disabled={cerrandoSesion}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/30 transition-all duration-200 hover:bg-white/[0.04] hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-sm">
                {cerrandoSesion ? "…" : "↪"}
              </span>

              <span>
                {cerrandoSesion
                  ? "Cerrando sesión..."
                  : "Cerrar sesión"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================
          HEADER MOBILE
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-black/90 px-4 backdrop-blur-2xl md:hidden">

        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
            <div className="relative h-3.5 w-3.5 rounded-full border border-white/70">
              <div className="absolute left-[4px] top-[4px] h-1.5 w-1.5 rounded-full bg-white" />
            </div>
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Vida Privada
            </p>

            <p className="truncate text-[9px] uppercase tracking-[0.18em] text-white/25">
              {nombre}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={cerrarSesion}
          disabled={cerrandoSesion}
          aria-label="Cerrar sesión"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/40 transition-all active:scale-95 active:bg-white/[0.08] disabled:opacity-40"
        >
          {cerrandoSesion ? "…" : "↪"}
        </button>
      </header>

      {/* =====================================================
          NAVEGACIÓN MOBILE
      ===================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-black/90 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
        <div className="mx-auto flex min-h-[74px] max-w-lg items-center justify-around py-1">

          {links.map((link) => {
            const activo = estaActivo(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all duration-200 active:scale-95 ${
                  activo
                    ? "text-white"
                    : "text-white/30"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-[15px] transition-all duration-200 ${
                    activo
                      ? "bg-white text-black shadow-lg shadow-white/5"
                      : "bg-transparent"
                  }`}
                >
                  {link.icon}
                </span>

                <span
                  className={`max-w-full truncate text-[8px] font-medium sm:text-[9px] ${
                    activo
                      ? "text-white/80"
                      : "text-white/25"
                  }`}
                >
                  {link.label}
                </span>

                {activo && (
                  <span className="absolute bottom-0.5 h-0.5 w-5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}