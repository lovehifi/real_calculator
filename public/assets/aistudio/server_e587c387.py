import os
import sys
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler

import calculator_engine

PORT = 8890
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

SAMPLE_RESULT_PATH = os.path.join(DIRECTORY, "sample_calc_result.json")

class RealCalculatorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        # Hỗ trợ cả endpoint mới và endpoint cũ
        if self.path.startswith("/api/calculator/calc") or self.path.startswith("/api/fs-pro/calc") or self.path.startswith("/api/fs/calc"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode("utf-8"))
                inp = payload.get("input", {})
                if inp:
                    data = calculator_engine.run_calculation(inp)
                elif os.path.exists(SAMPLE_RESULT_PATH):
                    with open(SAMPLE_RESULT_PATH, "r", encoding="utf-8") as f:
                        data = json.load(f)
                else:
                    data = {"v": 1, "error": "empty_input"}
            except Exception as e:
                sys.stderr.write(f"[CALCULATOR ERROR] {e}\n")
                if os.path.exists(SAMPLE_RESULT_PATH):
                    with open(SAMPLE_RESULT_PATH, "r", encoding="utf-8") as f:
                        data = json.load(f)
                else:
                    data = {"v": 1, "error": str(e)}

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            return
            
        super().do_POST()

    def do_GET(self):
        if self.path.startswith("/api/calculator/config") or self.path.startswith("/api/fs/config") or self.path.startswith("/api/fs-pro/config"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"turnstileSiteKey": None, "devLogin": False}).encode("utf-8"))
            return

        if self.path.startswith("/api/calculator/me") or self.path.startswith("/api/fs-pro/me") or self.path.startswith("/api/auth/me"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "user": {"email": "admin@realcalculator.vn"}, "configured": True}).encode("utf-8"))
            return

        super().do_GET()

    def log_message(self, format, *args):
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

if __name__ == "__main__":
    server_address = ("127.0.0.1", PORT)
    httpd = HTTPServer(server_address, RealCalculatorHandler)
    print(f"==================================================")
    print(f"=== Real Calculator Pro — Bộ Máy Tính Toán BĐS ===")
    print(f"==================================================")
    print(f"Serving at: http://127.0.0.1:{PORT}")
    print(f"Directory:  {DIRECTORY}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
