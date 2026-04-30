"use client"
import Image from "next/image"
import { useEffect, useState } from "react"

type Availability = Record<string, number[] | "sunday">

const POSSIBLE_HOURS = [10, 15, 16, 17, 18]
const APPT_DURATION  = 2
const API_URL        =
  "https://script.google.com/macros/s/AKfycby-PNZ_Y8jlPEXh_mu3YZBVYH2JK4IJPPWvndH3QkYUTNp2oF7A_Bv5g3uSBgIo04fO-Q/exec"

const MONTH_NAMES = [
  "", "enero", "febrero", "marzo", "abril", "mayo",
  "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

function getAvailableMonths() {
  const now    = new Date()
  const cur    = { year: now.getFullYear(), month: now.getMonth() + 1 }
  const nextM  = cur.month === 12 ? 1 : cur.month + 1
  const nextY  = cur.month === 12 ? cur.year + 1 : cur.year
  const next2M = nextM === 12 ? 1 : nextM + 1
  const next2Y = nextM === 12 ? nextY + 1 : nextY
  return [cur, { year: nextY, month: nextM }, { year: next2Y, month: next2M }]
}

function formatHour12(hour: number) {
  const period = hour >= 12 ? "PM" : "AM"
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h} ${period}`
}

function padDate(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function filterAvailableHours(bookedHours: number[], dateKey: string): number[] {
  const today    = new Date()
  const todayKey = padDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const isToday  = dateKey === todayKey

  return POSSIBLE_HOURS.filter(h => {
    if (isToday) {
      const slotTime       = new Date()
      slotTime.setHours(h, 0, 0, 0)
      const thirtyMinFromNow = new Date(today.getTime() + 30 * 60 * 1000)
      if (slotTime < thirtyMinFromNow) return false
    }
    for (const b of bookedHours) {
      if (h < b + APPT_DURATION && h + APPT_DURATION > b) return false
    }
    return true
  })
}

export default function BookingPage() {
  const AVAILABLE_MONTHS = getAvailableMonths()

  const [monthIndex, setMonthIndex]         = useState(0)
  const [availCache, setAvailCache]         = useState<Record<string, Availability>>({})
  const [loadingCal, setLoadingCal]         = useState(false)
  const [selectedDate, setSelectedDate]     = useState<string | null>(null)
  const [selectedHour, setSelectedHour]     = useState<number | null>(null)
  const [availableHours, setAvailableHours] = useState<number[]>([])
  const [name, setName]   = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [booking, setBooking] = useState(false)

  const { year, month } = AVAILABLE_MONTHS[monthIndex]
  const cacheKey = `${year}-${String(month).padStart(2, "0")}`

  useEffect(() => {
    if (availCache[cacheKey]) return
    setLoadingCal(true)
    fetch(`${API_URL}?action=availability&year=${year}&month=${month}`)
      .then(r => r.json())
      .then((data: Availability) => {
        setAvailCache(prev => ({ ...prev, [cacheKey]: data }))
      })
      .catch(() => {})
      .finally(() => setLoadingCal(false))
  }, [monthIndex])

  const availability = availCache[cacheKey] ?? {}

  function goToPrev() {
    if (monthIndex === 0) return
    setMonthIndex(i => i - 1)
    setSelectedDate(null); setSelectedHour(null)
    setAvailableHours([]); setMessage(null)
  }

  function goToNext() {
    if (monthIndex === AVAILABLE_MONTHS.length - 1) return
    setMonthIndex(i => i + 1)
    setSelectedDate(null); setSelectedHour(null)
    setAvailableHours([]); setMessage(null)
  }

  function handleDateClick(dateKey: string, blocked: boolean) {
    if (blocked || loadingCal) return
    setSelectedDate(dateKey)
    setSelectedHour(null)
    setMessage(null)
    const raw    = availability[dateKey]
    const booked = Array.isArray(raw) ? raw : []
    setAvailableHours(filterAvailableHours(booked, dateKey))
  }

  function generateCalendar() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDay = new Date(year, month - 1, 1)
    const lastDate = new Date(year, month, 0).getDate()
    const offset   = (firstDay.getDay() + 6) % 7
    const cells    = []

    for (let i = 0; i < offset; i++) {
      cells.push(<div key={`e-${i}`} />)
    }

    for (let day = 1; day <= lastDate; day++) {
      const d          = new Date(year, month - 1, day)
      const key        = padDate(year, month, day)
      const isSunday   = d.getDay() === 0
      const isPast     = d < today
      const isToday    = d.getTime() === today.getTime()
      const isSelected = selectedDate === key

      const raw      = availability[key]
      const isSun2   = raw === "sunday"
      const booked   = Array.isArray(raw) ? raw : []
      const hasSlots = !isSunday && !isSun2 && !isPast && (
        loadingCal ? true : filterAvailableHours(booked, key).length > 0
      )
      const blocked = isSunday || isSun2 || isPast || !hasSlots

      let cellStyle: React.CSSProperties = {
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 500,
        cursor: "not-allowed",
        position: "relative",
        transition: "all 0.12s",
        userSelect: "none",
      }

      if (isSunday || isSun2) {
        cellStyle = { ...cellStyle, background: "#fff1f2", color: "#fca5a5" }
      } else if (isPast) {
        cellStyle = { ...cellStyle, background: "transparent", color: "#d1d5db", textDecoration: "line-through" }
      } else if (loadingCal) {
        cellStyle = { ...cellStyle, background: "#f3f4f6", color: "#d1d5db" }
      } else if (!hasSlots) {
        cellStyle = { ...cellStyle, background: "#f3f4f6", color: "#9ca3af" }
      } else {
        cellStyle = {
          ...cellStyle,
          background: isSelected ? "#C0182D" : "#ecfdf5",
          color:      isSelected ? "white"    : "#065f46",
          cursor:     "pointer",
          boxShadow:  isSelected ? "0 2px 8px rgba(192,24,45,0.25)" : "none",
        }
      }

      cells.push(
        <div key={key} style={cellStyle} onClick={() => handleDateClick(key, blocked)}>
          {day}
          {isToday && (
            <span style={{
              position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
              width: 3, height: 3, borderRadius: "50%",
              background: isSelected ? "white" : "#C0182D",
            }} />
          )}
        </div>
      )
    }
    return cells
  }

  async function handleBooking() {
    if (!selectedDate || selectedHour === null || !name || !phone || !email) {
      setMessage({ type: "err", text: "Por favor completa todos los campos." })
      return
    }
    setBooking(true)
    setMessage(null)
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, date: selectedDate, hour: selectedHour }),
      })
      const data = await res.json()
      if (data.ok) {
        setMessage({ type: "ok", text: "¡Cita confirmada! 💅" })
        setTimeout(() => location.reload(), 2000)
      } else {
        setMessage({ type: "err", text: data.message })
        setBooking(false)
      }
    } catch {
      setMessage({ type: "err", text: "Error de red. Intenta de nuevo." })
      setBooking(false)
    }
  }

  const canGoPrev  = monthIndex > 0
  const canGoNext  = monthIndex < AVAILABLE_MONTHS.length - 1
  const isDisabled = !selectedDate || selectedHour === null || booking

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .jn-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .jn-body    { font-family: 'DM Sans', system-ui, sans-serif; }
        .jn-input:focus { border-color: #C0182D !important; background: white !important; outline: none; }
        .jn-nav:hover:not(:disabled) { background: #fff1f2 !important; }
        .jn-slot:hover { border-color: #C0182D !important; }
      `}</style>

      <div
        className="jn-body"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          background: "radial-gradient(ellipse 100% 70% at 50% 0%, #fce7ea, #f9d0d6 50%, #f4b8c1)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Logo flotante */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            marginBottom: -28, zIndex: 10, position: "relative",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", overflow: "hidden",
              border: "3px solid white",
              boxShadow: "0 4px 16px rgba(192,24,45,0.18)",
            }}>
              <Image
                src="/images/logo-circular.png"
                alt="Jalil Nails"
                width={64} height={64}
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>

          {/* Tarjeta */}
          <div style={{
            background: "white", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 4px 6px rgba(192,24,45,0.05), 0 12px 32px rgba(192,24,45,0.10)",
          }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, #9b0e20, #C0182D, #e11d48, #C0182D, #9b0e20)" }} />

            <div style={{ padding: "36px 20px 24px" }}>

              <h1 className="jn-display" style={{
                textAlign: "center", fontSize: 26, fontWeight: 500,
                color: "#1a0005", margin: "0 0 2px",
              }}>
                Agenda tu cita
              </h1>
              <p style={{
                textAlign: "center", fontSize: 11, color: "#c4a0a8",
                letterSpacing: "0.12em", margin: "0 0 20px",
              }}>
                JALIL NAILS · REYNOSA
              </p>

              {/* Navegación mes */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <button
                  className="jn-nav"
                  onClick={goToPrev}
                  disabled={!canGoPrev}
                  style={{
                    width: 30, height: 30, border: "none", borderRadius: "50%",
                    background: "transparent", cursor: canGoPrev ? "pointer" : "not-allowed",
                    opacity: canGoPrev ? 1 : 0.2, fontSize: 20, color: "#C0182D",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >‹</button>

                <h2 className="jn-display" style={{ fontSize: 18, fontWeight: 500, color: "#1a0005", margin: 0 }}>
                  {MONTH_NAMES[month]} de {year}
                </h2>

                <button
                  className="jn-nav"
                  onClick={goToNext}
                  disabled={!canGoNext}
                  style={{
                    width: 30, height: 30, border: "none", borderRadius: "50%",
                    background: "transparent", cursor: canGoNext ? "pointer" : "not-allowed",
                    opacity: canGoNext ? 1 : 0.2, fontSize: 20, color: "#C0182D",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >›</button>
              </div>

              {/* Encabezado días */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
                {["L","M","M","J","V","S","D"].map((d, i) => (
                  <div key={i} style={{
                    textAlign: "center", fontSize: 10, fontWeight: 500,
                    color: i === 6 ? "#fca5a5" : "#c4a0a8", padding: "0 0 4px",
                  }}>{d}</div>
                ))}
              </div>

              {/* Grid calendario */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 12 }}>
                {generateCalendar()}
              </div>

              {/* Leyenda */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 12, marginBottom: 16, paddingBottom: 14,
                borderBottom: "1px solid #f3f4f6",
              }}>
                {[
                  { bg: "#ecfdf5", border: "#a7f3d0", label: "Disponible" },
                  { bg: "#f3f4f6", border: "#e5e7eb", label: "Ocupado"    },
                  { bg: "#fff1f2", border: "#fecdd3", label: "No trabajo" },
                ].map(({ bg, border, label }) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#9ca3af" }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: 3, background: bg,
                      border: `1px solid ${border}`, display: "inline-block", flexShrink: 0,
                    }} />
                    {label}
                  </span>
                ))}
              </div>

              {/* Horarios */}
              <div style={{ marginBottom: 16 }}>
                <p style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
                  color: "#9ca3af", margin: "0 0 8px", textTransform: "uppercase",
                }}>
                  Horario
                </p>
                {!selectedDate ? (
                  <p style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>
                    Selecciona un día disponible
                  </p>
                ) : availableHours.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>Sin horarios disponibles</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {availableHours.map(h => (
                      <button
                        key={h}
                        className="jn-slot"
                        onClick={() => { setSelectedHour(h); setMessage(null) }}
                        style={{
                          padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                          cursor: "pointer", transition: "all 0.12s",
                          border: selectedHour === h ? "none" : "1px solid #e5e7eb",
                          background: selectedHour === h ? "#C0182D" : "white",
                          color:      selectedHour === h ? "white"    : "#374151",
                          boxShadow:  selectedHour === h ? "0 2px 8px rgba(192,24,45,0.22)" : "none",
                        }}
                      >
                        {formatHour12(h)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Campos */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[
                  { value: name,  set: setName,  placeholder: "Nombre completo",   type: "text"  },
                  { value: phone, set: setPhone, placeholder: "Teléfono",           type: "tel"   },
                  { value: email, set: setEmail, placeholder: "Correo electrónico", type: "email" },
                ].map(({ value, set, placeholder, type }) => (
                  <input
                    key={placeholder}
                    className="jn-input"
                    type={type}
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 12,
                      border: "1px solid #e5e7eb", background: "#fafafa",
                      fontSize: 13, color: "#111827",
                      transition: "border-color 0.15s, background 0.15s",
                      boxSizing: "border-box",
                    }}
                  />
                ))}
              </div>

              {/* Botón */}
              <button
                onClick={handleBooking}
                disabled={isDisabled}
                style={{
                  width: "100%", padding: "13px", borderRadius: 14, border: "none",
                  fontSize: 14, fontWeight: 600, letterSpacing: "0.04em",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  background: isDisabled
                    ? "#f3f4f6"
                    : "linear-gradient(135deg, #9b0e20, #C0182D 50%, #e11d48)",
                  color:     isDisabled ? "#d1d5db" : "white",
                  boxShadow: isDisabled ? "none" : "0 3px 12px rgba(192,24,45,0.28)",
                }}
              >
                {booking ? "Confirmando…" : "Confirmar cita"}
              </button>

              {message && (
                <div style={{
                  marginTop: 10, padding: "11px 14px", borderRadius: 12,
                  fontSize: 13, textAlign: "center",
                  ...(message.type === "ok"
                    ? { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }
                    : { background: "#fff1f2", color: "#9b1c1c", border: "1px solid #fecdd3" }),
                }}>
                  {message.text}
                </div>
              )}

            </div>
          </div>

          <p className="jn-display" style={{
            textAlign: "center", fontSize: 11, color: "#c0657580",
            fontStyle: "italic", marginTop: 14, letterSpacing: "0.06em",
          }}>
            Jalil Nails · Reynosa, Tamaulipas
          </p>

        </div>
      </div>
    </>
  )
}