---
name: CouponPush partner surfaces
description: The implemented brand onboarding and workspace extension of CouponPush.
colors:
  partner-accent: "#235ebc"
  partner-accent-hover: "#174893"
  partner-ink: "#192943"
  partner-muted: "#52647c"
  partner-line: "#dce5ef"
  workspace-bg: "#f7f9fc"
  surface: "#ffffff"
  process-bg: "#f0f5fc"
  field-line: "#b9c8da"
  secondary-line: "#bccbdc"
  secondary-hover: "#edf3fa"
  selected-bg: "#e7effc"
  selected-ink: "#1a509e"
  status-bg: "#edf1f6"
  status-ink: "#526078"
  active-bg: "#e8f4ed"
  active-ink: "#27674f"
  review-bg: "#eaf0fd"
  review-ink: "#345bb1"
  changes-bg: "#fff4dc"
  changes-ink: "#7e5926"
  unavailable-bg: "#fbecef"
  unavailable-ink: "#8d3948"
  ended-bg: "#edf0f5"
  ended-ink: "#667189"
typography:
  display:
    fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: "48px"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-.035em"
  headline:
    fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: "32px"
    fontWeight: 750
    letterSpacing: "-.025em"
  section:
    fontSize: "22px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-.015em"
  title:
    fontSize: "18px"
    fontWeight: 700
  body:
    fontSize: "14px"
    lineHeight: 1.7
  label:
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.5
  status:
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.4
rounded:
  status: "5px"
  field: "7px"
  action: "8px"
  notice: "10px"
  panel: "14px"
spacing:
  compact: "8px"
  control: "12px"
  row: "20px"
  section: "22px"
  panel: "30px"
components:
  button-primary:
    backgroundColor: "{colors.partner-accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.action}"
    padding: "12px 19px"
  button-primary-hover:
    backgroundColor: "{colors.partner-accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.partner-ink}"
    rounded: "{rounded.action}"
    padding: "12px 19px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.partner-ink}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  status:
    backgroundColor: "{colors.status-bg}"
    textColor: "{colors.status-ink}"
    rounded: "{rounded.status}"
    padding: "5px 9px"
---

# Design System: CouponPush partner surfaces

## Overview

**Creative North Star: "CouponPush, extended"**

This document applies to the implemented partner workspace and list-your-brand landing page. Satoshi, navy text, blue actions, white panels and pale blue surfaces extend the incumbent product. The existing public Header, Footer, logo and global tokens retain their own authority.

The workspace favors readable forms and flat operational rows. Color supports an explicit state label; review feedback and publication progress belong beside the work they explain.

**Key Characteristics:**

- Familiar CouponPush typography and native controls.
- One primary work area with persistent workspace navigation.
- Flat offer and activity rows with explicit review states.
- Forms and management actions remain usable on narrow screens.

Evidence: `PartnerPortal.tsx`, `partners.module.css`, `../list-a-store/page.tsx`, shared `src/styles/style.css`, and the existing Header/Footer. Development-only component previews and extensions are in `.impeccable/design.json` beside this file.

## Colors

A restrained blue action palette sits on white and cool pale surfaces; semantic tints distinguish review outcomes.

### Primary

- **Partner blue:** primary actions, linked next steps and the landing headline accent.
- **Deep partner blue:** primary button hover.

### Neutral

- **Partner navy:** main text; **slate:** descriptions, field hints and metadata.
- **Cool white and workspace wash:** panel/landing background and workspace background.
- **Pale process blue:** onboarding process container.
- **Cool lines:** panel dividers, input strokes and secondary button strokes.
- **Selected blue wash and ink:** current workspace navigation item.

Semantic status pairs in the frontmatter are functional colors: active green, review blue, requested-change amber, unavailable rose and ended slate.

Sidecar tonal ramps are synthesized preview metadata; they do not add CSS palette tokens to this surface.

**The Written State Rule.** Always display the status text; a colored badge alone does not communicate review or publication state.

## Typography

**Display and Body Font:** Satoshi, inherited from the shared `--font-primary` / `--font-display` stacks. The global stylesheet and font loading remain the source of truth.

The hierarchy uses weight and size rather than a separate partner display face. The frontmatter records CSS-specified weights; the installed font determines their rendered interpolation.

- **Display:** landing headline; scales to 41px below 1050px, 42px below 800px and 37px below 540px.
- **Headline:** workspace page title; 27px on small screens.
- **Section:** task-area headings, with 24px authentication headings and 34px introductory authentication copy.
- **Title:** next-step, publication and recent-activity headings.
- **Body:** recurring task descriptions; field values are 15px, authentication introduction is 16px, landing introduction is 17px.
- **Label / status:** persistent field names and compact badge text. Hints are 12px; table headings and some metric metadata are 11px.
- **Metrics:** 28px, weight 750, tabular numerals; 27px on small screens.

