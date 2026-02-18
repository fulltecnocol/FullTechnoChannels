import os
import asyncio
from core.interfaces.storage import StorageProvider

class LocalStorageService(StorageProvider):
    def __init__(self, base_path: str = "data/contracts"):
        # Ensure path is relative to project root
        project_root = os.getcwd()
        self.base_path = os.path.join(project_root, base_path)
        
        if not os.path.exists(self.base_path):
            os.makedirs(self.base_path, exist_ok=True)
            
    def _get_path(self, filename: str) -> str:
        # Basic sanitization to prevent directory traversal
        clean_name = os.path.basename(filename)
        return os.path.join(self.base_path, clean_name)

    async def save_file(self, content: bytes, filename: str) -> str:
        """
        Guarda el archivo en disco de forma asíncrona (usando thread pool).
        Retorna el nombre del archivo guardado.
        """
        path = self._get_path(filename)
        loop = asyncio.get_running_loop()
        
        # Ejecutar operación bloqueante en un hilo separado
        await loop.run_in_executor(None, self._write_file, path, content)
        
        return filename

    def _write_file(self, path: str, content: bytes):
        with open(path, 'wb') as f:
            f.write(content)

    def get_absolute_path(self, filename: str) -> str:
        return os.path.abspath(self._get_path(filename))

    def file_exists(self, filename: str) -> bool:
        return os.path.exists(self._get_path(filename))

    async def read_file(self, filename: str) -> bytes:
        """Lee un archivo del disco de forma asíncrona."""
        path = self._get_path(filename)
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._read_file_sync, path)

    def _read_file_sync(self, path: str) -> bytes:
        with open(path, 'rb') as f:
            return f.read()

    def get_public_url(self, filename: str) -> str:
        """En local, el URL público podría ser un path relativo o una ruta de API."""
        return f"/api/files/{filename}"
