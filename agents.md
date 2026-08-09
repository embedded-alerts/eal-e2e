# Repository agent instructions

Follow the organization-wide branching, semantic-conflict, security, and evidence rules in `embedded-alerts/.github`.

- Preserve the canonical repository identity `embedded-alerts/eal-e2e`; never create a long-name duplicate.
- Treat `.zpkg.toml` as dependency intent and generate `.zpkg.lock` only through a real resolver.
- Keep browser tests deterministic and safe against the local fixture server by default.
- Live endpoint, account, payment, identity, or legal-document tests require isolated test tenants and explicit secrets; never record credentials, cookies, prompts, responses, customer data, or legal records.
- Use feature branches and draft pull requests. Do not reset, clean, stash, rebase, force-push, or discard unfamiliar work.
