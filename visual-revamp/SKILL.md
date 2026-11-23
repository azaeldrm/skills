---
name: visual-revamp
description: Start a visual revamp of an app from the user's inspiration images and/or
  logo. Settle the style as HTML mockups with screenshots before reading any code, then
  the logo and icon set, then hand off to explore-effort. Use when the user says "visual
  revamp", "redesign the UI", "new style for <app>", or attaches wallpapers, inspiration
  images or a logo and asks for a look.
---

# Visual revamp

We're starting a new story for a visual revamp of the entirety of the app. Decide the
style first. **Don't read the app's code yet.** Code gets read once the user approves a
direction and moves to `/explore-effort`.

## Inputs

- **Images the user attached:** wallpapers, inspiration images, a logo or a sketch.
  They are the source for the look. Build the whole suite from them: components,
  style, fonts, color palette, textures and motion.
  - If a logo is attached, treat it as the anchor.
  - The inspiration images set the mood, palette and texture, and they take precedence
    over any style the user names in words.
  - If an image didn't come through, or the inputs conflict, say so and ask before
    building.
- **Product context:** use only the README and the Knowledge Base (CORE.md and the
  KB folder) to learn what the app is, who uses it, and which screens matter most.
  Don't read source code.

## 1. Read the images and propose a direction

Before building anything, tell the user:
- what you see in the images: palette, texture, era, mood, motifs
- the direction you propose, with a short name, and why it fits this product
- where the direction departs from anything the user suggested, and why

## 2. Build the style in HTML

Put everything under a gitignored `.local/design/<effort>/`. Every item comes in every
theme the product supports (for example light, dark, e-ink or high contrast). Use the
user's images as wallpapers or backgrounds where they work, keeping text contrast intact
over them.

Build one page with two sections:

- **UX:** the app's screens and flows, animated. Each flow plays from one state to the
  next the way the real app would, so the user sees it behave rather than reading a
  description of it. Build them with the bundled player, not a new animation system:
  copy `assets/ux-flow.js` and `assets/ux-flow.css` next to the page and write each
  flow as its views plus a steps script. The usage and step ops are at the top of
  `ux-flow.js`, and `assets/example.html` is a working page with both sections to
  start from.
- **Design system:** the product's aesthetics: color tokens, typography, components,
  icons and imagery.

Host the page at a URL the user can open from another machine. Check your own output
and fix problems before showing it.

## 3. Iterate

Show the mockups and iterate with the user before moving on. Keep each round's changes
scoped to what they asked for, re-take the affected screenshots, and say what changed.

## 4. Logo / mark

Settle the logo the same way, after the direction holds.
- If the user brings a logo or sketch, build from it, and say honestly whether it beats
  any mark you proposed.
- Offer a few variants and show them at real sizes, including the smallest. Add a
  simplified version if detail breaks down when small.
- Compare finalists in place on real screens (sign-in, navigation, app icon), side by
  side, then put the chosen one into the style guide.

## 5. Icons and illustrations

Once the direction and the logo are approved, build the app's icon set in the same
visual language. Nothing here fixes their shape or style; derive that from the
direction.
- Cover the app's core actions, states and concepts: navigation, modes, empty and
  offline states, and anything that is "the app's character" (an assistant, an
  activity indicator).
- Add motion only where it says something (playing, thinking, speaking, loading),
  respect reduced-motion and no-animation themes, and keep motion cheap on mobile.
- Show each icon in context in the UX section, and put the full set in the Design
  system section. Expect several rounds of small corrections on individual icons.

## 6. Hand off

When the user approves, summarize the direction, palette, type, logo and icon decisions,
along with the locations of the mockups. Save them to memory. Then suggest
`/explore-effort` to turn the approved style into a story. That's where code reading
starts.
