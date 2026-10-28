# WunderOS Console

Unofficial, interactive simulator of the ideas behind [WunderOS by Pentad Labs](https://pentad.ai/): signed agent specification, governed runtime (default-deny gate, held effects), deterministic + counterfactual replay, tamper-evident hash-chained record, Agentic Data Enclave with lineage, and a regulator audit view. Runs entirely in the browser (localStorage), mobile-first, installable PWA, works offline.

- Build: `python3 build.py` → `dist/` (single-file `index.html` + `sw.js`, manifest, icons)
- Serve: `cd dist && python3 -m http.server 8090`
- Test: `python3 tests/e2e.py [cdp_url] [app_url]` (Playwright over CDP)
- Demo approval PIN: `1234`
