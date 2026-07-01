# Design Guidelines & System Token Documentation

This document serves as the design registry for the **Engineering Knowledge Base** to maintain visual consistency across components, sidebars, and document views.

---

## 🎨 Theme Colors & Branding

The website utilizes a deep dark mode design (with a clean light mode fallback). The primary brand color is **Neon/Mint Green**, matching the main dashboard layout.

### 1. Color Palette Tokens

| Token Name | Hex Value | Purpose / Usage |
| :--- | :--- | :--- |
| `page-bg-dark` | `#090b14` | The overall canvas and body background color. |
| `sidebar-bg-dark` | `#0c0e17` | Sidebar background (creates floating contrast over page background). |
| `brand-green` | `#4ade80` | Primary accent color. Used for active link highlights, hover glows, and status cues. |
| `brand-green-rgb` | `74, 222, 128` | RGB representation for dynamic translucent background alpha channels. |
| `border-dark` | `rgba(255, 255, 255, 0.05)` | Subtle borders on cards, headers, and container limits. |
| `text-muted-dark` | `#8f9cae` | Inactive links, side-labels, and non-essential text. |

---

## 🛠️ Sidebar Design Specifications

The sidebar is built as a fully custom desktop React layout ([CustomSidebarDesktop.tsx](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/theme/DocSidebar/CustomSidebarDesktop.tsx)).

### 1. Core Structure
- **Floating Layout**: The sidebar is styled with an outer margin (`margin: 16px`), rounded corners (`border-radius: 20px`), and floats beside the main canvas.
- **Glassmorphic Shadows**: Contrasts with the canvas using `box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5)`.
- **Sticky Positioning**: Remains sticky on scroll relative to the main navbar using `position: sticky !important` and `top: calc(var(--ifm-navbar-height) + 16px) !important`. Height is bounded by `calc(100vh - var(--ifm-navbar-height) - 32px) !important` to ensure full screen visibility without overlapping the top header.

### 2. State Metrics & Specificity overrides

| Metric State | Width | Content Margin Offset | Behavior |
| :--- | :--- | :--- | :--- |
| **Expanded** | Dynamic (default `300px`) | Matching dynamic width | Shows category names, carets, labels, and horizontal socials at bottom. |
| **Collapsed** | `60px` | `60px` | Triggers via high-specificity ID negation selector `[class*='docSidebarContainerHidden']:not(#\#_AOxo):not(#\#_AOxo)`. Hides carets and text labels, rendering only the emojis. |

### 3. Drag-and-Drop Resizable Sidebar
- **Mechanism**: The left desktop sidebar implements interactive resizing using React mouse events (`onMouseDown`, `mousemove`, `mouseup`).
- **Resize Handle**: A 6px transparent overlay element (`.custom-sidebar-resize-handle`) is positioned on the right edge of the sidebar. When hovered or dragged, it lights up in brand green (`var(--brand-green)`) with an active neon glow.
- **Constraints**: Resizing width is clamped between `200px` (min) and `480px` (max) using the client X coordinate minus offset margins.
- **Visual Smoothness**: While active resizing is in progress, a class `.resizing-sidebar` is appended to the `body` which disables text selections (`user-select: none !important`) and disables layout transition delays (`transition: none !important`) across all child elements to ensure 60fps tracking.
- **State Persistence**: The dynamic width is written directly to the document root element's styling variable (`--doc-sidebar-width`) and saved to `localStorage` under the key `'sidebar-width'` to persist across page refreshes and route navigations.

---

## 🚀 Navigation & Link Highlight States

### 1. Active Navigation Pill & Hierarchy
- **Normal Menu Link**: `font-weight: 500; font-size: 0.9rem; padding: 10px 14px; margin: 4px 12px;`
- **Active Expanded Pill**:
  - Background: `rgba(74, 222, 128, 0.12) !important;`
  - Color: `var(--brand-green) !important;` (Neon Green)
  - Border: `1px solid rgba(74, 222, 128, 0.25) !important;`
  - Shadow: `box-shadow: 0 4px 20px rgba(74, 222, 128, 0.2) !important;`
- **Active Collapsed Circle**:
  - Dimensions: `44px x 44px` centered.
  - Same color, border, and glow parameters as the active expanded pill to maintain design identity.
- **Nested Child Pages Hierarchy**:
  - Indentation: Indented container wrapper (`margin-left: 28px !important`) to match parent's icon center.
  - Guide lines: Vertical dashed guide line (`border-left: 1px dashed rgba(255, 255, 255, 0.08) !important`) running down children blocks to map directory nesting.
  - Scale & size: Child links have slightly compressed sizing (`padding: 8px 12px`, `font-size: 0.85rem`) to contrast hierarchy.
  - Bullet helper: Uses a dynamic bullet prefix `•` (`::before` selector) that shifts highlight color to brand green on hover or active states.

