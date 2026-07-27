# PMSM alternatives

An interactive Takshashila issue brief on electric motor alternatives to rare-earth permanent magnet synchronous motors.

The page explains the motor from first principles, then compares wound-field, induction and reluctance architectures alongside ferrite and emerging iron-nitride magnets. The interactive SVG diagrams are explanatory. Commercial claims are separated from current production evidence.

## Run locally

The site has no build step and no runtime dependencies. Run it through a local HTTP server:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Structure

- `index.html` contains the single-page brief and source ledger.
- `styles.css` contains the visual system and responsive states.
- `js/app.js` controls the motor assembly, field model, architecture comparison, loss map and responsive navigation.
- `assets/` contains the shared Takshashila logo and favicon.

GitHub Actions publishes `main` to GitHub Pages.
