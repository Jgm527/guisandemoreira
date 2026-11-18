#!/usr/bin/env python3
"""
Descarga el material de UNA asignatura del Aula Virtual del IES de Teis.

Reutiliza el scraper de D:\\Brain\\02-projects\\moodle-scraper\\scraper.py
(API REST de Moodle + token de pluginfile) y filtra por nombre de curso,
guardando el material ordenado por tema y por carpeta:

    <out>/
      01-UT1 .../
        apunte.pdf
      02-UT2 .../
        Codigos unidad/
          componente.vue
      Entregas/

Uso:
    py tools/moodle/descargar-asignatura.py --list
    py tools/moodle/descargar-asignatura.py --scan --match interfaces
    py tools/moodle/descargar-asignatura.py --match interfaces --out material
"""

import argparse
import os
import re
import sys
from pathlib import Path

# La consola de Windows usa cp1252 y el scraper imprime caracteres de caja/símbolos
for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="replace")

SCRAPER_DIR = Path(r"D:\Brain\02-projects\moodle-scraper")
sys.path.insert(0, str(SCRAPER_DIR))

from dotenv import load_dotenv  # noqa: E402
from scraper import C, MoodleScraper  # noqa: E402


def fix_mojibake(name):
    """Moodle manda la cabecera en UTF-8 crudo y requests la lee como latin-1."""
    try:
        return name.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return name


class LocalScraper(MoodleScraper):
    """MoodleScraper con nombres de archivo bien decodificados."""

    def _extract_name(self, resp, fallback_url):
        name = super()._extract_name(resp, fallback_url)
        return self.clean_filename(fix_mojibake(name)) if name else name


def find_courses(scraper, pattern):
    rx = re.compile(pattern, re.I)
    return [
        c for c in scraper.get_courses()
        if rx.search(c.get("shortname", "")) or rx.search(c.get("fullname", ""))
    ]


def sections_of(scraper, course):
    contents = scraper.api("core_course_get_contents", courseid=course["id"])
    return contents if isinstance(contents, list) else []


def scan(scraper, course):
    """Lista secciones y tipos de módulo del curso, sin descargar."""
    contents = sections_of(scraper, course)
    if not contents:
        print(f"  {C.ROJO}[✗] El curso no devolvió contenido{C.RESET}")
        return
    for sec in contents:
        mods = sec.get("modules", [])
        if not mods:
            continue
        name = (sec.get("name") or "").strip() or f"Tema {sec.get('section', 0)}"
        print(f"\n  {C.AMARILLO}[{sec.get('section', 0):02d}] {scraper.clean(name)}{C.RESET}")
        for m in mods:
            nfiles = len(m.get("contents") or [])
            extra = f" ({nfiles} archivos)" if nfiles else ""
            print(f"        · {m.get('modname', '?'):<10} {m.get('name', '')[:70]}{extra}")


