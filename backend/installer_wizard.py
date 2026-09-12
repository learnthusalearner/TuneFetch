"""
TuneFetch Windows Setup Wizard
Clean, modern desktop installer with persistent navigation controls.

Flow:
1. Welcome & Installation Directory
2. License & Privacy Policy (Must accept to install)
3. Installation (Unpacks CLI engine & configures PATH)
4. Finish & Terminal Usage
"""

import os
import sys
import shutil
import winreg
import tkinter as tk
from tkinter import ttk, messagebox


APP_NAME = "TuneFetch"
APP_VERSION = "1.3.0"

DEFAULT_INSTALL_DIR = os.path.join(
    os.environ.get("LOCALAPPDATA", r"C:\Users\Public"),
    "Programs",
    "TuneFetch"
)

# Visual Theme Tokens (Harmonized with TuneFetch Dark Palette)
BG = "#121317"
SURFACE = "#1a1b20"
SURFACE_2 = "#22242c"
BORDER = "#2a2c35"
TEXT = "#ffffff"
MUTED = "#9a9da8"
GREEN = "#1DB954"
GREEN_HOVER = "#1ed760"
DISABLED_BG = "#1e2027"
DISABLED_FG = "#555866"


LICENSE_AND_PRIVACY = """TUNEFETCH LICENSE & PRIVACY NOTICE
Version 1.3.0 — Open Source Audio Extraction Software

1. MIT OPEN SOURCE LICENSE
TuneFetch is free, open-source software released under the MIT License. You are free to inspect, audit, modify, and redistribute the software in accordance with the license.

2. PRIVACY & SECURITY
• Zero Credential Logging: TuneFetch uses Spotify PKCE OAuth 2.0. We NEVER ask for, handle, or store your Spotify password.
• Local Processing: Audio extraction and MP3 encoding are processed entirely on your local machine. No audio files are uploaded to our servers.
• Temporary Cloud Sessions: To synchronize playlist requests from the web dashboard to your terminal, temporary session identifiers and track metadata are stored in our hosted PostgreSQL database and automatically purged after expiration.

3. ACCEPTABLE USE & USER RESPONSIBILITY
TuneFetch is designed for personal backup and educational purposes. You are responsible for ensuring that your use of the application complies with applicable copyright laws, local regulations, and the terms of third-party services.

By checking the acceptance box below, you acknowledge and agree to these terms.
"""


