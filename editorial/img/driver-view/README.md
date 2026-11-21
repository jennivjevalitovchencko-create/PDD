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

## Release 3 (items 12, 17–19), prepared 2026-11-18, not yet published

Accepted by the user 18.11 after the retouch round (`PDD-Images-12-20-Retouch.zip`: emblems removed, Q195 rear with one oncoming lane, Q647 arm straight and extended downward). App copies made with the same HOW-TO-FRAME commands; built frames match the approved `drafts/q*-framed-2.png` (only JPEG noise: PSNR ≈ 38 dB, SSIM 0.979 full size / 0.997 at 400 px — release 2 measured the same way gives 0.982 for Q67).
- Q90 item 17 (`ry:60`: at `ry:0` the inside mirror shows only sky), Q195 item 18, Q196 item 19 (hazard set, multi-answer, not in the exam), Q647 N8 item 12.
- Q90 had a rule-map fix with a top-view scheme (`fixes-3.json`, `img`); `PDD_FIX` now skips `img` for questions in `DV`, so the driver-view picture is not overwritten (`build-fixes.cjs` template synced, also the `DVT` text rule from release 2).
- Q647 text fixes (`editorial/rules/fixes-4.json`, reviewer 18.11): the explanation no longer attributes "левой рукой из окна" to CGS §14-244; natural options of different length (user rule 18.11: never equalize lengths; a wrong option may be the longest); full text "вытянул вниз".
- Progress reset `QV 2026-11-19-img`. Still waiting: Q197 item 20 (scene with the cyclist riding into the open door), Q139 item 14 (v4: larger motorcycle, signal readable on a phone).
- Speedometer fix (user 18.11): the 0…80 marks on `app/dash.jpg` are not evenly spaced, so the old linear needle angle (`133° + speed/80·274°`) was up to ~6° off (15 mph read ~17, 25 read ~27). `dvf()` now interpolates between the measured angles of the marks from the needle pivot: `G=[134.9,164.4,194.7,231.3,271.1,310.6,345.8,376.4,406.7]` (0,10,…,80). All 31 frames re-rendered (all picture URLs change, phones download the set again, ~9 MB). Same formula in `compose-sample.html` and the skill asset.
- Q197 item 20 added (scene v2 18.11: the cyclist rides at the right edge of the lane, the open door is right in her path; rear v2 without emblems), `ry:80`, 15 mph; short text without the old labels (A)/(B).
- Reviewer text fixes accepted by the user 18.11 (`fixes-4.json`): Q195 explanation cites CGS §14-300(c), the hidden-pedestrian point is a tip, option 3 no longer mentions pedestrians on the crosswalk; Q196 explanation without "почти всегда"; Q647 explanation per §14-244 wording; Q90 option 1 "с обеих сторон" (edited in `fixes-3.json`). User rule 18.11: option lengths are NOT equalized — options should differ naturally.

## Release 4 (list items 14, 21–52), prepared 2026-11-19, not yet published

