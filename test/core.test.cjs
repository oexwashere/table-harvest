const test = require("node:test"),
  assert = require("node:assert/strict"),
  core = require("../src/core.js");
test("CSV escapes commas, quotes and multiline cells", () =>
  assert.equal(
    core.serialize([["a,b", 'say "hello"', "one\ntwo"]]),
    '"a,b","say ""hello""","one\ntwo"',
  ));
test("formula protection is enabled unless explicitly disabled", () => {
  assert.equal(core.safeCell(" =SUM(A1)"), "' =SUM(A1)");
  assert.equal(core.safeCell("-5"), "'-5");
  assert.equal(core.safeCell("=1", false), "=1");
});
test("table summary detects ragged rows", () =>
  assert.deepEqual(core.summary([["a"], ["b", "c"]]), {
    rows: 2,
    columns: 2,
    ragged: true,
  }));
test("file names cannot introduce path segments", () => {
  assert.equal(core.filename("../../hello / world"), "hello-world.csv");
  assert.equal(core.filename("", "tsv"), "table.tsv");
});
