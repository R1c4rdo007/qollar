"use client";

import { motion } from "framer-motion";
import { QrCode, MapPin, Bell, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const features = [
  {
    icon: <QrCode size={24} />,
    title: "QR único en el collar",
    description:
      "Cada mascota tiene su placa con QR personalizado. Configúralo en minutos desde la app.",
    color: "from-orange-500 to-orange-400",
  },
  {
    icon: <MapPin size={24} />,
    title: "Ubicación GPS al instante",
    description:
      "Cuando alguien escanea el QR, recibes la ubicación exacta de tu mascota en tiempo real.",
    color: "from-purple-500 to-purple-400",
  },
  {
    icon: <Bell size={24} />,
    title: "Alerta inmediata",
    description:
      "Te notificamos por email y WhatsApp tan pronto alguien encuentre a tu mascota.",
    color: "from-emerald-500 to-emerald-400",
  },
  {
    icon: <Shield size={24} />,
    title: "Datos protegidos",
    description:
      "Tu dirección nunca se muestra. La comunicación es segura entre el que encontró y tú.",
    color: "from-blue-500 to-blue-400",
  },
];

const steps = [
  {
    number: "01",
    title: "Crea el perfil de tu mascota",
    description: "Sube fotos, agrega sus datos y configura tu QR en la app.",
  },
  {
    number: "02",
    title: "Coloca la placa en su collar",
    description: "Imprime o solicita tu placa física con el QR único de tu mascota.",
  },
  {
    number: "03",
    title: "Alguien lo encuentra y escanea",
    description: "Cualquier persona puede escanear con la cámara de su teléfono, sin instalar nada.",
  },
  {
    number: "04",
    title: "¡Tú recibes la alerta!",
    description: "Te enviamos su ubicación GPS por email y WhatsApp al instante.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C5A] flex items-center justify-center text-lg">
            🐾
          </div>
          <span className="text-xl font-bold gradient-text">Qollar</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/login">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link href="/login" className="hidden sm:block">
            <Button size="sm">Comenzar gratis</Button>
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-12 pb-20 max-w-6xl mx-auto text-center">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-[#9B8FC0] mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          Disponible ahora en Perú
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
        >
          Tu mascota siempre
          <br />
          <span className="gradient-text">encontrará</span> el camino
          <br />
          de regreso a casa
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-[#9B8FC0] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Con Qollar, tu mascota lleva un QR inteligente en su collar. Si se pierde,
          cualquier persona puede escanearlo y recibirás su ubicación al instante.
          Sin apps. Sin complicaciones.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login">
            <Button size="lg" className="min-w-[220px]">
              Protege a tu mascota
              <ChevronRight size={18} />
            </Button>
          </Link>
          <p className="text-sm text-[#9B8FC0]">Gratis para siempre en el plan básico</p>
        </motion.div>

        {/* Hero visual mock */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative max-w-sm mx-auto"
        >
          <div className="glass rounded-3xl p-8 glow-orange">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FF6B35] to-[#7C3AED] flex items-center justify-center text-5xl shadow-2xl">
                🐶
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Rocky</h3>
                <p className="text-[#9B8FC0] text-sm">Labrador · 3 años · Marrón</p>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex items-center gap-2 text-[#10B981] text-sm font-medium">
                <MapPin size={16} />
                <span>Ubicación enviada al dueño</span>
              </div>
              <div className="w-full bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl p-4 text-left">
                <p className="text-[#10B981] text-sm font-semibold mb-1">¡Alerta enviada!</p>
                <p className="text-[#9B8FC0] text-xs">
                  El dueño fue notificado con tu ubicación GPS. Gracias por ayudar 🙏
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Todo lo que necesitas para
            <span className="gradient-text"> proteger a tu mascota</span>
          </h2>
          <p className="text-[#9B8FC0] max-w-xl mx-auto">
            Tecnología simple y efectiva pensada para el Perú.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl p-6 hover:bg-white/8 group cursor-default"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-[#9B8FC0] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">¿Cómo funciona?</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="glass rounded-3xl p-6 h-full">
                <span className="text-4xl font-black gradient-text opacity-40 block mb-3">
                  {step.number}
                </span>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-[#9B8FC0] text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-10 glow-purple"
        >
          <div className="text-5xl mb-4">🐾</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Dale la protección que se merece
          </h2>
          <p className="text-[#9B8FC0] mb-8 max-w-lg mx-auto">
            Únete a los dueños que ya protegen a sus mascotas con Qollar.
            Configura el perfil de tu mascota en menos de 5 minutos.
          </p>
          <Link href="/login">
            <Button size="lg">
              Empezar ahora — es gratis
              <ChevronRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/5 text-center text-[#9B8FC0] text-sm">
        <p>© 2025 Qollar · Hecho con ❤️ en Perú</p>
      </footer>
    </main>
  );
}
