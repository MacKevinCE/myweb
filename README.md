# myweb

A multi-theme portfolio that turns a developer profile into an interactive desktop operating system.

## Overview

Three visual themes, three languages, one portfolio. The main attraction is the OS theme — a fully functional macOS-style desktop built entirely with vanilla TypeScript and CSS. No React, no Vue, no framework overhead. Just a window manager, a dock, a terminal, and 15 draggable windows running in the browser.

The other two themes (Terminal and Liquid Glass) offer alternative ways to browse the same profile data.

## Themes

### OS Theme (Primary)

A macOS-inspired desktop environment. Menubar at the top, dock at the bottom, draggable windows everywhere in between. It boots with a lock screen, auto-opens the About Me and Terminal windows, and lets you explore the portfolio the way you'd navigate a real OS.

**What you get:**

- Draggable, resizable windows with minimize (genie animation), fullscreen, and close
- Z-index stacking that tracks focus like a real window manager
- Cascade positioning so new windows don't pile on top of each other
- Dock with magnification hover effect, auto-hide, and auto-shrink when crowded
- Launchpad grid for launching any app
- App Switcher (Alt+Tab) for cycling between open windows
- Lock screen with clock and unlock interaction
- Notification Center (click the clock) with history, dismiss, and clear all
- 21 unlockable achievements tracked in Game Center
- Keyboard shortcuts for power users
- Three responsive modes: desktop, tablet (Stage Manager), mobile

**The 15 windows:**

| Window | What it does |
|--------|-------------|
| About Me | Profile card — bio, metrics, avatar, CV download |
| Skills | Categorized skill bars with levels |
| Education | Tabbed view of degrees and courses |
| Preview | Certificate gallery with image viewer |
| Contact | Contact form with validation |
| Finder | Column-based file browser (projects, experience, education as folders) |
| Browser | Start page with bookmarks, toolbar with reload/home/open external |
| Terminal | Full terminal emulator with virtual filesystem |
| App Store | Portfolio projects displayed as app cards, categorized |
| Notes | Article reader with a list of technical write-ups |
| Playgrounds | Live code playground with run/output |
| Stickies | Draggable sticky notes you can create and color |
| Speed Test | Real network speed test via Cloudflare |
| Settings | Appearance, wallpaper, dock config, accent color, clock format, accessibility |
| Game Center | Achievement tracker — 21 achievements with progress bars |

### Terminal Theme

Retro CRT aesthetic. Green phosphor text on black, scanlines, flicker. The portfolio renders as terminal output with a boot sequence animation. Route: `/terminal/{lang}`.

### Liquid Glass Theme

Glassmorphism with serif typography, blur effects, and gradient accents. A more traditional scrolling portfolio layout with a modern visual twist. Route: `/liquid-glass/{lang}`.

## Tech Stack

- **Astro 5** — static site generation, zero JS by default, islands where needed
- **TypeScript** — strict mode, no `any` crimes
- **Tailwind CSS 3** — utility classes for layout; custom properties for OS theme tokens
- **GSAP** — genie minimize animation, scroll triggers
- **Vitest + happy-dom** — unit tests for window manager, achievements, terminal, settings
- **ESLint + Prettier** — flat config, astro parser
- **Docker** — dev container with live reload, prod with multi-stage Node + NGINX

## Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── os/                    # 15 window components + desktop chrome
│   │   │   ├── AboutWindow.astro
│   │   │   ├── FinderWindow.astro
│   │   │   ├── TerminalWindow.astro
│   │   │   ├── Dock.astro
│   │   │   ├── MenuBar.astro
│   │   │   ├── LockScreen.astro
│   │   │   └── ...
│   │   ├── terminal/              # Terminal theme components
│   │   ├── liquid-glass/          # Liquid Glass theme components
│   │   └── shared/                # Cross-theme (LanguageSwitch, icons)
│   ├── scripts/os/
│   │   ├── window/                # Window lifecycle, drag, resize, z-index, dock
│   │   ├── terminal/              # Virtual filesystem, commands, tab completion
│   │   ├── finder/                # Column navigation, detail panel, sorting
│   │   ├── settings/              # Appearance, wallpaper, accent, accessibility, persistence
│   │   ├── achievements.ts        # 21-achievement engine with localStorage persistence
│   │   ├── notifications.ts       # Notification center + toast system
│   │   ├── responsive.ts          # Desktop / tablet / mobile mode detection
│   │   ├── shortcuts.ts           # Keyboard shortcut handler
│   │   └── bootstrap.ts           # App initialization entry point
│   ├── styles/os/                 # Design tokens + per-window CSS
│   ├── data/
│   │   ├── os-apps.ts             # Single source of truth: all 18 app definitions
│   │   ├── profile/{en,es,pt}/    # i18n JSON — bio, skills, experience, projects
│   │   └── ui/{os,terminal,liquid-glass,shared}/  # UI string translations
│   ├── pages/os/[lang].astro      # OS theme entry point
│   └── layouts/OsLayout.astro
├── tests/os/                      # Vitest suites (achievements, window, terminal, settings)
├── public/                        # Static assets, wallpapers, favicons
└── docker/                        # Dev + prod Dockerfiles
```

## i18n

Three languages: English, Spanish, Portuguese. Routing follows `/{theme}/{lang}` — for example `/os/en`, `/terminal/es`, `/liquid-glass/pt`.

Profile data lives in `src/data/profile/{en,es,pt}/profile.json`. UI strings (button labels, tooltips, achievement descriptions) are in `src/data/ui/`. The root `/` auto-redirects based on the browser's `Accept-Language` header.

## OS Theme — Deep Dive

### Window Management

Every window is a plain DOM element managed by a custom window engine in `src/scripts/os/window/`. The system handles:

- **Drag** — title bar grab, constrained to viewport, updates state on drop
- **Resize** — eight-handle resize with min/max size constraints per window
- **Minimize** — GSAP genie animation that shrinks the window into its dock icon
- **Fullscreen** — double-click title bar or green button, animates to fill screen
- **Z-index** — focus tracking with a monotonic counter, clicked windows come to front
- **Auto-open** — About Me and Terminal open on boot
- **Cascade** — each new window offsets from the previous to avoid exact overlap
- **Lifecycle** — a reset registry pattern lets each subsystem clean up on window close

### Dock

The dock sits at the bottom with fixed slots (Finder, App Store on the left; Settings on the right) and dynamic slots that appear when you open a window. Features:

- Magnification on hover (fisheye scaling based on cursor distance)
- Auto-hide option (controlled in Settings)
- Auto-shrink when too many icons to fit
- Bounce animation on app launch
- Tooltip with app name on hover

### Achievements (Game Center)

21 achievements tracked via localStorage. Each one fires a notification toast when unlocked. The `completist` meta-achievement unlocks when you get all other 20.

| Icon | Achievement | How to unlock |
|------|------------|---------------|
| `🗺️` | Explorer | Open 10 different windows |
| `💻` | Hacker | Run 5 terminal commands |
| `📖` | Curious | Read 3 different articles |
| `🎨` | Artist | Create 3 sticky notes |
| `⚡` | Speedster | Run a speed test |
| `🌍` | Polyglot | Change the language |
| `⚙️` | Customizer | Change a setting |
| `🧑‍💻` | Dev | Run code in Playgrounds |
| `📬` | Networker | Send a contact message |
| `🗂️` | Archivist | Browse 5 Finder sections |
| `🏅` | Certified | View certifications |
| `🪟` | Mover | Move 3 windows |
| `📐` | Organizer | Double-click 2 title bars |
| `🔴🟠🟢` | Controller | Use all 3 window buttons |
| `🚀` | Launcher | Open Launchpad twice |
| `🎬` | Cinema | Use fullscreen mode |
| `🍎` | Apple | Click the Apple menu |
| `📄` | Recruiter | Download the CV |
| `🔔` | Informed | Open Notification Center |
| `🏠` | Resident | Spend time on the site |
| `🏆` | Completist | Unlock all 20 other achievements |

### Terminal

A full terminal emulator with a virtual filesystem built from the profile JSON data. Directory structure mirrors the portfolio: `~/projects/`, `~/experience/`, `~/skills/`, etc.

**Commands:**

```
help              Show available commands
ls [path]         List directory contents
cat <file>        Display file contents
cd <dir>          Change directory
pwd               Print working directory
whoami            Display user info
clear             Clear terminal
skills [--top N]  Show skills (optionally top N)
experience        List work experience
projects          List portfolio projects
contact           Show contact info
open <target>     Open a window or URL
launch <app>      Launch an app by name
history           Command history
echo <text>       Print text
date              Current date/time
uname -a          System info
neofetch          System info with ASCII art
cowsay [text]     Because why not
ping <host>       Simulated ping
matrix            Matrix rain animation
```

Tab completion works for commands, paths, and app names.

### Notification Center

Click the clock in the menubar to toggle. Notifications appear as toasts in the top-right corner and stack in the center's history. Each notification can link to a specific window (clicking it opens that window). Clear individual notifications or clear all at once.

### Settings

Accessible via the dock, Launchpad, or `Cmd+,`. Organized in tabs:

- **Appearance** — Dark mode, light mode, or auto (follows system)
- **Wallpaper** — Pick from built-in wallpapers
- **Dock** — Size slider, magnification slider, auto-hide toggle
- **Accent color** — Changes the system accent throughout the UI
- **Date & Time** — 12/24 hour clock format, show seconds
- **Language** — Switch between en/es/pt
- **Accessibility** — Font size, reduce motion, high contrast

All preferences persist to localStorage.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + ,` | Open Settings |
| `Cmd/Ctrl + Space` | Toggle Launchpad |
| `Alt + Tab` | App Switcher |

