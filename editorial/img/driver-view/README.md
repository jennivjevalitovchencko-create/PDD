# Driver-view images (Q65, Q68, Q92, Q213, Q294 built into the app; others are drafts)

Approved frame style 2026-11-08 (user): see `compose-sample.html` (open locally) and the skill
`pdd-driver-view-image` (C:\Users\PC\.claude-my\skills\pdd-driver-view-image).

- Scenes generated in Canva, full size via the working design «PDD — картинки к вопросам» (DAHaWYTjPlU), export JPG 1600×900.
- `dashboard-modern-1600x800.jpg` — shared cluster (Canva, page 5), own SVG overlays: needle, big turn arrows, ISO 2575 icons, mirrors.
- Samples: q65 (left turn on green; app uses q65v2 — all three signal heads lit green after reviewer note), q294v5 (right lane; q294v3 had the camera on the centre line) (uncontrolled intersection), q68f/q68r (ambulance behind, rear view in mirrors), q213f/q213r (lane change, empty mirrors).
- Q213 image: user finds it clear (08.11). All generated images incl. rejected ones: library/CATALOG.md.

## App copies (in index.html since 2026-11-08 release)

- `app/*.jpg` — compressed copies used by the app: scenes 960×540, mirror scenes 800×450, dashboard 800×400 (ffmpeg, lanczos, `-q:v 5`/`6`).
- (until 2026-11-17) `node editorial/img/driver-view/build-app.cjs` wrote them into `const DVI` in `index.html` — now pre-rendered files, see below; `DV` there sets per question: scene, speed, turn signals, mirror scene, scene top.
- Frame code in the app: `dvf()` (port of `compose-sample.html`); Q65 scene lowered (top 122) so the rear-view mirror does not hide the signal.
- `tests/integrity.cjs` checked the embedded data equals `app/*.jpg` (until 2026-11-17).
- Q92 (13.11): scene app/q92.jpg; mirrors use app/q92r.jpg = horizontally flipped crop of the same scene (no real rear view yet — Canva credit quota ran out). Redo the rear view and remove the stop-line-like white line when credits reset.

## 16:10 format (user decision 2026-11-15)

All driver-view scenes move to one 16:10 format: composition as 16:9 plus ~12% sky on top, which sits under the rear-view mirror (no dark band). `dvf()` takes an options object as the 8th DV element: `h` scene height (1000 for 16:10, default 900), `ry` rear-view mirror crop shift down, `low` low-beam icon lit. First: Q675 (R21) `['r21',0,0,0,'r21r',56,{h:1000,ry:80,low:1}]`. The five older 16:9 pictures (Q65, Q68, Q92, Q213, Q294) will be redone in 16:10 later.

## R questions, release 2026-11-17

Twelve more R questions got 16:10 ChatGPT scenes with rear views (user-approved 15–16.11): Q669 R15, Q671 R17, Q673 R19, Q677 R23, Q679 R25, Q682 R28, Q684 R30, Q686 R32, Q687 R33, Q689 R35, Q692 R38, Q695 R41. App copies: scenes 960×600 `-q:v 5`, rear views bottom 16:9 crop (R15: `crop=1586:892:0:100`), `hflip`, 800×450 `-q:v 6`. New `dvf()` option `high` lights the high-beam icon blue (R32, R33). Originals: `library/p16`–`p39`. `index.html` grew from 2.1 to about 5 MB; before many more pictures, consider loading them as separate files.

## Pictures as separate files (user decision 2026-11-17, variant A)

`index.html` no longer carries the pictures (it was ~5 MB, 3.7 MB of it base64). Each driver-view frame (scene + dashboard + mirrors, the same `dvf()` SVG as before) is pre-rendered at build time into `img/dv/q<id>.jpg`, 1600×1311, JPEG 4:4:4 `-q:v 4` (~quality 85; SSIM vs. the lossless render 0.987–0.994; indicators unchanged at 1:1 and at 375 px).

- Build: `node editorial/img/driver-view/build-app.cjs` (`--force` re-renders all). It evaluates `const DVI={}` … `dvf()` from `index.html`, fills `DVI` from `app/*.jpg`, screenshots each SVG with Edge headless (scale 1) and encodes with ffmpeg. A frame is re-rendered only when its SVG changes.
- It writes `const DVP={id:'img/dv/q<id>.jpg?v=<hash>'}` into `index.html` (hash of the frame SVG + JPEG quality, so a changed frame gets a new URL) and the same list plus the cache name into `sw.js` (`const C=…,P=[…];/*PRE*/`).
- `sw.js`: on install the app shell (`./`) is cached (required) and all pictures are downloaded (each one best-effort); old caches are removed on activate; the page asks the worker to fetch missing pictures on every open; a picture whose versioned URL is already in an older cache is copied, so after a release only changed pictures are downloaded; only own `pdd-` caches are deleted (other apps may share the github.io origin); a failed picture shows the alt text «Картинка не загрузилась…»; pictures are served cache-first (versioned URLs), everything else network-first as before. Full offline after the first open (user choice). The app is used only through the site, not as a saved file (user 2026-11-17).
- `tests/integrity.cjs` recomputes every frame: the path in `DVP` must match the current `DV`/`app/*.jpg`, the file must exist with the right size, `sw.js` must precache exactly these files, no `data:image/jpeg` in `index.html`.
- Before/after check 2026-11-17: all 18 frame SVGs identical to `bd064b3`; phone screenshots (375 px, Q65, Q675, Q686, exam review) same layout, SSIM 0.988–0.997; offline after upgrade from `bd064b3` and after a fresh install: a never-viewed picture loads with the server stopped; served under /PDD/ like Pages; 2 files missing on the server -> alt text offline, cache completes on the next online open; next release with one changed picture downloads only that file.
- `drafts/frame.cjs` fills `DVI` from `app/*.jpg` itself.

## List items 6–16 (priority 1), release 2026-11-18

Accepted by the user 17.11 («Да, все 6–16»); scenes/rears per `drafts/ACCEPTED-2026-11-17.txt`, app copies made with the HOW-TO-FRAME commands (scene `scale=1600:1000 -q:v 3`, rear `crop=iw:iw*9/16:0:ih-iw*9/16,hflip,scale=800:450 -q:v 3`) — byte-identical to the files the approved frames were built from; full 1600 px scenes now (no 960 px copies), since frames are pre-rendered files. Built frames match the approved `drafts/q*-framed-*.png` (SSIM 0.991–0.993).
- Q67 item 6, Q97 item 7 (`ry:40`: windshield and driver of the tailgater in the inside mirror), Q176 item 9, Q612 item 10, Q564 item 11, Q132 item 13, Q160 item 15, Q638 C1 item 16.
- Q99 item 8: top view, `DV` option `plain:1` — `dvf()` returns the picture only (1600×1000), the app adds class `pw` (16:10, not cropped).
- Not in this release: Q647 N8 item 12 — reviewer 18.11: the arm hangs relaxed from the elbow, not "hand and arm extended downward" (CGS §14-244); needs a new scene. Q19 (same picture as Q67) — the question is in no topic or pool, so it is not shown in the app; Q139 item 14 — waiting for v3 (turn signal unreadable at 375 px); Q200 (picture of Q132 with truck "A") — Q200 is a hazard-scheme question drawn by `SCN.truckWide`, replacing it needs a separate user decision.
- Short texts in `DVT`, full texts (= the previous app text) and picture notes in `question-texts.json`; progress reset `QV 2026-11-18-img`. A `PDD_FIX` text no longer overwrites a short picture text (Q97). Exam pool unchanged (same 236 ids).
