---
name: KM100 Skills and Training Center Portal
description: Grounded industrial access control and staff credential system for KM100 Skills and Training Center, Inc.
colors:
  brand-orange: "#ea580c" # KM100 Brand Orange (Primary Action)
  brand-orange-hover: "#c2410c"
  brand-orange-light: "#fb923c"
  charcoal-950: "#0d0f12" # Deep Canvas
  charcoal-900: "#16191e" # Card Surface
  charcoal-800: "#222730" # Borders & Dividers
  charcoal-700: "#333945" # Muted Borders
  text-white: "#ffffff"
  text-slate-200: "#e2e8f0"
  text-slate-400: "#94a3b8"
  state-granted: "#16a34a" # Valid Entry Emerald
  state-denied: "#dc2626" # Access Denied Red
  state-warning: "#d97706" # Cooldown / On-Leave Amber
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-brand:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-charcoal:
    backgroundColor: "{colors.charcoal-800}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
---

## Overview

The design system for **KM100 Skills and Training Center, Inc.** is inspired directly by the organization's official emblem: bold KM100 Safety Orange paired with industrial charcoal and crisp white. It prioritizes clarity, fast task completion, and outdoor legibility over decorative trends.

## Colors

- **Brand Orange (`#ea580c` / `#f37321`):** Applied purposefully to primary identity headers, registration buttons, active badges, and navigation emphasis.
- **Industrial Charcoal Canvas (`#0d0f12`):** Grounded matte background that avoids glossy purple/cyan hues and reduces eye strain in dark gate booths.
- **Card Surface (`#16191e` with border `#222730`):** Solid, opaque surfaces with tactile border contrast. No translucent blur slop.
- **Operational Verification Colors:**
  - Access Granted: Solid verified green (`#16a34a`)
  - Access Denied: Authoritative crimson (`#dc2626`)
  - Warning / Cooldown: Clear warning amber (`#d97706`)

## Typography

- **Headings & Badges:** Bold and Extrabold sans-serif with tight tracking (`tracking-tight`), uppercase micro-labels for gate protocols.
- **Codes & Security Tokens:** Monospace (`font-mono`) with clear character distinction for `KM100-XXX` identification codes.

## Realism & Anti-AI Guidelines

- **Real Emblem:** The official circular **KM100 Skills and Training Center, Inc.** logo is placed prominently on the header and on physical CR80 cards.
- **No Decorative AI Fluff:** No purple/cyan glowing gradient spheres, no floating glassmorphic cards, no gratuitous particle halos.
- **Physical Credential Fidelity:** The CR80 staff card models a real institutional badge with security microprint, chip contact simulation, lanyard slot, official organization subtitle, and high-DPI QR code.
- **Tactile Touch Targets:** All touch targets on mobile viewports are sized to 44px minimum for glove-friendly, rapid tapping by campus gate officers.
