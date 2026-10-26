import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(
  request: NextRequest
) {
  try {
    const servicioIdTexto =
      request.nextUrl.searchParams.get(
        "servicioId"
      );

    // Si no se manda servicio,
    // devuelve todas las profesionales activas.
    if (!servicioIdTexto) {
      const { data, error } =
        await supabaseAdmin
          .from("barberos")
          .select(
            "id,nombre,activo"
          )
          .eq("activo", true)
          .order("id", {
            ascending: true,
          });

      if (error) {
        console.error(error);

        return NextResponse.json(
          {
            error:
              "No se pudieron cargar los profesionales",
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        barberos: data ?? [],
      });
    }

    const servicioId =
      Number(servicioIdTexto);

    if (
      !Number.isInteger(
        servicioId
      ) ||
      servicioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tratamiento inválido",
        },
        {
          status: 400,
        }
      );
    }

    // Buscar qué profesionales
    // tienen asignado este tratamiento.
    const {
      data: relaciones,
      error: errorRelaciones,
    } =
      await supabaseAdmin
        .from(
          "barbero_servicios"
        )
        .select("barbero_id")
        .eq(
          "servicio_id",
          servicioId
        )
        .eq("activo", true);

    if (errorRelaciones) {
      console.error(
        errorRelaciones
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron consultar los profesionales del tratamiento",
        },
        {
          status: 500,
        }
      );
    }

    const ids =
      [
        ...new Set(
          (
            relaciones ?? []
          ).map(
            (relacion) =>
              relacion.barbero_id
          )
        ),
      ];

    if (ids.length === 0) {
      return NextResponse.json({
        barberos: [],
      });
    }

    const {
      data: profesionales,
      error: errorProfesionales,
    } =
      await supabaseAdmin
        .from("barberos")
        .select(
          "id,nombre,activo"
        )
        .in("id", ids)
        .eq("activo", true)
        .order("id", {
          ascending: true,
        });

    if (errorProfesionales) {
      console.error(
        errorProfesionales
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron cargar los profesionales",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      barberos:
        profesionales ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los profesionales",
      },
      {
        status: 500,
      }
    );
  }
}