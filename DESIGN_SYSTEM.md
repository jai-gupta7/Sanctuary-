# Shared Living OS Design System

## Purpose

This document defines the visual and interaction system for `Shared Living OS` so future pages, flows, and components feel like one product instead of disconnected screens.

The current product stage is:

- vision-first
- trust-led
- app-inspired
- modern, bright, and structured

This is not a luxury editorial system and not a playful marketplace aesthetic. The product should feel:

- reliable
- clear
- contemporary
- urban
- helpful
- calm under pressure

## Brand Intent

Shared Living OS helps users navigate a stressful life decision:

- finding the right people
- evaluating fit
- reducing trust risk
- moving in with less chaos

Because of that, the interface should communicate:

1. clarity before cleverness
2. trust before excitement
3. structure before density
4. confidence without coldness

## Core Experience Principles

### 1. Trust-first

Every important screen should visibly communicate legitimacy and clarity.

Use:

- verified states
- explicit labels
- understandable status signals
- visible next steps

Avoid:

- vague calls to action
- fake urgency
- decorative ambiguity

### 2. App-first

The product should feel like a real platform, not a brochure site.

Use:

- product-shaped cards
- dashboard patterns
- structured content blocks
- clear action zones

Avoid:

- oversized marketing sections with no utility
- purely ornamental illustrations without product meaning

### 3. Calm decision support

Users may arrive stressed, rushed, or uncertain. The design should lower tension.

Use:

- clean spacing
- obvious hierarchy
- short labels
- readable cards
- guided sections

Avoid:

- clutter
- noisy animation
- dense walls of text

## Visual Direction

### Theme

The active direction is:

- bright base
- blue-led trust palette
- teal support accent
- warm secondary accent for urgency or market energy

The page should feel like:

- a modern consumer product
- a structured housing tool
- a trustworthy app interface

Not like:

- a dark fintech dashboard
- a generic SaaS template
- a pastel lifestyle brand

## Color System

### Core Tokens

Use these as the primary design tokens:

```css
--bg: #f3f7ff;
--surface: #ffffff;
--surface-alt: #eef4ff;
--surface-strong: #0f172a;
--text: #14213a;
--muted: #5c6b87;
--line: #d7e2f5;
--primary: #2563eb;
--primary-strong: #1748b3;
--accent: #14b8a6;
--warm: #ff7a59;
```

### Color Roles

- `--bg`: page background
- `--surface`: primary cards and containers
- `--surface-alt`: secondary surfaces and inset blocks
- `--surface-strong`: dark emphasis background, sparingly used
- `--text`: main text color
- `--muted`: secondary text color
- `--line`: borders and separators
- `--primary`: main action and brand trust color
- `--primary-strong`: hover or pressed primary state
- `--accent`: supportive highlight for fit, success, compatibility
- `--warm`: human and city-energy accent, used sparingly

### Usage Rules

- Blue is the main trust and action color.
- Teal is for positive guidance, fit, and supportive emphasis.
- Warm orange is for selective emphasis, not for primary UI dominance.
- Backgrounds should remain bright and breathable.
- Text contrast should stay high and readable.

## Typography

### Font Pairing

Use:

- `Urbanist` for display headings
- `Sora` for body text and UI text

### Typographic Roles

- `Urbanist`: hero headlines, section headings, major emphasis
- `Sora`: paragraphs, buttons, cards, labels, navigation

### Typography Principles

- Headings should feel modern and energetic.
- Body text should feel precise and calm.
- Avoid over-styling subtext.
- Keep line lengths reasonably short for decision-making contexts.

### Heading Scale

Recommended hierarchy:

- Hero H1: `clamp(3rem, 9vw, 6rem)`
- Section H2: `clamp(2.2rem, 5vw, 4rem)`
- Card H3: around `1.2rem`

### Body Scale

- Primary paragraph: `1rem` to `1.05rem`
- Supporting text: `0.9rem` to `0.95rem`
- Eyebrow/meta labels: `0.75rem`

## Layout System

### Grid Philosophy

Use clean, structured layouts with obvious grouping.

Default content width:

- `min(1200px, calc(100% - 1.5rem))` on mobile/base
- `min(1240px, calc(100% - 3rem))` on larger screens

### Section Rhythm

Standard section spacing:

```css
padding: 4rem 0;
```

This should be the default rhythm across product marketing and key onboarding surfaces.

### Containers

Main page blocks should use:

- strong horizontal consistency
- modest vertical breathing room
- visible grouping between sections

## Surface System

### Card Language

Cards are a foundational visual pattern.

Use cards for:

- features
- city blocks
- metrics
- testimonials or trust statements
- dashboard previews
- onboarding or step content

### Card Styling

Default card style:

```css
background: var(--surface);
border: 1px solid var(--line);
box-shadow: 0 24px 60px rgba(37, 99, 235, 0.12);
```

### Radii

Use:

- large containers: `32px`
- standard cards: `22px`
- small badges and chips: pill or `14px` equivalent

### Elevation Rules

- Use soft elevation, not heavy floating glassmorphism.
- Shadows should suggest polish, not fantasy.
- Keep surfaces crisp and product-like.

## Button System

### Primary Button

Used for:

- main forward action
- highest-priority step in a section

Style:

- filled blue gradient
- white text
- rounded pill shape

