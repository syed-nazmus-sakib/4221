#!/usr/bin/env python3
"""Build exam_prep/lab-final-solutions.html from notebooks + last-year markdown."""
from __future__ import annotations

import html
import re
from pathlib import Path

import nbformat

ROOT = Path("/Volumes/ns_external/Study/4221")
OUT = ROOT / "exam_prep" / "lab-final-solutions.html"


def stash_factory():
    slots = []

    def stash(fragment: str) -> str:
        slots.append(fragment)
        return f"@@PH{len(slots) - 1}@@"

    def restore(text: str) -> str:
        def repl(m):
            return slots[int(m.group(1))]

        return re.sub(r"@@PH(\d+)@@", repl, text)

    return stash, restore


def md_to_html(src: str) -> str:
    src = src.replace("\r\n", "\n").strip("\n")
    if not src.strip():
        return ""
    stash, restore = stash_factory()

    def fence(m):
        code = html.escape(m.group(1).rstrip("\n"))
        return stash(f'<pre class="code"><code>{code}</code></pre>')

    src = re.sub(r"```(?:\w*)\n(.*?)```", fence, src, flags=re.S)

    def disp(m):
        return stash("\\[" + m.group(1).strip() + "\\]")

    src = re.sub(r"\$\$(.+?)\$\$", disp, src, flags=re.S)

    def inl(m):
        return stash("\\(" + m.group(1) + "\\)")

    src = re.sub(r"(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)", inl, src)

    def inline_code(m):
        return stash(f"<code>{html.escape(m.group(1))}</code>")

    src = re.sub(r"`([^`]+)`", inline_code, src)

    lines = src.split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if re.match(r"^\|.+\|$", line) and i + 1 < len(lines) and re.match(
            r"^\|[\s:|\-]+\|$", lines[i + 1]
        ):
            rows = []
            while i < len(lines) and re.match(r"^\|.+\|$", lines[i]):
                rows.append(lines[i])
                i += 1
            header = [c.strip() for c in rows[0].strip("|").split("|")]
            body = rows[2:] if len(rows) > 2 else []
            html_t = ['<div class="table-wrap"><table><thead><tr>']
            html_t += [f"<th>{cell}</th>" for cell in header]
            html_t.append("</tr></thead><tbody>")
            for row in body:
                cells = [c.strip() for c in row.strip("|").split("|")]
                html_t.append("<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
            html_t.append("</tbody></table></div>")
            out.append("".join(html_t))
            continue
        if line.strip() == "---":
            out.append("<hr>")
            i += 1
            continue
        hm = re.match(r"^(#{1,4})\s+(.*)$", line)
        if hm:
            n = len(hm.group(1))
            tag = "h3" if n <= 3 else "h4"
            out.append(f"<{tag}>{hm.group(2)}</{tag}>")
            i += 1
            continue
        if re.match(r"^[-*]\s+", line) or re.match(r"^\d+\.\s+", line):
            ordered = bool(re.match(r"^\d+\.\s+", line))
            tag = "ol" if ordered else "ul"
            items = []
            while i < len(lines) and (
                re.match(r"^[-*]\s+", lines[i]) or re.match(r"^\d+\.\s+", lines[i])
            ):
                items.append(re.sub(r"^([-*]|\d+\.)\s+", "", lines[i]))
                i += 1
            lis = "".join(f"<li>{inline_fmt(x)}</li>" for x in items)
            out.append(f"<{tag}>{lis}</{tag}>")
            continue
        if not line.strip():
            i += 1
            continue
        para = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
            r"^(#{1,4}\s+|[-*]\s+|\d+\.\s+|\|.+\||---$)", lines[i]
        ):
            para.append(lines[i])
            i += 1
        out.append("<p>" + inline_fmt(" ".join(para)) + "</p>")
    return restore("\n".join(out))


def inline_fmt(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", text)
    return text


def code_block(src: str, open_by_default: bool = False) -> str:
    src = src.strip("\n")
    opened = " open" if open_by_default else ""
    return (
        f'<details class="reveal"{opened}><summary>Solution code</summary>'
        f'<div class="reveal-body"><pre class="code"><code>'
        f"{html.escape(src)}</code></pre></div></details>"
    )


def clean_title(title: str) -> str:
    title = re.sub(r"\*\*(.+?)\*\*", r"\1", title)
    title = re.sub(r"\$([^$]+)\$", r"\1", title)
    title = title.replace("\\times", "×").replace("\\mathrm{out}", "out")
    title = re.sub(r"\s+", " ", title).strip()
    return title


def slug(prefix: str, title: str, used: set[str]) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower())
    s = re.sub(r"-+", "-", s).strip("-")[:70]
    sid = f"{prefix}-{s}" if s else prefix
    base = sid
    n = 2
    while sid in used:
        sid = f"{base}-{n}"
        n += 1
    used.add(sid)
    return sid


