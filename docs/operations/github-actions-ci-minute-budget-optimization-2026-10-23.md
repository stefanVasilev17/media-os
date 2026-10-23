# MediaOS — GitHub Actions CI minutes optimization (2026-10-23)

**Director approved:** Optimize GitHub Actions consumption following the GitHub billing notice that 1,800 of 2,000 included Actions minutes were used as of 2026-10-22. Continue strong checks for relevant changes without re-running expensive unrelated tests.

**Implemented on `main`:**
- Commit `70be04987c8f7d60338b81fd733e735fe04a07dc`: selective CI jobs, npm download caching, superseded-run cancellation, no push-triggered CI for docs/Markdown/skills-only changes, and `workflow_dispatch` for manual full suite.
- Commit `fd5ea8c4f4f468f8c28f81945bfb0bcdffd4399c`: avoid rebuilding the entire Remotion CPU worker Docker image for visual-only Remotion `.tsx` edits; continue Remotion typecheck, while still running worker Docker preflight for affected worker runtime/dependencies.

## Behavior

The GitHub workflow `.github/workflows/ci.yml` uses a short `changes` classifier job to compute affected suites from commit or pull-request diffs, then conditionally executes the existing tests without changing their semantics.

| Path category | Automatic checks |
| --- | --- |
| `frontend/**` | Frontend npm build |
| `backend/**` | Backend Maven tests |
| `remotion-engine/**` generally | Remotion TypeScript typecheck |
| `remotion-engine/cpu-worker.mjs`, `remotion-engine/package.json`, `render-worker/**` | CPU worker Docker preflight (plus Remotion typecheck for remotion-engine changes) |
| `worker/**` | Windows PowerShell runner syntax and shim self-tests |
| `docker-entrypoint.sh`, `chromium-software-webgl.sh` | Backend and CPU worker preflight |
| Root `Dockerfile`, compose/railway configs, `contracts/**`, `gpu-render-worker/**`, `ops/**`, the CI workflow itself, and unknown source paths | Full five-job CI (safety fallback) |
| GitHub workflow files other than `ci.yml`, `.railway-deploy-trigger`, misc recognized metadata | Cheap selector check; no heavyweight checks |
| Docs, skills, and Markdown-only push | No CI workflow |
| `workflow_dispatch` | Full five-job CI, as before |

Other safeguards:
- Concurrency `cancel-in-progress: true` for the same ref or PR prevents obsolete CI runs from spending further time when a new commit supersedes them.
- Npm caches are separate for `frontend` and `remotion-engine`, keyed to `package.json`. Since there are no committed package lockfiles in these directories, retain `npm install` rather than using `npm ci`.
- Preserve all previously implemented tests, command-line smoke checks, and manual visual QA/video-render workflows. SHOT 01–06 Director video/voice locks and PostgreSQL are untouched.
- Do not automatically restore heavy SHOT06 Remotion render workflows; the Director-reviewed v5 is LOCKED.
- **Neither this document nor CI optimization changes billing limits or retroactively refunds consumed minutes**. Usage needs inspection in GitHub Settings → Billing and licensing to avoid overage.

## Operational notes / risks

GitHub path filtering can leave required status checks pending for skipped docs-only workflows on some branch protection configurations. If a future required-check policy mandates `CI` for doc-only changes, use a cheap always-on status workflow or revisit filtering before enforcing that policy. Pull requests continue to run the lightweight classifier even for docs-only changes to reduce this risk.

To run full verification on demand, open GitHub Actions → CI → Run workflow (manual dispatch). A change to `ci.yml` also triggers a one-off full verification. For normal Remotion scene edits, require the Remotion TypeScript check; verify final visuals through the relevant Director review process rather than automatically rendering masters on each code push.
