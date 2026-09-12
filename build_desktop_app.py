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
    
    # Step 1: Ensure frontend is built
    print("\n[1/4] Building Frontend...")
    if not (frontend_dir / "dist" / "index.html").exists():
        print("Frontend dist not found. Please run 'npm run build' inside the frontend folder first.")
        # Alternatively, we could run it automatically:
        # subprocess.run("npm install", cwd=frontend_dir, shell=True, check=True)
        # subprocess.run("npm run build", cwd=frontend_dir, shell=True, check=True)
    
    # Step 2: Copy frontend build to backend/frontend_dist
    print("\n[2/4] Copying frontend build to backend...")
    frontend_dist_dest = backend_dir / "frontend_dist"
    if frontend_dist_dest.exists():
        shutil.rmtree(frontend_dist_dest)
    shutil.copytree(frontend_dir / "dist", frontend_dist_dest)
    
    # Step 3: Install PyInstaller if not installed
    print("\n[3/4] Installing PyInstaller...")
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
    
    # Step 4: Run PyInstaller
    print("\n[4/4] Running PyInstaller...")
    
    # The --add-data flag uses ';' on Windows and ':' on Unix
    separator = ";" if os.name == "nt" else ":"
    
    pyinstaller_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", "TuneFetch",
        "--onefile",
        "--windowed", # Hides the console window (you can remove this if you want to see logs)
        "--add-data", f"frontend_dist{separator}frontend_dist",
        "--clean",
        "--distpath", str(dist_dir),
        str(backend_dir / "launcher.py")
    ]
    
    subprocess.run(pyinstaller_cmd, cwd=backend_dir, check=True)
    
    print("\n=========================================")
    print(f" Build Complete! You can find your app at: ")
    print(f" {dist_dir / 'TuneFetch.exe'} ")
    print("=========================================")

if __name__ == "__main__":
    main()
