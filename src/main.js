(function () {
  "use strict";
  const HOST_ID = "oex-table-harvest";
  const core = globalThis.TableHarvestCore;

  let closeActive = null;
  function openDrawer(title) {
    if (closeActive) closeActive();
    const old = document.getElementById(HOST_ID);
    if (old) old.remove();
    const previous = document.activeElement;
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText =
      "position:fixed!important;inset:0 0 0 auto!important;width:min(440px,100vw)!important;height:100vh!important;z-index:2147483647!important;display:block!important;";
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `:host{all:initial}*{box-sizing:border-box}.drawer{height:100vh;overflow:auto;background:#f6f6ee;color:#293e35;box-shadow:-10px 0 50px #0003;padding:26px;font:14px/1.65 Arial,sans-serif}h1{font:28px Georgia,serif;line-height:1.2;margin:0}h2{font:21px Georgia,serif}header{display:flex;align-items:start;justify-content:space-between;gap:15px;margin-bottom:25px}button{font:12px Arial,sans-serif;border:1px solid #c7d0bb;background:#e4ebd3;color:#293e35;border-radius:6px;padding:10px 13px;cursor:pointer}button:hover{background:#d1dfb8}input,textarea,select{display:block;width:100%;padding:11px;margin:7px 0 15px;border:1px solid #c6d1b8;border-radius:6px;background:#fffef7;color:#293e35;font:13px/1.6 Arial,sans-serif}textarea{resize:vertical}label{font-size:11px}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #8c9c67;outline-offset:3px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.status{font-size:12px;color:#6b8052;overflow-wrap:anywhere}.item{padding:13px 0;border-bottom:1px solid #d9dfd0;overflow-wrap:anywhere}.small{font-size:11px;color:#79856e}a{color:#446548}.reader p{font-size:16px;line-height:1.9}.reader h2{margin-top:30px}.reader blockquote{border-left:3px solid #8c9c67;padding-left:14px}.empty{border:1px dashed #bfcdaa;padding:20px;border-radius:8px}`;
    const panel = document.createElement("section");
    panel.className = "drawer";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", title);
    const header = document.createElement("header"),
      heading = document.createElement("h1"),
      close = document.createElement("button");
    heading.textContent = title;
    close.textContent = "Close";
    close.setAttribute("aria-label", "Close " + title);
    header.append(heading, close);
    const body = document.createElement("div"),
      status = document.createElement("p");
    status.className = "status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    panel.append(header, body, status);
    root.append(style, panel);
    document.documentElement.append(host);
    const cleanup = () => {
      host.remove();
      closeActive = null;
      document.removeEventListener("keydown", escape);
      previous?.focus();
    };
    const escape = (e) => {
      if (e.key === "Escape") cleanup();
    };
    closeActive = cleanup;
    close.addEventListener("click", cleanup);
    document.addEventListener("keydown", escape);
    close.focus();
    return { body, status, panel, close: cleanup, root };
  }
  function el(tag, text = "", className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function action(label, handler) {
    const b = el("button", label);
    b.type = "button";
    b.addEventListener("click", () => {
      Promise.resolve()
        .then(handler)
        .catch((e) => alert("This action could not finish: " + e.message));
    });
    return b;
  }
  function download(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.documentElement.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  GM_registerMenuCommand("Export a page table", () => {
    const tables = Array.from(document.querySelectorAll("table")).filter(
      (t) => t.rows.length > 0,
    );
    if (!tables.length) {
      alert("No HTML tables were found on this page.");
      return;
    }
    const ui = openDrawer("Table Harvest");
    const label = el("label", "Choose a table"),
      select = document.createElement("select");
    select.setAttribute("aria-label", "Table to export");
    const rows = (table) =>
      Array.from(table.rows)
        .filter((row) => row.closest("table") === table)
        .map((row) =>
          Array.from(row.cells).map((cell) => cell.innerText.trim()),
        );
    tables.forEach((table, i) => {
      const info = core.summary(rows(table)),
        option = document.createElement("option");
      option.value = i;
      option.textContent =
        (table.caption?.textContent?.trim() || "Table " + (i + 1)) +
        " · " +
        info.rows +
        " rows × " +
        info.columns +
        " columns";
      select.append(option);
    });
    label.append(select);
    const details = el("p", "", "small"),
      preview = document.createElement("pre");
    preview.style.cssText =
      "overflow:auto;background:#e9efdf;padding:15px;font:11px/1.7 monospace;max-height:280px;";
    const protection = el(
        "label",
        "Protect spreadsheet formulas (recommended)",
      ),
      check = document.createElement("input");
    check.type = "checkbox";
    check.checked = true;
    check.style.width = "auto";
    check.setAttribute("aria-label", "Protect spreadsheet formulas");
    protection.append(check);
    function update() {
      const data = rows(tables[Number(select.value)]),
        info = core.summary(data);
      details.textContent = info.ragged
        ? "Rows have different lengths. Merged cells are exported once, not expanded."
        : "Merged cells are exported once, not expanded.";
      preview.textContent = core.serialize(data.slice(0, 6), {
        protect: check.checked,
      });
    }
    select.addEventListener("change", update);
    check.addEventListener("change", update);
    const actions = el("div", "", "actions");
    for (const type of ["csv", "tsv"])
      actions.append(
        action("Download " + type.toUpperCase(), () => {
          const table = tables[Number(select.value)],
            data = rows(table);
          download(
            core.filename(table.caption?.textContent || document.title, type),
            core.serialize(data, {
              delimiter: type === "tsv" ? "\t" : ",",
              protect: check.checked,
            }),
            "text/" +
              (type === "tsv" ? "tab-separated-values" : "csv") +
              ";charset=utf-8",
          );
          ui.status.textContent =
            "Export prepared. Your browser handles the download.";
        }),
      );
    ui.body.append(label, details, protection, preview, actions);
    update();
  });
})();
