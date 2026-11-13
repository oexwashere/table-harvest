const fs = require("node:fs");
const header = fs.readFileSync("metadata.txt", "utf8");
const content =
  header +
  "\n" +
  fs.readFileSync("src/core.js", "utf8") +
  "\n" +
  fs.readFileSync("src/main.js", "utf8");
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/table-harvest.user.js", content);
