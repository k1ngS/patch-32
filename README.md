# ⚡ PATCH_32 // KERNEL UNDER SIEGE

`PATCH_32` is a dark, minimalist **Cybernetic Immune System Simulator** built as a strategic hybrid between automation and incremental gameplay. Instead of manual tactical inputs, the player acts as a system administrator managing an infrastructure under acute stress. Monitor data saturation, deploy autonomous security patches, and prevent a catastrophic kernel breach.

Developed entirely from scratch for a Game Jam using a strict **Separation of Concerns (SoC)** architecture.

---

## 🕹️ Gameplay & Core Loop

The operating system is experiencing an aggressive corruption injection from its perimeter nodes. Your objective is to keep the system online.

*   **Autonomous Containment:** Deploy Emitter Nodes onto clean memory grids. Nodes automatically scan the matrix using Manhattan Distance and fire neon energy streams to induce explosive chain reactions on corruption clusters.
*   **Tactical Overclocking:** Force an emergency core overclock (Shift key) to double emitter fire rates. Beware of the **Thermal Throttle** penalty—overusing it will cause cores to superheat and suffer a severe 50% fire rate penalty for 4 seconds.
*   **Grid Saturation:** The Core health is tied to the environment. If data corruption infects more than 40% of the active matrix, the system begins to decay linearly. At 70% saturation, the Core suffers exponential degradation.
*   **Progression Sectors:** Survive three distinct infrastructure shifts: **Root** (initial breach containment), **Cache** (permanent dead memory allocations creating spatial maze constraints), and **Gateway** (the final multivariate attack velocity).

---

## 🛠️ Tech Stack & Architecture

This project was intentionally built without external gaming frameworks, engines, or heavy post-processing libraries to ensure clean, readable, and highly maintainable backend code.

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript (Strict type checking)
*   **Styling:** Tailwind CSS (Rigid Viewport Hull Layout)
*   **Graphics Engine:** Pure, stateless HTML5 Canvas 2D running at a locked 60 FPS
*   **State Management:** Zustand (Decoupled game engine ticks and logic hooks)

### Key Performance & Game Feel Enhancements:
*   **Trauma-Driven Cam Shake:** Screen shake intensity scales exponentially using a `Trauma²` model, safely wrapped within isolated `ctx.save()` / `ctx.restore()` boundaries so peripheral UI menus remain absolutely fixed.
*   **Hit-Stop Impact Lag:** When massive chain purges occur, the delta time engine pauses processing for 4 frames to give the player a physical sensation of destructive impact.
*   **Dynamic Telmetry:** Horizontal modular scanlines shift their chromatic rendering scale based on the system's infection percentage.

---

## 🚀 Getting Started

To run the simulation environment locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/k1ngS/patch-32](https://github.com/k1ngS/patch-32)
   cd patch-32
   ```

2. **Install the dependencies:**
    ```bash
    npm install

    ```


3. **Run the local development server:**
    ```bash
    npm run dev

    ```


4. **Compile and Type-Check:**
    ```bash
    npx tsc --noEmit

    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to witness the simulation.

---

## ⚙️ Project Structure Overview

```text
src/
├── app/                  # Next.js page layout and global dashboard css
├── components/           # UI Chrome, Matrix Upgrades, and the main GridCanvas maestro loop
├── constants/            # Pure configuration engines, pricing metrics, and grids
├── store/                # Zustand core game tick calculations and automated state machine
├── types/                # System architectures and type interfaces
└── utils/
    ├── audio/            # Core browser native Web Audio API managers
    └── renderers/        # Stateless pure drawing utilities (parasites, grids, cores)

```

---

Developed by **Marcos k1ngS** as a showcase of clean frontend architecture and performance engineering.
