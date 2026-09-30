import argparse
import socket

import uvicorn

from app.config import settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-reload", action="store_true")
    args = parser.parse_args()
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", settings.backend_port))
        except OSError:
            raise SystemExit(f"Backend port {settings.backend_port} is occupied. Stop its service or change BACKEND_PORT.")
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.backend_port, reload=not args.no_reload)


if __name__ == "__main__":
    main()
