from abc import ABC, abstractmethod

class StorageProvider(ABC):
    @abstractmethod
    async def save_file(self, content: bytes, filename: str) -> str:
        """Saves a file and returns the identifier/URL."""
        pass

    @abstractmethod
    async def read_file(self, filename: str) -> bytes:
        """Reads a file and returns its content as bytes."""
        pass

    @abstractmethod
    def file_exists(self, filename: str) -> bool:
        """Checks if a file exists."""
        pass

    @abstractmethod
    def get_public_url(self, filename: str) -> str:
        """Returns a URL to access the file."""
        pass
