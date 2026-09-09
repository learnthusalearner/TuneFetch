import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Automatically ensure the dedicated project venv is used if available
venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
if os.path.exists(venv_python):
    current_exe = os.path.abspath(sys.executable).lower()
    target_exe = os.path.abspath(venv_python).lower()
    if current_exe != target_exe:
        import subprocess
        sys.exit(subprocess.call([venv_python] + sys.argv))

import uvicorn

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    reload = os.environ.get("RELOAD", "false").lower() in ("true", "1")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
