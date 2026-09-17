import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rutasPrivadas = [
    "/dashboard",
    "/finanzas",
    "/deudas",
    "/calendario",
    "/estudios",
    "/relaciones",
  ];

  const esRutaPrivada = rutasPrivadas.some(
    (ruta) =>
      request.nextUrl.pathname === ruta ||
      request.nextUrl.pathname.startsWith(`${ruta}/`)
  );

  if (esRutaPrivada && !user) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  if (request.nextUrl.pathname === "/" && user) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/finanzas/:path*",
    "/deudas/:path*",
    "/calendario/:path*",
    "/estudios/:path*",
    "/relaciones/:path*",
  ],
};