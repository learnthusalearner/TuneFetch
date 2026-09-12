"""
TuneFetch Windows Setup Wizard (Installer)
Provides an attractive 4-step Setup Wizard (Welcome -> Terms of Service -> Install -> Finish)
Installs tunefetch.exe and automatically adds 'tunefetch' to the Windows User PATH.
"""
import os
import sys
import shutil
import winreg
import tkinter as tk
from tkinter import ttk, messagebox

APP_NAME = "TuneFetch"
APP_VERSION = "1.3.0"
DEFAULT_INSTALL_DIR = os.path.join(os.environ.get("LOCALAPPDATA", r"C:\Users\Public"), "Programs", "TuneFetch")

TERMS_OF_SERVICE = """
TUNEFETCH SOFTWARE LICENSE & TERMS OF SERVICE (v1.3.0)

1. ACCEPTANCE OF TERMS
By installing and using TuneFetch Desktop, you agree to be bound by these terms. TuneFetch is provided for personal music downloading and archival purposes.

2. PERSONAL USE ONLY
TuneFetch is designed to enable users to download audio streams for offline listening and personal media organization. Users are responsible for complying with local copyright laws.

3. NO WARRANTY & FREEMIUM PRIVACY
TuneFetch is provided "AS IS" without warranties of any kind. No personal data, passwords, or Spotify login credentials are ever collected or stored on our servers. All downloads are fetched at maximum 320 kbps MP3 quality directly onto your local machine.

4. AUTOMATIC PATH REGISTRATION
Installing TuneFetch adds the executable directory to your Windows User PATH environment variable so you can run 'tunefetch' from any Command Prompt or Terminal window.

Click 'I Accept' below to proceed with the installation.
"""

