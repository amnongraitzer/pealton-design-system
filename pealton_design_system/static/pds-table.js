/* ============================================================================
 * Pealton Design System — table wrapper module (PLT-080, Epic 3)
 *
 * The ONE themed table the DS ships. A thin, framework-free vanilla-JS wrapper
 * around Tabulator (no framework, no build, ZERO runtime deps). Tabulator itself
 * is NOT bundled — the consuming app loads it as a global `Tabulator`; this file
 * only wraps it so every Pealton HR table surface gets the same look + behaviour.
 *
 * What it gives every table (contract: docs/TABLE-CONTRACT.md):
 *   - the DS `pds-tabulator` theme, RTL by default, virtual vertical scroll,
 *     and NO pagination (progressive-scroll model);
 *   - a selection API + bulk-bar mount whose count label renders "N נבחרו".
 *   (State overlay — skeleton / empty / error / loading-more — added in Task 2.)
 *
 * Security: a single `escapeHtml` helper escapes ALL text this wrapper injects
 * into the DOM — caller state copy and built-in formatters both route through it
 * (project security posture: no unescaped external data reaches the DOM).
 *
 * API (mirrors pds.js):  window.createPdsTable(el, options)
 *                        window.PDS.createTable(el, options)
 * ========================================================================== */
(function () {
  "use strict";

  /* -- sanitiser -------------------------------------------------------------
   * The SINGLE place text becomes HTML. A Tabulator formatter that returns a
   * string inserts it as HTML, so every injected value (cell text, empty copy,
   * error copy) MUST pass through here first. Escapes the five HTML metachars. */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* -- small DOM helpers ----------------------------------------------------- */
  function resolveEl(elOrSelector) {
    if (typeof elOrSelector === "string") {
      return document.querySelector(elOrSelector);
    }
    return elOrSelector || null;
  }

  function makeEl(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  /* -- createPdsTable(el, options) -------------------------------------------
   * Initialise a DS-themed Tabulator on `el` and return a controller exposing
   * the selection API (Task 2 attaches the state methods to this same object). */
  function createPdsTable(el, options) {
    options = options || {};

    var element = resolveEl(el);
    if (!element) {
      throw new Error("createPdsTable: target element not found");
    }
    if (typeof Tabulator === "undefined") {
      throw new Error(
        "createPdsTable: global Tabulator is not loaded — the consuming app " +
          "must include Tabulator before pds-table.js"
      );
    }

    /* Apply the DS theme. Theme selectors are `.pds-tabulator.tabulator ...`,
     * so the element MUST carry `pds-tabulator` (Tabulator adds `.tabulator`). */
    element.classList.add("pds-tabulator");

    /* The overlay (Task 2) is absolutely positioned over the table, so the host
     * element needs a positioning context. The CSS also sets this; we set it
     * here so it holds even if the stylesheet load order ever changes. */
    if (getComputedStyle(element).position === "static") {
      element.style.position = "relative";
    }

    /* Which row-data field identifies a row (for selection payloads). Caller
     * configurable — NO business field name is baked in; default is "id". */
    var idField = options.idField || "id";
    var selectionEnabled = options.selectableRows !== false;

    /* Merge caller options OVER DS defaults (defaults are overridable), then
     * FORCE the non-negotiable contract options last so a caller cannot turn
     * pagination on or break RTL/virtual scroll by accident. */
    var config = Object.assign(
      {
        textDirection: "rtl", // RTL-safe default (Hebrew-first)
        renderVertical: "virtual", // virtual vertical scroll ON
        layout: "fitColumns",
      },
      options.tabulator || {},
      {
        // caller data passes straight through
        data: options.data || [],
      }
    );

    // Contract: progressive-scroll model — NEVER paginate. Force it off and
    // strip any pagination option a caller may have slipped in.
    config.pagination = false;
    delete config.paginationSize;
    delete config.paginationCounter;

    /* Selection column: a narrow, unsortable, centred checkbox column using
     * Tabulator's built-in rowSelection formatter for header + cell. */
    var columns = (options.columns || []).slice();
    if (selectionEnabled) {
      config.selectableRows = true;
      columns.unshift({
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        headerSort: false,
        hozAlign: "center",
        headerHozAlign: "center",
        width: 46,
        frozen: true,
        cssClass: "pds-table-select-col",
      });
    } else {
      config.selectableRows = false;
    }
    config.columns = columns;

    /* -- the Tabulator instance ---------------------------------------------- */
    var table = new Tabulator(element, config);

    /* -- selection + bulk-bar ------------------------------------------------
     * The DS provides ONLY: the mount, a count label ("N נבחרו"), and a clear
     * affordance. Consumers render their OWN action buttons into the mount. */
    var bulkBar = resolveEl(options.bulkBar);
    var countLabel = null;
    if (bulkBar) {
      bulkBar.classList.add("pds-bulk-bar");
      // A dedicated count-label node so consumers can append their own actions
      // without us clobbering them on each selection change.
      countLabel = bulkBar.querySelector(".pds-bulk-bar__count");
      if (!countLabel) {
        countLabel = makeEl("span", "pds-bulk-bar__count");
        bulkBar.appendChild(countLabel);
      }
    }

    function getSelectedIds() {
      return table.getSelectedData().map(function (row) {
        return row[idField];
      });
    }

    function clearSelection() {
      table.deselectRow();
    }

    function refreshBulkBar(selectedIds) {
      if (!bulkBar) return;
      var count = selectedIds.length;
      if (countLabel) {
        // Built-in Hebrew count label — the ONLY business string the DS bakes in
        // (contract Selection section: "N נבחרו").
        countLabel.textContent = count + " נבחרו";
      }
      bulkBar.hidden = count === 0;
    }

    // Fire on every selection change: recompute payload, update the bar, and
    // hand the caller {selectedIds, count, clear}.
    table.on("rowSelectionChanged", function () {
      var selectedIds = getSelectedIds();
      refreshBulkBar(selectedIds);
      if (typeof options.onSelectionChange === "function") {
        options.onSelectionChange({
          selectedIds: selectedIds,
          count: selectedIds.length,
          clear: clearSelection,
        });
      }
    });

    /* -- controller ----------------------------------------------------------
     * Task 2 attaches setState + the show* state methods onto this same object. */
    function destroy() {
      try {
        table.destroy();
      } catch (e) {
        /* Tabulator already torn down — nothing to do. */
      }
    }

    return {
      table: table,
      // selection
      getSelectedIds: getSelectedIds,
      clearSelection: clearSelection,
      bulkBar: bulkBar,
      // lifecycle
      destroy: destroy,
    };
  }

  /* Expose globally BOTH ways — a bare global and on the PDS namespace, mirroring
   * pds.js. */
  window.createPdsTable = createPdsTable;
  window.PDS = window.PDS || {};
  window.PDS.createTable = createPdsTable;
})();
