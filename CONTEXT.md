# QOLLAR — Contexto del Proyecto para Claude Code

## ¿Qué es Qollar?
PWA ecosistema para mascotas en Perú. MVP: Plaquita física con QR → escaneo → muestra datos del perro + alerta al dueño con GPS.

## Stack Técnico
- **Framework**: Next.js 16.2.1 + TypeScript + Tailwind CSS
- **DB + Auth**: Supabase (PostgreSQL + Google OAuth)
- **Animaciones**: Framer Motion
- **QR**: qrcode.react (QRCodeSVG)
- **Fechas**: date-fns (locale: es)
- **AI Vet**: Google Gemini 2.5 Flash (`gemini-2.5-flash`) — nivel 1 postpago
- **Portal**: React `createPortal` para modales/overlays (evita stacking context de backdrop-filter)
- **Directorio**: `/Users/ricardovara/Documents/Qollar`

## Credenciales Supabase
- Project ID: `iacrqwzncfywzjqmmogo`
- URL: `https://iacrqwzncfywzjqmmogo.supabase.co`
- Schemas ejecutados: `schema.sql` ✅ | `schema_v2.sql` ✅ | `schema_v3.sql` ⬜ (pendiente)

## Admin
- Email: `ricardo.var.webdev@gmail.com` (en `src/lib/config.ts`)
- Para activar admin: `UPDATE profiles SET is_admin = true WHERE email = 'ricardo.var.webdev@gmail.com';`

## Estructura de archivos
```
src/
├── app/
│   ├── page.tsx                              ← Landing page (pública)
│   ├── layout.tsx                            ← Root layout: SEO completo, PWA, Toaster
│   ├── globals.css                           ← Design system + fix header z-index + print styles
│   ├── sitemap.ts                            ← Sitemap autogenerado por Next.js
│   ├── login/page.tsx                        ← Login Google OAuth
│   ├── auth/callback/route.ts                ← OAuth callback
│   ├── activate/[code]/                      ← Activar plaquita QR comprada
│   ├── pet/[qrId]/                           ← Página pública QR (finder) — captura GPS, notifica dueño
│   ├── dashboard/
│   │   ├── page.tsx                          ← Server: fetcha pets, profile, notifs, llama check_vaccine_reminders
│   │   ├── DashboardClient.tsx               ← Nav bottom, puntos, notifs, admin badge
│   │   └── pets/
│   │       ├── new/page.tsx + PetForm.tsx    ← Crear mascota (5 tabs)
│   │       └── [id]/
│   │           ├── page.tsx                  ← Server: fetcha pet + scanEvents + vaccines
│   │           ├── PetDetailClient.tsx       ← QR descargable, historial escaneos, salud, vacunas
│   │           └── edit/PetEditClient.tsx    ← Editar mascota (5 tabs, carga vacunas de DB)
│   ├── admin/
│   │   ├── page.tsx + AdminDashboardClient.tsx   ← Panel admin con 6 métricas
│   │   └── plates/
│   │       ├── page.tsx + AdminPlatesClient.tsx  ← Lista de plaquitas (filtro + búsqueda)
│   │       └── generate/GeneratePlatesClient.tsx ← Generar lotes QR para laser
│   ├── community/
│   │   ├── page.tsx                          ← Server: fetcha posts, stories, likes, pets, profile
│   │   ├── CommunityClient.tsx               ← Feed + StoriesBar integrada
│   │   ├── StoriesBar.tsx                    ← Historias 24h (viewer via createPortal)
│   │   └── new/                              ← Crear post
│   ├── vet/page.tsx                          ← Chat AI Dr. Qoll
│   ├── points/                               ← QollPoints del usuario
│   ├── notifications/                        ← Notificaciones internas
│   └── api/vet/route.ts                      ← API Gemini 2.5 Flash
├── components/
│   ├── ui/ (Button, Input, Card)
│   └── pet/PetForm.tsx                       ← 5 tabs: Básico, Salud, Vacunas, Galería, Reseña
├── lib/
│   ├── supabase/ (client, server, middleware)
│   ├── config.ts     ← ADMIN_EMAILS, POINTS, generatePlateCode(), APP_NAME, VET_AI_NAME
│   └── utils.ts
├── types/index.ts    ← Profile, Pet (con campos v3), ScanEvent, Vaccine, Story
└── proxy.ts          ← Auth middleware (Next.js 16: proxy.ts, no middleware.ts)

supabase/
├── schema.sql        ← Ejecutar primero (profiles, pets, scan_events, RLS, storage)
├── schema_v2.sql     ← Ejecutar segundo (qr_plates, posts, likes, comments, notifications, points)
└── schema_v3.sql     ← Ejecutar tercero (vaccines, stories, story_views, campos salud en pets)

public/
├── manifest.json     ← PWA manifest
├── robots.txt        ← SEO: protege rutas privadas
└── icons/icon.svg    ← Ícono PWA (gradiente naranja-morado con pata)
```

## Design System
- Fondo: `#0F0A1E` | Primario: `#FF6B35` | Secundario: `#7C3AED` | Éxito: `#10B981` | Muted: `#9B8FC0`
- Superficies: `#1A1230` / `#241840`
- Clases CSS: `.gradient-text`, `.glass`, `.glow-orange`, `.glow-purple`, `.no-scrollbar`, `.safe-top`, `.safe-bottom`
- **IMPORTANTE**: `.glass` usa `backdrop-filter: blur()` → crea stacking context. Los `<header>` tienen `z-index: 20` global en CSS para siempre quedar encima del contenido que hace scroll.

