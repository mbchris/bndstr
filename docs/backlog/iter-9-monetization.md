# Iteration 9 — Monetization

- [ ] Introduce subscription plan model for bands: `free`, `pro`, `pro-zero`.
- [ ] Add billing interval support for `pro`: monthly and yearly.
- [ ] Integrate payment checkout flow for `pro` plan upgrades.
- [ ] Implement subscription status sync (active, canceled, past_due, trialing if used).
- [ ] Add webhook handling to keep subscription state in sync with billing provider.
- [ ] Keep `pro-zero` as internal-only (not available in public checkout UI/API).
- [ ] Add admin/dev-only endpoint or workflow to assign `pro-zero`.
- [ ] Enforce free-plan song limit (max 15 setlist songs) on API level.
- [ ] Enforce free-plan member limit (max 5 members) on API level.
- [ ] Keep free-plan features usable: voting, calendar, availabilities, bierwart, gig setlists.
- [ ] Gate shared notes on songs as pro-only (API and UI).
- [ ] Gate personal notes on songs as pro-only (API and UI).
- [ ] Gate import/export functionality as pro-only (API and UI).
- [ ] Update Billing page to show current plan, limits, renewal/cancel info, and upgrade CTA.
- [ ] Update Dashboard subscription card to reflect live plan and status.
- [ ] Implement downgrade behavior: preserve existing data, block creating items above limit.
- [ ] Add clear user-facing messages when limits are reached.
- [ ] Add tests for plan enforcement and subscription transitions.
