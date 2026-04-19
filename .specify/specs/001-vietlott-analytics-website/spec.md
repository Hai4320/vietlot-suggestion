# Specification — Vietlott Analytics Website

## Feature: 001-vietlott-analytics-website

## Overview

Build a modern, interactive analytics website for Vietnamese lottery (Vietlott) data. The website displays historical draw results, statistical analysis, and number suggestions for 6 lottery products organized into 2 groups.

## Product Groups

### Group 1: Xổ số Ma trận (Matrix Lottery — Jackpot Hunts)

| Product | Code | Numbers | Draw Schedule | Jackpot |
|---------|------|---------|---------------|---------|
| Power 6/55 | `power_655` | 6 from 01-55 + 1 special | T3, T5, T7 | Jackpot 1 (≥30B) + Jackpot 2 (≥3B) |
| Mega 6/45 | `power_645` | 6 from 01-45 | T4, T6, CN | ≥12 tỷ |
| Lotto 5/35 | `power_535` | 5 from 01-35 + 1 special (01-12) | Daily 2x (13h, 21h) | ≥6 tỷ, chia nếu >12 tỷ |

**Data format:** `{"date": "...", "id": "...", "result": [n1, n2, ..., n6, special?]}`

### Group 2: Xổ số Dãy số (Sequence Lottery — Fixed Prize)

| Product | Code | Numbers | Format |
|---------|------|---------|--------|
| Max 3D | `3d` | Bộ 3 số (000-999) | Multi-prize tiers |
| Max 3D Pro | `3d_pro` | 2 bộ 3 số, dò cả đúng & ngược thứ tự | Multi-prize tiers |

**Data format:** `{"date": "...", "id": "...", "result": {"Giải Đặc biệt": [...], "Giải Nhất": [...], "Giải Nhì": [...], "Giải ba": [...]}}`

> **Note:** Max 3D+ does not have a dedicated crawler yet. Excluded from Phase 1.

## User Stories

### US-01: Home Page — Product Overview
**As a** visitor,
**I want to** see all lottery products organized by group with key stats,
**So that** I can quickly navigate to the product I'm interested in.

**Acceptance Criteria:**
- [ ] Two product groups displayed as card sections
- [ ] Each product card shows: name, emoji, brief description, last draw date, total draws count
- [ ] Clicking a card navigates to the product detail page
- [ ] Hero section with project title and overall statistics

### US-02: Matrix Product Detail — Recent Results
**As a** user viewing a matrix lottery product (Power 655/645, Lotto 535),
**I want to** see the most recent draw results,
**So that** I can check winning numbers.

**Acceptance Criteria:**
- [ ] Table of 20 most recent draws (date, ID, drawn numbers)
- [ ] Numbers displayed as colored balls/badges
- [ ] Special number (if exists) highlighted differently
- [ ] Sortable by date
- [ ] Paginated (20 per page)

### US-03: Matrix Product Detail — Frequency Analysis
**As a** user,
**I want to** see how often each number appears,
**So that** I can identify hot and cold numbers.

**Acceptance Criteria:**
- [ ] Bar chart: frequency of each number (1-55/45/35)
- [ ] Time filter: All-time / Last 90 days / Last 60 days / Last 30 days
- [ ] Color gradient: most frequent (hot/red) → least frequent (cold/blue)
- [ ] Hover tooltip showing exact count and percentage

### US-04: Matrix Product Detail — Hot/Cold Summary
**As a** user,
**I want to** quickly see which numbers are "hot" (appearing often) and "cold" (absent long),
**So that** I can make informed choices.

**Acceptance Criteria:**
- [ ] Top 10 most frequent numbers (hot) with fire emoji
- [ ] Top 10 least recent numbers (cold) with snowflake emoji
- [ ] Days since last appearance for each number
- [ ] Visual cards with color coding

### US-05: Matrix Product Detail — Trend Over Time
**As a** user,
**I want to** see how number frequencies change over time,
**So that** I can spot trends.

**Acceptance Criteria:**
- [ ] Line chart: rolling 30-day frequency for selected numbers
- [ ] Multi-select up to 5 numbers to compare
- [ ] X-axis: date, Y-axis: frequency count

