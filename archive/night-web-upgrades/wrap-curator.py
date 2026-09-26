"""One-off: wrap each .curator paragraph in its own .panel-note container.

Why: js/reel-stage.js renders with `stage.innerHTML = ""`, and for films and
series the stage element IS the tab panel, so a bare <p> inside it was deleted
on first paint. The note has to be a sibling of the stage, not a child.
"""
import re

PATH = "index.html"
HTML = open(PATH, encoding="utf-8").read()

PATTERN = re.compile(r'<p class="curator (curator--[a-z]+)">(.*?)</p>', re.S)


def repl(match):
    return (
        '<div class="panel-note">\n'
        '              <p class="curator %s">%s</p>\n'
        '            </div>' % (match.group(1), match.group(2))
    )


out, count = PATTERN.subn(repl, HTML)
if count != 6:
    raise SystemExit("expected 6 notes, found %d" % count)

open(PATH, "w", encoding="utf-8", newline="").write(out)
print("wrapped %d notes" % count)
