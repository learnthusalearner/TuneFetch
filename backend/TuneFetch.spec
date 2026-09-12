# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from pathlib import Path

block_cipher = None

base_dir = os.path.abspath(SPECPATH)
frontend_dist = os.path.join(base_dir, 'frontend_dist')

# Collect imageio_ffmpeg binaries
import imageio_ffmpeg
ffmpeg_bin_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

datas = [
    (frontend_dist, 'frontend_dist'),
    (ffmpeg_bin_dir, 'imageio_ffmpeg/binaries'),
]

# Note: .env is intentionally omitted to keep all server credentials private

hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'fastapi.staticfiles',
    'fastapi.responses',
    'fastapi.middleware.cors',
    'app',
    'app.main',
    'app.core',
    'app.core.config',
    'app.core.database',
    'app.models',
    'app.models.db_models',
    'app.models.schemas',
    'app.routes',
    'app.routes.health',
    'app.routes.media',
    'app.routes.spotify',
    'app.routes.cloud_session',
    'app.services',
    'app.services.downloader',
    'app.services.user_cookie_store',
    'app.services.spotify_service',
    'app.services.playlist_pipeline',
    'app.services.serper_service',
    'app.services.cloud_session_store',
    'app.services.local_batch_downloader',
    'app.utils',
    'app.utils.auth_helper',
    'app.utils.sanitizer',
    'pytubefix',
    'pytubefix.botGuard',
    'pytubefix.botGuard.bot_guard',
    'pytubefix.botGuard.program',
    'spotipy',
    'imageio_ffmpeg',
    'sqlalchemy',
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.dialects.postgresql',
    'psycopg2',
    'cryptography',
    'itsdangerous',
]

a = Analysis(
    ['launcher.py'],
    pathex=[base_dir],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='TuneFetch',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True, # Console shows startup status and download log
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='TuneFetch',
)
