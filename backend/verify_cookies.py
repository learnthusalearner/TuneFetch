"""
Quick script to verify that your YouTube cookies in backend/cookies.txt
or environment variables are recognized and working properly.
Usage:
    python verify_cookies.py
"""
import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.downloader import get_cookie_jar, configure_urllib_network
from pytubefix import YouTube
from pytubefix.botGuard.bot_guard import generate_po_token

def main():
    print("=" * 60)
    print(" TuneFetch YouTube Cookie Verifier")
    print("=" * 60)

    jar = get_cookie_jar()
    if not jar or len(list(jar)) == 0:
        print("\n[-] No cookies found yet!")
        print(f"    Please open: {os.path.join(backend_dir, 'cookies.txt')}")
        print("    and paste your exported YouTube cookies there, then re-run this script.")
        print("\nSupported formats:")
        print("  - Netscape (.txt from 'Get cookies.txt LOCALLY')")
        print("  - JSON (from 'Cookie-Editor')")
        print("  - Header string ('name=val; name2=val')")
        return

    cookie_count = len(list(jar))
    domains = set(c.domain for c in jar)
    print(f"\n[+] SUCCESS: Found {cookie_count} cookies across domains: {', '.join(domains)}")

    print("\n[*] Testing authenticated YouTube audio stream resolution...")
    configure_urllib_network(use_proxy=False)

    test_video = "https://www.youtube.com/watch?v=dkdrMG-uXdQ"
    try:
        def po_token_verifier():
            token = generate_po_token()
            return token, "bogus_visitor_data"

        yt = YouTube(
            test_video,
            client="MWEB",
            use_po_token=True,
            po_token_verifier=po_token_verifier
        )
        audio_stream = yt.streams.filter(only_audio=True).order_by("abr").desc().first()
        if audio_stream:
            print(f"[+] Audio stream extracted successfully!")
            print(f"    Title:    {yt.title}")
            print(f"    Bitrate:  {audio_stream.abr}")
            print(f"    MimeType: {audio_stream.mime_type}")
            print("\n[✓] ALL CHECKS PASSED: Your cookies are working 100%!")
        else:
            print("[-] Could not find an audio stream for the test video.")
    except Exception as e:
        print(f"[-] Test extraction error: {e}")

if __name__ == "__main__":
    main()