### US-06: Matrix Product Detail — Pair Analysis
**As a** user,
**I want to** see which number pairs appear together most often,
**So that** I can consider pair patterns.

**Acceptance Criteria:**
- [ ] Top 20 most frequent pairs table
- [ ] Pair count and percentage shown
- [ ] Optional: heatmap visualization for all pairs

### US-07: Matrix Product Detail — Number Suggestion
**As a** user,
**I want to** get AI-suggested number sets,
**So that** I can have data-driven picks.

**Acceptance Criteria:**
- [ ] "Generate" button produces N sets (default 5)
- [ ] 3 strategies: Frequency-based, Long Absence, Mixed/Balanced
- [ ] Each suggestion shows the set of numbers as colored balls
- [ ] Disclaimer: "For entertainment only"

### US-08: 3D Product Detail — Recent Results
**As a** user viewing Max 3D or Max 3D Pro,
**I want to** see recent draw results organized by prize tier,
**So that** I can check results.

**Acceptance Criteria:**
- [ ] Table showing last 20 draws
- [ ] Each draw expanded to show: Giải Đặc biệt, Nhất, Nhì, Ba
- [ ] Numbers displayed as 3-digit codes (e.g., "015", "517")

### US-09: 3D Product Detail — Digit Frequency Analysis
**As a** user,
**I want to** see frequency of each digit (0-9) by position (hundreds, tens, units),
**So that** I can analyze patterns in 3-digit numbers.

**Acceptance Criteria:**
- [ ] 3 bar charts: one per digit position (hundreds, tens, units)
- [ ] Frequency of digits 0-9 in each position
- [ ] Filter by prize tier (Đặc biệt, Nhất, Nhì, Ba, All)
- [ ] Time filter: All-time / 90 / 60 / 30 days

### US-10: 3D Product Detail — Top 3-Digit Numbers
**As a** user,
**I want to** see the most frequently appearing 3-digit numbers,
**So that** I can identify common results.

**Acceptance Criteria:**
- [ ] Top 30 most frequent 3-digit numbers (across all tiers or per tier)
- [ ] Count and percentage for each
- [ ] Days since last appearance

### US-11: 3D Product Detail — Number Suggestion
**As a** user,
**I want to** get suggested 3-digit number sets,
**So that** I have data-driven picks for Max 3D/3D Pro.

**Acceptance Criteria:**
- [ ] Generate N suggested bộ 3 số (default 5)
- [ ] Strategies: Top frequency, Long absence, Mixed
- [ ] Disclaimer displayed

### US-12: Bilingual Support
**As a** Vietnamese or English-speaking user,
**I want to** switch between VI and EN,
**So that** I can use the website in my preferred language.

**Acceptance Criteria:**
- [ ] Language toggle in header (VI default)
- [ ] All static text has both VI and EN variants
- [ ] Chart labels localized
- [ ] Language preference persisted in localStorage

### US-13: Responsive Design
**As a** mobile user,
**I want to** use the website comfortably on my phone,
**So that** I can check lottery results anywhere.

**Acceptance Criteria:**
- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Charts resize properly
- [ ] Tables become horizontally scrollable
- [ ] Touch-friendly buttons and interactions

## Non-Functional Requirements

- **Performance:** Static site, all pages pre-rendered, FCP < 1.5s
- **SEO:** Proper meta tags, og:image per product, structured data
- **Analytics:** Google Analytics support (optional)
- **Deploy:** Static export to GitHub Pages or Vercel

## Data Sources

All data comes from local JSONL files in `data/`:
- `power655.jsonl` (~1,326 records, from 2017-08-01)
- `power645.jsonl` (~1,294 records, from 2017-10-25)
- `power535.jsonl` (~531 records, from 2025-06-29)
- `3d.jsonl` (~1,064 records, from 2019-04-22)
- `3d_pro.jsonl` (~703 records, from 2021-09-14)

## Out of Scope (Phase 1)
- Max 3D+ (no crawler yet)
- Bingo18 (different game type)
- Keno (fast-pace, different analysis)
- User accounts / authentication
- Real-time data updates
- Payment integration