## Development

### With Docker (recommended)

```bash
# Development — live reload on http://localhost:4321
docker compose up dev

# Production — optimized NGINX on http://localhost:8080
docker compose up --build -d prod
```

### Without Docker

```bash
cd app
pnpm install
pnpm dev          # http://localhost:4321
```

### Testing

```bash
cd app
pnpm test              # run once
pnpm test:watch        # watch mode
```

Tests use Vitest with happy-dom. Test suites cover the window manager, achievements engine, terminal filesystem/commands, settings persistence, notifications, and utility functions.

### Building

```bash
cd app
pnpm build        # runs astro check + astro build → outputs to dist/
```

### Linting & Formatting

```bash
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
pnpm format       # Prettier
pnpm format:check # Check only
```

## Architecture Decisions

- **Vanilla TypeScript over React/Vue** — The OS theme is a single-page desktop that needs precise control over DOM manipulation, z-index stacking, drag coordinates, and animation timing. A virtual DOM would add overhead without real benefit. Every window is server-rendered by Astro, then enhanced with targeted TS.

- **CSS custom properties over Tailwind for OS components** — The OS theme uses a design token system (`--os-accent`, `--os-bg-*`, `--os-text-*`) that supports dynamic theming (dark/light/accent switching) at runtime. Tailwind handles layout; custom properties handle the visual identity.

- **Reset registry for window lifecycle** — Each subsystem (drag, resize, achievements, etc.) registers a cleanup function. When a window closes or the page transitions, all registered teardown runs in order. Prevents memory leaks without tight coupling.

- **Lazy initialization for achievements** — The engine only touches localStorage on first interaction, not on page load. Keeps boot fast and avoids blocking the main thread for users who never trigger an achievement.

- **Single app registry** — `os-apps.ts` is the single source of truth for all 18 app definitions. Dock, desktop icons, launchpad, menubar, and window configs all derive from the same array. Add an app in one place, it shows up everywhere.

## Docker Details

### Development

Mounts `./app` into the container. `node_modules` stays in a named volume (no host pollution). Port 4321.

### Production

Multi-stage build: Node 22 Alpine installs deps and runs `pnpm build`, then copies `dist/` into NGINX Alpine. Port 8080.

```bash
# Stop
docker compose down

# Stop + remove volumes
docker compose down -v

# Full cleanup
docker compose down -v --rmi all
```

## Requirements

- **Docker >= 24** + **Docker Compose >= 2.15** (Docker workflow)
- **Node >= 22** + **pnpm** (local workflow)

## License

MIT
