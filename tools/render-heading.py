# Renders a fixed phrase in a desktop-licensed font as SVG outlines, so no font software ships.
# Used for the GTA VI card heading (Pricedown Black, Typodermic desktop licence: fixed website
# graphics are allowed, webfonts are not). The .otf stays on Daniel's PC — never commit it.
#   pip install fonttools uharfbuzz
#   python3 tools/render-heading.py "path/to/Pricedown Bl.otf" "Grand Theft Auto VI" out.svg
# Pricedown has no naira sign: a leading "₦" is drawn as the font's own N with two cross bars
# (separate <path>s, so the bars never cancel the N's fill), e.g. "₦150,000" for the GTA page.
import sys, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT, TEXT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
NAIRA = TEXT.startswith('\u20a6')
if NAIRA:
    TEXT = 'N' + TEXT[1:]
blob = hb.Blob.from_file_path(FONT); face = hb.Face(blob); font = hb.Font(face)
buf = hb.Buffer(); buf.add_str(TEXT); buf.guess_segment_properties()
hb.shape(font, buf, {'kern': True, 'liga': True, 'calt': True})
tt = TTFont(FONT); gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
paths = []; x = 0; first = None; x_gap = None
minx = miny = 1e9; maxx = maxy = -1e9
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = order[info.codepoint]
    dx, dy = x + pos.x_offset, pos.y_offset
    bp = BoundsPen(gs); gs[name].draw(bp)
    if bp.bounds:
        a, b, c, d = bp.bounds
        if first is None: first = (a+dx, b+dy, c+dx, d+dy)
        minx, miny, maxx, maxy = min(minx, a+dx), min(miny, b+dy), max(maxx, c+dx), max(maxy, d+dy)
        sp = SVGPathPen(gs)
        gs[name].draw(TransformPen(sp, (1, 0, 0, -1, dx, -dy)))   # flip y for SVG
        paths.append(sp.getCommands())
    x += pos.x_advance
    if NAIRA and len(paths) == 1 and first and x_gap is None:
        x_gap = (first[2] - first[0]) * 0.30          # room for the bars' overhang before the digits
        x += x_gap
bars = ''
if NAIRA and first:
    # two bars across the N, a little wider than it, heavy like the font's strokes
    a, b, c, d = first; h = d - b; t = h * 0.095; over = (c - a) * 0.10
    for frac in (0.40, 0.62):
        y = b + h * frac
        bars += f'<path fill="currentColor" d="M{a-over:.0f} {-(y+t/2):.0f}H{c+over:.0f}V{-(y-t/2):.0f}H{a-over:.0f}Z"/>'
    minx, maxx = min(minx, a-over), max(maxx, c+over)
pad = 10
vb = f'{minx-pad:.0f} {-maxy-pad:.0f} {maxx-minx+2*pad:.0f} {maxy-miny+2*pad:.0f}'
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" aria-hidden="true" focusable="false">'
       f'<path fill="currentColor" d="{" ".join(paths)}"/>{bars}</svg>')
open(OUT, 'w').write(svg)
print(OUT, vb, len(svg), 'bytes')
