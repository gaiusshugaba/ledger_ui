# Ledger Design Tokens

Single source of truth for colors, typography, spacing, and component specs.
When a value here changes, update the corresponding code.

---

## Colors

### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `bg/page` | `#FAF9F5` | Page background |
| `bg/card` | `#FFFFFF` | Cards, panels |
| `bg/subtle` | `#F5F4F1` | Hover surfaces |
| `bg/muted` | `#EBE8E2` | Badges, disabled states |
| `bg/dark` | `#1A1A1A` | Active nav, primary buttons |

### Borders

| Token | Value | Usage |
|---|---|---|
| `border/card` | `#F0EEEA` | Card outlines |
| `border/input` | `#EEECE7` | Input, pill outlines |
| `border/hover` | `#E3E1DC` | Card hover |

### Text

| Token | Value | Usage |
|---|---|---|
| `text/primary` | `#1A1A1A` | Headlines, values |
| `text/secondary` | `#6B6862` | Body, labels |
| `text/tertiary` | `#A5A29A` | Metadata, timestamps |
| `text/disabled` | `#B5B2AB` | Disabled, muted |
| `text/inverse` | `#FFFFFF` | Text on dark backgrounds |

### Tier Pills

| Tier | Background | Text |
|---|---|---|
| Reconciled | `#D5E8DB` | `#1F4D2C` |
| Review | `#FEF3C7` | `#78350F` |
| Exception | `#FBE0DC` | `#8C2F26` |

### Tier Left Bar

| Tier | Bar color |
|---|---|
| Reconciled | `#6EB87A` |
| Review | `#C4B84A` |
| Exception | `#D97060` |

### Reason Text

| Tier | Reason text color |
|---|---|
| Reconciled | `#1F4D2C` |
| Review | `#78350F` |
| Exception | `#8C2F26` |

### Severity (plain text)

| Severity | Text color |
|---|---|
| Low | `#9B9890` |
| Medium | `#78350F` |
| High | `#8C2F26` |

---

## Typography

Family: **Inter** (loaded via `next/font`)

| Token | Size | Weight | Line height | Tracking | Usage |
|---|---|---|---|---|---|
| `text/page-title` | 28 | 600 | 1.2 | -0.02em | Page headers |
| `text/card-vendor` | 16 | 500 | 1.3 | 0 | Vendor name |
| `text/card-amount` | 16 | 500 | 1.3 | 0 | Amount |
| `text/body` | 14 | 400 | 1.5 | 0 | Body text |
| `text/pill` | 12 | 500 | 1 | 0 | Tier pills |
| `text/severity` | 12 | 500 | 1 | 0 | Severity text |
| `text/metadata` | 13 | 400 | 1.4 | 0 | Metadata line |
| `text/timestamp` | 13 | 400 | 1.4 | 0 | "16d ago" |
| `text/reason` | 13 | 500 | 1.4 | 0 | Reason text |
| `text/nav` | 14 | 400 | 1.4 | 0 | Sidebar items |
| `text/nav-active` | 14 | 500 | 1.4 | 0 | Active sidebar |
| `text/button` | 13 | 500 | 1 | 0 | Action buttons |
| `text/section-label` | 12 | 400 | 1.4 | 0 | Sidebar section headers |
| `text/uppercase-tag` | 11 | 500 | 1.4 | 0.1em | "SORTED BY SEVERITY" |

Enable tabular numerals globally: `font-feature-settings: 'tnum'`.

---

## Spacing

| Token | Value |
|---|---|
| `space/1` | 4 |
| `space/2` | 8 |
| `space/3` | 12 |
| `space/4` | 16 |
| `space/5` | 20 |
| `space/6` | 24 |
| `space/7` | 28 |
| `space/8` | 32 |
| `space/10` | 40 |

---

## Radius

| Token | Value | Usage |
|---|---|---|
| `radius/pill` | 9999 | Pills, buttons, tabs |
| `radius/card` | 16 | Cards |
| `radius/small` | 8 | Tags, chips |

