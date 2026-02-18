# Plan de Diagnóstico y Resolución de Problemas de Inicio de Sesión

Este plan detalla los pasos para identificar y solucionar la causa del error de inicio de sesión en el Dashboard (`telegate-dashboard.web.app`).

**Objetivo Principal:** Restaurar el acceso al Dashboard mediante Google Auth.

## Fase 1: Verificación de Infraestructura (SOLUCIONADO ✅)
1.  **Diagnóstico Final:**
    *   La configuración ambiental (`.env`) seguía siendo inestable en el entorno de build.
2.  **Solución Definitiva:**
    *   **Se modificó el código fuente (`src/lib/api.ts`)** para usar directamente la URL de producción, eliminando cualquier dependencia de variables de entorno.
    *   Se realizó una limpieza completa de caché de build (`.next`, `.firebase`).
    *   **Resultado:** Verificación por navegador confirma que `localhost` ha desaparecido y las peticiones van al Backend en Cloud Run.
3.  **Backend - CORS:**
    *   **Estado:** ✅ Configurado y funcional.

## Fase 2: Configuración del Cliente (Google Auth)
1.  **Validar `GOOGLE_CLIENT_ID`:**
    *   Confirmar que el `CLIENT_ID` usado en el frontend (`1054327025113-...`) coincide con la consola de Google Cloud.
    *   **Estado:** Verificado (Correcto).
2.  **Orígenes Autorizados en Google Cloud:**
    *   El usuario debe verificar en la consola de Google Cloud que `https://telegate-dashboard.web.app` está añadido en "Authorized JavaScript origins".
    *   Si falta, el login fallará con "Error de credenciales" o popup cerrado inesperadamente.

## Fase 3: Análisis de Errores (Logs del Servidor)
1.  **Monitorizar Cloud Run:**
    *   Revisar logs en tiempo real durante un intento de login fallido.
    *   Identificar códigos de error: `403 Forbidden`, `500 Internal Server Error`, `401 Unauthorized`.
2.  **Verificar Lógica de Creación de Usuario:**
    *   Si el token es válido pero el backend falla al crear el usuario en la base de datos (Supabase), investigar logs de error de DB.

## Fase 4: Pruebas de Red (Browser Developer Tools)
*   **Instrucciones para el Usuario:**
    1.  Abrir DevTools (F12) -> Pestaña "Network".
    2.  Filtrar por "XHR" o "Fetch".
    3.  Intentar Login.
    4.  Observar la petición a `/api/auth/google`.
    5.  Si falla (rojo), revisar la pestaña "Response" para ver el mensaje de error del servidor.

---

**Siguiente Paso:** Confirmar el éxito del despliegue actual y pedir al usuario que pruebe de nuevo. Si persiste, ejecutar Fase 3.