class TuneFetchInstaller(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} v{APP_VERSION} Setup Wizard")
        self.geometry("640x480")
        self.resizable(False, False)
        self.configure(bg="#0b0f19")

        self.accepted_tos = tk.BooleanVar(value=False)
        self.install_dir_var = tk.StringVar(value=DEFAULT_INSTALL_DIR)

        # Style configuration
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure('TFrame', background='#0b0f19')
        self.style.configure('TLabel', background='#0b0f19', foreground='#ffffff', font=('Segoe UI', 10))
        self.style.configure('Header.TLabel', font=('Segoe UI', 16, 'bold'), foreground='#1DB954')
        self.style.configure('Title.TLabel', font=('Segoe UI', 20, 'bold'), foreground='#ffffff')

        self.container = ttk.Frame(self)
        self.container.pack(fill='both', expand=True, padx=24, pady=24)

        self.show_step_1_welcome()

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    # STEP 1: WELCOME SCREEN
    def show_step_1_welcome(self):
        self.clear_container()

        header = ttk.Label(self.container, text="♪ TuneFetch Setup Wizard", style='Header.TLabel')
        header.pack(anchor='w', pady=(0, 5))

        title = ttk.Label(self.container, text="Welcome to TuneFetch Downloader", style='Title.TLabel')
        title.pack(anchor='w', pady=(0, 15))

        desc = ttk.Label(
            self.container,
            text="This wizard will install TuneFetch High-Fidelity Audio Downloader on your computer.\n\n"
                 "• Installs standalone CLI & Desktop Engine\n"
                 "• Adds 'tunefetch' command to your Windows Command Prompt / Terminal\n"
                 "• Automatically downloads 320 kbps Ultra HQ MP3 files directly into Downloads/Thanks for downloading\n\n"
                 "Click Next to review the Terms of Service and proceed.",
            wraplength=580,
            justify='left'
        )
        desc.pack(anchor='w', pady=(0, 30))

        btn_frame = ttk.Frame(self.container)
        btn_frame.pack(fill='x', side='bottom')

        next_btn = tk.Button(
            btn_frame, text="Next >", font=('Segoe UI', 10, 'bold'),
            bg='#1DB954', fg='#000000', activebackground='#10b981',
            padx=20, pady=6, bd=0, cursor='hand2', command=self.show_step_2_terms
        )
        next_btn.pack(side='right')

        cancel_btn = tk.Button(
            btn_frame, text="Cancel", font=('Segoe UI', 10),
            bg='#1e293b', fg='#ffffff', padx=15, pady=6, bd=0, cursor='hand2',
            command=self.destroy
        )
        cancel_btn.pack(side='right', padx=10)

    # STEP 2: TERMS OF SERVICE / LICENSE AGREEMENT
    def show_step_2_terms(self):
        self.clear_container()

        header = ttk.Label(self.container, text="License Agreement & Terms of Service", style='Header.TLabel')
        header.pack(anchor='w', pady=(0, 5))

        sub = ttk.Label(self.container, text="Please review the terms before installing TuneFetch.", font=('Segoe UI', 10))
        sub.pack(anchor='w', pady=(0, 10))

        text_frame = ttk.Frame(self.container)
        text_frame.pack(fill='both', expand=True, pady=(0, 10))

        scrollbar = tk.Scrollbar(text_frame)
        scrollbar.pack(side='right', fill='y')

        tos_box = tk.Text(
            text_frame, wrap='word', yscrollcommand=scrollbar.set,
            bg='#151d2a', fg='#e2e8f0', font=('Consolas', 9), bd=1, relief='solid'
        )
        tos_box.insert('1.0', TERMS_OF_SERVICE.strip())
        tos_box.config(state='disabled')
        tos_box.pack(fill='both', expand=True)
        scrollbar.config(command=tos_box.yview)

        cb = tk.Checkbutton(
            self.container, text="I accept the Terms of Service & License Agreement",
            variable=self.accepted_tos, bg='#0b0f19', fg='#ffffff',
            selectcolor='#151d2a', activebackground='#0b0f19', activeforeground='#ffffff',
            font=('Segoe UI', 10, 'bold')
        )
        cb.pack(anchor='w', pady=(0, 15))

        btn_frame = ttk.Frame(self.container)
        btn_frame.pack(fill='x', side='bottom')

        next_btn = tk.Button(
            btn_frame, text="Next >", font=('Segoe UI', 10, 'bold'),
            bg='#1DB954', fg='#000000', activebackground='#10b981',
            padx=20, pady=6, bd=0, cursor='hand2',
            command=self.validate_tos
        )
        next_btn.pack(side='right')

        back_btn = tk.Button(
            btn_frame, text="< Back", font=('Segoe UI', 10),
            bg='#1e293b', fg='#ffffff', padx=15, pady=6, bd=0, cursor='hand2',
            command=self.show_step_1_welcome
        )
        back_btn.pack(side='right', padx=10)

    def validate_tos(self):
        if not self.accepted_tos.get():
            messagebox.showwarning("Agreement Required", "Please check 'I accept the Terms of Service' to proceed.")
            return
        self.show_step_3_install()

    # STEP 3: INSTALLATION & PATH REGISTRATION
    def show_step_3_install(self):
        self.clear_container()

        header = ttk.Label(self.container, text="Installing TuneFetch...", style='Header.TLabel')
        header.pack(anchor='w', pady=(0, 5))

        self.status_lbl = ttk.Label(self.container, text="Copying files and configuring PATH...", font=('Segoe UI', 10, 'bold'))
        self.status_lbl.pack(anchor='w', pady=(0, 15))

        self.progress = ttk.Progressbar(self.container, mode='indeterminate', length=580)
        self.progress.pack(fill='x', pady=20)
        self.progress.start(10)

        self.detail_lbl = ttk.Label(self.container, text=f"Target: {self.install_dir_var.get()}", font=('Consolas', 9), foreground='#94a3b8')
        self.detail_lbl.pack(anchor='w')

        self.after(800, self.perform_installation)

    def add_to_user_path(self, install_dir):
        """Adds installation directory to Windows User PATH environment variable."""
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment", 0, winreg.KEY_ALL_ACCESS)
            try:
                current_path, _ = winreg.QueryValueEx(key, "Path")
            except FileNotFoundError:
                current_path = ""

            paths = [p.strip() for p in current_path.split(";") if p.strip()]
            if install_dir not in paths:
                paths.append(install_dir)
                new_path = ";".join(paths)
                winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)
                print(f"[+] Added {install_dir} to User PATH.")
            winreg.CloseKey(key)
        except Exception as e:
            print(f"[!] Warning: Could not update User PATH: {e}")

    def perform_installation(self):
        target_dir = self.install_dir_var.get()
        try:
            os.makedirs(target_dir, exist_ok=True)

            source_exe = sys.executable if getattr(sys, 'frozen', False) else os.path.join(os.path.dirname(__file__), "dist", "TuneFetch.exe")
            target_exe = os.path.join(target_dir, "tunefetch.exe")

            if os.path.exists(source_exe) and source_exe != target_exe:
                shutil.copy2(source_exe, target_exe)
            elif os.path.exists(os.path.join(os.path.dirname(__file__), "TuneFetch.exe")):
                shutil.copy2(os.path.join(os.path.dirname(__file__), "TuneFetch.exe"), target_exe)

            # Register in System User PATH
            self.add_to_user_path(target_dir)

            self.progress.stop()
            self.show_step_4_finish()
        except Exception as err:
            self.progress.stop()
            messagebox.showerror("Installation Error", f"Failed to complete installation:\n{err}")

    # STEP 4: FINISH PAGE WITH EXAMPLE COMMAND
    def show_step_4_finish(self):
        self.clear_container()

        header = ttk.Label(self.container, text="✓ Installation Complete!", style='Header.TLabel', foreground='#10b981')
        header.pack(anchor='w', pady=(0, 5))

        title = ttk.Label(self.container, text="TuneFetch is Ready to Use", style='Title.TLabel')
        title.pack(anchor='w', pady=(0, 15))

        example_frame = tk.Frame(self.container, bg='#151d2a', bd=1, relief='solid', padx=18, pady=18)
        example_frame.pack(fill='x', pady=(0, 20))

        ex_lbl = tk.Label(
            example_frame,
            text="HOW TO EXECUTE COMMANDS IN TERMINAL:\n\n"
                 "1. Open Command Prompt or PowerShell (cmd.exe)\n"
                 "2. Copy session command from website:\n\n"
                 "   tunefetch TF-8907\n\n"
                 "3. Hit Enter to watch 320 kbps songs download in real-time!",
            font=('Segoe UI', 10), bg='#151d2a', fg='#ffffff', justify='left'
        )
        ex_lbl.pack(anchor='w')

        btn_frame = ttk.Frame(self.container)
        btn_frame.pack(fill='x', side='bottom')

        finish_btn = tk.Button(
            btn_frame, text="Finish", font=('Segoe UI', 10, 'bold'),
            bg='#1DB954', fg='#000000', activebackground='#10b981',
            padx=25, pady=6, bd=0, cursor='hand2', command=self.destroy
        )
        finish_btn.pack(side='right')

if __name__ == "__main__":
    app = TuneFetchInstaller()
    app.mainloop()