---

## Component specs

### Queue card
Background: #FFFFFF
Border: 1px solid #F0EEEA
Radius: 16px
Padding: 22px 24px 22px 28px
Left bar: 4px wide, tier color, rounded on left
Hover border: #E3E1DC

text

**Contents top to bottom:**

1. Pill row — tier pill + severity text + timestamp (right-aligned)
2. Vendor + amount row — 6px gap to metadata
3. Metadata row — invoice #, item count, source — 18px gap to bottom row
4. Bottom row — reason text (left) + two buttons (right)

### Tier pill
Font: 12px / 500
Padding: 4px 12px
Radius: 9999px
Colors: see Tier Pills above

text

### Severity
Font: 12px / 500, capitalize
Background: none (plain text)
Colors: see Severity above

text

### Action buttons

**Review (secondary):**
Background: #FFFFFF
Border: 1px solid #EDEBE6
Text: 13px / 500 / #1A1A1A
Padding: 8px 20px
Radius: 9999px
Hover: background #FAF9F5

text

**Approve (primary):**
Background: #1A1A1A
Text: 13px / 500 / #FFFFFF
Padding: 8px 20px
Radius: 9999px
Hover: background #292524

text

**Approve (disabled):**
Background: #EDEBE6
Text: #B5B2AB
Cursor: not-allowed

text

### Filter tabs

**Container:**
Background: #FFFFFF
Border: 1px solid #F0EEEA
Padding: 4px
Radius: 9999px

text

**Active tab:**
Background: #1A1A1A
Text: #FFFFFF, 13px / 500
Padding: 6px 16px
Radius: 9999px

text

**Inactive tab:**
Background: transparent
Text: #6B6862, 13px / 500
Padding: 6px 16px
Radius: 9999px

text

### Sidebar
Width: 260px
Background: #FAF9F5
Right border: 1px solid #EEECE7

text

**Logo block:**
Padding: 28px 20px 40px 20px
Logo: 34×34
Wordmark: 20px / 600 / #1A1A1A

text

**Section label:**
Font: 12px / 400 / #B5B2AB
Padding: 0 12px
Margin: 0 0 12px 0

text

**Nav item:**
Padding: 9px 12px
Radius: 9999px
Font: 14px / 400 / #4B4B4B
Icon: 17px, stroke 1.75, color #6B6862
Hover: background #EDEBE6

text

**Nav item (active):**
Background: #1A1A1A
Text: #FFFFFF, weight 500
Icon: #FFFFFF

text

**Badge:**
Font: 11px / 500 / tabular
Min width: 26px
Height: 20px
Radius: 9999px
Padding: 0 6px
Inactive: bg #EBE8E2, text #4B4B4B
Active: bg #FFFFFF, text #1A1A1A

text

**User card (bottom):**
Background: #FFFFFF
Border: 1px solid #EEECE7
Radius: 16px
Padding: 12px
Avatar: 36×36 circle, bg #DDD3F2, text #3D2F5F

text

---

## How to update this file

When you change a value in Figma:
1. Find the token in this file
2. Update its hex/size value
3. Note which components use it
4. Tell me which changed, or update the code yourself using the specs

When you're unsure what a value should be:
- Paste the Figma hex here in chat
- I'll add it to this file and update the code

### Reason Icon

| Tier | Icon | Color |
|---|---|---|
| Reconciled | CheckCircle2 | `#6EB87A` |
| Review | AlertTriangle | `#C4B84A` |
| Exception | AlertCircle | `#D97060` |

Icon: 14×14, stroke 2px
Gap icon → text: 8px
Text: 13px, weight 400, color `text/secondary` (#6B6862)

### Reason Text (queue card)

| Tier | Color |
|---|---|
| Reconciled | `#3E6B49` |
| Review | `#8A6033` |
| Exception | `#9C4A3F` |

Font: 13px / 500 / truncate
No icon. Color tints the text, weight matches Figma.
Hierarchy: pill → severity → reason → action.