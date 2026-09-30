import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.config import settings

print(json.dumps({"frontendPort": settings.frontend_port, "backendPort": settings.backend_port}))
