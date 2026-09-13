"""
TuneFetch One-Command Automatic Setup Script
Installs all backend Python dependencies and registers the 'tunefetch' global terminal command.
"""

import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
REQUIREMENTS_FILE = BASE_DIR / "backend" / "requirements.txt"
DOWNLOAD_PY = BASE_DIR / "download.py"

def print_banner():
    print("=" * 65)
    print("        TuneFetch Automatic Setup & CLI Installer")
    print("=" * 65)
    print()

def install_requirements():
    print("[1/2] Installing backend Python dependencies...")
    if not REQUIREMENTS_FILE.exists():
        print(f"[!] Error: {REQUIREMENTS_FILE} not found.")
        sys.exit(1)
    
    cmd = [sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS_FILE)]
    try:
        subprocess.check_call(cmd)
        print("[+] Dependencies installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"[!] Error installing dependencies: {e}")
        print("[!] Please try running: pip install -r backend/requirements.txt manually.")

def register_global_command():
    print("\n[2/2] Registering global 'tunefetch' CLI command...")
    
    if sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            target_dir = Path(local_app_data) / "Microsoft" / "WindowsApps"
            target_dir.mkdir(parents=True, exist_ok=True)
            cmd_file = target_dir / "tunefetch.cmd"
            
            python_exe = sys.executable
            cmd_content = f'@echo off\n"{python_exe}" "{DOWNLOAD_PY.resolve()}" %*\n'
            
            try:
                with open(cmd_file, "w", encoding="utf-8") as f:
                    f.write(cmd_content)
                print(f"[+] Registered command wrapper at: {cmd_file}")
                return True
            except Exception as e:
                print(f"[!] Warning: Could not write to {cmd_file}: {e}")
    else:
        # Linux / macOS symlink in ~/.local/bin or /usr/local/bin
        user_bin = Path.home() / ".local" / "bin"
        user_bin.mkdir(parents=True, exist_ok=True)
        sh_file = user_bin / "tunefetch"
        sh_content = f'#!/bin/sh\nexec "{sys.executable}" "{DOWNLOAD_PY.resolve()}" "$@"\n'
        try:
            with open(sh_file, "w", encoding="utf-8") as f:
                f.write(sh_content)
            sh_file.chmod(0o755)
            print(f"[+] Registered command wrapper at: {sh_file}")
            return True
        except Exception as e:
            print(f"[!] Warning: Could not write to {sh_file}: {e}")
    
    return False

def main():
    print_banner()
    install_requirements()
    register_global_command()
    
    print("\n" + "=" * 65)
    print("                    SETUP COMPLETE!")
    print("=" * 65)
    print()
    print("You can now download any Spotify playlist from ANY terminal folder!")
    print()
    print("Usage:")
    print("    tunefetch TF-XXXX")
    print()
    print("Example:")
    print("    tunefetch TF-4847")
    print()
    print(f"Downloaded MP3s are saved directly to:")
    print("  Downloads/Thanks for downloading")
    print("=" * 65)
    print()

if __name__ == "__main__":
    main()
