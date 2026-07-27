# PMSM alternatives

An interactive Takshashila issue brief on electric motor alternatives to rare-earth permanent magnet synchronous motors.

The page explains the shared physics first, then compares wound-field, induction, reluctance, ferrite and emerging iron nitride routes. Its Canvas models are explanatory. Company performance figures stay attributed to their publishers.

## Run locally

The site has no build step and no runtime dependencies. ES modules need an HTTP server:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Structure

- `index.html` contains the single-page brief and source ledger.
- `styles.css` contains the visual system and responsive states.
- `js/data.js` keeps motor evidence and comparison inputs separate from rendering.
- `js/motor-lab.js` draws the touch-controlled motor cross-section.
- `js/visual-labs.js` draws the drive cycle, technology field and material streams.
- `js/app.js` connects the page controls, themes and accessibility states.

GitHub Actions publishes `main` to GitHub Pages.