### 2. Premium Search Glow Orbit & Highlight Animations
- **Search Orbit Effects**: The navbar search box container (`.navbar__search`) features animated radial glowing pseudo-elements (`::before` and `::after`) that spin in orbit with keyframes (`search-travel`). Hovering or focusing transitions the orb opacity to visible, and active input focus accelerates the orbit speed.
- **SVG Distortion Filter**: A squiggly distortion filter (`#search-squiggle`) utilizing SVG `<feTurbulence>` (noise with animated frequency shifts over `8s`) and `<feDisplacementMap>` is attached to the search input border to create a liquid organic hand-drawn glow.
- **Autocomplete Result Highlights**: In-dropdown suggestion lists style highlighted matches (`mark` tag) in high contrast brand green (`#4ade80` for dark mode, `#2f8f4e` for light mode). Inactive and helper metadata (such as hierarchy trees and hit paths) are styled in `#94a3b8` / `#64748b`. The active cursor suggestion shifts `4px` to the right (`transform: translateX(4px)`) and gains a left colored border and shadow glow.

---

## 📝 Guidelines for Future Styling Additions
- Always reference `--brand-green` (`#4ade80`) for accents instead of raw hex values to support color variations.
- Custom CSS should be appended to [custom.css](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/css/custom.css).
- For components that render conditionally depending on the sidebar state, inspect the `isHidden` desktop prop or check if `.collapsed` / `[class*='sidebarCollapsed']` class is present in the parent container.

---

## 📊 Stylish Table Specifications

Markdown tables are overridden globally to render as stylish, rounded card elements.

- **Structure**: Rounded corners (`border-radius: 14px`) using `border-collapse: separate` and `border-spacing: 0` to preserve corner masks.
- **Dark Mode Card**:
  - Background: `#0f121d` (Header), alternating translucent rows (`rgba(255, 255, 255, 0.015)`).
  - Cell padding: `12px 16px` for comfortable scanning.
  - Border: `1px solid rgba(255, 255, 255, 0.06)` with a soft drop shadow.
  - Header highlighting: green header underline (`border-bottom: 2px solid rgba(74, 222, 128, 0.25)`) and brand green text color.
- **Row Hovers**: Transition duration `0.2s` with neon green overlay backdrop: `background: rgba(74, 222, 128, 0.06)`.

---

## 💻 Code Block Accent Guidelines

Code block layout styles are matched with the brand green theme accents.

- **Borders & Shadows**:
  - Code block containers, code editors, and title bars are customized to match the table card design (`border-radius: 12px`, background `#0c0e17`, border `1px solid rgba(255, 255, 255, 0.08)`, and shadow `0 8px 32px rgba(0, 0, 0, 0.25)`).
  - Title bars (e.g. file names) render with `#0f121d` backgrounds, green headers, and round on top: `border-radius: 12px 12px 0 0 !important`.
- **Inline Code Blocks**:
  - Styled with theme-aware `color: var(--brand-green) !important;` to ensure inline symbols match primary green accents.

---

## 🎨 Diagram Styling Guidelines (Mermaid)

