# FragmentHub Agent Rules

## Product rules

FragmentHub is human-confirmed by design.

When implementing AI-assisted Fragment workflows:

1. AI may propose classifications, tags, priority, urgency, domains, relationships, summaries, and next actions.
2. Proposed values are not final until the user confirms them.
3. Do not write a new Fragment to the canonical data store before confirmation.
4. If interview mode is used, show the completed result for a final confirmation before writing.
5. Do not automatically reclassify, merge, archive, delete, or reprioritize existing Fragments.
6. Preserve `original_input`; AI enrichment must not overwrite the user's original text.

## Data rules

- JSON is the canonical data format.
- Canonical Fragment data lives in `data/fragments/`.
- Do not split work and personal data into separate paths.
- Use `scope` metadata for work/personal classification.
- Fragment IDs use `F-000001` format and never encode classification.
- Keep JSON compatible with `config/fragment.schema.json` and `lib/fragment-schema.ts`.
- Do not bypass `lib/fragments/semantic-validator.ts` when creating or updating canonical Fragment data.
- Use the controlled domain IDs from `config/domains.json`; AI must not invent and persist new domain IDs.
- Preserve optimistic concurrency controls when updating stored Fragments.
- Prefer archive over delete. Any true delete must be explicitly requested and must not leave inbound project/related references.

## Security rules

- The repository is private, but a deployed web app must not be assumed private.
- Never place Fragment data, GitHub tokens, model API keys, or other secrets under `public/`.
- Keep GitHub access server-side. FragmentHub Web must not call model APIs.
- Do not enable production access to private Fragment content without authentication.
- Web authentication uses GitHub OAuth + PKCE + signed session cookies.
- Authorization must use immutable numeric GitHub user IDs from FRAGMENTHUB_ALLOWED_GITHUB_IDS, not mutable usernames.
- Keep OAuth identity credentials separate from FRAGMENTHUB_GITHUB_TOKEN used for canonical data writes.
- Never persist or reuse the OAuth user access token as the Fragment data write credential.

## Scope

GitHub Actions are intentionally excluded from v0.1 unless a concrete batch-maintenance requirement is introduced.


## AI workflow rules

- Classification output is always a proposal until `confirmed: true` is produced by the human-confirmation flow.
- AI may only persist domain IDs already defined in `config/domains.json`; a missing category must be surfaced as a suggestion, not silently created.
- Interview may run only after classification confirmation and is limited to six answered questions in v0.1.
- Finalization may rewrite only `title`, `summary`, `next_action`, and `notes`.
- Finalization must preserve confirmed classification metadata and `original_input` exactly through programmatic assembly.
- ChatGPT is the only AI analysis surface. Do not add model API routes, model SDKs, or AI classification to FragmentHub Web.
- Web manual create/edit may validate and preview drafts.
- Production writes must go through the authenticated Phase 5 GitHub API routes and preserve optimistic concurrency controls.
