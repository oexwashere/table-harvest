(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TableHarvestCore = factory();
})(globalThis, function () {
  "use strict";

  function safeCell(value, protect = true) {
    const text = String(value ?? "").replace(/\r\n/g, "\n");
    return protect && /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  }
  function serialize(rows, { delimiter = ",", protect = true } = {}) {
    if (![",", "\t"].includes(delimiter)) throw Error("Unsupported delimiter.");
    return rows
      .map((row) =>
        row
          .map(
            (value) => '"' + safeCell(value, protect).replace(/"/g, '""') + '"',
          )
          .join(delimiter),
      )
      .join("\r\n");
  }
  function summary(rows) {
    return {
      rows: rows.length,
      columns: Math.max(0, ...rows.map((r) => r.length)),
      ragged: new Set(rows.map((r) => r.length)).size > 1,
    };
  }
  function filename(title, extension = "csv") {
    const clean =
      String(title)
        .replace(/[^a-z\d_-]+/gi, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "table";
    return clean + "." + (extension === "tsv" ? "tsv" : "csv");
  }
  return { safeCell, serialize, summary, filename };
});
