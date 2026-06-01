"""
Generate a self-signed TLS certificate for local HTTPS.

Why: Camera access in mobile browsers (Safari on iPhone) requires HTTPS.
     This script creates a cert trusted for your local IP address so you
     can open https://192.168.x.x:8000 from your phone.

Usage:
    python gen_cert.py          # auto-detects your local IP
    python gen_cert.py 192.168.0.218

Then start the server with SSL:
    uvicorn main:app --host 0.0.0.0 --port 8000 \\
      --ssl-keyfile cert/key.pem --ssl-certfile cert/cert.pem

On iPhone:
    1. Open https://192.168.x.x:8000 in Safari
    2. Tap "Show Details" → "visit this website" → confirm
    3. Go to Settings → General → VPN & Device Management → trust the cert
    4. Reload the page — camera will work
    5. Share sheet → Add to Home Screen
"""

import ipaddress
import socket
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

# ── Detect local IP ────────────────────────────────────────────────────────────
def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

ip_str = sys.argv[1] if len(sys.argv) > 1 else local_ip()
print(f"Generating certificate for IP: {ip_str}")

# ── Generate key ───────────────────────────────────────────────────────────────
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# ── Build cert ────────────────────────────────────────────────────────────────
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COMMON_NAME, "EcoSortAI Local"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "EcoSortAI"),
])

cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(datetime.now(timezone.utc))
    .not_valid_after(datetime.now(timezone.utc) + timedelta(days=825))
    .add_extension(x509.SubjectAlternativeName([
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
        x509.IPAddress(ipaddress.IPv4Address(ip_str)),
    ]), critical=False)
    .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
    .sign(key, hashes.SHA256())
)

# ── Save ──────────────────────────────────────────────────────────────────────
out = Path(__file__).parent / "cert"
out.mkdir(exist_ok=True)

(out / "key.pem").write_bytes(
    key.private_bytes(serialization.Encoding.PEM,
                      serialization.PrivateFormat.TraditionalOpenSSL,
                      serialization.NoEncryption())
)
(out / "cert.pem").write_bytes(cert.public_bytes(serialization.Encoding.PEM))

print(f"Saved: {out}/cert.pem  and  {out}/key.pem")
print()
print("Start server:")
print(f"  uvicorn main:app --host 0.0.0.0 --port 8000 \\")
print(f"    --ssl-keyfile cert/key.pem --ssl-certfile cert/cert.pem")
print()
print("Open on iPhone:")
print(f"  https://{ip_str}:8000")
print()
print("iPhone trust steps:")
print("  1. Open the URL in Safari → tap 'Show Details' → 'visit this website'")
print("  2. Settings → General → VPN & Device Management → trust 'EcoSortAI Local'")
print("  3. Reload — camera now works over HTTPS")
print("  4. Share sheet → Add to Home Screen")
