"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let mounted = true;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!mounted) return;
      try {
        const html5Qr = new Html5Qrcode("qollar-qr-scanner");
        scannerRef.current = html5Qr;

        html5Qr
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (decodedText: string) => {
              if (!mounted) return;
              try { html5Qr.stop().catch(() => {}); } catch {}
              onScanRef.current(decodedText);
            },
            undefined
          )
          .then(() => { if (mounted) setStarted(true); })
          .catch(() => {
            if (mounted) setError("No se pudo acceder a la cámara. Verifica que hayas dado permisos.");
          });
      } catch {
        if (mounted) setError("No se pudo iniciar el escáner.");
      }
    });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}); } catch {}
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6"
      style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">Escanear Plaquita QR</h2>
            <p className="text-[#9B8FC0] text-sm">Apunta la cámara al código QR</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {error ? (
          <div className="glass rounded-3xl p-6 text-center">
            <Camera size={40} className="text-[#9B8FC0] mx-auto mb-3" />
            <p className="text-white font-medium mb-2">Error de cámara</p>
            <p className="text-[#9B8FC0] text-sm mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[#FF6B35]/20 text-[#FF6B35] text-sm font-medium hover:bg-[#FF6B35]/30"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden bg-black" style={{ minHeight: "300px" }}>
            <div id="qollar-qr-scanner" style={{ width: "100%" }} />
            {!started && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <Camera size={32} className="text-white mx-auto mb-2 animate-pulse" />
                  <p className="text-white text-sm">Iniciando cámara...</p>
                </div>
              </div>
            )}
            {/* Corner frame overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-56 h-56">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#FF6B35] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#FF6B35] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#FF6B35] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#FF6B35] rounded-br-xl" />
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-[#9B8FC0] text-xs mt-4">
          Asegúrate de que el QR sea visible y bien iluminado
        </p>
      </div>
    </div>
  );
}
