from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from news_service import get_snapshot, start_refresh_if_needed


HOST = os.getenv("NEWS_HOST", "127.0.0.1")
PORT = int(os.getenv("NEWS_PORT", "8787"))


class NewsHandler(BaseHTTPRequestHandler):
    server_version = "SafeGuardNews/1.0"

    def _json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        path = urlparse(self.path).path
        if path == "/health":
            self._json(200, {"ok": True, "service": "newspaper4k"})
            return
        if path == "/api/news":
            start_refresh_if_needed()
            self._json(200, get_snapshot())
            return
        self._json(404, {"error": "Not found"})

    def log_message(self, message: str, *args: object) -> None:
        print(f"[news] {self.address_string()} {message % args}")


if __name__ == "__main__":
    start_refresh_if_needed()
    server = ThreadingHTTPServer((HOST, PORT), NewsHandler)
    print(f"SafeGuard newspaper4k service listening on http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
