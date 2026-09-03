# Pulsebit Website Prototype

Static marketing website prototype for Pulsebit (Pty) Ltd. The site presents Pulsebit as a boutique digital agency with two clear paths:

- Agency: digital marketing strategy, creative campaigns, content and performance marketing.
- Lab: custom software development, web applications, APIs, business automation and systems integration.

## Project Structure

```text
.
|-- index.html              # Root Pulse landing page
|-- agency.html             # Redirect stub for old flat URL
|-- lab.html                # Redirect stub for old flat URL
|-- privacy.html            # Redirect stub for old flat URL
|-- terms.html              # Redirect stub for old flat URL
|-- work-with-us.html       # Redirect stub for old flat URL
|-- pages/                  # Supporting website pages
|   |-- agency.html
|   |-- lab.html
|   |-- privacy.html
|   |-- terms.html
|   `-- work-with-us.html
|-- css/
|   `-- styles.css          # Visual styling, layout, responsive rules and animations
|-- js/
|   `-- script.js           # Navigation, transitions, interactive Lab console and games
`-- assets/
    |-- pulsebitlogo.png
    `-- puzzles/            # Logo variants used by the sliding puzzle game
```

## How To Open

Open `index.html` in a browser. From there, all pages should be reachable through the landing page, hamburger menu or floating navigation dock.

For the best local testing experience, run a tiny static server from the project folder:

```bash
npx serve .
```

## Notes For GitHub

- This is a static prototype: no build step is required.
- External videos and placeholder images on the Agency page currently load from remote URLs.
- The Lab mini-games store any local leaderboard data in the visitor's browser local storage.
- Query strings on CSS/JS links are cache-busting version labels only.

## Main Interactive Areas

- Split landing page: `index.html`
- Draggable navigation dock: `js/script.js`
- Software Build Console: `pages/lab.html` and `js/script.js`
- Pulsebit Switch sliding puzzle: `pages/lab.html` and `js/script.js`
- Pulse-Maze arcade game: `pages/lab.html` and `js/script.js`
