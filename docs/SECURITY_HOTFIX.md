# 🚨 Auditoría de Seguridad y Plan de Acción

Este documento resume los secretos que fueron expuestos accidentalmente en GitHub y los pasos obligatorios para proteger la plataforma **TeleGate**.

## 🔴 Secretos Expuestos (DEBEN SER ROTADOS)

Los siguientes valores fueron detectados en el historial de Git y se consideran comprometidos:

1.  **Contraseña de Supabase (Base de Datos):** Expuesta en scripts de despliegue.
2.  **JWT_SECRET_KEY:** Expuesta en `api/main.py`. Si un atacante tiene esto, puede falsificar identidades de usuario.
3.  **URL de Base de Datos:** Expuesta en scripts.

## 🛠️ Plan de Acción Inmediato

### 1. Rotación de Credenciales de Base de Datos
*   **A dónde ir:** [Panel de Supabase](https://app.supabase.com)
*   **Acción:** Ve a `Project Settings` > `Database` y haz clic en **"Reset database password"**.
*   **Impacto:** Esto invalidará la contraseña antigua expuesta.

### 2. Generación de Nueva Clave JWT
*   **Acción:** Genera una cadena aleatoria de 64 caracteres. Puedes usar este comando en tu terminal:
    ```bash
    openssl rand -hex 32
    ```
*   **Donde ponerla:** Actualiza la variable `JWT_SECRET_KEY` en tu `.env` local y en Cloud Run.

### 3. Configuración Segura en Google Cloud (Secret Manager)
Para dejar de escribir contraseñas en los archivos, usaremos **Secret Manager**:

1.  Ve a la [Consola de Google Cloud](https://console.cloud.google.com/security/secret-manager).
2.  Crea un nuevo Secreto llamado `DATABASE_URL` y pega tu nueva URL de Supabase.
3.  Crea un nuevo Secreto llamado `JWT_SECRET_KEY` y pega tu nueva clave.
4.  Repite para `BOT_TOKEN`, `STRIPE_PRIVATE_KEY` y `WOMPI_PRIVATE_KEY`.

### 4. Limpieza Final del Repositorio
Para que GitGuardian deje de enviar alertas, no basta con borrar el texto, hay que eliminarlo de la historia de Git. Como este es un proyecto privado y manejable, lo más rápido ahora que ya "limpiamos" el código actual es:
1.  Continuar trabajando sobre la versión limpia que ya subí.
2.  Asegurarse de que el archivo `.env` **NUNCA** sea rastreado (ya está en el `.gitignore`).

---

## ✅ Estado del Código
*   [x] Eliminados secretos de `api/main.py`.
*   [x] Eliminadas credenciales de `deploy-with-env.sh`.
*   [x] Creado `deploy-safe.sh` que usa Secret Manager.
*   [x] Forzada la validación de variables de entorno en la API.
