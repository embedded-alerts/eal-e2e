# Repository agent instructions

Follow the organization-wide branching, semantic-conflict, security, and evidence rules in `embedded-alerts/.github`.

- Preserve the canonical repository identity `embedded-alerts/eal-e2e`; never create a long-name duplicate.
- Treat `.zpkg.toml` as dependency intent and generate `.zpkg.lock` only through a real resolver.
- Keep browser tests deterministic and safe against the local fixture server by default.
- Live endpoint, account, payment, identity, or legal-document tests require isolated test tenants and explicit secrets; never record credentials, cookies, prompts, responses, customer data, or legal records.
- Use feature branches and draft pull requests. Do not reset, clean, stash, rebase, force-push, or discard unfamiliar work.

## Code style and coding patterns

remember to modularize the rust, typescript and dart - not everything belongs in main.rs, main.ts and main.dart; also follow functional coding principles - fewer side-effects (use pure functions more), more immutability (immutable variables); but for stateful apps like the client or stateful servers like websockets or tcp connections, sometimes classes and oop make more sense than functional programming perse, but we can still adhere to functional programming more than usual. Favor exhaustive pattern matching and use formal methods checking too. Favor composability and re-use , so basically create more utility functions and routines for shared use. You can follow a medium level of D.R.Y. (don't repeat yourself) - in other words you can repeat yourself at medium amount (not too much not too little). Some chaining is totally fine, so either method-chaining (immutable sometimes although with classes can be mutable too for performance), and chaining via the pipe operator is ok in languages like gleamlang.

Functional programming is mostly the following:

+ explicit inputs
+ explicit outputs
+ immutable values
+ pure transformations
+ typed errors
+ explicit state transitions
+ composition
+ effects pushed outward
+ illegal states excluded by types