Accepted by the user 18–19.11 (checks per the skill §9–§10: zoom, diff with the previous version, frame with mirrors at 375 px; notes in `drafts/items-*-notes.txt`). App copies made with the HOW-TO-FRAME commands from the accepted versions — byte-identical to the files the approved trial frames were built from (except the letters below); built frames vs. the approved `drafts/q*-framed-N.png`: SSIM 0.986–0.991.
- 22 questions (first 26; Q636, Q635, Q64, Q189 taken out again after the reviewer, see below): Q139 (item 14, v6), Q198 (21), Q199 (22, v3), Q201 (23, v2, top view), Q202 + Q531 (24, v2, same picture), Q203 (25, v2), Q204 (26, v2), Q205 (27, front v2 + rear v1), Q206 (28), Q207 (29), Q208 (30, v2, top view), Q209 (31, v2), Q210 (32, v2), Q214 (35, top view), Q215 (36, low beam lit), Q637 (38, v2), Q68 (40) and Q92 (41) replace their 16:9 pictures of 08.11/13.11, Q300 (47), Q275 (49), Q85 (52). All `ry:80`; speed and turn signals from the «Код:» line of `CHATGPT-TASKS-2026-11-16.md`.
- Letters: options of Q201 (A–D), Q208 (B), Q209 (A, B, C) name objects, so the letters are drawn onto the app copies `app/q201.jpg`, `q208.jpg`, `q209.jpg` (ffmpeg drawtext, Arial Bold 60 px, white box); the accepted originals in `drafts/` stay without letters. Mapping as in the old schemes, except Q209 (picture: A opposite, B left, C right).
- Q637 (approved right-of-way scenario question) and the hazard-set questions show the picture instead of their SVG scheme; the scheme files stay in `editorial/svg`. `tests/integrity.cjs` checks this like Q90.
- Short texts in `DVT` (only what the picture shows is removed; arrival order, «одновременно», «мигает», seconds, 55 mph stay in the text); full texts (= the previous app text) and picture notes in `question-texts.json`; progress reset `QV 2026-11-20-img`. Unused now: `app/q68f.jpg` (old Q68 scene).
- Not in release 4 (embedded in batch 5 after the user decided 21.11): Q212 (item 34) — the accepted picture has the small gap ahead of us and the large gap beside us, so option 3 «…водитель X успеет притормозить» cannot match any labelling (decided 21.11: option 3 rewritten, see Batch 5); Q16 (same picture as Q85) — in no topic or pool, not shown; items 33, 39, 42–44, 50, 51 were embedded in batch 5.
- Reviewer 19.11 (accepted by the user «Да, применяй»): short texts keep facts the phone-size picture does not show (Q139/Q199 turn signal, Q202 «уже на перекрёстке», Q203 police car, Q205 white cane, Q210 signals off, Q637 car close, Q300 «одновременно … без знаков»; wording Q198, Q208, Q209). Taken out until new pictures: Q636 (item 37: the picture is a T-junction, the question says «прямо»), Q635/Q64/Q189 (items 45, 46, 48: the STOP signs for the cross street face us, so all four look like ours). They keep their schemes/texts exactly as before (checked against HEAD).

## Batch 5 (list items 33–112), embedded 2026-11-20/21, to be published together with release 4

Accepted by the user 19–21.11 (checks per the skill §9–§11; notes in `drafts/items-92-112-notes.txt`). Scripts: `drafts/tools-2026-11-20/embed5-manifest.txt`, `embed5-copies.sh`, `embed5.cjs`.
- (`drafts/` is local and untracked.) Also `app/q213f.jpg` is no longer used (Q213 now uses `q213`).
- 21 scenes: Q211 (33), Q65 (39, replaces 08.11), Q213 (42, replaces q213f/q213r), Q294 (43, replaces 08.11), Q298 (50), Q605 (51), Q636 (37, v4, letter A on `app/q636.jpg`), Q634 (44, v3), Q635 (45), Q64 (46), Q189 (48), Q529 (93), Q528 (94), Q527 (95), Q11 (109), Q15 (96), Q18 (97, v3), Q113 (98), Q470 (99), Q646 (111, `ry:200` — at 80 the mirror shows only sky), Q164 (92; a dot artefact under FLASHING removed with `delogo` on the app copy).
- 14 pictures without the dashboard (`plain:1`): sign shapes/colours Q5+Q192, Q8, Q9, Q10, Q12, Q13, Q14, Q6+Q193, Q37+Q331 (W11-2), Q648 (W11-5), and the top view Q212 (34) with letters X (white, ahead), Y (grey), Z (red) on `app/q212.jpg`.
- Text changes with the user's «да» 21.11: Q212 option 3 «Ускориться и войти в промежуток между X и Y: водитель Y успеет притормозить» (the picture has X ahead); Q211 short text without the labels (A)/(B). Reviewer 21.11 (user «да»): short texts Q65 «…налево на зелёный. Встречная машина едет прямо…» and Q213 «…В крайней левой полосе едет машина с мигающим правым поворотником…» (not visible on a phone); Q634 key fixed to option 1 only (`fixes-1.json` m:[0] — the 11.11 option 3 is false), so Q634 joins the exam (237). All other short texts = the current app text.
- Taken out: Q167 (item 100) — the picture has a double yellow while the key says passing carefully is possible; picture fix (broken yellow line) requested.
- Postponed (user 21.11): Q113/Q470 «закон Move Over» wording vs CGS 14-283b (slowing down is required only for emergency vehicles) — separate review after publishing.
- `index.html`: the DVT and DV `forEach` lines now stand after `/*PDD-FIX-END*/` — the sign literals `Q[1]`, `Q[5]`–`Q[14]` below the old place rebuilt those questions and wiped the picture and short text.
- QV mark `2026-11-20-img` (one release with release 4).
