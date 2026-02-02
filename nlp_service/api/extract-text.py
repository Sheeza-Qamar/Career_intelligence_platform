"""Vercel serverless: POST /api/extract-text - PDF text extraction."""
import json
import sys
import os
from http.server import BaseHTTPRequestHandler

# Allow importing from parent (nlp_service root)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.pdf_utils import extract_pdf_text


def parse_multipart(body: bytes, content_type: str):
    """Parse multipart form and return file field (first file)."""
    if not content_type or "multipart/form-data" not in content_type:
        return None, None
    boundary = None
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            boundary = part[9:].strip().strip('"')
            break
    if not boundary:
        return None, None
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
            return raw, "application/pdf"
    return None, None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            content_type = self.headers.get("Content-Type", "")
            body = self.rfile.read(content_length) if content_length else b""
            raw, _ = parse_multipart(body, content_type)
            if raw is None:
                self.send_response(400)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "No PDF file in request."}).encode("utf-8"))
                return
            text = extract_pdf_text(raw)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"text": text}).encode("utf-8"))
        except Exception as e:
            self.send_response(422)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode("utf-8"))