## Flujo de plaquitas físicas
1. Admin va a `/admin/plates/generate` → genera lote → cada plaquita tiene nombre/teléfono propio
2. Exporta SVG (cuadrícula 4 cols con QR real embebido) para grabadora laser
3. QR apunta a `{APP_URL}/activate/{PLATE_CODE}`
4. Cliente compra plaquita → escanea → se loguea → vincula a su mascota → `pets.qr_id = plate_code`
5. Después de activar → `/pet/{PLATE_CODE}` muestra perfil público del perro

## Registro de mascota (5 tabs)
| Tab | Campos |
|-----|--------|
| Básico | especie, nombre, raza, color, edad, zona, contacto |
| Salud | esterilizado (toggle), desparasitado (toggle), alergias, condiciones, dieta, veterinario |
| Vacunas | checklist con fecha aplicada + próxima dosis (notificación 7 días antes) |
| Galería | hasta 5 fotos (la primera = foto de perfil) |
| Reseña | personalidad, señas particulares, recompensa |

## Sistema de puntos (QollPoints)
- Registrarse: +50 | Registrar mascota: +20 | Encontrar mascota: +100 | Publicar: +5 | Comentar: +2
- Función SQL: `award_points(p_user_id, p_amount, p_reason, p_reference_id)`
- Función SQL: `check_vaccine_reminders(p_user_id)` → crea notificaciones de vacunas próximas

## Comunidad (Instagram-like)
- Stories de 24h con viewer fullscreen (tap izq/der para navegar, barra de progreso)
- Feed de posts con likes optimistas y comentarios cargados on-demand
- Modal de subida de historia via `createPortal` (sheet que sube desde abajo, estilo iOS)
- Points: +5 publicar post, +2 comentar

## AI Veterinario
- Nombre: **Dr. Qoll**
- Modelo: `gemini-2.5-flash` (requiere nivel 1 postpago en Google AI Studio)
- Route: `/api/vet` (POST) — system prompt en español peruano
- Configurar: `GEMINI_API_KEY=...` en `.env.local`

## SEO
- Metadata completa: title template, description, keywords, OG, Twitter Card, robots
- `sitemap.xml` auto-generado (rutas públicas)
- `robots.txt`: indexa `/`, `/community`, `/vet`, `/pet/*`; bloquea `/dashboard/`, `/admin/`, `/api/`

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://iacrqwzncfywzjqmmogo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000   ← cambiar a dominio Vercel en producción
GEMINI_API_KEY=...
```

## Comandos
```bash
export PATH="/opt/homebrew/bin:$PATH"   # siempre necesario (Node via Homebrew)
npm run dev      # localhost:3000
npm run build    # verificar antes de deploy
```

## Páginas (20 total)
| Ruta | Descripción |
|------|-------------|
| `/` | Landing pública |
| `/login` | Google OAuth |
| `/dashboard` | Panel dueño + nav bottom |
| `/dashboard/pets/new` | Crear mascota (5 tabs) |
| `/dashboard/pets/[id]` | Detalle + QR + salud + vacunas |
| `/dashboard/pets/[id]/edit` | Editar mascota (5 tabs) |
| `/activate/[code]` | Activar plaquita comprada |
| `/pet/[qrId]` | Página pública QR (finder) |
| `/admin` | Panel admin (6 métricas) |
| `/admin/plates` | Lista de plaquitas (filtro/búsqueda) |
| `/admin/plates/generate` | Generar QR para laser (por plaquita) |
| `/community` | Feed social + stories |
| `/community/new` | Crear post |
| `/vet` | Chat Dr. Qoll (AI vet) |
| `/points` | QollPoints del usuario |
| `/notifications` | Notificaciones internas |
| `/auth/callback` | OAuth redirect |
| `/api/vet` | API Gemini |
| `/sitemap.xml` | SEO sitemap |
| `robots.txt` | SEO crawl rules |

## PENDIENTE para producción
1. [ ] Ejecutar `supabase/schema_v3.sql` en Supabase Dashboard SQL Editor
2. [ ] `UPDATE profiles SET is_admin = true WHERE email = 'ricardo.var.webdev@gmail.com';`
3. [ ] Deploy en Vercel:
       - Conectar repo GitHub → Vercel detecta Next.js auto
       - Configurar env vars: SUPABASE_URL, SUPABASE_ANON_KEY, APP_URL (dominio Vercel), GEMINI_API_KEY
4. [ ] En Supabase Auth → URL Configuration: agregar dominio Vercel como Site URL y Redirect URL
5. [ ] Cambiar `NEXT_PUBLIC_APP_URL` al dominio real de Vercel

## Errores conocidos / histórico
- `gemini-1.5-flash` y `gemini-2.0-flash` deprecados → usar `gemini-2.5-flash`
- Next.js 16: middleware se llama `proxy.ts` y la función exportada se llama `proxy`
- Google avatar image: requiere `lh3.googleusercontent.com` en next.config.ts image domains
- `backdrop-filter` en `.glass` crea stacking context → fix global: `header { z-index: 20 }` en globals.css
- Modales/overlays dentro de `.glass` deben usar `createPortal(overlay, document.body)` para escapar el stacking context
