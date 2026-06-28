# 📋 Prode Mundialista 2026 — Plan del Proyecto

> PWA de predicciones de resultados para la fase eliminatoria del Mundial de Fútbol 2026.
> Los participantes predicen goles y equipos clasificados, acumulando puntos según un sistema definido.

---

## 1. Visión General

**Nombre**: Prode Mundialista 2026  
**Tipo**: Progressive Web App (instalable en Android/iOS)  
**Idioma**: Español  
**Tema visual**: Oscuro (azul oscuro) + colores de la selección Argentina  

Los participantes se unen al torneo vía URL compartida, ingresan su nombre, y comienzan a predecir resultados de los partidos de la fase eliminatoria del Mundial 2026 (R32 → R16 → QF → SF → 3er puesto → Final). Se acumulan puntos según la precisión de las predicciones. El que más puntos tenga al final, gana.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Vite + React | React 19, Vite 6 |
| **Routing** | React Router | v7 |
| **Estilos** | Vanilla CSS | Variables CSS, glassmorphism |
| **Tipografía** | Google Fonts (Outfit) | — |
| **Backend / DB** | Supabase (PostgreSQL) | Free tier |
| **Realtime** | Supabase Realtime | WebSockets |
| **API de datos** | WorldCup26.ir | Gratuita, sin auth |
| **Hosting** | Vercel | Free tier |
| **PWA** | vite-plugin-pwa | Manifest + Service Worker |
| **Notificaciones** | Web Push API | VAPID keys |
| **Fechas** | date-fns | v4 |

**Dominio**: `prode-mundialista-2026.vercel.app` (gratuito)

---

## 3. Funcionalidades

### 3.1 Registro y Sesión
- Primera visita → página de bienvenida
- El usuario ingresa su nombre y toca "Unirse al Torneo"
- Se genera un `device_id` único almacenado en `localStorage`
- La sesión persiste indefinidamente en el navegador
- No hay login/password, no hay autenticación de Supabase
- Sin límite práctico de participantes

### 3.2 Cuadro Eliminatorio
- Vista visual del bracket completo: R32 → R16 → QF → SF → 3er puesto → Final
- Scroll horizontal con snap points en mobile
- Cada partido muestra:
  - Banderas y nombres de los equipos
  - Fecha y hora (hora Argentina, UTC-3)
  - Estado: ⏱ Programado | 🔴 En vivo | ✅ Terminado
  - Resultado actual (si está en vivo o terminado)
  - Indicador de si ya se hizo predicción
- Partidos con equipos por definir muestran "Por definir"
- Los cruces se generan dinámicamente cuando se definen los clasificados

### 3.3 Predicciones
- Al tocar un partido → modal para ingresar predicción
- Selector de goles para cada equipo (0-15)
- Si el resultado es empate → selector de quién pasa en penales
- Countdown timer hasta el bloqueo
- Se puede editar hasta 0 minutos antes del inicio del partido
- Una vez iniciado el partido, la predicción queda bloqueada
- Si no se predijo, no suma puntos
- Animación de confirmación al guardar

### 3.4 Tabla de Posiciones
- Ranking de participantes por puntos acumulados
- Columnas: #, Nombre, Puntos totales
- Fila del usuario actual resaltada
- Empates de puntos son válidos (mismo ranking)
- Se actualiza en tiempo real

### 3.5 Historial de Predicciones
- Lista cronológica de todas las predicciones
- Cada entrada muestra: partido, predicción propia, resultado real, puntos ganados
- Se puede ver el historial de otros participantes
- **Privacidad**: las predicciones de un partido son privadas hasta que el partido empieza
- Filtro por ronda
- Colores: verde (acertó), rojo (no acertó), gris (pendiente)

### 3.6 Reglas
- Explicación visual del sistema de puntuación
- Ejemplos con casos concretos
- Información sobre plazos y bloqueos