def is_question_heading(text: str) -> str | None:
    m = re.search(
        r"^#{1,3}\s+((?:Question|Q)\s*\d+[^\n]*)",
        text.strip(),
        re.I | re.M,
    )
    if not m:
        return None
    title = re.sub(r"\s+", " ", m.group(1)).strip()
    if re.search(r"\bsolution\b", title, re.I) and not re.match(
        r"Question", title, re.I
    ):
        return None
    return title


def cards_from_markdown_file(path: Path, prefix: str) -> tuple[str, list[dict]]:
    text = path.read_text(encoding="utf-8")
    intro = ""
    parts = re.split(r"(?=^## )", text, flags=re.M)
    cards = []
    used = set()
    for chunk in parts:
        if chunk.startswith("# ") and not chunk.startswith("## "):
            # file title + intro until first ##
            before, *rest = re.split(r"\n## ", chunk, maxsplit=1)
            intro = md_to_html(before)
            if rest:
                chunk = "## " + rest[0]
            else:
                continue
        if not chunk.startswith("## "):
            continue
        title = clean_title(chunk.split("\n", 1)[0][3:].strip())
        body = chunk.split("\n", 1)[1] if "\n" in chunk else ""
        cards.append(
            {
                "id": slug(prefix, title, used),
                "title": title,
                "html": md_to_html("## " + title + "\n" + body),
            }
        )
    return intro, cards


def cards_from_notebook(path: Path, prefix: str) -> tuple[str, list[dict]]:
    nb = nbformat.read(path, as_version=4)
    intro_bits = []
    cards: list[dict] = []
    used = set()
    current = None

    def flush():
        nonlocal current
        if current:
            cards.append(current)
            current = None

    for cell in nb.cells:
        src = cell.source if isinstance(cell.source, str) else "".join(cell.source)
        if cell.cell_type == "markdown":
            title = is_question_heading(src)
            if title:
                flush()
                current = {
                    "id": slug(prefix, title, used),
                    "title": clean_title(title),
                    "html": md_to_html(src),
                }
            elif current is None:
                intro_bits.append(md_to_html(src))
            else:
                current["html"] += md_to_html(src)
        elif cell.cell_type == "code":
            if current is None:
                continue
            current["html"] += code_block(src)
    flush()
    return "\n".join(b for b in intro_bits if b), cards


def render_cards(cards: list[dict]) -> str:
    chunks = []
    for c in cards:
        chunks.append(
            f'<section class="card" id="{html.escape(c["id"])}">\n'
            f'<h2>{html.escape(c["title"])}</h2>\n'
            f'{c["html"]}\n'
            f"</section>"
        )
    return "\n".join(chunks)


def ans_box(html_inner: str) -> str:
    return f'<div class="ans">{html_inner}</div>'


