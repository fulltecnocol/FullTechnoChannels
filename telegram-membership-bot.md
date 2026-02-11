# Telegram Membership Bot (InviteMember Clone)

## Goal
Construir un bot de membresía automatizado con Dashboard administrativo, pagos vía Stripe, base de datos PostgreSQL y despliegue en Docker.

## Tasks
- [x] Task 1: Estructurar el proyecto (monorepo) con carpetas para `bot`, `api`, `dashboard` y `docker`. → Verify: carpetas creadas.
- [x] Task 2: Configurar `docker-compose.yml` con servicios para PostgreSQL y los placeholders de las apps. → Verify: `docker compose up` levanta BD.
- [x] Task 3: Implementar el esquema de base de datos en PostgreSQL (Users, Subscriptions, Payments, Plans). → Verify: tablas creadas.
- [ ] Task 4: Desarrollar el core del Bot (aiogram) con manejo de `ChatJoinRequest` y comandos básicos. → Verify: bot responde `/start`.
- [ ] Task 5: Implementar el API Backend (FastAPI) para el Dashboard y Webhooks de Stripe. → Verify: endpoint `/health` y `/webhook/stripe` activos.
- [ ] Task 6: Integrar Stripe Checkout para la compra de planes. → Verify: enlace de pago generado por el bot funciona.
- [x] Task 7: Crear el Dashboard administrativo (Next.js) para visualizar métricas y gestionar usuarios. → Verify: login y tabla de usuarios visibles.
- [ ] Task 8: Configurar el script de "Expulsión Automática" (Cron/Task) para suscripciones vencidas. → Verify: usuario vencido es removido del grupo.

## Done When
- [ ] El bot gestiona solicitudes de unión basadas en el estado de pago.
- [ ] El Dashboard muestra los ingresos y usuarios activos.
- [ ] Todo el sistema corre dentro de contenedores Docker.
