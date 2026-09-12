"""
TuneFetch Windows Setup Wizard
Professional desktop installer UI.

Flow:
1. Welcome
2. License & Privacy
3. Installation
4. Complete
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

BG = "#121317"
SURFACE = "#1a1b20"
SURFACE_2 = "#22242c"
BORDER = "#2a2c35"
TEXT = "#ffffff"
MUTED = "#9a9da8"
GREEN = "#1DB954"
GREEN_HOVER = "#1ed760"
DANGER = "#ef4444"


LICENSE_AND_PRIVACY = """
TUNEFETCH LICENSE & PRIVACY NOTICE
Version 1.3.0

OPEN SOURCE SOFTWARE

TuneFetch is free and open-source software released under the MIT License.
The source code can be inspected, audited, modified, and redistributed
according to the terms of the MIT License.

Spotify Authentication

TuneFetch uses Spotify's OAuth authorization system to connect your Spotify
account and access playlists that you authorize.

TuneFetch does not ask for or store your Spotify password.

Temporary Session Data

To synchronize the TuneFetch website with the desktop application, the service
may temporarily process information such as:

• Session identifiers
• Playlist names
• Track names and artist names
• Track counts
• Information required to process a download session
• Resolved media-source information used during processing

Temporary session information is retained only for the period necessary for
the service to operate and is automatically cleaned according to the
application's configured retention policy.

Database & Infrastructure

TuneFetch uses PostgreSQL infrastructure provided by Neon for application
data and temporary session coordination.

Caching may be used to reduce repeated requests and improve application
performance.

Third-Party Services

TuneFetch may interact with third-party services such as Spotify and other
services required by the application's processing pipeline. These services
operate under their own terms and privacy policies.

Local Processing

The TuneFetch desktop application performs download processing locally on
your computer.

Downloaded files are saved to your local Downloads folder and are not
intentionally uploaded to TuneFetch servers.

Security

TuneFetch takes reasonable technical measures to protect information used by
the application. However, no internet-connected service can guarantee
absolute security.

User Responsibility

You are responsible for ensuring that your use of TuneFetch complies with
applicable laws, copyright requirements, and the terms of the services you
use.

