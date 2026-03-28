"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, Printer, QrCode, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { generatePlateCode } from "@/lib/config";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

interface GeneratedPlate {
  plate_code: string;
  petName: string;
  ownerPhone: string;
}

const PLATE_SIZES = [
  { label: "3×3 cm (estándar)", value: 3 },
  { label: "3.5×3.5 cm", value: 3.5 },
  { label: "4×4 cm (grande)", value: 4 },
];

export default function GeneratePlatesClient({ userId }: { userId: string }) {
  const [quantity, setQuantity] = useState("10");
  const [batchName, setBatchName] = useState("");
  const [plateSize, setPlateSize] = useState(3);
  const [generatedPlates, setGeneratedPlates] = useState<GeneratedPlate[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPlate, setExpandedPlate] = useState<string | null>(null);

  const appUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      : "";

  const sizePx = plateSize * 37.8;
  const qrExportSize = Math.max(40, Math.round(sizePx - 34));

  async function handleGenerate() {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 200) {
      toast.error("Cantidad debe ser entre 1 y 200");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    try {
      const batch =
        batchName || `LOTE-${new Date().toISOString().slice(0, 10)}`;
      const plates: GeneratedPlate[] = Array.from({ length: qty }, () => ({
        plate_code: generatePlateCode(),
        petName: "",
        ownerPhone: "",
      }));

      const { error } = await supabase.from("qr_plates").insert(
        plates.map((p) => ({
          plate_code: p.plate_code,
          status: "inactive",
          batch_id: batch,
          created_by: userId,
        }))
      );

      if (error) throw error;

      setGeneratedPlates(plates);
      setExpandedPlate(null);
      toast.success(`✅ ${qty} plaquitas generadas y guardadas`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al generar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function updatePlate(
    code: string,
    field: "petName" | "ownerPhone",
    value: string
  ) {
    setGeneratedPlates((prev) =>
      prev.map((p) => (p.plate_code === code ? { ...p, [field]: value } : p))
    );
  }

  function handlePrint() {
    window.print();
  }

  function handleExportSVG() {
    if (generatedPlates.length === 0) return;

    const cols = 4;
    const spacing = 8;
    const totalWidth = cols * sizePx + (cols - 1) * spacing;
    const rows = Math.ceil(generatedPlates.length / cols);
    const totalHeight = rows * sizePx + (rows - 1) * spacing;

    const plateSvgs = generatedPlates.map((plate, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * (sizePx + spacing);
      const y = row * (sizePx + spacing);
      const cx = x + sizePx / 2;
      const cy = y + sizePx / 2;

      // Get QR SVG paths from the hidden DOM elements
      const qrEl = document.getElementById(
        `qr-export-${plate.plate_code}`
      ) as SVGSVGElement | null;
      const qrViewBox =
        qrEl?.getAttribute("viewBox") ||
        `0 0 ${qrExportSize} ${qrExportSize}`;
      const qrInner = qrEl?.innerHTML || "";

      const hasName = !!plate.petName;
      const hasPhone = !!plate.ownerPhone;
      const qrMargin = 10;
      const topOffset = hasName ? 14 : qrMargin;
      const bottomReserve = (hasName ? 8 : 6) + (hasPhone ? 9 : 0);
      const qrX = x + qrMargin;
      const qrY = y + topOffset;
      const qrW = sizePx - qrMargin * 2;
      const qrH = sizePx - topOffset - bottomReserve - qrMargin / 2;

      return `  <g>
    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(sizePx / 2 - 1).toFixed(1)}" fill="white" stroke="#444" stroke-width="1.2"/>
    ${hasName ? `<text x="${cx.toFixed(1)}" y="${(y + 11).toFixed(1)}" text-anchor="middle" font-size="8" font-family="Arial,sans-serif" font-weight="bold" fill="#111">${plate.petName}</text>` : ""}
    <svg x="${qrX.toFixed(1)}" y="${qrY.toFixed(1)}" width="${qrW.toFixed(1)}" height="${qrH.toFixed(1)}" viewBox="${qrViewBox}" preserveAspectRatio="xMidYMid meet">${qrInner}</svg>
    <text x="${cx.toFixed(1)}" y="${(y + sizePx - (hasPhone ? 11 : 4)).toFixed(1)}" text-anchor="middle" font-size="5.5" font-family="Courier New,monospace" fill="#555">${plate.plate_code}</text>
    ${hasPhone ? `<text x="${cx.toFixed(1)}" y="${(y + sizePx - 3).toFixed(1)}" text-anchor="middle" font-size="7" font-family="Arial,monospace" fill="#111">${plate.ownerPhone}</text>` : ""}
  </g>`;
    });

    const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth.toFixed(1)}" height="${totalHeight.toFixed(1)}" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}">
  <rect width="${totalWidth.toFixed(1)}" height="${totalHeight.toFixed(1)}" fill="white"/>
${plateSvgs.join("\n")}
</svg>`;

    const blob = new Blob([fullSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qollar-plates-${new Date().toISOString().slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG exportado — listo para grabadora laser");
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/15 blur-[100px]" />
      </div>

      {/* Hidden QR codes at export size — used by handleExportSVG */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: 0, overflow: "hidden", height: 1, width: 1 }}
      >
        {generatedPlates.map((plate) => (
          <QRCodeSVG
            key={`export-${plate.plate_code}`}
            id={`qr-export-${plate.plate_code}`}
            value={`${appUrl}/activate/${plate.plate_code}`}
            size={qrExportSize}
            level="H"
            includeMargin={false}
          />
        ))}
      </div>

      {/* Print-only area */}
      <div className="qollar-print-area">
        {generatedPlates.map((plate) => (
          <div key={`print-${plate.plate_code}`} className="qollar-print-plate">
            <QRCodeSVG
              value={`${appUrl}/activate/${plate.plate_code}`}
              size={110}
              level="H"
              includeMargin={false}
            />
            {plate.petName && (
              <p style={{ fontWeight: "bold", fontSize: 10, margin: "2px 0 0" }}>
                {plate.petName}
              </p>
            )}
            <p style={{ fontFamily: "monospace", fontSize: 8, margin: "1px 0 0" }}>
              {plate.plate_code}
            </p>
            {plate.ownerPhone && (
              <p style={{ fontSize: 9, margin: "1px 0 0" }}>{plate.ownerPhone}</p>
            )}
          </div>
        ))}
      </div>

      <header className="relative z-10 glass border-b border-white/5 px-6 py-4 no-print">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 rounded-xl hover:bg-white/5 text-[#9B8FC0] hover:text-white">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-white">Generar plaquitas QR</h1>
            <p className="text-xs text-[#9B8FC0]">Para grabado laser</p>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Config panel ─────────────────────── */}
          <div className="space-y-5">
            <div className="glass rounded-3xl p-6 space-y-4">
              <h2 className="font-semibold text-white">Configuración del lote</h2>

              <Input
                label="Nombre del lote (opcional)"
                placeholder="Ej. Lote Mayo 2025"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />

              <Input
                label="Cantidad de plaquitas"
                type="number"
                min="1"
                max="200"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                hint="Máximo 200 por lote"
              />

              <div>
                <label className="text-sm font-medium text-[#9B8FC0] block mb-2">
                  Tamaño de la placa
                </label>
                <div className="flex flex-col gap-2">
                  {PLATE_SIZES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setPlateSize(s.value)}
                      className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        plateSize === s.value
                          ? "bg-[#FF6B35]/15 border-[#FF6B35]/40 text-white"
                          : "bg-white/3 border-white/10 text-[#9B8FC0] hover:bg-white/5"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleGenerate} loading={loading} fullWidth size="lg">
              <Plus size={18} />
              Generar {quantity || 0} plaquitas
            </Button>

            {generatedPlates.length > 0 && (
              <p className="text-xs text-[#9B8FC0] text-center">
                💡 Puedes personalizar el nombre y teléfono de cada plaquita individualmente en el panel derecho
              </p>
            )}
          </div>

          {/* ── Generated plates panel ───────────── */}
          <div>
            {generatedPlates.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                <QrCode size={48} className="text-[#9B8FC0]/40 mb-4" />
                <p className="text-[#9B8FC0] text-sm">
                  Configura el lote y presiona generar
                </p>
                <p className="text-[#9B8FC0]/60 text-xs mt-2">
                  Los QR apuntarán a: {appUrl || "tu-dominio.com"}/activate/[CODE]
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Export buttons */}
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-semibold text-sm">
                      {generatedPlates.length} plaquitas generadas
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={handleExportSVG} variant="secondary" size="sm">
                        <Download size={14} />
                        SVG Laser
                      </Button>
                      <Button onClick={handlePrint} variant="ghost" size="sm">
                        <Printer size={14} />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-[#9B8FC0] space-y-0.5">
                    <p>✅ Guardadas en DB como <span className="font-mono text-white">inactive</span></p>
                    <p>📐 Cuadrícula de 4 columnas en el SVG exportado</p>
                  </div>
                </div>

                {/* Per-plate list */}
                <div className="glass rounded-3xl overflow-hidden">
                  <div className="p-4 border-b border-white/5">
                    <p className="text-sm font-medium text-white">
                      Personalizar cada plaquita
                    </p>
                    <p className="text-xs text-[#9B8FC0] mt-0.5">
                      Nombre y teléfono individuales (opcional)
                    </p>
                  </div>

                  <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                    {generatedPlates.map((plate, i) => (
                      <div key={plate.plate_code}>
                        {/* Row header */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPlate(
                              expandedPlate === plate.plate_code
                                ? null
                                : plate.plate_code
                            )
                          }
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 text-left"
                        >
                          {/* Mini QR preview */}
                          <div className="bg-white rounded-lg p-1 flex-shrink-0">
                            <QRCodeSVG
                              value={`${appUrl}/activate/${plate.plate_code}`}
                              size={40}
                              level="M"
                              includeMargin={false}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-white font-medium">
                              {plate.plate_code}
                            </p>
                            {plate.petName ? (
                              <p className="text-xs text-[#FF6B35] truncate">
                                {plate.petName}
                                {plate.ownerPhone ? ` · ${plate.ownerPhone}` : ""}
                              </p>
                            ) : (
                              <p className="text-xs text-[#9B8FC0]/60">
                                Sin personalizar
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-[#9B8FC0]">#{i + 1}</span>
                            {expandedPlate === plate.plate_code ? (
                              <ChevronUp size={14} className="text-[#9B8FC0]" />
                            ) : (
                              <ChevronDown size={14} className="text-[#9B8FC0]" />
                            )}
                          </div>
                        </button>

                        {/* Expanded edit fields */}
                        <AnimatePresence>
                          {expandedPlate === plate.plate_code && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3 bg-white/2">
                                <Input
                                  label="Nombre de la mascota"
                                  placeholder="Ej. Rocky"
                                  value={plate.petName}
                                  onChange={(e) =>
                                    updatePlate(
                                      plate.plate_code,
                                      "petName",
                                      e.target.value
                                    )
                                  }
                                />
                                <Input
                                  label="Teléfono del dueño"
                                  placeholder="Ej. 987654321"
                                  value={plate.ownerPhone}
                                  onChange={(e) =>
                                    updatePlate(
                                      plate.plate_code,
                                      "ownerPhone",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
