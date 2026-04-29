import Link from "next/link"

export default function SuccessPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse 100% 70% at 50% 0%, #fce7ea, #f9d0d6 50%, #f4b8c1)",
      padding: "24px 16px", fontFamily: "DM Sans, system-ui, sans-serif",
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "40px 28px",
        maxWidth: 340, width: "100%", textAlign: "center",
        boxShadow: "0 12px 32px rgba(192,24,45,0.10)",
      }}>
        {/* Círculo check */}
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "#ecfdf5",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", fontSize: 26,
        }}>
          ✓
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a0005", margin: "0 0 8px" }}>
          ¡Pago recibido!
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 24px" }}>
          Tu anticipo fue procesado correctamente. En unos momentos recibirás un correo con los detalles de tu cita.
        </p>
        <p style={{ fontSize: 13, color: "#C0182D", fontWeight: 500, margin: "0 0 28px" }}>
          Jalil Nails · Reynosa
        </p>
        <Link href="/" style={{
          display: "block", padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 600,
          background: "linear-gradient(135deg, #9b0e20, #C0182D 50%, #e11d48)",
          color: "white", textDecoration: "none",
          boxShadow: "0 3px 12px rgba(192,24,45,0.28)",
        }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}