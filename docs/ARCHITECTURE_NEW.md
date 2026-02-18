# FGate Backend Architecture (Clean Architecture)

This document describes the structure of the Python backend after migration to Clean Architecture.

## 1. Structure Overview

The project is preserving the `api/` folder as entry point but logic has moved to:

- `core/`: **Enterprise Business Rules** (Entities) & **Application Business Rules** (Use Cases).
- `application/`: **Interface Adapters** (Controllers, DTOs, Middlewares).
- `infrastructure/`: **Frameworks & Drivers** (Database, External APIs, Config).

## 2. Directory Map

### `core/` (The Heart)
- `entities/`: Pure Python classes (SQLAlchemy models). Independent of frameworks (mostly).
  - `user.py`, `channel.py`, `subscription.py`, etc.
- `use_cases/`: Business logic executables.
  - `activate_membership.py`: Logic for activating plans.
  - `distribute_funds.py`: Logic for MLM distribution.
  - `auth.py`: Logic for authentication.

### `application/` (The Glue)
- `controllers/`: FastAPI routers (formerly `api/routes`).
  - `auth_controller.py`, `payment_controller.py`.
- `dto/`: Pydantic models (Data Transfer Objects).
  - `user.py`, `auth.py`.
- `middlewares/`: Request processing.
  - `auth.py` (JWT validation), `rate_limiter.py`.

### `infrastructure/` (The Tools)
- `database/`: `connection.py` (SQLAlchemy engine).
- `external_apis/`: Clients for 3rd parties.
  - `telegram.py`, `stripe_client.py`, `blockchain.py`.
- `config/`: `logging.py`.
- `cache/`: `memory_cache.py`, `availability_cache.py`.

### `api/` (The Entry Point & Legacy Compat)
- `main.py`: **Entry Point**. Mounts routers.
- `routes/__init__.py`: Re-exports controllers from `application/` to keep `main.py` happy.
- `deps.py`: Re-exports auth logic from `application/`.
- `services/`: Re-exports use cases from `core/`.

### `shared/` (The Legacy Bridge)
- `models.py`: Re-exports entities from `core/` (keeps Bot working).
- `database.py`: Re-exports connection from `infrastructure/`.
- `accounting.py`: Re-exports logic from `core/`.

## 3. Key Benefits
1. **Separation of Concerns:** Business logic vs API logic.
2. **Testability:** Core logic can be tested without FastAPI.
3. **Modularity:** Infrastructure can be swapped (e.g., Stripe -> PayPal) easier.
4. **Maintainability:** Clear place for everything.
