# Habixa – Análisis exhaustivo vs estrategia de gamificación y plan propuesto

**Fecha:** 2026-02-05  
**Referencia:** Estrategia "Duolingo for Fitness" (Core Loop, Map, Hero's Journey, UI/UX).

---

## Parte 1: Análisis exhaustivo por bloque de estrategia

### 1. The Core Loop (The "Hook")

| Elemento estrategia | Ubicación en código | Estado | Detalle |
|--------------------|---------------------|--------|---------|
| **Trigger – Abrir app** | `apps/mobile/app/(tabs)/index.tsx` → `MapScreen` | ✅ | Home = mapa. |
| **Trigger – Mapa con nodo que pulsa** | `MapScreen.tsx`, `SagaPath.tsx`, `MapNode.tsx` (líneas 22–31: `pulseAnim` en activo) | ✅ | Solo el nodo activo tiene animación de pulso (scale 1→1.08). |
| **Trigger – Streak Flame (miedo a romper)** | `PathHeader.tsx` (líneas 36–38): icono `local-fire-department` + `wallet.streak` | ✅ | Visual presente; valor viene de estado local (mock), no de backend. |
| **Action – Tap al nodo** | `MapScreen` → `handleNodePress` → solo si `node.status === 'active'` | ✅ | Correcto. |
| **Action – Sesión corta 15–20 min** | `NodeDetailModal`: muestra `durationMinutes`, botón "START SESSION" | ⚠️ | No hay workout real: al pulsar "START SESSION" se cierra el modal y se dispara completado sin ejercicio. Flujo es simulado. |
| **Reward – Punto en oro** | `MapNode.tsx`: `isCompleted` → `backgroundColor` gold, `MaterialIcons name="star"` | ✅ | Implementado. |
| **Reward – Path desbloqueado** | `use-path.ts`: `setActiveDayIndex(prev => prev + 1)`; dominio `getNodeStatus` hace linealidad | ✅ | Implementado. |
| **Reward – +10 Gems** | `path.types.ts` `gemsReward`, `use-path.ts` `applyCompletion` suma a `wallet.gems` | ✅ | En UI y estado local. |
| **Reward – Sonido "Ding!"** | — | ❌ | No existe en el proyecto. |
| **Investment – Gems en Streak Freeze** | — | ❌ | No hay modelo de ítems, ni tienda, ni consumo de Gems. |
| **Investment – "Level 2 en X días"** | — | ❌ | No hay mensajes de countdown de desbloqueo. |

**Resumen Core Loop:** Loop visual y de progresión local completos; falta sesión de workout real, sonido, economía (Gems/Freeze) y mensajes de inversión.

---

### 2. El mapa (dominio de progresión)

| Elemento estrategia | Ubicación en código | Estado | Detalle |
|--------------------|---------------------|--------|---------|
| **World (Phase)** | `path.types.ts` `SagaPathState.phaseLabel`, `phaseNumber`; `mock-path.ts` `PHASE_LABEL = 'Phase 1: Foundation'` | ✅ | Una fase mock. |
| **Level (Node)** | `path.types.ts` `NodeStatus`: `'locked' \| 'active' \| 'completed'` | ✅ | Tres estados. |
| **Nodo 🔒 Gray** | `MapNode.tsx`: `isLocked` → `backgroundColor` gris, label "🔒" | ✅ | Implementado. |
| **Nodo 🟢 Active (bounce)** | `MapNode.tsx`: `pulseAnim` loop en nodo activo | ✅ | Implementado. |
| **Nodo ⭐ Gold** | `MapNode.tsx`: `isCompleted` → gold + estrella | ✅ | Implementado. |
| **Boss al final de fase** | `mock-path.ts`: nodo 7 "Week 1 Boss" (25 min, 100 XP, 25 Gems) | ⚠️ | Datos presentes; no hay UI diferenciada (icono/estilo "boss"). |
| **Lock lineal** | `path.domain.ts` `getNodeStatus(dayIndex, activeDayIndex)` | ✅ | No se puede saltar: solo `dayIndex === activeDayIndex` es activo. |
| **Zigzag vertical** | `SagaPath.tsx`: `ScrollView` + `nodeRow`; `path.domain.ts` `getNodeSide(index)` alterna left/right | ✅ | Implementado. |

**Resumen Mapa:** Mapa alineado con la estrategia; solo falta tratamiento visual explícito de “Boss” y (más adelante) múltiples fases desde backend.

---

### 3. Flujo del usuario (Hero's Journey)

| Elemento estrategia | Ubicación en código | Estado | Detalle |
|--------------------|---------------------|--------|---------|
| **Onboarding – Contrato** | Onboarding: `step1` (objetivo/tags), `step2` (BMI), `step3` (ventana tiempo), `step4` (dieta), `step5` (metas/calendario), `step6` (salud) | ❌ | No hay pantalla tipo "Te hemos creado un path de 30 días" ni CTA de compromiso post-elección de objetivo. |
| **Día 1 – Primera victoria** | `MapScreen` + `usePath()` con `activeDayIndex: 1` inicial; mock "Assessment Workout" día 1; `VictoryOverlay` "Day X Complete!" | ✅ | Flujo completo en mock. |
| **Primera semana – Notificaciones** | — | ❌ | No hay push ni mensajes tipo "No pierdas tu racha de X días". |
| **Primera semana – Badge "Novice" día 7** | — | ❌ | No hay sistema de badges ni pantalla de logros. |
| **The Dip – Día perdido** | — | ❌ | No hay detección de "missed day" (por fecha ni por backend). |
| **The Dip – Streak Freeze con Gems** | — | ❌ | No hay modal "Oh no! Your streak is burning!" ni "Use 50 Gems to Repair?". |
| **Mastery – Fin Phase 1** | Mock tiene 7 nodos; no hay transición a Phase 2 en UI | ⚠️ | Lógica de "fin de fase" no implementada. |
| **Mastery – Boss Battle** | Nodo 7 es "Boss" en datos; no hay pantalla especial ni test difícil | ⚠️ | Solo nombre/subtítulo. |
| **Mastery – Level Up / avatar** | `VictoryOverlay` no muestra level up ni cambio de avatar | ❌ | Profile tiene "Level 7" hardcodeado; no hay evolución de nivel en Victory. |
| **Mastery – Phase 2 unlock** | API: `Challenge`, `UserProgress`, admin `forceUnlock`; mobile no consume | ⚠️ | Backend existe; mapa no usa fases desde API. |

**Resumen Journey:** Día 1 y progresión en mapa están; faltan contrato de onboarding, retención (streak rescue), notificaciones, badges y cierre de fase/boss/level up.

---

### 4. UI/UX (entregables de diseño)

| Entregable | Archivo(s) | Estado | Gaps |
|------------|------------|--------|------|
| **1. Map (Home)** | `MapScreen`, `PathHeader`, `SagaPath`, `MapNode` | ✅ | Header no es "glassmorphism" explícito (sí tiene fondo semi-transparente). |
| **2. Node Detail (Pre-Workout)** | `NodeDetailModal.tsx`: Day X, título, subtítulo, mins, XP, "START SESSION" | ✅ | Estrategia pide también "250 XP" visible; ya está como `node.xpReward` XP. Gems no se muestran en modal (sí en Victory). |
| **3. Victory / Level Up** | `VictoryOverlay.tsx`: título, XP, Gems, racha, "New record!" | ⚠️ | Falta: confetti/partículas, barra de XP que se llena, Gems "volando" al wallet, sonido. |
| **4. Streak Rescue** | — | ❌ | No existe modal. |
| **5. The Shop** | — | ❌ | No existe pantalla ni ítems (Hearts, Streak Freeze, frames). |
| **Vibe – Dark, neon, tactile** | `MapScreen` bg `#15241a`; `Colors.ts`; botones con `activeOpacity` | ⚠️ | Base presente; falta más "juicy" (confetti, sonidos, micro-animaciones). |

---

### 5. Backend – Modelos y APIs

| Concepto | Schema / API | Estado | Detalle |
|---------|--------------|--------|---------|
| **User – level, xp, streak, currentDay** | `schema.prisma` `User`: `level`, `xp`, `streakCurrent`, `currentDayIndex` | ✅ | Campos existen. |
| **User profile expuesto** | `identity` `GetUserProfileUseCase` → `UserDto`: solo `id`, `email` | ❌ | No se exponen level, xp, streak, currentDayIndex al cliente. |
| **UserStats (gamificación)** | `UserStats`: `xp`, `level`, `currentStreak`, `longestStreak`, `lastActivityDate` | ✅ | Usado por `GamificationService`. Duplicado con `User` (dos fuentes de verdad). |
| **Gamification API** | `GET /gamification/stats/:userId` → XP, level, streaks | ✅ | No requiere JWT en código actual; útil para desarrollo. |
| **XP y streak** | `GamificationService.awardXp`, `updateStreak`; `UserStatsEntity.addXp`, `updateStreak` (lógica de días consecutivos) | ✅ | Lógica de racha por fecha correcta. |
| **Eventos** | `habit.completed` → XP + streak; `daily_plan.completed` → XP | ⚠️ | `daily_plan.completed` nunca se emite en el código (listener muerto). |
| **Planning** | `DailyPlan` por `userId` + `date`; `PlanItem` (título, completado); `POST /planning/generate`, `GET /planning/today?userId=` | ✅ | Plan por día natural; no por "día 1, 2…" del path. |
| **Path / Challenge** | `Challenge`, `DailyTaskDefinition` (dayIndex, title, type, workoutBlockId), `UserProgress` (currentDay, status) | ✅ | Modelo "path por días" existe; no hay endpoint que devuelva path para el mapa. |
| **Workouts** | `LogWorkoutUseCase` guarda workout; no emite evento a gamificación | ❌ | Completar workout no da XP ni actualiza racha desde API. |
| **Gems / economía** | — | ❌ | No hay modelo ni endpoints para Gems, ítems ni tienda. |
| **Admin unlock phase** | `AdminService.forceUnlock(userId, challengeTitle)` busca por `title`; controller pasa `challengeId` | 🐛 | Inconsistencia: body envía `challengeId` pero servicio usa como título. |

**Resumen Backend:** Hay base (User, UserStats, Challenge, UserProgress, Planning); faltan: API de path para mapa, sincronizar User vs UserStats, emitir `daily_plan.completed`, conectar workout→XP/streak, economía (Gems/shop) y corregir admin unlock.

---

### 6. Mobile – Integración con backend

| Flujo | Uso de API | Estado |
|-------|------------|--------|
| Login / Register | `apiClient` + SecureStore token | ✅ |
| Workouts (history, log, stats) | `apiClient` en `workouts/` | ✅ |
| Admin | fetch directo a `localhost:3008` | ✅ |
| **Mapa (path, wallet, completar nodo)** | Ninguno; todo en `use-path.ts` + mock | ❌ |
| **Profile (level, XP, streak)** | Ninguno; "Level 7 • 12,450 XP" y "12 Streak" hardcodeados en `profile.tsx` | ❌ |
| **Onboarding → guardar perfil** | No se envía a backend al terminar onboarding | ❌ |

**Resumen Mobile:** El mapa y el perfil son estáticos/mock; no hay integración con gamificación ni planning.

---

## Parte 2: Inventario de archivos clave

- **Saga Map (mobile):**  
  `path.types.ts`, `path.domain.ts`, `path.domain.test.ts`, `mock-path.ts`, `use-path.ts`, `MapScreen.tsx`, `SagaPath.tsx`, `MapNode.tsx`, `PathHeader.tsx`, `NodeDetailModal.tsx`, `VictoryOverlay.tsx`, `(tabs)/index.tsx`.
- **Onboarding:**  
  `app/onboarding/step1.tsx` … `step6.tsx`, `language.tsx`.
- **API gamificación:**  
  `gamification.service.ts`, `gamification.listeners.ts`, `user-stats.entity.ts`, `xp.constants.ts`, `gamification.controller.ts`.
- **API planning:**  
  `daily-plan.entity.ts`, `plan-item.entity.ts`, `generate-daily-plan.use-case.ts`, `get-daily-plan.use-case.ts`, `prisma-plan.repository.ts`, `planning.controller.ts`.
- **API identidad:**  
  `get-user-profile.use-case.ts`, `user.dto.ts`, `identity.controller.ts`.
- **Schema:**  
  `User`, `UserStats`, `DailyPlan`, `PlanItem`, `Challenge`, `DailyTaskDefinition`, `UserProgress`.

---

## Parte 3: Plan propuesto (priorizado y por fases)

### Fase 1 – Conectar mapa y perfil al backend (fundamento)

Objetivo: que el mapa y el perfil reflejen datos reales y que completar un nodo persista.

1. **API: Path para el mapa**
   - Crear endpoint p. ej. `GET /planning/path` (o `/challenge/current-path`) que, dado `userId` (JWT):
     - Use `UserProgress` + `Challenge` + `DailyTaskDefinition` para el challenge activo (o uno por defecto).
     - Devuelva: `phaseLabel`, `phaseNumber`, `nodes[]` (id, dayIndex, title, subtitle, durationMinutes, xpReward, gemsReward), `currentDayIndex`.
   - Si no hay challenge/config, devolver path por defecto (ej. Phase 1 con 7 nodos) desde backend para no depender del mock en mobile.

2. **API: Wallet y progreso**
   - Opción A: Ampliar `GET /identity/me` (o `GET /gamification/me`) para incluir: `level`, `xp`, `currentStreak`, `longestStreak`, `currentDayIndex`, `gems` (cuando exista modelo).
   - Opción B: Mantener `GET /gamification/stats/:userId` y que el cliente autenticado llame con su `userId`; asegurar que esté protegido por JWT y que el `userId` sea el del token.
   - Unificar fuente: o bien `User` o bien `UserStats` para level/xp/streak y que el otro se derive/sincronice para no tener dos fuentes de verdad.

3. **API: Completar nodo del path**
   - Crear p. ej. `POST /planning/complete-node` (o `POST /gamification/complete-path-day`) con `userId` (JWT), `dayIndex` (y opcionalmente `challengeId`):
     - Validar que `dayIndex` sea el actual (no saltar).
     - Incrementar `User.currentDayIndex` (o el currentDay del `UserProgress` del challenge).
     - Llamar a `GamificationService.awardXp(userId, xpDelNodo)` y `GamificationService.updateStreak(userId)`.
     - (Cuando exista) Actualizar Gems del usuario.
   - Opcional: emitir evento tipo `path_node.completed` y que un listener actualice UserStats/User para mantener una sola fuente si se decide.

4. **Mobile: usePath con API**
   - Crear capa de aplicación (p. ej. `path-api.ts` o dentro de `use-path.ts`) que:
     - Al montar (y con usuario logueado): llame a `GET /planning/path` y a wallet/stats; inicialice `nodes`, `activeDayIndex`, `wallet` (hearts, gems, streak) desde la respuesta.
     - Al completar nodo: llame a `POST /planning/complete-node` (o el que se defina), luego actualice estado local con la respuesta del servidor (o re-fetch path + stats).
   - Mantener mock como fallback si no hay token o la API falla (o modo demo).

5. **Mobile: Profile con datos reales**
   - En `profile.tsx`, obtener usuario (y si se añade, stats) desde `GET /identity/me` (ampliado) o `GET /gamification/stats/:userId`.
   - Mostrar level, XP, streak (y luego Gems) desde la respuesta; quitar valores hardcodeados.

6. **Corrección admin**
   - En `admin.service.ts`: si el contrato es por `challengeId` (UUID), usar `where: { id: challengeId }`; si es por título, documentar y que el cliente envíe `challengeTitle`. Ajustar controller en consecuencia.

**Entregables Fase 1:** Mapa alimentado por API, completar nodo persiste y actualiza XP/streak, perfil con datos reales, admin unlock coherente.

---

### Fase 2 – Onboarding “contrato” y primera experiencia

7. **Pantalla “Contrato” post-objetivo**
   - Tras step1 (o step2), añadir una pantalla (o reutilizar step existente) que muestre: “Hemos creado tu path de 30 días” (o N según challenge), resumen del objetivo elegido, y CTA “Empezar” que lleve al mapa (o a step siguiente hasta llegar al mapa).
   - Opcional: al “Empezar”, llamar a `POST /planning/generate` (o endpoint que asigne challenge/path al usuario) para que el backend tenga un plan/path desde el primer día.

8. **Persistir onboarding**
   - Al finalizar onboarding, enviar datos relevantes (objetivo, peso, altura, etc.) a `PUT /identity/profile` (o endpoint específico de onboarding) para que `User` quede con goals y datos de perfil.

**Entregables Fase 2:** Usuario siente “contrato” claro y sus datos quedan guardados; mapa puede usar challenge/path asignado.

---

### Fase 3 – Retención: Streak Rescue y economía (Gems)

9. **Modelo de economía en backend**
   - En Prisma: añadir `gems` a `User` o a `UserStats`; opcionalmente modelo `UserItem` (userId, itemId, quantity) o `Inventory` para ítems.
   - Modelo `Item` (o enum): ej. `STREAK_FREEZE`, `HEART_REFILL`, `AVATAR_FRAME_*` con coste en Gems.
   - Endpoint `POST /gamification/use-item` (ej. Streak Freeze) que reste Gems y aplique efecto (p. ej. no romper racha ese día).

10. **Lógica de “día perdido”**
    - En backend: al cargar stats (o en cron), si `lastActivityDate` es anterior a “ayer”, considerar racha rota o “en riesgo”.
    - Opción: flag `streakFrozen` o “streak break date” para mostrar en cliente que puede usar Streak Freeze.

11. **Mobile: Modal Streak Rescue**
    - Cuando el cliente detecte “streak roto” o “en riesgo” (desde API o desde fecha), mostrar modal: “¡Tu racha se está apagando!” con opción “Usar 50 Gems para reparar” y “Dejarla morir”.
    - Llamar a `POST /gamification/use-item` (Streak Freeze) y actualizar wallet/streak desde respuesta.

12. **API: Devolver Gems en wallet**
    - Incluir `gems` en el endpoint de me/stats que use el mapa y el perfil.

**Entregables Fase 3:** Usuario puede gastar Gems en Streak Freeze y ver el flujo de “rescate” de racha.

---

### Fase 4 – Tienda y uso de Gems

13. **Backend: Catálogo y compra**
    - Endpoints: `GET /shop/items` (lista de ítems con precio), `POST /shop/purchase` (userId, itemId) que reste Gems y registre ítem (o incremento de hearts, etc.).

14. **Mobile: Pantalla Shop**
    - Lista de ítems (Hearts refill, Streak Freeze, frames de avatar) con precios en Gems; botón comprar que llame a `POST /shop/purchase` y actualice wallet.

**Entregables Fase 4:** Tienda funcional y uso de Gems en ítems definidos.

---

### Fase 5 – Experiencia “juicy” y cierre de fase

15. **Victory: confetti y sonido**
    - En `VictoryOverlay`: añadir confetti (lib como `react-native-confetti-cannon` o similar) y, si se quiere, sonido corto al abrir (ej. `expo-av`).
    - Opcional: animación de “Gems volando” hacia el header (o número de Gems subiendo).

16. **Barra de XP en Victory**
    - Mostrar barra de progreso de XP (ej. actual vs umbral del siguiente nivel) que se llene con animación.

17. **Boss y fin de fase**
    - En path: marcar nodos tipo “Boss” (desde API o por convención dayIndex múltiplo de 7) y darles estilo/icono distinto en `MapNode`.
    - Al completar último nodo de fase: pantalla “Phase Complete” con resumen y CTA “Desbloquear Phase 2” (o desbloqueo automático vía backend).

18. **Level up en Victory**
    - Si el servidor indica “levelUp: true” (o se calcula en cliente con XP nuevo), mostrar en Victory “Level X!” y opcionalmente cambio de borde/avatar en perfil.

**Entregables Fase 5:** Sensación de recompensa mayor y cierre claro de fase.

---

### Fase 6 – Hábitos, plan diario y eventos

19. **Emitir `daily_plan.completed`**
    - Donde se marque el plan del día (o todos los ítems) como completados (p. ej. en planning o en un “complete daily plan” use case), emitir `DailyPlanCompletedEvent` para que el listener de gamificación otorgue XP.

20. **Workout → XP y racha**
    - En `LogWorkoutUseCase` (o al confirmar workout desde el flujo del mapa): emitir evento (ej. `workout.completed` o reutilizar `path_node.completed`) que dispare awardXp y updateStreak cuando el workout corresponda al nodo del día.

21. **Notificaciones (opcional)**
    - Configurar push (expo-notifications) y enviar recordatorios tipo “No pierdas tu racha de X días” según `lastActivityDate` y streak (backend puede exponer endpoint para que un job envíe notificaciones o un worker emita eventos).

**Entregables Fase 6:** Plan diario y workouts contribuyen a XP/streak; evento daily_plan usado; base para notificaciones.

---

## Parte 4: Resumen de prioridades

| Prioridad | Qué | Fase |
|-----------|-----|------|
| P0 | Path y wallet desde API; completar nodo persiste; perfil con datos reales | Fase 1 |
| P1 | Contrato onboarding; persistir perfil al terminar onboarding | Fase 2 |
| P1 | Streak Rescue (modal + uso de Gems); modelo Gems en backend | Fase 3 |
| P2 | Tienda (catálogo + compra) | Fase 4 |
| P2 | Victory confetti/sonido; barra XP; Boss/fin de fase; Level up en Victory | Fase 5 |
| P3 | daily_plan.completed; workout→XP/streak; notificaciones | Fase 6 |

---

## Parte 5: Bugs y deuda técnica detectados

- **Admin unlock:** `AdminController` envía `challengeId` en body; `AdminService.forceUnlock` usa ese valor en `findFirst({ where: { title: challengeTitle } })`. Corregir para usar `id` si el contrato es UUID, o renombrar param a `challengeTitle` y documentar.
- **User vs UserStats:** Dos fuentes para level/xp/streak; conviene elegir una fuente canónica (p. ej. UserStats para gamificación) y que el otro se mantenga en sync o se deprecie.
- **GET /identity/me:** No devuelve level, xp, streak, currentDayIndex; necesario para perfil y para wallet en mapa.
- **daily_plan.completed:** Ningún use case emite este evento; el listener existe pero no se usa.
- **LogWorkoutUseCase:** No integrado con gamificación (no XP ni streak por workout).

---

*Documento generado a partir del análisis del código en el repositorio Habixa (apps/api, apps/mobile) y de la estrategia de gamificación “Duolingo for Fitness”.*
