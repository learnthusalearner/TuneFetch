"""
TuneFetch Windows Setup Wizard (Installer)
Provides an attractive 4-step Setup Wizard (Welcome -> Terms of Service & Privacy -> Install -> Finish)
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
TUNEFETCH OPEN-SOURCE LICENSE & PRIVACY GUARANTEE (v1.3.0)

1. 100% OPEN-SOURCE & FREE FOR EVERYONE
TuneFetch is 100% free and open-source software under the MIT License. Anyone is free to use, inspect, share, or audit the complete codebase on GitHub (github.com/learnthusalearner/TuneFetch).

2. POSTGRESQL DATABASE & SESSION METADATA TRACKING
TuneFetch uses a secure PostgreSQL database to manage session metadata between the web app and desktop client:
• Database Session Store: We store temporary 4-digit session codes (e.g. TF-8907), playlist titles, total track counts, and resolved YouTube candidate URLs to coordinate seamless sync.
• Zero Personal Data: We DO NOT store your Spotify passwords, account credentials, or personal listening history.
• Automatic Purge: All database session records and temporary download tokens are automatically deleted from the database after 24 hours.

3. REAL-TIME LIVE DOWNLOAD FEEDBACK
When running 'tunefetch TF-XXXX' in your command prompt, you will see:
• Active Song Title & Artist
• Real-time Download Percentage (% completion)
• Live Download Speed (MB/s)
• Estimated Time Remaining (ETA countdown)

4. SOFTWARE BREAKDOWN & INSTALLATION ESTIMATE
• What is installed: Single standalone 'tunefetch.exe' executable (~15 MB).
• Setup Time: ~3 to 5 seconds (Instant fast installation).
• Destination Folder: Downloads 320 kbps Ultra HQ MP3s directly into your 'Downloads/Thanks for downloading' folder.

Click 'I Accept' below to proceed with installation.
"""

class TuneFetchInstaller(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} v{APP_VERSION} Setup Wizard")
        self.geometry("640x510")
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
        self.style.configure('Title.TLabel', font=('Segoe UI', 19, 'bold'), foreground='#ffffff')

        self.container = ttk.Frame(self)
        self.container.pack(fill='both', expand=True, padx=24, pady=24)

        self.show_step_1_welcome()

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    # STEP 1: WELCOME SCREEN & BREAKDOWN
    def show_step_1_welcome(self):
        self.clear_container()

        header = ttk.Label(self.container, text="♪ TuneFetch Setup Wizard", style='Header.TLabel')
        header.pack(anchor='w', pady=(0, 4))

        title = ttk.Label(self.container, text="Welcome to TuneFetch Downloader", style='Title.TLabel')
        title.pack(anchor='w', pady=(0, 12))

        # Information Box
        info_frame = tk.Frame(self.container, bg='#151d2a', bd=1, relief='solid', padx=16, pady=14)
        info_frame.pack(fill='x', pady=(0, 16))

        info_lbl = tk.Label(
            info_frame,
            text="⚡ QUICK INSTALLATION SUMMARY:\n\n"
                 "• Software Installed:  TuneFetch CLI Engine (~15 MB)\n"
                 "• Installation Time:   ~3 to 5 seconds\n"
                 "• Downloads Saved To:  Downloads/Thanks for downloading\n"
                 "• Audio Quality:       320 kbps Ultra HQ MP3 (Best Quality)\n"
                 "• Real-Time Monitor:   Live percentage %, speed (MB/s), and ETA countdown\n"
                 "• Session DB Storage:   Encrypted 24h cloud database session tokens for sync\n"
                 "• Privacy Guarantee:   100% Open-Source. Zero user passwords or credentials stored.",
            font=('Segoe UI', 10), bg='#151d2a', fg='#e2e8f0', justify='left'
        )
        info_lbl.pack(anchor='w')

        desc = ttk.Label(
            self.container,
            text="Click Next to review the Open-Source License & Privacy Guarantee and proceed with installation.",
            wraplength=580,
            justify='left',
            font=('Segoe UI', 10)
        )
        desc.pack(anchor='w', pady=(0, 20))

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

    # STEP 2: TERMS OF SERVICE & PRIVACY GUARANTEE
    def show_step_2_terms(self):
        self.clear_container()

        header = ttk.Label(self.container, text="Open-Source License & Privacy Policy", style='Header.TLabel')
        header.pack(anchor='w', pady=(0, 4))

        sub = ttk.Label(self.container, text="Please review the privacy policy and open-source terms below.", font=('Segoe UI', 10))
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
            self.container, text="I accept the Open-Source Terms & Privacy Guarantee",
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
            messagebox.showwarning("Agreement Required", "Please check 'I accept the Terms & Privacy Guarantee' to proceed.")
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
        """Adds installation directory to Windows User PATH environment variable and broadcasts system change."""
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

            # Broadcast WM_SETTINGCHANGE to notify Windows explorer and command shells of new PATH
            try:
                import ctypes
                HWND_BROADCAST = 0xFFFF
                WM_SETTINGCHANGE = 0x001A
                SMTO_ABORTIFHUNG = 0x0002
                result = ctypes.c_ulong()
                ctypes.windll.user32.SendMessageTimeoutW(
                    HWND_BROADCAST, WM_SETTINGCHANGE, 0, "Environment",
                    SMTO_ABORTIFHUNG, 1000, ctypes.byref(result)
                )
            except Exception as e_bc:
                print(f"[!] Could not broadcast environment update: {e_bc}")

        except Exception as e:
            print(f"[!] Warning: Could not update User PATH: {e}")

    def get_source_engine_exe(self):
        """Locates the standalone TuneFetch CLI engine executable (TuneFetch.exe)."""
        candidates = []
        if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
            candidates.append(os.path.join(sys._MEIPASS, "TuneFetch.exe"))
            candidates.append(os.path.join(sys._MEIPASS, "tunefetch.exe"))

        exe_dir = os.path.dirname(sys.executable) if getattr(sys, 'frozen', False) else os.path.dirname(__file__)
        candidates.extend([
            os.path.join(exe_dir, "TuneFetch.exe"),
            os.path.join(exe_dir, "dist", "TuneFetch.exe"),
            os.path.join(exe_dir, "static", "TuneFetch.exe"),
            os.path.join(os.getcwd(), "dist", "TuneFetch.exe"),
            os.path.join(os.getcwd(), "backend", "static", "TuneFetch.exe"),
        ])
        for c in candidates:
            if os.path.exists(c) and os.path.isfile(c):
                return c
        return None

    def perform_installation(self):
        target_dir = self.install_dir_var.get()
        try:
            os.makedirs(target_dir, exist_ok=True)
            target_exe = os.path.join(target_dir, "tunefetch.exe")

            source_exe = self.get_source_engine_exe()
            if source_exe and os.path.exists(source_exe):
                shutil.copy2(source_exe, target_exe)
            elif getattr(sys, 'frozen', False):
                # Fallback: copy running executable
                shutil.copy2(sys.executable, target_exe)
            else:
                raise FileNotFoundError("TuneFetch.exe CLI engine binary not found.")

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
                 "1. Open a NEW Command Prompt or PowerShell (cmd.exe)\n"
                 "   (Close any old terminal windows so Windows loads new PATH)\n\n"
                 "2. Paste your session command from website:\n\n"
                 "   tunefetch TF-8907\n\n"
                 "3. Hit Enter to listen 320 kbps songs directly!",
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
