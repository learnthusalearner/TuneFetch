import os
import sys
import subprocess
import shutil
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"
    dist_dir = root_dir / "dist"
    
    print("=========================================")
    print("      Building TuneFetch Desktop App     ")
    print("=========================================")
    
    # Step 1: Build fresh frontend bundle
    print("\n[1/4] Building Frontend bundle...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    try:
        subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
    except Exception as e:
        print(f"Warning: npm run build failed ({e}). Checking if existing dist can be used...")
        if not (frontend_dir / "dist" / "index.html").exists():
            raise RuntimeError("Frontend dist missing and build failed!")
    
    # Step 2: Copy frontend build to backend/frontend_dist
    print("\n[2/4] Copying frontend build to backend...")
    frontend_dist_dest = backend_dir / "frontend_dist"
    if frontend_dist_dest.exists():
        shutil.rmtree(frontend_dist_dest)
    shutil.copytree(frontend_dir / "dist", frontend_dist_dest)
    
    # Step 3: Close any running TuneFetch instances before overwriting
    print("\n[3/4] Checking for running TuneFetch instances...")
    if os.name == "nt":
        subprocess.run(["powershell", "-Command", "Stop-Process -Name TuneFetch -Force -ErrorAction SilentlyContinue"], capture_output=True)

    # Step 4: Run PyInstaller for TuneFetch Engine and Installer Wizard
    print("\n[4/5] Running PyInstaller for TuneFetch CLI Engine...")
    
    separator = ";" if os.name == "nt" else ":"
    
    pyinstaller_cmd_engine = [
        sys.executable, "-m", "PyInstaller",
        "--name", "TuneFetch",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--version-file", "version_info.txt",
        "--exclude-module", "numpy",
        "--exclude-module", "pandas",
        "--exclude-module", "scipy",
        "--exclude-module", "matplotlib",
        "--exclude-module", "IPython",
        "--distpath", str(dist_dir),
        str(backend_dir / "launcher.py")
    ]
    subprocess.run(pyinstaller_cmd_engine, cwd=backend_dir, check=True)

    print("\n[5/5] Running PyInstaller for TuneFetch Setup Wizard...")
    setup_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        "--name",
        "TuneFetch_Setup",
        "--distpath",
        str(dist_dir),
        "--add-binary",
        f"{dist_dir / 'TuneFetch.exe'};.",
        str(backend_dir / "installer_wizard.py"),
    ]
    subprocess.run(setup_cmd, cwd=backend_dir, check=True)

    # Copy executables to backend/static so FastAPI serves them and Git commits them
    static_dir = backend_dir / "static"
    os.makedirs(static_dir, exist_ok=True)
    
    if (dist_dir / "TuneFetch_Setup.exe").exists():
        shutil.copy2(dist_dir / "TuneFetch_Setup.exe", static_dir / "TuneFetch_Setup.exe")
    if (dist_dir / "TuneFetch.exe").exists():
        shutil.copy2(dist_dir / "TuneFetch.exe", static_dir / "TuneFetch.exe")
        shutil.copy2(dist_dir / "TuneFetch.exe", backend_dir / "TuneFetch.exe")

    print("\n=========================================")
    print(f" Build Complete! Apps generated at: ")
    print(f" • {dist_dir / 'TuneFetch_Setup.exe'} (Installer Wizard)")
    print(f" • {dist_dir / 'TuneFetch.exe'} (CLI Downloader Engine)")
    print(f" • {static_dir / 'TuneFetch_Setup.exe'} (Static Downloadable Binary)")
    print("=========================================")

if __name__ == "__main__":
    main()
