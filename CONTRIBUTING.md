# Contributing workflow

This repo is set up for a solo (or small) maintainer. **GitHub issues are the backlog.** One issue becomes one branch and one pull request into `development`. `main` is production.

```text
idea → GitHub issue → branch off development → PR into development →
test on development → release PR into main → close issue
```

Do not commit straight to `development` or `main`. GitHub rulesets require pull requests on both, and they block deleting or force-pushing those branches.

## Branches

| Branch | Role |
| --- | --- |
| `main` | Production. Squash-merge only, linear history. |
| `development` | Integration. Long-lived. Never delete it, including after a release PR. |
| `{issue}-{slug}` | Feature or fix. Branched from `development`. Safe to delete after merge. |

## 1. Open an issue first

File an issue as soon as you notice work. Do not start from a chat thread or an untracked local change.

Include:

- **What** should change
- **Who** it is for (educator, provider, parent, admin)
- **Done when** (checklist)

Use a title like `SSO: domain allowlist rejects parent Gmail` or `Session form: minutes double-count across goals`.

### Labels

| Label | Use for |
| --- | --- |
| `bug` | Broken behavior |
| `enhancement` | New feature or workflow |
| `documentation` | README, setup, this guide |
| `accessibility` | Keyboard, screen reader, contrast |
| `privacy` | FERPA, consent, audit, retention (create if missing) |
| `sso` | School sign-in (create if missing) |
| `release` | Version cut to `main` (create if missing) |

### Issue types

- **Bug** — steps, expected vs actual
- **Enhancement** — who it serves, done-when checklist
- **Documentation** — which page or file
- **Release** — version, list of issue numbers, production test plan

## 2. Branch from `development`

```bash
git checkout development
git pull
git checkout -b 2-add-school-sso
```

Name the branch `{issue-number}-{short-slug}` so it is obvious which issue it implements.

## 3. Pull request into `development`

Open the PR against **`development`**, not `main`.

- Title: same as the issue, or a close match
- Body: start with `Fixes #2` (use the real issue number) so GitHub closes the issue when the PR merges
- Squash merge
- Do not delete `development`

Example:

```markdown
Fixes #2

## Summary
- Adds opt-in Microsoft, Google, and OIDC sign-in.

## Test plan
- [ ] Without SSO env vars, demo passphrase sign-in still works
- [ ] Pre-provisioned email can sign in via SSO
```

Feature branches can be deleted after merge. `development` stays.

## 4. Release to production

When `development` has a set of closed issues you want live:

1. Open an issue titled `Release x.y.z` with label `release`. List the issue numbers going out.
2. Open a PR from `development` into `main`.
3. Squash merge. `development` is not deleted.
4. Optional: tag `v.x.y.z` on `main`.

Do not open feature PRs directly to `main`.

## Cadence

| When | What |
| --- | --- |
| Anytime | File an issue the moment you notice work |
| Work session | Pick one issue, ship it to `development` |
| When `development` is stable | One release PR to `main` |
| After release | Close the release issue |

## Example

Issue [#2](https://github.com/vrigzalejo/iep-progress-tracker/issues/2) (school SSO) → branch `2-add-school-sso` → PR [#3](https://github.com/vrigzalejo/iep-progress-tracker/pull/3) into `development`.
