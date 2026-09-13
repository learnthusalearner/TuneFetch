"""
TuneFetch Global CLI Entrypoint
Run Spotify playlist downloads globally using session codes (e.g. tunefetch TF-XXXX).
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

def register_cmd():
    """Auto-register tunefetch command globally in Windows PATH if needed."""
    if sys.platform == "win32":
        try:
            local_app_data = os.environ.get("LOCALAPPDATA", "")
            if local_app_data:
                target_dir = Path(local_app_data) / "Microsoft" / "WindowsApps"
                target_dir.mkdir(parents=True, exist_ok=True)
                cmd_file = target_dir / "tunefetch.cmd"
                
                python_exe = sys.executable
                download_py = (BASE_DIR / "download.py").resolve()
                
                cmd_content = f'@echo off\n"{python_exe}" "{download_py}" %*\n'
                
                # Check if up to date
                need_write = True
                if cmd_file.exists():
                    try:
                        if cmd_file.read_text(encoding="utf-8") == cmd_content:
                            need_write = False
                    except Exception:
                        pass
                
                if need_write:
                    with open(cmd_file, "w", encoding="utf-8") as f:
                        f.write(cmd_content)
        except Exception:
            pass

def main():
    register_cmd()
    try:
        from launcher import main as launcher_main
        launcher_main()
    except ImportError as e:
        print(f"[!] Error loading TuneFetch backend components: {e}")
        print("[!] Please run: python install_cli.py")
        sys.exit(1)

if __name__ == "__main__":
    main()
