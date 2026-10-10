# Humanis backlog

## Implemented, pending 0.3 production acceptance
- Private beta authentication with server-verified Supabase sessions and an approved-email allowlist (already live).
- Viewport selection/drag tint fix.
- Version and commit displayed on login and studio.
- Private gallery, stored originals/results/context, download and deletion.
- Asynchronous batch processing with per-photo progress, retry and ZIP export.
- Shared context and restoration version history.

## Next
- Credits and pricing based on measured per-restoration costs; refund failed jobs.
- Paddle checkout, verified/idempotent webhooks and account credit ledger.
- Per-user rate limits, concurrent-job caps and usage monitoring before wider access.

## Product exploration
- Preserve selected faces/details during restoration; verify actual fidelity.
- Local corrections such as changing the color of a jacket without regenerating everything.
- Separate colorization-only and damage-repair actions where useful.

## Operational follow-ups
- Scheduled outbox repair for jobs whose queue dispatch failed.
- Storage cleanup when deleting user accounts.
- Saved slider adjustments and export of adjusted images.
