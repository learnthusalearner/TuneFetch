import shutil
import logging
import os

logger = logging.getLogger("ffmpeg_helper")

def get_ffmpeg_path() -> str | None:
    """
    Returns path to ffmpeg executable.
    First checks system PATH, then falls back to imageio-ffmpeg.
    """
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        if ffmpeg_exe and os.path.exists(ffmpeg_exe):
            logger.info(f"Using imageio-ffmpeg at: {ffmpeg_exe}")
            return ffmpeg_exe
    except Exception as e:
        logger.warning(f"Could not load imageio-ffmpeg: {e}")

    return None