PAGE_HEAD = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RME 4231 Lab Final — All Solutions</title>
<link rel="stylesheet" href="styles.css">
<style>
pre.code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12.8px;
  background: var(--code-bg);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 16px;
  overflow-x: auto;
  line-height: 1.55;
  margin: 10px 0;
  color: var(--ink);
}
pre.code code { font: inherit; background: none; padding: 0; }
code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.92em;
  background: var(--code-bg);
  padding: 1px 6px;
  border-radius: 5px;
}
.ans {
  background: #f3f7ea;
  border: 1px solid #c5d4a8;
  border-left: 5px solid #7a9a4a;
  border-radius: 10px;
  padding: 12px 16px;
  margin: 14px 0;
}
.ans strong { color: #4a6a28; }
.toolbar {
  display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;
}
.toolbar button {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  border: 1px solid var(--line);
  background: var(--cream-2);
  color: var(--cocoa);
  border-radius: 999px;
  padding: 6px 14px;
  cursor: pointer;
}
.toolbar button:hover { background: var(--milk); }
hr { border: none; border-top: 1px solid var(--line); margin: 16px 0; }
</style>
<script>
  window.MathJax = {
    tex: {
      inlineMath: [['\\(', '\\)']],
      displayMath: [['\\[', '\\]']],
      processEscapes: true
    },
    svg: { fontCache: 'global' },
    options: { skipHtmlTags: ['script','noscript','style','textarea','pre','code'] }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" id="MathJax-script" async></script>
</head>
<body>
<header class="topbar">
  <span class="brand"><span class="dot"></span>4221 Exam Prep</span>
  <span class="sub">Lab Final · all solutions</span>
  <nav class="exam-switch" aria-label="Exam notes">
    <a href="index.html">Final Exam</a>
    <a href="incourse-exam.html">In-course</a>
    <a href="lab-final-solutions.html" class="current">Lab Final</a>
  </nav>
  <button class="menu-btn" id="menu-btn" aria-label="Toggle contents">☰ Contents</button>
</header>
<div class="scrim" id="scrim"></div>
<div class="layout">
  <nav class="sidebar" id="sidebar">
    <h2>Table of Contents</h2>
    <input type="text" class="toc-search" id="toc-search" placeholder="Filter sections…">
    <div id="toc-root"></div>
  </nav>
  <main class="content" id="content">
"""

PAGE_FOOT = r"""
  </main>
</div>
<button class="to-top" id="to-top" aria-label="Back to top">↑</button>
<script src="script.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-all');
  const closeBtn = document.getElementById('close-all');
  if (openBtn) openBtn.addEventListener('click', () => {
    document.querySelectorAll('details.reveal').forEach(d => d.open = true);
  });
  if (closeBtn) closeBtn.addEventListener('click', () => {
    document.querySelectorAll('details.reveal').forEach(d => d.open = false);
  });
});
</script>
</body>
</html>
"""


def part(pid: str, title: str, sub: str) -> str:
    return (
        f'<div class="part" id="{pid}">'
        f"<h1>{html.escape(title)}</h1>"
        f'<div class="part-sub">{sub}</div></div>'
    )


def main():
    pyq_intro, pyq_cards = cards_from_markdown_file(
        ROOT / "4231-last-year-solutions.md", "pyq"
    )
    like_intro, like_cards = cards_from_notebook(
        ROOT / "4231-five-exam-questions.ipynb", "like"
    )
    lp1_intro, lp1_cards = cards_from_notebook(ROOT / "lab-practice-1.ipynb", "lp1")
    lp2_intro, lp2_cards = cards_from_notebook(ROOT / "lab-practice-2.ipynb", "lp2")
    lp3_intro, lp3_cards = cards_from_notebook(ROOT / "lab-practice-3.ipynb", "lp3")

    hero = """
    <div class="hero">
      <h1>Lab Final — all solutions</h1>
      <p>RME 4231 / 4221. Same hall rules as last year: <code>import math</code>, nested loops, no PyTorch. He changes <strong>one number</strong>.</p>
      <p class="mantra">Previous year → lookalike mutations → lab-practice 1, 2, 3</p>
      <div class="chips">
        <span class="chip">Last year · 3 Qs</span>
        <span class="chip">5 lookalikes</span>
        <span class="chip">Practice 1 · neuron</span>
        <span class="chip">Practice 2 · train + data</span>
        <span class="chip">Practice 3 · CNN</span>
      </div>
      <div class="toolbar">
        <button type="button" id="open-all">Open all solution code</button>
        <button type="button" id="close-all">Collapse all code</button>
      </div>
    </div>
    """

    lp1_ans = ans_box(
        """
        <strong>Practice 1 — hall prints.</strong>
        Q1 ŷ≈0.767. Q2 ReLU dies. Q4 dw≈−0.620. Q5 ŷ≈0.986.
        Q11 class 1. Q15 4/4. Q16 dead ReLU: dw₂=0, db₂≠0.
        Q23 naive softmax NaN; stable [0.269, 0.731]. Q24 acc 1.0.
        """
    )
    lp2_ans = ans_box(
        """
        <strong>Practice 2 — hall prints.</strong>
        Q2 loss drops 0.695→0.680. Q3 miss index 1. Q4 η=0.01 underfits, η=0.5 best.
        Q5 two test entries outside [0,1]. Q6 recalls 0.75 vs 0.25.
        Q7 F₁=0.75. Q9 W1@X ValueError. Q16 XOR: logistic 0.5, MLP 1.0.
        Q24 best_epoch=5. Q25 always-benign recall 0.
        """
    )
    lp3_ans = ans_box(
        """
        <strong>Practice 3 — hall prints.</strong>
        Q1 pool [[8]]. Q2 S=2 conv [[4,8],[8,4]]. Q3 conv[0][0]=−3.
        Q4 max [[5,4],[3,4]]. Q5 (6,3,0,2) floor 2 not 2.5.
        Q7 flatten 784. Q8 total 103018. Q20 after 5×5 conv 24 then pool 12.
        Q24 conv[1][1]=4. Q25 argmax global (1,1),(0,3),(2,1),(3,2).
        """
    )

    body = [
        PAGE_HEAD,
        hero,
        part("part-pyq", "I. Previous year paper", "University of Dhaka · 40 marks · 90 minutes"),
        pyq_intro,
        render_cards(pyq_cards),
        part(
            "part-like",
            "II. Previous-year-like questions",
            "Five mutations: extra feature, MSE+ReLU, 5×5 CNN, stride 2, four-box NMS",
        ),
        like_intro,
        render_cards(like_cards),
        part("part-lp1", "III. Lab practice 1", "Neuron + backprop · 25 questions"),
        lp1_intro,
        lp1_ans,
        render_cards(lp1_cards),
        part("part-lp2", "IV. Lab practice 2", "Training loop + real data · Labs 3–4"),
        lp2_intro,
        lp2_ans,
        render_cards(lp2_cards),
        part("part-lp3", "V. Lab practice 3", "CNN from scratch · Lab 5 + last year’s Q2"),
        lp3_intro,
        lp3_ans,
        render_cards(lp3_cards),
        PAGE_FOOT,
    ]
    OUT.write_text("".join(body), encoding="utf-8")
    print(
        "wrote",
        OUT,
        "bytes",
        OUT.stat().st_size,
        "cards",
        len(pyq_cards) + len(like_cards) + len(lp1_cards) + len(lp2_cards) + len(lp3_cards),
    )


if __name__ == "__main__":
    main()
