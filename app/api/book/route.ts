import { NextRequest, NextResponse } from "next/server"

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res  = await fetch(APPS_SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Error llamando Apps Script:", err)
    return NextResponse.json({ ok: false, message: "Error al conectar con el servidor." }, { status: 500 })
  }
}