"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../app/lib/supabase";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function comprobarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const paginaPublica =
        pathname === "/login" || pathname === "/registro";

      if (!session && !paginaPublica) {
        router.replace("/login");
        return;
      }

      if (session && paginaPublica) {
        router.replace("/");
        return;
      }

      setCargando(false);
    }

    comprobarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const paginaPublica =
        pathname === "/login" || pathname === "/registro";

      if (!session && !paginaPublica) {
        router.replace("/login");
      }

      if (session && paginaPublica) {
        router.replace("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/5" />

            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              <div className="h-5 w-5 rounded-full border border-white/60">
                <div className="ml-[6px] mt-[6px] h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-white/70">
              Vida Privada
            </p>

            <p className="mt-1 text-xs text-white/25">
              Preparando tu espacio...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}