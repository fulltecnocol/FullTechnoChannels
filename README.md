# FGate Membership Bot

Sistema automatizado de gestión de membresías para canales de Telegram.

## Características
- **Bot de Telegram**: Gestiona Join Requests, muestra planes y procesa pagos.
- **Pagos**: Integración con Stripe (fácilmente extensible a Cryptos).
- **Dashboard**: Panel administrativo en Next.js para gestionar usuarios y métricas.
- **Infraestructura**: Despliegue listo con Docker Compose y PostgreSQL.

## Requisitos
- Docker y Docker Compose
- Token de Bot de Telegram (vía @BotFather)
- Cuenta de Stripe y API Keys

## Instalación
1. Clonar el repositorio.
2. Copiar `.env.example` a `.env` y completar los valores.
3. Ejecutar `docker compose up --build`.

## Desarrollo
- **/api**: FastAPI con Swagger en `/docs`.
- **/bot**: aiogram 3.x.
- **/dashboard**: Next.js 15.
- **/shared**: Modelos y lógica compartida entre microservicios.
