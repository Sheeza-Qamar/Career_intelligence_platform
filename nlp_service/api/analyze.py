"""Vercel serverless: POST /api/analyze - resume vs job skills."""
import json
import sys
import os
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib.pdf_utils import analyze_skills


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length else b""
            data = json.loads(body.decode("utf-8")) if body else {}
            resume_text = data.get("resume_text", "")
            job_role_skills = data.get("job_role_skills", [])
            skill_dictionary = data.get("skill_dictionary")
            result = analyze_skills(resume_text, job_role_skills, skill_dictionary)
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as e:
            self.send_response(422)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode("utf-8"))
