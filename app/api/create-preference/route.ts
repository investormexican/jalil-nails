import { NextRequest, NextResponse } from "next/server"
import MercadoPagoConfig, { Preference } from "mercadopago"

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, date, hour } = await req.json()

    if (!name || !email || !phone || !date || hour === undefined) {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 })
    }

    const preference = await new Preference(mp).create({
      body: {
        items: [{
          id:          "anticipo-jalil-nails",
          title:       "Anticipo cita — Jalil Nails",
          quantity:    1,
          unit_price:  200,
          currency_id: "MXN",
        }],
        payer: { name, email },
        // Guardamos los datos de la cita en metadata
        // El webhook los leerá para crear el evento en Google Calendar
        metadata: { name, email, phone, date, hour },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL}/success`,
          failure: `${process.env.NEXT_PUBLIC_URL}/failure`,
          pending: `${process.env.NEXT_PUBLIC_URL}/pending`,
        },
        auto_return:      "approved",
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhook`,
      },
    })

    return NextResponse.json({ url: preference.init_point })
  } catch (err) {
    console.error("Error creando preferencia MP:", err)
    return NextResponse.json({ error: "Error al iniciar pago." }, { status: 500 })
  }
}