class TuneFetchInstaller(tk.Tk):

    def __init__(self):
        super().__init__()

        self.title(f"{APP_NAME} Setup Wizard")
        self.geometry("720x520")
        self.minsize(680, 480)
        self.resizable(True, True)
        self.configure(bg=BG)

        self.accepted_terms = tk.BooleanVar(value=False)
        self.install_dir_var = tk.StringVar(value=DEFAULT_INSTALL_DIR)
        self.current_step = 1

        self.setup_styles()
        self.build_shell()
        self.show_welcome()

    def setup_styles(self):
        self.style = ttk.Style(self)
        try:
            self.style.theme_use("clam")
        except Exception:
            pass

        self.style.configure("TFrame", background=BG)
        self.style.configure("TLabel", background=BG, foreground=TEXT, font=("Segoe UI", 10))
        self.style.configure("Card.TFrame", background=SURFACE)
        self.style.configure(
            "TProgressbar",
            troughcolor=SURFACE_2,
            background=GREEN,
            bordercolor=SURFACE_2,
            lightcolor=GREEN,
            darkcolor=GREEN
        )

    def build_shell(self):
        """Build the master frame with top header, middle content container, and pinned bottom footer."""
        # Main shell container
        self.main_frame = tk.Frame(self, bg=BG)
        self.main_frame.pack(fill="both", expand=True)

        # 1. Header (Fixed at top)
        self.header_frame = tk.Frame(self.main_frame, bg=BG)
        self.header_frame.pack(side="top", fill="x", padx=32, pady=(20, 10))

        brand_row = tk.Frame(self.header_frame, bg=BG)
        brand_row.pack(fill="x")

        tk.Label(
            brand_row,
            text="♪  TuneFetch",
            bg=BG,
            fg=GREEN,
            font=("Segoe UI", 15, "bold")
        ).pack(side="left")

        tk.Label(
            brand_row,
            text=f"Setup Wizard v{APP_VERSION}",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 9)
        ).pack(side="right")

        # Step Indicator Pills
        self.steps_bar = tk.Frame(self.header_frame, bg=BG)
        self.steps_bar.pack(fill="x", pady=(14, 4))

        self.step_indicators = []
        step_names = [("1", "Welcome"), ("2", "License"), ("3", "Install"), ("4", "Finish")]
        for num, name in step_names:
            pill = tk.Frame(self.steps_bar, bg=BG)
            pill.pack(side="left", expand=True, fill="x")

            lbl_num = tk.Label(
                pill, text=num, width=3, bg=SURFACE_2, fg=MUTED, font=("Segoe UI", 8, "bold")
            )
            lbl_num.pack(side="left")

            lbl_txt = tk.Label(
                pill, text=f" {name}", bg=BG, fg=MUTED, font=("Segoe UI", 9)
            )
            lbl_txt.pack(side="left")

            self.step_indicators.append((lbl_num, lbl_txt))

        # Thin separator below header
        tk.Frame(self.header_frame, bg=BORDER, height=1).pack(fill="x", pady=(12, 0))

        # 2. Footer Navigation Bar (FIXED PINNED AT BOTTOM - NEVER CLIPPED)
        self.footer_frame = tk.Frame(self.main_frame, bg=BG)
        self.footer_frame.pack(side="bottom", fill="x", padx=32, pady=(10, 20))

        tk.Frame(self.footer_frame, bg=BORDER, height=1).pack(fill="x", pady=(0, 14))

        self.footer_buttons = tk.Frame(self.footer_frame, bg=BG)
        self.footer_buttons.pack(fill="x")

        # Left button (Cancel)
        self.btn_cancel = tk.Button(
            self.footer_buttons,
            text="Cancel",
            command=self.destroy,
            bg=SURFACE_2,
            fg=TEXT,
            activebackground=BORDER,
            activeforeground=TEXT,
            font=("Segoe UI", 9, "bold"),
            relief="flat",
            bd=0,
            padx=18,
            pady=8,
            cursor="hand2"
        )
        self.btn_cancel.pack(side="left")

        # Right buttons container
        self.right_buttons = tk.Frame(self.footer_buttons, bg=BG)
        self.right_buttons.pack(side="right")

        self.btn_back = tk.Button(
            self.right_buttons,
            text="← Back",
            command=self.go_back,
            bg=SURFACE_2,
            fg=TEXT,
            activebackground=BORDER,
            activeforeground=TEXT,
            font=("Segoe UI", 9),
            relief="flat",
            bd=0,
            padx=18,
            pady=8,
            cursor="hand2"
        )

        self.btn_next = tk.Button(
            self.right_buttons,
            text="Continue →",
            command=self.go_next,
            bg=GREEN,
            fg="#000000",
            activebackground=GREEN_HOVER,
            activeforeground="#000000",
            font=("Segoe UI", 9, "bold"),
            relief="flat",
            bd=0,
            padx=22,
            pady=8,
            cursor="hand2"
        )

        # 3. Middle Dynamic Content Container
        self.content_frame = tk.Frame(self.main_frame, bg=BG)
        self.content_frame.pack(side="top", fill="both", expand=True, padx=32, pady=10)

    def update_steps(self, active_index):
        """Update step numbers and highlights."""
        for idx, (lbl_num, lbl_txt) in enumerate(self.step_indicators, start=1):
            if idx < active_index:
                lbl_num.configure(bg=GREEN, fg="#000000", text="✓")
                lbl_txt.configure(fg=GREEN)
            elif idx == active_index:
                lbl_num.configure(bg=GREEN, fg="#000000", text=str(idx))
                lbl_txt.configure(fg=TEXT)
            else:
                lbl_num.configure(bg=SURFACE_2, fg=MUTED, text=str(idx))
                lbl_txt.configure(fg=MUTED)

    def clear_content(self):
        """Clear dynamic middle area."""
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    # ============================================================
    # STEP 1: WELCOME
    # ============================================================

    def show_welcome(self):
        self.current_step = 1
        self.update_steps(1)
        self.clear_content()

        # Update Navigation Footer
        self.btn_back.pack_forget()
        self.btn_next.pack(side="right", padx=(8, 0))
        self.btn_next.configure(
            text="Continue →",
            command=self.show_privacy,
            bg=GREEN,
            fg="#000000",
            state="normal",
            cursor="hand2"
        )

        tk.Label(
            self.content_frame,
            text="Welcome to TuneFetch",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 20, "bold")
        ).pack(anchor="w", pady=(0, 4))

        tk.Label(
            self.content_frame,
            text="Install the high-speed Spotify 320 kbps terminal downloader.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 10)
        ).pack(anchor="w", pady=(0, 16))

        # Overview Card
        card = tk.Frame(self.content_frame, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        card.pack(fill="x", pady=(0, 14))

        features = [
            ("🎵", "Studio 320 kbps MP3", "Embedded high-res Spotify cover art & ID3 metadata"),
            ("⚡", "1-Line Terminal Engine", "Type 'tunefetch TF-XXXX' in any terminal to download"),
            ("🔒", "100% Private & Safe", "Files process on your PC. No server limits or adware")
        ]

        for icon, title, desc in features:
            row = tk.Frame(card, bg=SURFACE)
            row.pack(fill="x", padx=16, pady=10)

            tk.Label(row, text=icon, bg=SURFACE, font=("Segoe UI", 13)).pack(side="left", padx=(0, 12))
            text_box = tk.Frame(row, bg=SURFACE)
            text_box.pack(side="left", fill="x")

            tk.Label(text_box, text=title, bg=SURFACE, fg=TEXT, font=("Segoe UI", 9, "bold")).pack(anchor="w")
            tk.Label(text_box, text=desc, bg=SURFACE, fg=MUTED, font=("Segoe UI", 8)).pack(anchor="w")

        # Install Directory
        tk.Label(
            self.content_frame,
            text="Installation Folder (Added to Windows PATH):",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 9, "bold")
        ).pack(anchor="w", pady=(8, 4))

        path_box = tk.Label(
            self.content_frame,
            text=self.install_dir_var.get(),
            bg=SURFACE_2,
            fg="#cbd5e1",
            font=("Consolas", 9),
            anchor="w",
            padx=12,
            pady=8,
            highlightbackground=BORDER,
            highlightthickness=1
        )
        path_box.pack(fill="x")

    # ============================================================
    # STEP 2: LICENSE & PRIVACY (MANDATORY AGREEMENT)
    # ============================================================

    def show_privacy(self):
        self.current_step = 2
        self.update_steps(2)
        self.clear_content()

        # Update Navigation Footer
        self.btn_back.pack(side="right", padx=(0, 8))
        self.btn_back.configure(command=self.show_welcome)
        self.btn_next.pack(side="right")
        self.btn_next.configure(
            text="Install TuneFetch",
            command=self.validate_and_install
        )
        self.toggle_install_button()

        tk.Label(
            self.content_frame,
            text="License & Privacy Terms",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 20, "bold")
        ).pack(anchor="w", pady=(0, 4))

        tk.Label(
            self.content_frame,
            text="Please review and accept the agreement before proceeding with installation.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 10)
        ).pack(anchor="w", pady=(0, 10))

        # Scrollable license text box
        text_container = tk.Frame(self.content_frame, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        text_container.pack(fill="both", expand=True, pady=(0, 12))

        scrollbar = tk.Scrollbar(text_container)
        scrollbar.pack(side="right", fill="y")

        text_widget = tk.Text(
            text_container,
            wrap="word",
            bg=SURFACE,
            fg="#e2e8f0",
            font=("Segoe UI", 9),
            padx=14,
            pady=12,
            bd=0,
            relief="flat",
            yscrollcommand=scrollbar.set
        )
        text_widget.insert("1.0", LICENSE_AND_PRIVACY.strip())
        text_widget.configure(state="disabled")
        text_widget.pack(fill="both", expand=True)
        scrollbar.configure(command=text_widget.yview)

        # Checkbox: Acceptance required to enable Install button
        chk_box = tk.Checkbutton(
            self.content_frame,
            text="  I have read and agree to the License & Privacy Terms",
            variable=self.accepted_terms,
            command=self.toggle_install_button,
            bg=BG,
            fg=TEXT,
            activebackground=BG,
            activeforeground=TEXT,
            selectcolor=SURFACE_2,
            font=("Segoe UI", 9, "bold"),
            cursor="hand2"
        )
        chk_box.pack(anchor="w", pady=(0, 4))

    def toggle_install_button(self):
        """Enables or disables the Install button based on terms acceptance."""
        if self.accepted_terms.get():
            self.btn_next.configure(
                state="normal",
                bg=GREEN,
                fg="#000000",
                activebackground=GREEN_HOVER,
                cursor="hand2"
            )
        else:
            self.btn_next.configure(
                state="disabled",
                bg=DISABLED_BG,
                fg=DISABLED_FG,
                cursor="arrow"
            )

    def validate_and_install(self):
        if not self.accepted_terms.get():
            messagebox.showwarning(
                "Agreement Required",
                "You must accept the License & Privacy Terms to install TuneFetch."
            )
            return
        self.show_installing()

    # ============================================================
    # STEP 3: INSTALLATION
    # ============================================================

    def show_installing(self):
        self.current_step = 3
        self.update_steps(3)
        self.clear_content()

        # Disable navigation buttons during installation
        self.btn_back.pack_forget()
        self.btn_next.configure(state="disabled", bg=DISABLED_BG, fg=DISABLED_FG)
        self.btn_cancel.configure(state="disabled")

        tk.Label(
            self.content_frame,
            text="Installing TuneFetch...",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 20, "bold")
        ).pack(anchor="w", pady=(0, 4))

        tk.Label(
            self.content_frame,
            text="Copying executable and configuring system environment.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 10)
        ).pack(anchor="w", pady=(0, 20))

        # Installation Status Card
        card = tk.Frame(self.content_frame, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        card.pack(fill="x", pady=(0, 16))

        self.status_label = tk.Label(
            card,
            text="Preparing installation...",
            bg=SURFACE,
            fg=TEXT,
            font=("Segoe UI", 10, "bold")
        )
        self.status_label.pack(anchor="w", padx=20, pady=(16, 10))

        self.progress_bar = ttk.Progressbar(card, mode="determinate", maximum=100)
        self.progress_bar.pack(fill="x", padx=20, pady=(0, 14))

        self.detail_label = tk.Label(
            card,
            text=f"Target: {self.install_dir_var.get()}",
            bg=SURFACE,
            fg=MUTED,
            font=("Consolas", 8)
        )
        self.detail_label.pack(anchor="w", padx=20, pady=(0, 16))

        # Run extraction
        self.after(500, self.perform_installation)

    def add_to_user_path(self, install_dir):
        """Adds install_dir to HKCU Environment PATH."""
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment", 0, winreg.KEY_ALL_ACCESS)
            try:
                current_path, _ = winreg.QueryValueEx(key, "Path")
            except FileNotFoundError:
                current_path = ""

            paths = [p.strip() for p in current_path.split(";") if p.strip()]
            normalized = [os.path.normcase(os.path.normpath(p)) for p in paths]
            target_norm = os.path.normcase(os.path.normpath(install_dir))

            if target_norm not in normalized:
                paths.append(install_dir)
                new_path = ";".join(paths)
                winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)

            winreg.CloseKey(key)

            # Broadcast environment update to running Windows processes
            try:
                import ctypes
                HWND_BROADCAST = 0xFFFF
                WM_SETTINGCHANGE = 0x001A
                SMTO_ABORTIFHUNG = 0x0002
                res = ctypes.c_ulong()
                ctypes.windll.user32.SendMessageTimeoutW(
                    HWND_BROADCAST, WM_SETTINGCHANGE, 0, "Environment", SMTO_ABORTIFHUNG, 1000, ctypes.byref(res)
                )
            except Exception:
                pass
        except Exception as error:
            print(f"[!] Path update warning: {error}")

    def get_source_engine_exe(self):
        """Locates the bundled TuneFetch.exe engine."""
        candidates = []
        if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
            candidates.append(os.path.join(sys._MEIPASS, "TuneFetch.exe"))
            candidates.append(os.path.join(sys._MEIPASS, "tunefetch.exe"))

        exe_dir = os.path.dirname(sys.executable) if getattr(sys, "frozen", False) else os.path.dirname(__file__)
        candidates.extend([
            os.path.join(exe_dir, "TuneFetch.exe"),
            os.path.join(exe_dir, "dist", "TuneFetch.exe"),
            os.path.join(exe_dir, "static", "TuneFetch.exe"),
            os.path.join(os.getcwd(), "dist", "TuneFetch.exe"),
            os.path.join(os.getcwd(), "backend", "static", "TuneFetch.exe")
        ])

        for c in candidates:
            if os.path.isfile(c):
                return c
        return None

    def perform_installation(self):
        target_dir = self.install_dir_var.get()
        try:
            # 1. Create target folder
            self.status_label.configure(text="Creating program folder...")
            self.progress_bar["value"] = 25
            os.makedirs(target_dir, exist_ok=True)

            # 2. Copy binary
            self.status_label.configure(text="Extracting TuneFetch CLI engine...")
            self.progress_bar["value"] = 55
            target_exe = os.path.join(target_dir, "tunefetch.exe")
            source_exe = self.get_source_engine_exe()

            if source_exe and os.path.exists(source_exe):
                shutil.copy2(source_exe, target_exe)
            elif getattr(sys, "frozen", False):
                shutil.copy2(sys.executable, target_exe)
            else:
                raise FileNotFoundError("TuneFetch.exe engine was not found in the installer bundle.")

            # 3. Add to PATH
            self.status_label.configure(text="Registering 'tunefetch' in system PATH...")
            self.progress_bar["value"] = 80
            self.add_to_user_path(target_dir)

            # 4. Finish
            self.status_label.configure(text="Installation completed successfully!")
            self.progress_bar["value"] = 100

            self.after(500, self.show_complete)

        except Exception as err:
            messagebox.showerror("Installation Error", f"Installation failed:\n\n{err}")
            self.show_welcome()

    # ============================================================
    # STEP 4: COMPLETE
    # ============================================================

    def show_complete(self):
        self.current_step = 4
        self.update_steps(4)
        self.clear_content()

        # Update Navigation Footer
        self.btn_cancel.pack_forget()
        self.btn_back.pack_forget()
        self.btn_next.pack(side="right")
        self.btn_next.configure(
            text="Finish",
            command=self.destroy,
            bg=GREEN,
            fg="#000000",
            state="normal",
            cursor="hand2"
        )

        tk.Label(
            self.content_frame,
            text="✓ Installation Complete!",
            bg=BG,
            fg=GREEN,
            font=("Segoe UI", 20, "bold")
        ).pack(anchor="w", pady=(0, 4))

        tk.Label(
            self.content_frame,
            text="TuneFetch is now ready to use from any Command Prompt or PowerShell.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 10)
        ).pack(anchor="w", pady=(0, 16))

        # Command Box
        cmd_card = tk.Frame(self.content_frame, bg=SURFACE, highlightbackground=BORDER, highlightthickness=1)
        cmd_card.pack(fill="x", pady=(0, 14))

        tk.Label(
            cmd_card,
            text="HOW TO DOWNLOAD PLAYLISTS:",
            bg=SURFACE,
            fg=GREEN,
            font=("Segoe UI", 8, "bold")
        ).pack(anchor="w", padx=16, pady=(14, 4))

        cmd_row = tk.Frame(cmd_card, bg=BG, highlightbackground=BORDER, highlightthickness=1)
        cmd_row.pack(fill="x", padx=16, pady=(4, 10))

        tk.Label(
            cmd_row,
            text="tunefetch TF-XXXX",
            bg=BG,
            fg="#38bdf8",
            font=("Consolas", 11, "bold")
        ).pack(side="left", padx=12, pady=8)

        def copy_cmd():
            self.clipboard_clear()
            self.clipboard_append("tunefetch TF-XXXX")
            btn_copy.configure(text="Copied ✓")
            self.after(1500, lambda: btn_copy.configure(text="Copy"))

        btn_copy = tk.Button(
            cmd_row,
            text="Copy",
            command=copy_cmd,
            bg=SURFACE_2,
            fg=TEXT,
            font=("Segoe UI", 8, "bold"),
            relief="flat",
            bd=0,
            padx=10,
            cursor="hand2"
        )
        btn_copy.pack(side="right", padx=6, pady=4)

        tk.Label(
            cmd_card,
            text="Replace TF-XXXX with the code generated on the TuneFetch web app.\nSongs download directly into your Downloads folder.",
            bg=SURFACE,
            fg=MUTED,
            font=("Segoe UI", 8),
            justify="left"
        ).pack(anchor="w", padx=16, pady=(0, 14))

    def go_back(self):
        if self.current_step == 2:
            self.show_welcome()

    def go_next(self):
        if self.current_step == 1:
            self.show_privacy()
        elif self.current_step == 2:
            self.validate_and_install()


if __name__ == "__main__":
    app = TuneFetchInstaller()
    app.mainloop()
