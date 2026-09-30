import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import dotenv_values

project_root = Path(__file__).resolve().parents[2]
values = {
    **dotenv_values(project_root / ".env"),
    **dotenv_values(project_root / "backend" / ".env"),
    **os.environ,
}


def port(name: str, default: int) -> int:
    result = int(values.get(name) or default)
    if not 1 <= result <= 65535:
        raise ValueError(f"Invalid {name}: {result}")
    return result


@dataclass(frozen=True)
class Settings:
    frontend_port: int
    backend_port: int
    database_path: Path
    database_url: str
    cors_origins: list[str]


frontend_port = port("FRONTEND_PORT", 5174)
database_path = Path(values.get("DATABASE_PATH") or "backend/viewer.db")
if not database_path.is_absolute():
    database_path = project_root / database_path
origins = values.get("CORS_ORIGINS") or f"http://127.0.0.1:{frontend_port},http://localhost:{frontend_port}"
settings = Settings(
    frontend_port=frontend_port,
    backend_port=port("BACKEND_PORT", 8000),
    database_path=database_path.resolve(),
    database_url=values.get("DATABASE_URL") or f"sqlite:///{database_path.as_posix()}",
    cors_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
)
