# bndstr — Feature Plan

> Iteration-structured roadmap for the **bndstr** band website.
> Each iteration maps to a GitHub Projects **Iteration** value on the
> [Iterative Development](https://github.com/users/mbchris/projects/3) board.

## Bug Fixing

**Goal:** Bugs are fixed

- Each bug is fixed

**Backlog:** [`docs/backlog/bugfixing.md`](./backlog/bugfixing.md)
---

## Iteration 1 — Foundation

**Goal:** Project scaffolding, Docker setup, CI pipeline, and basic layout with navigation.

- Nuxt 3 project structure with TypeScript
- Docker + docker-compose (dev & prod profiles)
- Global design system (dark theme, typography, spacing)
- Responsive layout with header, footer, and navigation
- GitHub Actions CI (lint, typecheck, build)

**Backlog:** [`docs/backlog/iter-1-foundation.md`](./backlog/iter-1-foundation.md)

---

## Iteration 2 — Content Pages

**Goal:** Build out the main content pages with rich visuals.
- Rehearsal page: next rehearsal with additional information
- About page: band bio, member profiles
- Setlist page: list of songs
- Voting page: voting for songs
- Admin page: admin functions

**Backlog:** [`docs/backlog/iter-2-content.md`](./backlog/iter-2-content.md)

---


## Iteration 3 — Calendar

**Goal:** Optimizations for the calendar
- Detail window available
- User can create, delete and update their own calendar entries
- User can create, delete and update the band calendar entries
- Editing a calendar item: Overview and details fields are available
- Editing a calendar item: The owner of the entry can be selected, either the band or the user
- Calendar is scrollable month-wise
- Calendar is responsive

**Backlog:** [`docs/backlog/iter-3-calendar.md`](./backlog/iter-3-calendar.md)

---
## Iteration 4 — Voting

**Goal:** Optimizations for the voting
- A song can be added
- A song can be removed
- A song can be moved up or down
- A song can be pinned
- A song can be pinned to a specific position
- A song can be voted by each band member in a scale from ("veto", "ok", "good", "great")
- Each song can be voted by each band member 
- All votes are shown
- The average vote is shown
- The number of votes is shown
- Table can be ordered and filtered by the average vote, title, artist
- Link to youtube can be added
- Link to spotify can be added
- Linked songs show the preview of the song
- Linked songs can be opened in a new tab
- Songs can be taken over to Setlist. This needs to be confirmed.
- Show votes from others even they have not voted yet. All band members shall be shown.


**Backlog:** [`docs/backlog/iter-4-voting.md`](./backlog/iter-4-voting.md)

---

## Iteration 5 — Setlist

**Goal:** Optimizations for the setlist
- A song can be added
- A song can be removed
- A song can be moved up or down
- A song can be pinned
- A song can be pinned to a specific position
- A "semi-tone pitching" can be defined from -5 to +5
- A "pause" element can be added to the voting
- A "change tuning" element can be added to the voting
- Table can be ordered and filtered by title, artist
- Link to youtube can be added
- Link to spotify can be added
- Linked songs show the preview of the song
- Linked songs can be opened in a new tab
- Song properties can be edited.


**Backlog:** [`docs/backlog/iter-5-setlist.md`](./backlog/iter-5-setlist.md)


## Iteration 6 - Rehearsal

**Goal:** Support the rehearsal process
- A rehearsal session can be started and ended
- The duration of each song played is tracked
- Rehearsal notes can be added to each song
- The status of a song can be updated (e.g. "Done", "Needs Work")
- Lyrics and chords are displayed in a rehearsal-friendly view
- Metronome and tempo are visible for each song
- Easy navigation between songs in the setlist
- Summary of the rehearsal is shown at the end

**Backlog:** [`docs/backlog/iter-6-rehearsal.md`](./backlog/iter-6-rehearsal.md)




