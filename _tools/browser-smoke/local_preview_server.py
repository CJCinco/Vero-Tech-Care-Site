#!/usr/bin/env python3
"""Serve the static site locally with production-style extensionless routes."""

from argparse import ArgumentParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


SITE_ROOT = Path(__file__).resolve().parents[2]


class CleanRouteHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        translated = Path(super().translate_path(path))
        request_path = urlsplit(path).path

        if request_path != "/" and not request_path.endswith("/") and not translated.suffix:
            html_candidate = translated.with_suffix(".html")
            if html_candidate.is_file():
                return str(html_candidate)

        return str(translated)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()

    handler = lambda *handler_args, **handler_kwargs: CleanRouteHandler(  # noqa: E731
        *handler_args,
        directory=str(SITE_ROOT),
        **handler_kwargs,
    )
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"Serving {SITE_ROOT} at http://127.0.0.1:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