### Secondary Button

Used for:

- alternate path
- lower-priority action
- product exploration

Style:

- white or translucent light surface
- border using `--line`
- dark text

### Tertiary Button

Used for:

- lightweight secondary action
- navigation within page sections

Style:

- transparent or subtle background
- bordered
- visually quieter than primary

### Button Rules

- Never present two visually identical primary actions side by side.
- Every section should have one obvious main action.
- Button labels should be concrete and stage-appropriate.

For current vision-stage pages, prefer:

- `Explore the Vision`
- `View Product Pillars`
- `See How It Works`

For MVP-stage pages, prefer:

- `Find Flatmates`
- `Explore Listings`
- `List Your Room`
- `Create Profile`

## Badge and Chip System

Use chips to quickly communicate:

- verification
- city focus
- urgency
- stage
- match quality
- product category

Chip rules:

- Keep them compact
- Use clear color meaning
- Avoid decorative-only chips

Examples:

- blue chip for product/system label
- teal chip for positive trust or fit
- warm chip for market urgency or launch focus

## Iconography

Use icons sparingly and functionally.

Best uses:

- feature anchors
- trust cues
- step markers
- quick-scan status blocks

Avoid:

- oversized decorative icon clouds
- random mixed icon styles

Preferred icon feel:

- clean
- geometric
- modern
- simple stroke or minimal solid form

## Content System

### Messaging Tone

The product voice should be:

- direct
- thoughtful
- calm
- product-minded
- urban and contemporary

Avoid:

- overhype
- exaggerated claims
- forced startup language
- vague emotional fluff

### Homepage Messaging Rules

If the page is vision-stage:

- explain the problem clearly
- define the system
- show how the future product works
- avoid pretending the full product exists

If the page is MVP-stage:

- focus more on tasks and real flows
- reduce abstract product storytelling
- increase action readiness

## Interaction Design

### Motion Principles

Motion should:

- guide attention
- confirm interaction
- make the page feel polished

Motion should not:

- distract
- delay understanding
- turn the interface into a spectacle

### Current Motion Style

Use:

- subtle hover lifts
- soft section entrance effects
- smooth anchor scrolling
- fast transitions

Avoid:

- bouncing elements
- long parallax effects
- dramatic animated backgrounds

### Hover Behavior

Interactive cards may lift slightly on hover:

```css
transform: translateY(-4px);
```

Buttons may lift subtly:

```css
transform: translateY(-2px);
```

## Responsive Design Rules

### Mobile-first

All design decisions should work on mobile first.

Mobile priorities:

- single-column flow
- clear section boundaries
- easy thumb-access CTAs
- minimal cognitive overload

### Sticky Mobile CTA

Allowed for high-priority pages when:

- there is one clear primary action
- the action is useful and not misleading

For vision-stage pages, sticky CTA text should reflect exploration, not false conversion.

### Desktop Behavior

On desktop:

- expand into multi-column layouts where helpful
- maintain readable line lengths
- use horizontal grids for steps and features

## Component Guidance

### Header

Header should include:

- brand mark
- simple navigation
- max 1 to 2 actions

Header must feel lightweight and uncluttered.

### Hero

Hero should always include:

- one sharp headline
- one strong subheadline
- clear primary action
- product-shaped visual or structured system preview

Hero should not include:

- too many competing stats
- generic illustrations without product meaning

### Feature Cards

Each feature card should include:

- icon or indicator
- short title
- one concise explanation

Keep each card scannable in under 3 seconds.

### Stepper

Stepper should:

- visually simplify the process
- use numbered sequence
- stay understandable on mobile and desktop

### CTA Section

Final CTA should:

- summarize intent
- state current stage honestly
- offer next logical action

## Trust Design Rules

Because Shared Living OS is trust-sensitive, always include some of the following:

- verification language
- visible process clarity
- structured comparison
- city/context specificity
- clear explanation of what happens next

Do not use fabricated proof.

If real user counts, testimonials, or retention metrics are not available yet:

- use category insights
- use product principles
- use clearly framed launch intentions

## Product Stage Rules

### Vision-stage pages

Use:

- explainers
- product model visuals
- concept framing
- product principles
- launch-market context

Avoid:

- pretending users can complete flows that do not exist
- fake social proof
- misleading CTA labels

### MVP-stage pages

Use:

- real routes
- direct action labels
- stronger conversion emphasis
- genuine metrics if available

## Accessibility Rules

Always maintain:

- sufficient text contrast
- visible focus states
- readable font sizes
- clear section labeling
- logical heading order

Do not rely on color alone to communicate status.

## Writing Rules for Future Designers and Developers

Before adding any new page or component, ask:

1. Does this reduce confusion or add confusion?
2. Does this help the user trust the product more?
3. Does this feel like the same product language as the homepage?
4. Is the action honest for the current product stage?
5. Is this modern and app-like rather than generic marketing filler?

## Recommended Next System Extensions

Next documents to create after this one:

1. component inventory
2. button and form interaction spec
3. onboarding flow design rules
4. listing card system
5. trust and verification state system
6. mobile navigation system

## Source of Truth

The current design language is implemented in:

- `src/App.tsx`
- `src/styles.css`

This document should evolve with the product. When the first MVP is ready, update this system to reflect:

- real routes
- real flows
- real proof
- real conversion patterns
