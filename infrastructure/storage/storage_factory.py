import os
from core.interfaces.storage import StorageProvider
from infrastructure.storage.local_disk import LocalStorageService

class StorageFactory:
    _instance: StorageProvider = None

    @classmethod
    def get_provider(cls) -> StorageProvider:
        if cls._instance is None:
            storage_type = os.getenv("STORAGE_TYPE", "LOCAL").upper()
            
            if storage_type == "CLOUD":
                # Aquí se cargará CloudStorageService cuando esté listo
                try:
                    # from infrastructure.storage.cloud_storage import CloudStorageService
                    # cls._instance = CloudStorageService()
                    pass
                except ImportError:
                    cls._instance = LocalStorageService()
            else:
                cls._instance = LocalStorageService()
                
        return cls._instance
