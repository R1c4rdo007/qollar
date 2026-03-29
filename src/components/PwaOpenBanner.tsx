"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Shows a banner when the user opens a QR-linked page OUTSIDE the installed PWA.
 * - Android Chrome: clicking "Abrir en app" navigates to the same URL — Chrome
 *   detects it matches an installed PWA scope and opens it in the PWA.
 * - iOS Safari: deep-linking into a PWA from outside is not supported by Apple.
 *   We show instructions instead.
 */
export default function PwaOpenBanner({ targetUrl }: { targetUrl: string }) {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Already inside the installed PWA → don't show
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-safe-top">
      <div
        className="mt-3 glass border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{ background: "rgba(26, 18, 48, 0.96)" }}
      >
        <span className="text-xl flex-shrink-0">🐾</span>
        <div className="flex-1 min-w-0">
          {isIos ? (
            <>
              <p className="text-white text-xs font-semibold">¿Tienes Qollar instalada?</p>
              <p className="text-[#9B8FC0] text-[11px] leading-tight">
                Abre Safari → toca <strong>Compartir</strong> → <strong>Agregar a inicio</strong>
              </p>
            </>
          ) : (
            <>
              <p className="text-white text-xs font-semibold">Abre Qollar en la app</p>
              <p className="text-[#9B8FC0] text-[11px]">Si la tienes instalada, ábrela directamente</p>
            </>
          )}
        </div>
        {!isIos && (
          <button
            onClick={() => { window.location.href = targetUrl; }}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#FF6B35] text-white text-xs font-semibold"
          >
            Abrir
          </button>
        )}
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 p-1 text-[#9B8FC0] hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
