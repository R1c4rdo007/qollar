// ============================================================
// QOLLAR — Configuración global
// Para cambiar administradores, modifica ADMIN_EMAILS
// ============================================================

export const ADMIN_EMAILS = [
  "ricardo.var.webdev@gmail.com",
];

export const POINTS = {
  WELCOME: 50,        // Al registrarse
  ADD_PET: 20,        // Al registrar una mascota
  FOUND_PET: 100,     // Al reportar una mascota encontrada
  POST: 5,            // Al publicar en la comunidad
  COMMENT: 2,         // Al comentar una publicación
  DAILY_LOGIN: 2,     // (futuro) Login diario
} as const;

export const QR_PLATE = {
  PREFIX: "QLR",
  CODE_LENGTH: 8,     // Longitud del código hex
} as const;

export const APP_NAME = "Qollar";
export const APP_TAGLINE = "Protege a tu mascota con un QR inteligente";
export const APP_COUNTRY = "Perú 🇵🇪";

// Nombre del AI Veterinario
export const VET_AI_NAME = "Dr. Qoll";
export const VET_AI_DESCRIPTION = "Tu veterinario virtual disponible 24/7";

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function generatePlateCode(): string {
  const hex = Array.from(
    { length: QR_PLATE.CODE_LENGTH },
    () => Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join("");
  return `${QR_PLATE.PREFIX}-${hex}`;
}