## Layout

Desktop shells cap at 1180px with 32px side gutters. The workspace uses a 220px navigation column, 35px gap and flexible primary panel. At 1050px the navigation narrows to 180px and panel padding reduces to 24px.

At 800px shells use 18px gutters. Workspace navigation becomes a horizontal scrolling row above the content. Authentication becomes a single column capped at 580px, with the account form first and explanatory copy second. Landing sections stack.

At 540px paired form fields become a single column, primary form actions fill their row, filters stack, metrics become two columns, and activity timestamps move below their message. Offer tables retain their semantic markup but present each offer as a flat labeled row: title, status, two engagement counts and visible management actions. Horizontal table scrolling is removed at this breakpoint.

## Elevation & Depth

Partner panels and rows are flat at rest, with borders and surface tint providing separation. The partner module introduces no shadows. This does not replace the shared site's own Header, Footer or navigation depth treatments.

Button background/border transitions take 150ms; reduced-motion preference removes these transitions.

## Shapes

Soft rectangular geometry uses compact field/navigation corners, slightly fuller action corners and broad panel corners. Status chips are small rounded rectangles, not pills. Thin cool borders define panels, controls and row boundaries; process steps use outlined square number markers.

## Components

### Buttons

Primary and secondary actions have a minimum 46px height, centered labels, 700 weight and 12px icon gap. Secondary actions use a white fill and cool stroke; text actions are underlined blue, while withdrawal actions use muted rose. Disabled buttons dim to 58% opacity and use the not-allowed cursor. Small-screen table actions remain at least 44px tall.

### Inputs / Fields

Native inputs, selects, textareas, checkboxes and file controls retain explicit labels. Fields have at least 46px height; textareas expand vertically. Required-for-review fields use written “(required)” text. Store and offer forms allow unfinished draft saves; full required-detail validation occurs when submitting for review, with a concise reminder beside the offer fields. TextField hints/errors share a described-by target, and invalid fields expose `aria-invalid` with a rose border and a written error. Disabled fieldsets use a pale wash and muted text.

Interactive partner elements use a visible three-pixel blue outline with four-pixel offset. The top-level error is an alert and receives programmatic focus; successful notices use status semantics. Opening an inline offer editor focuses its heading without adding it to the regular tab order.

### Cards / Containers

Authentication and workspace panels use white, cool borders and generous inset spacing. Feedback, verification, error and success notices use semantic tint and text, rather than heavy elevation. Review feedback preserves supplied line breaks and wraps long content.

### Navigation

The existing site Header and Footer frame both surfaces. Workspace navigation is a labeled nav with button destinations and `aria-current="page"` on the active destination. It stays sticky on desktop, becomes a scrolling row at 800px, and drops decorative icons at 540px. The existing mobile site drawer retains its dialog semantics, focus trap, Escape dismissal and focus return.

### Status and publication

Visible labels are Draft, In review, Changes requested, Active, Not approved, Withdrawn and Suspended, with Expired or Scheduled overriding the offer label when applicable. Scheduled currently shares its underlying status tint; the written label carries its distinction.

**The Separate Publication Rule.** Review approval and completion of a website update remain separate messages: “Website update pending” and “Approved version published.” A status badge never substitutes for publication progress.

### Review locks

Pending review and suspended listings disable store and offer editing. Both task surfaces explain the reason above the controls and offer “Open Overview.” The pending-review notice tells the representative to withdraw from Overview, edit the draft and resubmit; suspension directs them to feedback or Contact CouponPush. The notice and action stack on small screens.

**The Explained Lock Rule.** Keep the reason and an available next step adjacent to disabled editing controls.

### Offer and activity rows

Offers use a captioned table with scoped headings on desktop and labeled row presentation on mobile. Edit/Renew and Withdraw stay visible; their accessible names include the offer title. Offer feedback stays beside the affected offer. Activity is a flat chronology with timestamps and revision metadata. Search-empty and first-offer states provide distinct written guidance.

## Do's and Don'ts

### Do:

- **Do** inherit CouponPush typography, public navigation and logo assets.
- **Do** pair semantic tint with explicit state text and actionable feedback.
- **Do** preserve the mobile account-form-first order and visible offer actions.
- **Do** explain disabled editing and distinguish review from publication.
- **Do** keep native controls, named fields, written errors and visible focus.

### Don't:

- **Don't** promote this scoped partner extension into a replacement site identity.
- **Don't** use view/click figures as purchase or redemption claims.
- **Don't** hide small-screen management actions behind horizontal table scrolling.
- **Don't** add decorative raster imagery, traffic promises or fabricated social proof.

Not canonized: inherited Font Awesome glyph icons remain an implementation dependency, not a partner icon-system rule. The compact “Your workspace” navigation label is descriptive UI copy, not a reusable decorative kicker pattern.