### 3.7 Panel Admin (oculto)
- Ruta: `/admin`
- Protegido con contraseña (variable de entorno)
- Funcionalidades:
  - Cargar/editar resultados de partidos manualmente
  - Forzar recálculo de puntos
  - Sincronizar manualmente con la API
  - Ver participantes

### 3.8 Notificaciones Push
- Se solicita permiso al usuario al registrarse
- Recordatorio 30 minutos antes de cada partido si no se hizo predicción
- Mensaje: "⚽ ¡Faltan 30 min para [Equipo A] vs [Equipo B]! Hacé tu predicción"

### 3.9 Datos en Vivo
- API: `https://worldcup26.ir/get/games`
- Sincronización automática cada 2 minutos
- Actualización de resultados y estados de partidos
- Detección de partidos terminados → cálculo automático de puntos
- Detección de nuevos cruces → generación de partidos
- Fallback: carga manual desde panel admin

---

## 4. Sistema de Puntuación

### 4.1 Estructura de la Predicción
Cada predicción tiene:
- Goles equipo local (0-15)
- Goles equipo visitante (0-15)
- Si es empate: quién pasa en penales (LOCAL o VISITANTE)

### 4.2 Reglas de Puntuación

#### Caso 1: El partido tiene ganador en 90'/120' (no empate)

| Condición | Puntos |
|-----------|--------|
| Acertó qué equipo gana | +3 |
| Además acertó goles de 1 equipo | +1 |
| Además acertó goles de ambos equipos (resultado exacto) | = 6 total |

#### Caso 2: El partido termina en empate (va a penales)

| Condición | Puntos |
|-----------|--------|
| Acertó que empatan | +3 |
| Además acertó cantidad de goles | +1 |
| Además acertó quién pasa en penales | +1 |
| Si acertó empate + goles + quién pasa | = 6 total |

#### Caso 3: No acertó el resultado de 90'/120'

