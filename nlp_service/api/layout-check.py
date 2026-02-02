"""Vercel serverless: POST /api/layout-check - ATS layout score."""
import json
import sys
import os
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.pdf_utils import ats_layout_from_pdf


def parse_multipart(body: bytes, content_type: str):
    if not content_type or "multipart/form-data" not in content_type:
        return None
    boundary = None
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            boundary = part[9:].strip().strip('"')
            break
    if not boundary:
        return None
    parts = body.split(("--" + boundary).encode())
    for part in parts:
        if b"Content-Disposition" not in part or b"filename=" not in part:
            continue
        lines = part.split(b"\r\n")
        i = 0
        while i < len(lines) and lines[i] != b"":
            i += 1
        i += 1
        if i < len(lines):
            raw = b"\r\n".join(lines[i:]).strip()
            if raw.endswith(b"--"):
                raw = raw[:-2].strip()
            return raw
    return None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            content_type = self.headers.get("Content-Type", "")
            body = self.rfile.read(content_length) if content_length else b""
            raw = parse_multipart(body, content_type)
            if raw is None:
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "No PDF file."}).encode("utf-8"))
                return
            result = ats_layout_from_pdf(raw)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as e:
            self.send_response(422)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode("utf-8"))