Mermaid diagrams are rendered within a custom interactive wrapper ([Mermaid/index.tsx](file:///Users/lukhuong/Desktop/docusaurus-knowledge-base-template/src/theme/Mermaid/index.tsx)) that matches the site's premium design systems:
- **Interactive Controls Toolbar**: Floating controls overlay features buttons to Zoom In (`➕`), Zoom Out (`➖`), Reset View (`🔄`), and Toggle Fullscreen (`🖥️`/`📴`).
- **Interactive Panning & Zooming**: Supports dragging to pan the diagram (`grabbing` cursor) and scale adjustment via toolbar. Supports mouse drag handlers as well as touch handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) for fluid zooming/panning on mobile screens.
- **Fullscreen Overlay**: Toggling fullscreen enters a high-contrast viewport backdrop overlay with comfortable space and orbital background grid meshes.
- **Styling Card**: Rendered inside a card container with a `#0c0e17` background (`#ffffff` in light mode), `border: 1px solid rgba(255, 255, 255, 0.08)`, `border-radius: 12px`, and a soft drop shadow (`0 8px 32px rgba(0, 0, 0, 0.25)`), with a radial grid point canvas background texture.
- **Custom Theme Overrides**:
  - **Subgraphs / Cluster Boxes**: Styled with a deep translucent fill `rgba(13, 17, 26, 0.6)`, and custom borders (`rgba(74, 222, 128, 0.2)`) with rounded corners.
  - **Nodes**: Rendered with `#161f30` fill, cyan outline borders (`#2dd4bf`), and transition to glowing neon green on hover. Node text labels are styled in `#e2e8f0`.
  - **Edges / Connections**: Colored indigo (`#818cf8`) and transition to purple (`#a855f7`) with custom thickness on hover.
  - **Light Theme**: Automatically falls back to clean green outlines, white fills, and soft gray subgraphs with matching shadows.

---

## 🌌 Cosmic Space Aesthetics (Dark Mode)

To provide an immersive dark mode theme without causing visual distractions during reading:

### 1. Parallax Starry Background
- **Stars Wrapper**: Appended to `.main-wrapper` using pseudo-elements `::before` and `::after` with custom `radial-gradient` vectors.
- **Multilayered Twinkle**: Tiny and medium stars pulse at alternating rates (`starTwinkleOne` [6s] and `starTwinkleTwo` [9s]) to simulate real starfields.
- **Reading Mask**: The main text reader block `.docMainContainer` is forced to a solid color `#090b14` with a blurred perimeter shadow (`box-shadow: -30px 0 60px rgba(9, 11, 20, 0.95), 30px 0 60px ...`). 

### 2. Animated Space Navbar & Moon Elements
- **Floating Planet Core**: Rendered at `left: 26%` in the navbar background as a green core (`#4ade80` to `#1b5e20` radial core) floating slowly: `animation: planetFloat 8s ease-in-out infinite alternate`.
- **Planet Ring**: An orbital ring (`rgba(74, 222, 128, 0.4)`) rotates and stretches in tandem: `animation: ringFloat 8s ease-in-out infinite alternate`.
- **Brand Rocket**: A `🚀` emoji is appended to `.navbar__brand::after` and flies with custom translation, tilt, and scaling transitions: `animation: rocketFlight 4s ease-in-out infinite`.
- **Floating Moon (`🌙`)**: Appended as `.moon` in the left background margin and `.header-moon-h` in the navbar header, floating slowly.

---

## 🍃 Nature & Garden Aesthetics (Light Mode)

In light mode, all cosmic space elements are hidden, and the site shifts to a serene natural theme:
- **Golden Sun**: Floating sun orb (`.sun` and `.header-sun`) styled with a radial orange gradient and warm glow positioned in the left background margin and navbar.
- **Floating Leaves & Flowers**: Drifting green/maple leaves (`🍃`, `🍁`) and cherry/yellow blossoms (`🌸`, `🌼`, `🌷`) sway down the background margins (`.nature-item`) and navbar header.
- **Swaying Leaves Wallpaper**: Appended to `.main-wrapper::before` and `::after` as repeating SVG leaf/blossom patterns swaying slowly in opposite directions to represent organic breezes.

---

## 🛡️ Sidebar-Only Background Masking

To ensure zero reading distractions across the main content area in both themes:
- A linear gradient CSS mask (`mask-image` / `-webkit-mask-image`) is applied to `.main-wrapper::before` and `::after`.
- The background stars (dark mode) and background leaves/flowers (light mode) render only in the left and right margins (`0% to 18%` and `82% to 100%` viewport width) and are completely masked out in the middle reading area (`22% to 78%`).

---

## 🎨 Secondary Accent & Dimmer Light Theme

### 1. Cosmic Purple Accent (`--brand-purple`)
- **Tokens**: `--brand-purple: #a855f7` in dark mode and `#7c3aed` in light mode.
- **Usage**:
  * **Dividers**: Used for all article section subheadings (`.markdown h2`) and table header cells (`.markdown table th` and underlines).
  * **Card Titles**: Default color for category cards (`.card h2`) and pagination nav buttons (`.pagination-nav__label`), transitioning to brand green on hover.
  * **Neon Glow Borders**: Combined with brand green in card outline gradients (`--neon-border-gradient`) to shift between green, purple, and cyan.

### 2. Dimmer Light Theme
- **Background**: Overrode the default white background with a softer slate gray (`#f1f5f9` / `--ifm-background-color`).
- **Surface Elevation**: Placed pure white cards (`#ffffff` / `--ifm-background-surface-color`) for sidebars, TOC, and content boxes on top of the gray canvas to create a modern card-on-surface layout.

### 3. Sidebar Page Link Ellipsis
- **Label Truncation**: Applied `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` to sidebar menu labels to prevent long page titles from wrapping.
- **Tooltip Hover**: Added `title={cleanLabel}` bindings to show full page titles on hover.

---

## 🧭 Sticky Double Sidebar Layout

For comfortable navigation across very long document pages:
- **Left Sidebar**: Remains sticky relative to the navbar (`top: calc(var(--ifm-navbar-height) + 16px)`), constrained to viewport height (`height: calc(100vh - var(--ifm-navbar-height) - 32px)`), and scrolls internally (`overflow-y: auto`).
- **Right Sidebar (Table of Contents)**: Overridden to render as a floating slate card mirroring the left sidebar card block (`#0c0e17` background, `border: 1px solid rgba(255, 255, 255, 0.05)`, `border-radius: 20px`, `box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5)`). Sits sticky at `top: calc(var(--ifm-navbar-height) + 16px)`, bounds its height to `max-height: calc(100vh - var(--ifm-navbar-height) - 32px)`, and scrolls internally via custom webkit scrollbars.
  * TOC Links: Styled as rounded pills (`border-radius: 8px`) that transition to brand green (`var(--brand-green)`) on hover and active states.
  * Nested Subheadings (H3+): Indented slightly (`padding-left: 1.5rem`) inside the card to visually map document structure.
  * Left border line: Docusaurus's default left timeline border is disabled (`border-left: none !important`) to keep the floating card outline clean.