def download_course(scraper, course, dest_root):
    print(f"\n{C.BOLD}{C.AZUL}── {course.get('shortname')} ──{C.RESET}")
    print(f"  {C.GRIS}{course.get('fullname', '')[:90]}{C.RESET}")

    assignments = []
    for sec in sections_of(scraper, course):
        mods = sec.get("modules", [])
        if not mods:
            continue

        sec_name = scraper.clean((sec.get("name") or "").strip() or f"Tema {sec.get('section', 0)}")
        sec_dir = dest_root / f"{sec.get('section', 0):02d}-{sec_name}"[:120]
        print(f"\n  {C.AMARILLO}📁 {sec_dir.name}{C.RESET}")

        for mod in mods:
            mtype = mod.get("modname", "")
            mname = mod.get("name", "") or "sin_nombre"
            files = [c for c in (mod.get("contents") or []) if c.get("fileurl")]

            if mtype in ("resource", "folder") and files:
                # Las carpetas van en su propia subcarpeta; los recursos sueltos, en el tema
                target = sec_dir / scraper.clean(mname)[:80] if mtype == "folder" else sec_dir
                target.mkdir(parents=True, exist_ok=True)
                if mtype == "folder":
                    print(f"    {C.GRIS}carpeta: {mname[:60]}{C.RESET}")
                for f in files:
                    label = f.get("filename") or mname
                    print(f"    {C.GRIS}→ {fix_mojibake(label)[:70]}{C.RESET}")
                    scraper.download(f["fileurl"], target, label=label)

            elif mtype == "folder" and mod.get("url"):
                # Carpeta sin contents: se navega la página y se sacan los pluginfile
                target = sec_dir / scraper.clean(mname)[:80]
                print(f"    {C.GRIS}carpeta (nav): {mname[:60]}{C.RESET}")
                scraper.download_folder_nav(mod["url"], target)

            elif mtype == "url" and mod.get("url"):
                # Enlace externo: se guarda como acceso directo
                sec_dir.mkdir(parents=True, exist_ok=True)
                link = sec_dir / (scraper.clean(mname)[:80] + ".url")
                link.write_text(f"[InternetShortcut]\nURL={mod['url']}\n", encoding="utf-8")
                print(f"    {C.GRIS}enlace: {mname[:60]}{C.RESET}")

            elif mtype == "assign":
                assignments.append({"name": mname, "url": mod.get("url", "")})
                print(f"    {C.GRIS}tarea: {mname[:60]}{C.RESET}")

    if assignments:
        entregas = dest_root / "Entregas"
        entregas.mkdir(parents=True, exist_ok=True)
        print(f"\n  {C.AMARILLO}📋 Entregas{C.RESET}")
        for a in assignments:
            print(f"    {C.GRIS}→ {a['name'][:70]}{C.RESET}")
            if a["url"]:
                scraper.download_assignment(a["url"], entregas / scraper.clean(a["name"][:40]))


def main():
    ap = argparse.ArgumentParser(description="Descargar una asignatura del Moodle del IES de Teis")
    ap.add_argument("--match", default="interfaces",
                    help="regex sobre shortname/fullname del curso (por defecto: interfaces)")
    ap.add_argument("--out", default="material", help="carpeta destino (por defecto: material)")
    ap.add_argument("--list", action="store_true", help="solo listar cursos que coinciden")
    ap.add_argument("--scan", action="store_true", help="listar secciones y módulos, sin descargar")
    args = ap.parse_args()

    load_dotenv(SCRAPER_DIR / ".env")
    user, pw = os.getenv("MOODLE_USER"), os.getenv("MOODLE_PASS")
    if not user or not pw:
        sys.exit("[✗] Faltan MOODLE_USER / MOODLE_PASS en el .env del scraper")

    out = Path(args.out).resolve()
    scraper = LocalScraper(download_dir=out)
    if not scraper.authenticate(user, pw):
        sys.exit(1)

    courses = find_courses(scraper, args.match)
    print(f"\n  Cursos que coinciden con /{args.match}/: {len(courses)}")
    for c in courses:
        print(f"    · {c['id']:>5} → {c.get('shortname')} — {c.get('fullname', '')[:70]}")

    if not courses:
        sys.exit("\n[!] Ningún curso coincide. Prueba con otro --match.")

    if args.list:
        return
    if args.scan:
        for c in courses:
            scan(scraper, c)
        return

    single = len(courses) == 1
    for c in courses:
        dest_root = out if single else out / scraper.clean(c.get("shortname", str(c["id"])))
        download_course(scraper, c, dest_root)

    s = scraper.stats
    print(f"\n{C.BOLD}{'=' * 50}{C.RESET}")
    print(f"  Descargados: {s['downloaded']}  |  Saltados: {s['skipped']}  |  Errores: {s['errors']}")
    print(f"  Destino: {out}")


if __name__ == "__main__":
    main()