By continuing with installation, you acknowledge that you have read and
understood this License & Privacy Notice.
"""


class TuneFetchInstaller(tk.Tk):

    def __init__(self):
        super().__init__()

        self.title(f"{APP_NAME} Setup")
        self.geometry("760x560")
        self.resizable(False, False)
        self.configure(bg=BG)

        self.accepted_terms = tk.BooleanVar(value=False)
        self.install_dir_var = tk.StringVar(
            value=DEFAULT_INSTALL_DIR
        )

        self.current_step = 1

        self.setup_styles()
        self.build_shell()
        self.show_welcome()

    # ============================================================
    # STYLING
    # ============================================================

    def setup_styles(self):

        self.style = ttk.Style(self)

        try:
            self.style.theme_use("clam")
        except Exception:
            pass

        self.style.configure(
            "TFrame",
            background=BG
        )

        self.style.configure(
            "TLabel",
            background=BG,
            foreground=TEXT,
            font=("Segoe UI", 10)
        )

        self.style.configure(
            "Title.TLabel",
            background=BG,
            foreground=TEXT,
            font=("Segoe UI", 25, "bold")
        )

        self.style.configure(
            "Subtitle.TLabel",
            background=BG,
            foreground=MUTED,
            font=("Segoe UI", 10)
        )

        self.style.configure(
            "Section.TLabel",
            background=BG,
            foreground=GREEN,
            font=("Segoe UI", 11, "bold")
        )

        self.style.configure(
            "Card.TFrame",
            background=SURFACE
        )

        self.style.configure(
            "TProgressbar",
            troughcolor=SURFACE_2,
            background=GREEN,
            bordercolor=SURFACE_2,
            lightcolor=GREEN,
            darkcolor=GREEN
        )

    # ============================================================
    # MAIN SHELL
    # ============================================================

    def build_shell(self):

        self.main = tk.Frame(
            self,
            bg=BG
        )

        self.main.pack(
            fill="both",
            expand=True
        )

        # Header
        self.header = tk.Frame(
            self.main,
            bg=BG
        )

        self.header.pack(
            fill="x",
            padx=34,
            pady=(28, 0)
        )

        brand = tk.Label(
            self.header,
            text="♪  TuneFetch",
            bg=BG,
            fg=GREEN,
            font=("Segoe UI", 15, "bold")
        )

        brand.pack(side="left")

        version = tk.Label(
            self.header,
            text=f"v{APP_VERSION}",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 9)
        )

        version.pack(side="right")

        # Step indicator
        self.steps_frame = tk.Frame(
            self.main,
            bg=BG
        )

        self.steps_frame.pack(
            fill="x",
            padx=34,
            pady=(26, 0)
        )

        self.step_widgets = []

        steps = [
            ("1", "Welcome"),
            ("2", "Privacy"),
            ("3", "Install"),
            ("4", "Complete")
        ]

        for index, (number, name) in enumerate(steps):

            wrapper = tk.Frame(
                self.steps_frame,
                bg=BG
            )

            wrapper.pack(
                side="left",
                expand=True,
                fill="x"
            )

            circle = tk.Label(
                wrapper,
                text=number,
                width=3,
                height=1,
                bg=SURFACE_2,
                fg=MUTED,
                font=("Segoe UI", 9, "bold")
            )

            circle.pack()

            label = tk.Label(
                wrapper,
                text=name,
                bg=BG,
                fg=MUTED,
                font=("Segoe UI", 8)
            )

            label.pack(pady=(5, 0))

            self.step_widgets.append(
                (circle, label)
            )

        # Content
        self.container = tk.Frame(
            self.main,
            bg=BG
        )

        self.container.pack(
            fill="both",
            expand=True,
            padx=34,
            pady=28
        )

    # ============================================================
    # COMMON UI
    # ============================================================

    def update_steps(self, active):

        for index, (circle, label) in enumerate(
            self.step_widgets,
            start=1
        ):

            if index < active:
                circle.configure(
                    bg=GREEN,
                    fg="#000000",
                    text="✓"
                )

                label.configure(
                    fg=GREEN
                )

            elif index == active:
                circle.configure(
                    bg=GREEN,
                    fg="#000000",
                    text=str(index)
                )

                label.configure(
                    fg=TEXT
                )

            else:
                circle.configure(
                    bg=SURFACE_2,
                    fg=MUTED,
                    text=str(index)
                )

                label.configure(
                    fg=MUTED
                )

    def clear_container(self):

        for widget in self.container.winfo_children():
            widget.destroy()

    def create_button(
        self,
        parent,
        text,
        command,
        primary=False
    ):

        if primary:

            button = tk.Button(
                parent,
                text=text,
                command=command,
                bg=GREEN,
                fg="#000000",
                activebackground=GREEN_HOVER,
                activeforeground="#000000",
                font=("Segoe UI", 10, "bold"),
                relief="flat",
                bd=0,
                padx=22,
                pady=9,
                cursor="hand2"
            )

        else:

            button = tk.Button(
                parent,
                text=text,
                command=command,
                bg=SURFACE_2,
                fg=TEXT,
                activebackground=BORDER,
                activeforeground=TEXT,
                font=("Segoe UI", 10),
                relief="flat",
                bd=0,
                padx=18,
                pady=9,
                cursor="hand2"
            )

        return button

    def create_card(self, parent):

        return tk.Frame(
            parent,
            bg=SURFACE,
            highlightbackground=BORDER,
            highlightthickness=1
        )

    # ============================================================
    # STEP 1
    # ============================================================

    def show_welcome(self):

        self.current_step = 1
        self.update_steps(1)
        self.clear_container()

        title = tk.Label(
            self.container,
            text="Welcome to TuneFetch",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 25, "bold")
        )

        title.pack(anchor="w")

        subtitle = tk.Label(
            self.container,
            text="Install the lightweight TuneFetch desktop engine.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 11)
        )

        subtitle.pack(
            anchor="w",
            pady=(5, 22)
        )

        card = self.create_card(self.container)

        card.pack(
            fill="x"
        )

        items = [
            ("✓", "Standalone desktop engine", "Lightweight Windows executable"),
            ("✓", "Spotify playlist sessions", "Synchronize playlists with TuneFetch"),
            ("✓", "Local processing", "Downloads are processed on your computer"),
            ("✓", "320 kbps MP3 output", "High-quality audio output"),
        ]

        for symbol, heading, description in items:

            row = tk.Frame(
                card,
                bg=SURFACE
            )

            row.pack(
                fill="x",
                padx=22,
                pady=14
            )

            icon = tk.Label(
                row,
                text=symbol,
                bg=SURFACE,
                fg=GREEN,
                font=("Segoe UI", 13, "bold")
            )

            icon.pack(
                side="left",
                padx=(0, 14)
            )

            text_frame = tk.Frame(
                row,
                bg=SURFACE
            )

            text_frame.pack(
                side="left"
            )

            tk.Label(
                text_frame,
                text=heading,
                bg=SURFACE,
                fg=TEXT,
                font=("Segoe UI", 10, "bold")
            ).pack(anchor="w")

            tk.Label(
                text_frame,
                text=description,
                bg=SURFACE,
                fg=MUTED,
                font=("Segoe UI", 9)
            ).pack(anchor="w", pady=(2, 0))

        # Install location
        location_title = tk.Label(
            self.container,
            text="Installation location",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 10, "bold")
        )

        location_title.pack(
            anchor="w",
            pady=(22, 7)
        )

        location = tk.Label(
            self.container,
            text=self.install_dir_var.get(),
            bg=SURFACE_2,
            fg=MUTED,
            anchor="w",
            padx=14,
            pady=10,
            font=("Consolas", 9)
        )

        location.pack(
            fill="x"
        )

        # Buttons
        buttons = tk.Frame(
            self.container,
            bg=BG
        )

        buttons.pack(
            fill="x",
            side="bottom",
            pady=(20, 0)
        )

        cancel = self.create_button(
            buttons,
            "Cancel",
            self.destroy
        )

        cancel.pack(
            side="right"
        )

        next_button = self.create_button(
            buttons,
            "Continue  →",
            self.show_privacy,
            primary=True
        )

        next_button.pack(
            side="right",
            padx=(0, 10)
        )

    # ============================================================
    # STEP 2
    # ============================================================

    def show_privacy(self):

        self.current_step = 2
        self.update_steps(2)
        self.clear_container()

        title = tk.Label(
            self.container,
            text="License & Privacy",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 25, "bold")
        )

        title.pack(anchor="w")

        subtitle = tk.Label(
            self.container,
            text="Please review the information before continuing.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 11)
        )

        subtitle.pack(
            anchor="w",
            pady=(5, 15)
        )

        text_frame = tk.Frame(
            self.container,
            bg=SURFACE,
            highlightbackground=BORDER,
            highlightthickness=1
        )

        text_frame.pack(
            fill="both",
            expand=True
        )

        scrollbar = tk.Scrollbar(
            text_frame
        )

        scrollbar.pack(
            side="right",
            fill="y"
        )

        text_box = tk.Text(
            text_frame,
            wrap="word",
            bg=SURFACE,
            fg="#dbe4ee",
            insertbackground=TEXT,
            selectbackground=GREEN,
            selectforeground="#000000",
            font=("Segoe UI", 9),
            padx=18,
            pady=16,
            bd=0,
            relief="flat",
            yscrollcommand=scrollbar.set
        )

        text_box.insert(
            "1.0",
            LICENSE_AND_PRIVACY.strip()
        )

        text_box.configure(
            state="disabled"
        )

        text_box.pack(
            fill="both",
            expand=True
        )

        scrollbar.configure(
            command=text_box.yview
        )

        # Checkbox
        checkbox = tk.Checkbutton(
            self.container,
            text="I have read and accept the License & Privacy Notice",
            variable=self.accepted_terms,
            bg=BG,
            fg=TEXT,
            activebackground=BG,
            activeforeground=TEXT,
            selectcolor=SURFACE_2,
            font=("Segoe UI", 9, "bold"),
            cursor="hand2"
        )

        checkbox.pack(
            anchor="w",
            pady=(13, 10)
        )

        buttons = tk.Frame(
            self.container,
            bg=BG
        )

        buttons.pack(
            fill="x"
        )

        back = self.create_button(
            buttons,
            "←  Back",
            self.show_welcome
        )

        back.pack(
            side="left"
        )

        continue_button = self.create_button(
            buttons,
            "Continue  →",
            self.validate_terms,
            primary=True
        )

        continue_button.pack(
            side="right"
        )

    def validate_terms(self):

        if not self.accepted_terms.get():

            messagebox.showwarning(
                "Agreement Required",
                "Please review and accept the License & Privacy Notice before continuing."
            )

            return

        self.show_install()

    # ============================================================
    # STEP 3
    # ============================================================

    def show_install(self):

        self.current_step = 3
        self.update_steps(3)
        self.clear_container()

        title = tk.Label(
            self.container,
            text="Installing TuneFetch",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 25, "bold")
        )

        title.pack(anchor="w")

        subtitle = tk.Label(
            self.container,
            text="Setting up the desktop engine on your computer.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 11)
        )

        subtitle.pack(
            anchor="w",
            pady=(5, 25)
        )

        card = self.create_card(
            self.container
        )

        card.pack(
            fill="x"
        )

        self.status_label = tk.Label(
            card,
            text="Preparing installation...",
            bg=SURFACE,
            fg=TEXT,
            font=("Segoe UI", 11, "bold")
        )

        self.status_label.pack(
            anchor="w",
            padx=22,
            pady=(22, 12)
        )

        self.progress = ttk.Progressbar(
            card,
            mode="indeterminate"
        )

        self.progress.pack(
            fill="x",
            padx=22,
            pady=(0, 18)
        )

        self.detail_label = tk.Label(
            card,
            text=f"Install location:\n{self.install_dir_var.get()}",
            bg=SURFACE,
            fg=MUTED,
            justify="left",
            font=("Consolas", 9)
        )

        self.detail_label.pack(
            anchor="w",
            padx=22,
            pady=(0, 22)
        )

        self.install_steps_label = tk.Label(
            self.container,
            text="✓ Creating installation directory\n"
                 "○ Copying TuneFetch engine\n"
                 "○ Registering command in PATH\n"
                 "○ Finalizing installation",
            bg=BG,
            fg=MUTED,
            justify="left",
            font=("Segoe UI", 9),
            pady=20
        )

        self.install_steps_label.pack(
            anchor="w"
        )

        self.progress.start(10)

        self.after(
            700,
            self.perform_installation
        )

    # ============================================================
    # INSTALLATION LOGIC
    # ============================================================

    def add_to_user_path(self, install_dir):

        try:

            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Environment",
                0,
                winreg.KEY_ALL_ACCESS
            )

            try:
                current_path, _ = winreg.QueryValueEx(
                    key,
                    "Path"
                )

            except FileNotFoundError:
                current_path = ""

            paths = [
                p.strip()
                for p in current_path.split(";")
                if p.strip()
            ]

            normalized = [
                os.path.normcase(os.path.normpath(p))
                for p in paths
            ]

            target_normalized = os.path.normcase(
                os.path.normpath(install_dir)
            )

            if target_normalized not in normalized:

                paths.append(
                    install_dir
                )

                new_path = ";".join(paths)

                winreg.SetValueEx(
                    key,
                    "Path",
                    0,
                    winreg.REG_EXPAND_SZ,
                    new_path
                )

            winreg.CloseKey(key)

            # Notify Windows
            try:

                import ctypes

                HWND_BROADCAST = 0xFFFF
                WM_SETTINGCHANGE = 0x001A
                SMTO_ABORTIFHUNG = 0x0002

                result = ctypes.c_ulong()

                ctypes.windll.user32.SendMessageTimeoutW(
                    HWND_BROADCAST,
                    WM_SETTINGCHANGE,
                    0,
                    "Environment",
                    SMTO_ABORTIFHUNG,
                    1000,
                    ctypes.byref(result)
                )

            except Exception:
                pass

        except Exception as error:

            print(
                f"[!] Could not update User PATH: {error}"
            )

    def get_source_engine_exe(self):

        candidates = []

        if getattr(sys, "frozen", False) and hasattr(
            sys,
            "_MEIPASS"
        ):

            candidates.extend([
                os.path.join(
                    sys._MEIPASS,
                    "TuneFetch.exe"
                ),
                os.path.join(
                    sys._MEIPASS,
                    "tunefetch.exe"
                )
            ])

        exe_dir = (
            os.path.dirname(sys.executable)
            if getattr(sys, "frozen", False)
            else os.path.dirname(__file__)
        )

        candidates.extend([
            os.path.join(
                exe_dir,
                "TuneFetch.exe"
            ),
            os.path.join(
                exe_dir,
                "dist",
                "TuneFetch.exe"
            ),
            os.path.join(
                exe_dir,
                "static",
                "TuneFetch.exe"
            ),
            os.path.join(
                os.getcwd(),
                "dist",
                "TuneFetch.exe"
            ),
            os.path.join(
                os.getcwd(),
                "backend",
                "static",
                "TuneFetch.exe"
            )
        ])

        for candidate in candidates:

            if (
                os.path.exists(candidate)
                and os.path.isfile(candidate)
            ):

                return candidate

        return None

    def perform_installation(self):

        target_dir = self.install_dir_var.get()

        try:

            # Step 1
            self.status_label.configure(
                text="Creating installation directory..."
            )

            os.makedirs(
                target_dir,
                exist_ok=True
            )

            target_exe = os.path.join(
                target_dir,
                "tunefetch.exe"
            )

            # Step 2
            self.status_label.configure(
                text="Copying TuneFetch desktop engine..."
            )

            source_exe = self.get_source_engine_exe()

            if source_exe and os.path.exists(source_exe):

                shutil.copy2(
                    source_exe,
                    target_exe
                )

            elif getattr(sys, "frozen", False):

                shutil.copy2(
                    sys.executable,
                    target_exe
                )

            else:

                raise FileNotFoundError(
                    "TuneFetch.exe desktop engine was not found."
                )

            # Step 3
            self.status_label.configure(
                text="Registering TuneFetch in Windows PATH..."
            )

            self.add_to_user_path(
                target_dir
            )

            # Step 4
            self.status_label.configure(
                text="Finalizing installation..."
            )

            self.install_steps_label.configure(
                text="✓ Creating installation directory\n"
                     "✓ Copying TuneFetch engine\n"
                     "✓ Registering command in PATH\n"
                     "✓ Finalizing installation",
                fg=GREEN
            )

            self.progress.stop()

            self.after(
                500,
                self.show_complete
            )

        except Exception as error:

            self.progress.stop()

            messagebox.showerror(
                "Installation Failed",
                f"TuneFetch could not be installed.\n\n{error}"
            )

            self.show_welcome()

    # ============================================================
    # STEP 4
    # ============================================================

    def show_complete(self):

        self.current_step = 4
        self.update_steps(4)
        self.clear_container()

        success_icon = tk.Label(
            self.container,
            text="✓",
            bg=BG,
            fg=GREEN,
            font=("Segoe UI", 48, "bold")
        )

        success_icon.pack(
            pady=(10, 0)
        )

        title = tk.Label(
            self.container,
            text="You're all set",
            bg=BG,
            fg=TEXT,
            font=("Segoe UI", 26, "bold")
        )

        title.pack(
            pady=(0, 5)
        )

        subtitle = tk.Label(
            self.container,
            text="TuneFetch has been installed successfully.",
            bg=BG,
            fg=MUTED,
            font=("Segoe UI", 11)
        )

        subtitle.pack(
            pady=(0, 22)
        )

        command_card = self.create_card(
            self.container
        )

        command_card.pack(
            fill="x"
        )

        tk.Label(
            command_card,
            text="START A DOWNLOAD SESSION",
            bg=SURFACE,
            fg=GREEN,
            font=("Segoe UI", 9, "bold")
        ).pack(
            anchor="w",
            padx=22,
            pady=(20, 8)
        )

        tk.Label(
            command_card,
            text="Open a new Command Prompt or PowerShell and run:",
            bg=SURFACE,
            fg=MUTED,
            font=("Segoe UI", 9)
        ).pack(
            anchor="w",
            padx=22
        )

        command = tk.Frame(
            command_card,
            bg=BG,
            highlightbackground=BORDER,
            highlightthickness=1
        )

        command.pack(
            fill="x",
            padx=22,
            pady=12
        )

        tk.Label(
            command,
            text="tunefetch TF-XXXX",
            bg=BG,
            fg=TEXT,
            font=("Consolas", 11, "bold")
        ).pack(
            side="left",
            padx=14,
            pady=12
        )

        def copy_command():

            self.clipboard_clear()
            self.clipboard_append(
                "tunefetch TF-XXXX"
            )

            copy_button.configure(
                text="Copied ✓"
            )

            self.after(
                1500,
                lambda: copy_button.configure(
                    text="Copy"
                )
            )

        copy_button = tk.Button(
            command,
            text="Copy",
            command=copy_command,
            bg=SURFACE_2,
            fg=TEXT,
            activebackground=BORDER,
            activeforeground=TEXT,
            font=("Segoe UI", 9, "bold"),
            relief="flat",
            bd=0,
            padx=12,
            cursor="hand2"
        )

        copy_button.pack(
            side="right",
            padx=6,
            pady=6
        )

        tk.Label(
            command_card,
            text="Replace TF-XXXX with the session code generated on the TuneFetch website.",
            bg=SURFACE,
            fg=MUTED,
            font=("Segoe UI", 9),
            wraplength=620,
            justify="left"
        ).pack(
            anchor="w",
            padx=22,
            pady=(0, 20)
        )

        location_card = self.create_card(
            self.container
        )

        location_card.pack(
            fill="x",
            pady=(14, 0)
        )

        tk.Label(
            location_card,
            text="DOWNLOAD LOCATION",
            bg=SURFACE,
            fg=GREEN,
            font=("Segoe UI", 8, "bold")
        ).pack(
            anchor="w",
            padx=18,
            pady=(14, 4)
        )

        tk.Label(
            location_card,
            text=os.path.join(
                "Downloads",
                "Thanks for downloading"
            ),
            bg=SURFACE,
            fg=TEXT,
            font=("Consolas", 9)
        ).pack(
            anchor="w",
            padx=18,
            pady=(0, 14)
        )

        buttons = tk.Frame(
            self.container,
            bg=BG
        )

        buttons.pack(
            fill="x",
            side="bottom",
            pady=(18, 0)
        )

        finish = self.create_button(
            buttons,
            "Finish",
            self.destroy,
            primary=True
        )

        finish.pack(
            side="right"
        )


if __name__ == "__main__":

    app = TuneFetchInstaller()

    app.mainloop()
