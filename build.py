#!/usr/bin/env python3
"""Inline src/ into a single self-contained dist/index.html plus PWA files."""
import re, shutil, pathlib
root = pathlib.Path(__file__).parent
src, dist = root / 'src', root / 'dist'
dist.mkdir(exist_ok=True)
css = (src / 'style.css').read_text()
js = (src / 'engine.js').read_text() + '\n' + (src / 'ui.js').read_text()
version = re.search(r"APP_VERSION = '([^']+)'", js).group(1)
html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>WunderOS Console</title><meta name="theme-color" content="#0b0f14">
<meta name="description" content="Own the agents that run your business: spec, governed runtime, deterministic replay, tamper-evident record and an Agentic Data Enclave.">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>{css}</style></head><body><script>{js}</script></body></html>'''
(dist / 'index.html').write_text(html)
(dist / 'sw.js').write_text((src / 'sw.js').read_text().replace('__VERSION__', version))
for f in ['manifest.webmanifest', 'icon-192.png', 'icon-512.png']:
    shutil.copy(src / f, dist / f)
print('built v' + version, len(html), 'bytes')
# GitHub Pages serves main / (root): mirror the build there.
for f in dist.iterdir():
    shutil.copy(f, root / f.name)
(root / '.nojekyll').touch()