| Condición | Puntos |
|-----------|--------|
| Predijo empate + equipo X pasa, y equipo X efectivamente pasa (ganando en 90') | 3 + bonus gol |
| Predijo que gana equipo X, pero empatan y equipo X pasa en penales | 3 |
| Acertó goles de un equipo individual | +1 (solo si ya tiene los 3 base) |
| No acertó nada | 0 |

### 4.3 Tabla de Ejemplos Confirmados

| # | Predicción | Resultado Real | Pts | Explicación |
|---|-----------|---------------|-----|-------------|
| 1 | `2-1 Gana A` | `2-1 Gana A` | **6** | Resultado exacto |
| 2 | `2-1 Gana A` | `3-1 Gana A` | **4** | Ganador (3) + gol away (1) |
| 3 | `2-1 Gana A` | `1-0 Gana A` | **3** | Solo ganador |
| 4 | `2-1 Gana A` | `0-1 Gana B` | **1** | Gol away (1) |
| 5 | `0-0 Pasa A` | `0-0 Pasa A` | **6** | Todo correcto |
| 6 | `0-0 Pasa A` | `1-1 Pasa B` | **3** | Solo empate |
| 7 | `0-0 Pasa A` | `0-0 Pasa B` | **4** | Empate (3) + goles (1) |
| 8 | `0-0 Pasa A` | `2-0 Gana A` | **4** | Pasa A (3) + un 0 (1) |
| 9 | `1-1 Pasa B` | `0-0 Pasa B` | **4** | Empate (3) + quién pasa (1) |
| 10 | `0-0 Pasa A` | `1-1 Pasa A` | **4** | Empate (3) + quién pasa (1) |

### 4.4 Algoritmo de Puntuación (Pseudocódigo)

```
función calcularPuntos(pred, real):
  pred_resultado = tipoResultado(pred.goles_local, pred.goles_visitante)
  real_resultado = tipoResultado(real.goles_local, real.goles_visitante)

  // ═══ CASO A: Acertó el resultado de 90' (gana/empate) ═══
  SI pred_resultado == real_resultado:
    
    SI real_resultado != EMPATE:
      // Partido con ganador claro
      SI pred.goles_local == real.goles_local Y pred.goles_visitante == real.goles_visitante:
        RETORNAR 6  // Resultado exacto
      
      puntos = 3  // Acertó ganador
      SI pred.goles_local == real.goles_local: puntos += 1
      SI pred.goles_visitante == real.goles_visitante: puntos += 1
      RETORNAR puntos  // 3, 4, o 5
    
    SI real_resultado == EMPATE:
      puntos = 3  // Acertó empate
      acerto_goles = (pred.goles_local == real.goles_local)  // basta con uno, es empate
      acerto_pasa = (pred.ganador_penales == real.ganador_penales)
      
      SI acerto_goles Y acerto_pasa: RETORNAR 6
      SI acerto_goles: RETORNAR 4
      SI acerto_pasa: RETORNAR 4
      RETORNAR 3

  // ═══ CASO B: No acertó el resultado de 90' ═══
  
  // Sub-caso B1: Predijo empate pero hubo ganador
  SI pred_resultado == EMPATE Y real_resultado != EMPATE:
    ganador_real = SI real.goles_local > real.goles_visitante: "LOCAL" SINO "VISITANTE"
    
    SI pred.ganador_penales == ganador_real:
      // Acertó quién pasa (aunque no acertó que empatan)
      puntos = 3
      SI pred.goles_local == real.goles_local: puntos += 1
      SI pred.goles_visitante == real.goles_visitante: puntos += 1
      RETORNAR puntos
    
    RETORNAR 0  // No acertó ni resultado ni quién pasa

  // Sub-caso B2: Predijo ganador pero empataron
  SI pred_resultado != EMPATE Y real_resultado == EMPATE:
    equipo_predicho = SI pred.goles_local > pred.goles_visitante: "LOCAL" SINO "VISITANTE"
    
    SI equipo_predicho == real.ganador_penales:
      // Acertó quién pasa (aunque no acertó el empate)
      puntos = 3
      SI pred.goles_local == real.goles_local: puntos += 1
      SI pred.goles_visitante == real.goles_visitante: puntos += 1
      RETORNAR puntos
    
    RETORNAR 0

  // Sub-caso B3: Ambos tienen ganador pero distinto
  RETORNAR 0
```

---

## 5. Diseño de Base de Datos

### 5.1 Tabla: `participants`
| Columna | Tipo | Restricción |
|---------|------|-------------|
| `id` | UUID | PK, default gen_random_uuid() |
| `name` | TEXT | NOT NULL |
| `device_id` | TEXT | UNIQUE, NOT NULL |
| `push_subscription` | JSONB | NULL |
| `created_at` | TIMESTAMPTZ | default now() |

### 5.2 Tabla: `matches`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `external_id` | TEXT | UNIQUE — ID de WorldCup26.ir |
| `round` | TEXT | "R32", "R16", "QF", "SF", "3RD", "FINAL" |
| `team_home` | TEXT | Nombre equipo local |
| `team_away` | TEXT | Nombre equipo visitante |
| `team_home_code` | TEXT | Código ISO del país (para banderas) |
| `team_away_code` | TEXT | Código ISO del país |
| `goals_home` | INT | NULL si no jugado |
| `goals_away` | INT | NULL si no jugado |
| `winner_penalty` | TEXT | NULL, "HOME", "AWAY" |
| `status` | TEXT | "SCHEDULED", "LIVE", "FINISHED" |
| `match_datetime` | TIMESTAMPTZ | Fecha/hora del partido |
| `stadium` | TEXT | Estadio |
| `bracket_position` | INT | Posición en el cuadro |
| `created_at` | TIMESTAMPTZ | — |
| `updated_at` | TIMESTAMPTZ | — |

### 5.3 Tabla: `predictions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | PK |
| `participant_id` | UUID | FK → participants |
| `match_id` | UUID | FK → matches |
| `predicted_home_goals` | INT | 0-15 |
| `predicted_away_goals` | INT | 0-15 |
| `predicted_winner` | TEXT | "HOME", "AWAY" (solo si empate) |
| `points_earned` | INT | NULL hasta cálculo, luego 0-6 |
| `is_locked` | BOOLEAN | true cuando empieza el partido |
| `created_at` | TIMESTAMPTZ | — |
| `updated_at` | TIMESTAMPTZ | — |

**Constraint**: UNIQUE(participant_id, match_id)

### 5.4 Tabla: `admin_config`
| Columna | Tipo |
|---------|------|
| `key` | TEXT PK |
| `value` | TEXT |

### 5.5 Row Level Security (RLS)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `participants` | Todos | Cualquiera | Solo dueño (device_id) | — |
| `matches` | Todos | Solo service role | Solo service role | — |
| `predictions` | Propias siempre; ajenas solo si match ya inició | Dueño + match no iniciado | Dueño + match no iniciado | — |

---

## 6. API Externa: API-Football (api-sports.io)

### 6.1 Endpoints
| Endpoint | Descripción |
|----------|-------------|
| `GET /fixtures?league=1&season=2026` | Todos los partidos del mundial |

### 6.2 Estrategia de Sincronización
- **Supabase Edge Function** ejecutada cada 2-5 minutos vía pg_cron (para no pasarse del límite gratuito de 100 req/día).
- Fetch → parseo → upsert en tabla `matches`
- Requiere agregar API_FOOTBALL_KEY a los secrets de Supabase.
- Si un partido pasa a `FINISHED`:
  1. Bloquear predicciones (`is_locked = true`)
  2. Ejecutar cálculo de puntos para ese partido
- Si se detectan nuevos cruces definidos → insertar partidos
- Filtrar solo partidos de fase eliminatoria (R32 en adelante)

### 6.3 Fallback
- Panel admin oculto (`/admin`) para cargar resultados manualmente
- Si la API no responde, los datos existentes se mantienen

---

## 7. Diseño UI / UX

### 7.1 Paleta de Colores
```
Fondo primario:    #0a1128  (azul oscuro profundo)
Fondo secundario:  #101d3f  (azul oscuro medio)
Fondo cards:       #152247  (azul para cards)
Celeste Argentina: #75b8f4
Azul Argentina:    #4a8fe7
Dorado:            #d4af37
Blanco cálido:     #f0f4f8
Texto secundario:  #8b9dc3
Verde éxito:       #4caf50
Rojo error:        #ef5350
```

### 7.2 Tipografía
- **Principal**: Outfit (Google Fonts) — moderna, limpia
- **Monoespaciada**: JetBrains Mono (para scores/números)

### 7.3 Efectos Visuales
- **Glassmorphism** en modales y cards destacadas
- **Gradiente argentino** (celeste → azul → dorado) para acentos
- **Micro-animaciones**: hover en cards, transiciones entre páginas, pulse en partidos en vivo
- **Shimmer loading** para estados de carga

### 7.4 Navegación
- **Navbar inferior** (4 tabs, estilo app nativa):
  1. 🏆 Cuadro
  2. 📊 Posiciones
  3. 📋 Historial
  4. 📖 Reglas
- Header fijo con título "Prode Mundialista 2026"
- Si no hay sesión → redirect a Welcome

### 7.5 Banderas
- CDN: `https://flagcdn.com/w80/{code}.png`
- No se incluyen en el bundle

---

## 8. Notificaciones Push

### 8.1 Flujo
1. Usuario se registra → se pide permiso de notificaciones
2. Si acepta → se genera suscripción Web Push → se guarda en `participants.push_subscription`
3. Edge Function (cada minuto) busca partidos que empiezan en ≤30 min
4. Busca participantes sin predicción para ese partido
5. Envía push notification vía Web Push Protocol

### 8.2 Requisitos
- VAPID keys generadas (se guardan en Supabase secrets)
- Service Worker registrado para manejar eventos `push` y `notificationclick`

---

## 9. PWA

### 9.1 Manifest
```json
{
  "name": "Prode Mundialista 2026",
  "short_name": "Prode 2026",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a1128",
  "theme_color": "#0a1128",
  "orientation": "portrait"
}
```

### 9.2 Service Worker (vite-plugin-pwa)
- Cache de assets estáticos (HTML, CSS, JS, fuentes, iconos)
- Estrategia network-first para datos de la API
- Manejo de push events

### 9.3 Instalación
- Prompt de instalación nativo del navegador
- Compatible con Android (Chrome) e iOS (Safari)

---

## 10. Estructura de Archivos

```
prode-2026/
├── public/
│   ├── icons/                     # Iconos PWA (192x192, 512x512)
│   └── favicon.ico
│
├── src/
│   ├── main.jsx                   # Entry point
│   ├── App.jsx                    # Router + layout
│   ├── index.css                  # Design system completo
│   │
│   ├── lib/
│   │   ├── supabase.js            # Cliente Supabase
│   │   ├── scoring.js             # Cálculo de puntos
│   │   ├── scoring.test.js        # Tests del scoring
│   │   ├── api.js                 # WorldCup26.ir wrapper
│   │   └── notifications.js       # Web Push helpers
│   │
│   ├── hooks/
│   │   ├── useParticipant.js      # Sesión del participante
│   │   ├── useMatches.js          # Partidos (con realtime)
│   │   ├── usePredictions.js      # Predicciones del usuario
│   │   └── useStandings.js        # Tabla de posiciones
│   │
│   ├── context/
│   │   └── ParticipantContext.jsx # Context global
│   │
│   ├── pages/
│   │   ├── WelcomePage.jsx        # Registro
│   │   ├── BracketPage.jsx        # Cuadro eliminatorio
│   │   ├── StandingsPage.jsx      # Tabla de posiciones
│   │   ├── RulesPage.jsx          # Reglas
│   │   ├── HistoryPage.jsx        # Historial
│   │   └── AdminPage.jsx          # Panel admin oculto
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Layout.jsx
│   │   ├── Bracket/
│   │   │   ├── BracketView.jsx
│   │   │   ├── RoundColumn.jsx
│   │   │   └── MatchCard.jsx
│   │   ├── Prediction/
│   │   │   ├── PredictionModal.jsx
│   │   │   ├── GoalSelector.jsx
│   │   │   └── PenaltyPicker.jsx
│   │   ├── Standings/
│   │   │   ├── StandingsTable.jsx
│   │   │   └── ParticipantRow.jsx
│   │   ├── History/
│   │   │   ├── HistoryList.jsx
│   │   │   └── HistoryCard.jsx
│   │   └── UI/
│   │       ├── Badge.jsx
│   │       ├── CountdownTimer.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── Toast.jsx
│   │       └── Modal.jsx
│   │
│   └── assets/
│       └── (banderas via CDN)
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── functions/
│   │   ├── sync-matches/
│   │   │   └── index.ts
│   │   ├── calculate-points/
│   │   │   └── index.ts
│   │   └── send-notifications/
│   │       └── index.ts
│   └── seed.sql
│
├── index.html
├── vite.config.js
├── package.json
├── vercel.json
├── .env.local
├── plan.md                        # ← Este archivo
└── README.md
```

---

## 11. Fases de Ejecución

### Fase 1 — Setup (Proyecto + Supabase)
- [ ] Inicializar proyecto Vite + React
- [ ] Instalar dependencias (react-router, supabase-js, date-fns, vite-plugin-pwa)
- [ ] Crear proyecto Supabase
- [ ] Configurar `.env.local` con credenciales
- [ ] Configurar `vercel.json`

### Fase 2 — Design System
- [ ] `index.css` con variables, tipografía, animaciones
- [ ] Componentes UI base (Modal, Badge, Spinner, Toast)
- [ ] Layout + Header + Navbar

### Fase 3 — Base de Datos
- [ ] Migration SQL con tablas + RLS
- [ ] Ejecutar migration en Supabase
- [ ] `src/lib/supabase.js` — cliente

### Fase 4 — Registro y Sesión
- [ ] WelcomePage
- [ ] ParticipantContext
- [ ] useParticipant hook
- [ ] Redirect lógica (sin sesión → welcome)

### Fase 5 — Cuadro Eliminatorio
- [ ] BracketView, RoundColumn, MatchCard
- [ ] BracketPage con scroll horizontal
- [ ] useMatches hook con realtime
- [ ] Indicadores de estado (programado/vivo/terminado)

### Fase 6 — Predicciones
- [ ] PredictionModal, GoalSelector, PenaltyPicker
- [ ] usePredictions hook
- [ ] Lógica de bloqueo por horario
- [ ] Guardado/edición en Supabase

### Fase 7 — Sistema de Puntuación
- [ ] `scoring.js` con todos los casos
- [ ] `scoring.test.js` con los 10+ casos de prueba
- [ ] Edge Function `calculate-points`

### Fase 8 — Tabla de Posiciones
- [ ] StandingsTable, ParticipantRow
- [ ] StandingsPage
- [ ] useStandings hook

### Fase 9 — Historial
- [ ] HistoryList, HistoryCard
- [ ] HistoryPage con filtros
- [ ] Lógica de privacidad (pred ocultas pre-partido)

### Fase 10 — Reglas
- [ ] RulesPage con diseño visual
- [ ] Ejemplos y tabla de puntuación

### Fase 11 — Integración API en Vivo
- [ ] `src/lib/api.js` — wrapper WorldCup26.ir
- [ ] Edge Function `sync-matches`
- [ ] pg_cron cada 2 minutos
- [ ] Detección de partidos terminados → auto-cálculo

### Fase 12 — Notificaciones Push
- [ ] `src/lib/notifications.js`
- [ ] Service Worker con push handler
- [ ] Edge Function `send-notifications`
- [ ] VAPID keys

### Fase 13 — Panel Admin
- [ ] AdminPage con autenticación por contraseña
- [ ] CRUD resultados de partidos
- [ ] Botón de recálculo manual
- [ ] Sincronización manual con API

### Fase 14 — PWA + Deploy
- [ ] Configurar vite-plugin-pwa
- [ ] Generar iconos PWA
- [ ] manifest.json
- [ ] Deploy a Vercel
- [ ] Test de instalación en Android/iOS

### Fase 15 — Testing Final
- [ ] Tests unitarios de scoring
- [ ] Test de flujo completo (registro → predicción → resultado → puntos)
- [ ] Lighthouse PWA audit
- [ ] Test en dispositivos reales

---

## 12. Dependencias npm

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^2.1.0"
  }
}
```

---

## 13. Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `VITE_ADMIN_PASSWORD` | Contraseña del panel admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo Edge Functions) |
| `VAPID_PUBLIC_KEY` | Clave pública para Web Push |
| `VAPID_PRIVATE_KEY` | Clave privada para Web Push |

---

## 14. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| API WorldCup26.ir cae | Media | Alto | Panel admin para carga manual |
| API no tiene datos de eliminatoria | Baja | Alto | Carga manual + seed data |
| localStorage se borra | Baja | Medio | Mensaje de "sesión perdida" + re-registro |
| Push notifications no soportadas | Media | Bajo | Funcionalidad opcional, no crítica |
| Free tier de Supabase insuficiente | Baja | Medio | Pocas queries, pocos usuarios |

---

*Documento generado el 27/06/2026. Versión 1.0.*
