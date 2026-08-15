# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Every validation AC must ship with an HTTP-level or unit assertion for invalid field formats, not only happy-path updates.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `users` · harmful: 0
- features: user-profile-update
- evidence: USR-12 (users)
- last seen: 2026-08-15T19:27:14Z

### L-002 - Route e2e suites must assert the global auth boundary with an unauthenticated request when the feature is behind AuthGuard.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `users` · harmful: 0
- features: user-profile-update
- evidence: edge:unauthenticated (users)
- last seen: 2026-08-15T19:27:15Z

### L-003 - Translate Prisma record-not-found (P2025) on update into NotFoundException and cover it with a service test.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `users` · harmful: 0
- features: user-profile-update
- evidence: edge:P2025 (users)
- last seen: 2026-08-15T19:27:15Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
