#!/usr/bin/env python3
"""Maakt één los HTML-bestand van de demo (CSS, JS en afbeeldingen ingebakken).

Handig om de demo te mailen, lokaal te openen of op een plek te zetten waar je
maar één bestand kunt uploaden. Draai opnieuw na elke wijziging:

    python3 build_standalone.py
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "document-automation-studio-demo.html"

html = (HERE / "index.html").read_text(encoding="utf-8")
css = (HERE / "demo.css").read_text(encoding="utf-8")
js = (HERE / "demo.js").read_text(encoding="utf-8")

assets = {}
for name, mime in (("peacock-logo.png", "image/png"), ("peacock-mark.png", "image/png"), ("receipt.jpg", "image/jpeg")):
    data = base64.b64encode((HERE / "assets" / name).read_bytes()).decode("ascii")
    assets[name] = f"data:{mime};base64,{data}"

assets_js = "window.ACS_ASSETS = {" + ",".join(f'"{k}":"{v}"' for k, v in assets.items()) + "};"

css_tag = '<link rel="stylesheet" href="demo.css">'
js_tag = '<script src="demo.js"></script>'
assert css_tag in html and js_tag in html, "index.html is veranderd; pas build_standalone.py aan"
js = js.replace("</script", "<\\/script")  # mag de inline <script> niet voortijdig sluiten

html = html.replace(css_tag, "<style>\n" + css + "\n</style>")
html = html.replace(js_tag, "<script>" + assets_js + "</script>\n<script>\n" + js + "\n</script>")
OUT.write_text(html, encoding="utf-8")
print(f"Geschreven: {OUT.name} ({OUT.stat().st_size // 1024} KB)")
