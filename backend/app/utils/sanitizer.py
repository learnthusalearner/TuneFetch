import re
import os
import urllib.parse
from typing import Tuple

def sanitize_filename(filename: str, fallback_ext: str = ".mp3") -> str:
    """
    Cleans illegal filesystem characters from filename while preserving valid unicode.
    """
    if not filename:
        return f"audio{fallback_ext}"
    
    # Remove characters forbidden in Windows/POSIX filenames: < > : " / \ | ? *
    clean = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename).strip()
    clean = re.sub(r'\s+', ' ', clean).strip(' .')
    
    if not clean:
        clean = "audio"
        
    return clean

def build_content_disposition_header(filename: str, ext: str = ".mp3") -> Tuple[str, str]:
    """
    Generates a dual-standard Content-Disposition header with:
    1. A strictly ASCII fallback filename="safe_name.ext"
    2. An RFC 5987 UTF-8 filename*=UTF-8''encoded_name.ext
    Returns (content_disposition_header_value, media_type)
    """
    clean_name = sanitize_filename(filename, ext)
    if not clean_name.lower().endswith(ext.lower()):
        clean_name = f"{clean_name}{ext}"
        
    # ASCII-only fallback
    ascii_name = re.sub(r'[^a-zA-Z0-9_\-\. ]', '_', clean_name).strip()
    if not ascii_name.lower().endswith(ext.lower()):
        ascii_name = f"{ascii_name}{ext}"
    if not ascii_name or ascii_name == ext:
        ascii_name = f"download{ext}"

    # RFC 5987 encoded UTF-8
    encoded_name = urllib.parse.quote(clean_name)
    
    header_val = f'attachment; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded_name}'
    
    # MIME Type resolution
    media_type = "audio/mpeg"
    ext_lower = ext.lower()
    if ext_lower == ".m4a":
        media_type = "audio/mp4"
    elif ext_lower in [".webm", ".opus"]:
        media_type = "audio/webm"
    elif ext_lower == ".wav":
        media_type = "audio/wav"
    elif ext_lower == ".ogg":
        media_type = "audio/ogg"
        
    return header_val, media_type
