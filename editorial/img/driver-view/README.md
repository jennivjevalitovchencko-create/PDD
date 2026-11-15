# Driver-view images (Q65, Q68, Q92, Q213, Q294 built into the app; others are drafts)

Approved frame style 2026-11-08 (user): see `compose-sample.html` (open locally) and the skill
`pdd-driver-view-image` (C:\Users\PC\.claude-my\skills\pdd-driver-view-image).

- Scenes generated in Canva, full size via the working design «PDD — картинки к вопросам» (DAHaWYTjPlU), export JPG 1600×900.
- `dashboard-modern-1600x800.jpg` — shared cluster (Canva, page 5), own SVG overlays: needle, big turn arrows, ISO 2575 icons, mirrors.
- Samples: q65 (left turn on green; app uses q65v2 — all three signal heads lit green after reviewer note), q294v5 (right lane; q294v3 had the camera on the centre line) (uncontrolled intersection), q68f/q68r (ambulance behind, rear view in mirrors), q213f/q213r (lane change, empty mirrors).
- Q213 image: user finds it clear (08.11). All generated images incl. rejected ones: library/CATALOG.md.

## App copies (in index.html since 2026-11-08 release)

- `app/*.jpg` — compressed copies used by the app: scenes 960×540, mirror scenes 800×450, dashboard 800×400 (ffmpeg, lanczos, `-q:v 5`/`6`).
- `node editorial/img/driver-view/build-app.cjs` writes them into `const DVI` in `index.html`; `DV` there sets per question: scene, speed, turn signals, mirror scene, scene top.
- Frame code in the app: `dvf()` (port of `compose-sample.html`); Q65 scene lowered (top 122) so the rear-view mirror does not hide the signal.
- `tests/integrity.cjs` checks the embedded data equals `app/*.jpg`.
- Q92 (13.11): scene app/q92.jpg; mirrors use app/q92r.jpg = horizontally flipped crop of the same scene (no real rear view yet — Canva credit quota ran out). Redo the rear view and remove the stop-line-like white line when credits reset.

## 16:10 format (user decision 2026-11-15)

All driver-view scenes move to one 16:10 format: composition as 16:9 plus ~12% sky on top, which sits under the rear-view mirror (no dark band). `dvf()` takes an options object as the 8th DV element: `h` scene height (1000 for 16:10, default 900), `ry` rear-view mirror crop shift down, `low` low-beam icon lit. First: Q675 (R21) `['r21',0,0,0,'r21r',56,{h:1000,ry:80,low:1}]`. The five older 16:9 pictures (Q65, Q68, Q92, Q213, Q294) will be redone in 16:10 later.
