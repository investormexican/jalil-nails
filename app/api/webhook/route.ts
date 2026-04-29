import { NextRequest, NextResponse } from "next/server"
import MercadoPagoConfig, { Payment } from "mercadopago"

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true })
    }

    const payment = await new Payment(mp).get({ id: body.data.id })

    if (payment.status === "approved") {
      const { name, email, phone, date, hour } = payment.metadata as {
        name: string; email: string; phone: string; date: string; hour: number
      }

      // 1. Crear cita en Google Calendar
      const calRes = await fetch(process.env.APPS_SCRIPT_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, date, hour }),
      })
      const calResult = await calRes.json()
      console.log("Cita en Calendar:", calResult)

      // 2. Registrar pago en Google Sheets
      const sheetRes = await fetch(process.env.APPS_SCRIPT_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:    "logPayment",
          name, email, phone, date, hour,
          paymentId: String(payment.id),
        }),
      })
      const sheetResult = await sheetRes.json()
      console.log("Registro en Sheet:", sheetResult)
    }

    // Siempre 200 a MercadoPago — si devuelves error, reintenta indefinidamente
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Error en webhook:", err)
    return NextResponse.json({ ok: true })
  }
}