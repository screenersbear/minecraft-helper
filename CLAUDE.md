## Testing rules (from app-safety-kit)

These rules apply to every change in this repo.

1. Every function gets several unit tests: the normal case, the edge cases (empty, zero, one item, very large, dates across midnight/months), and bad input. Three tests per function is the floor, not the goal.
2. Keep logic (calculations, data shaping, storage, parsing) in exported functions inside the folders listed under "logic" in safety.config.json. Keep DOM wiring thin. Logic is unit tested; the DOM is covered by the browser tests.
3. Never lower a number in safety.config.json, never add `.skip` / `.only`, never delete or weaken a test to make things pass, and never add files to "ignore" to dodge coverage. If a threshold seems wrong, stop and ask Starky.
4. Before saying a change is done, run `npm run test:quick` and fix anything it reports. For changes to logic, also run `npm run test:mutation` and add tests for any surviving mutants.
5. Any new button, link or control must survive tests/e2e/click-everything. Only add `data-test-skip` to a control that would destroy real data or call a paid/external service, and leave an HTML comment saying why.
6. Save tokens: run tests through the npm scripts (they print short summaries). Read only the failing test's output, e.g. `npm run test:quick 2>&1 | tail -60`. Do not open the HTML reports or paste full logs.
7. When fixing a bug, first write a test that fails because of the bug, then fix it.

## Publishing

After every finished change, commit and push `main` yourself, without asking (Starky, 2026-11-14). A push publishes the
live app at https://screenersbear.github.io/minecraft-helper/ in about a minute: run `npm run build` first if the book,
pictures or app files changed (it restamps sw.js), then check the live app. HANDOFF.md, .claude/ and .github/workflows/
stay out of git.

## When Starky pastes a copied list

The grown-ups screen's "Copy the list" gives one line per entry: `"question" | app answered: ... | reason: ... | asked N times, last on DATE`.
Reasons: Wrong, Hard to understand, Not what I asked, Not in the book, Missing (a kind of answer the book doesn't have yet,
like "Missing: what panda eats"), Didn't say why.

1. Check every entry against the Minecraft Wiki for Bedrock (minecraft.wiki). Change nothing yet.
2. Sort them into these groups and report back in this order:
   1. **The app was wrong**: say what's right, with the wiki page, and the fix.
   2. **The app was right**: say so and change nothing (the kid probably misheard or misunderstood).
   3. **Hard to understand**: suggest simpler words for the answer.
   4. **Missed the question**: the nicknames or wording to add so it matches next time.
   5. **Not in the book** (and Missing): the fact, where line or guide to add.
3. Wait for Starky's go-ahead, then make the changes. Where lines go in `tools/book/where.json` (Bedrock, with the
   wiki link), nicknames in `data/nicknames.json`, guides in `guides/`. Then `npm run build`, test, commit and push.
