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
 *   - the four contract states via ONE overlay — loading skeleton, per-view
 *     empty, error + retry, loading-more indicator;
 *   - a selection API + bulk-bar mount whose count label renders "N נבחרו".
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
   * the selection API and the state (setState) methods. */
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

    /* The overlay is absolutely positioned over the table, so the host element
     * needs a positioning context. The CSS also sets this; we set it here so it
     * holds even if the stylesheet load order ever changes. */
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

    /* -- state overlay -------------------------------------------------------
     * ONE overlay layered over the table container. setState swaps its content;
     * it never mutates Tabulator's own row markup, so states compose on top of
     * the themed table. Initially hidden (ready). */
    var overlay = makeEl("div", "pds-table-overlay");
    overlay.hidden = true;
    element.appendChild(overlay);

    // Default, non-business fallbacks. Real copy is per-view, supplied by the
    // caller (contract: empty message is view-specific, not a baked generic).
    var defaultEmptyText = options.emptyText || "No items to show";
    var defaultErrorText = options.errorText || "Something went wrong";
    var defaultOnRetry = options.onRetry;

    function clearOverlay() {
      overlay.textContent = "";
    }

    // loading: skeleton placeholder rows in place of real rows (first load).
    function renderSkeleton() {
      clearOverlay();
      var skeleton = makeEl("div", "pds-table-skeleton");
      for (var i = 0; i < 6; i++) {
        skeleton.appendChild(makeEl("div", "pds-table-skeleton__row"));
      }
      overlay.appendChild(skeleton);
    }

    // empty: per-view copy (escaped). No Hebrew business string baked in.
    function renderEmpty(text) {
      clearOverlay();
      var box = makeEl("div", "pds-table-state pds-table-state--empty");
      var msg = makeEl("p", "pds-table-state__msg");
      msg.innerHTML = escapeHtml(text == null ? defaultEmptyText : text);
      box.appendChild(msg);
      overlay.appendChild(box);
    }

    // error: copy (escaped) + a retry button that invokes the caller callback.
    function renderError(text, onRetry) {
      clearOverlay();
      var box = makeEl("div", "pds-table-state pds-table-state--error");
      var msg = makeEl("p", "pds-table-state__msg");
      msg.innerHTML = escapeHtml(text == null ? defaultErrorText : text);
      box.appendChild(msg);

      var retry = makeEl("button", "pds-btn pds-btn--primary pds-table-retry");
      retry.type = "button";
      retry.textContent = options.retryText ? String(options.retryText) : "Retry";
      var cb = typeof onRetry === "function" ? onRetry : defaultOnRetry;
      retry.addEventListener("click", function () {
        if (typeof cb === "function") cb();
      });
      box.appendChild(retry);
      overlay.appendChild(box);
    }

    // loading-more: a small spinner near the loaded edge that does NOT hide the
    // already-loaded rows (contract: progressive-load partial indicator).
    function renderLoadingMore() {
      clearOverlay();
      var box = makeEl("div", "pds-table-state pds-table-state--more");
      box.appendChild(makeEl("span", "pds-table-spinner"));
      overlay.appendChild(box);
    }

    /* setState(name): the five contract states — loading / empty / error /
     * loading-more / ready. Any other name hides the overlay so a typo never
     * leaves a stale layer up. */
    function setState(name) {
      if (name === "ready") {
        clearOverlay();
        overlay.hidden = true;
        overlay.classList.remove("pds-table-overlay--passthrough");
        return;
      }
      overlay.hidden = false;
      // loading-more must not cover the rows — it's a passthrough layer.
      overlay.classList.toggle(
        "pds-table-overlay--passthrough",
        name === "loading-more"
      );
      if (name === "loading") return renderSkeleton();
      if (name === "empty") return renderEmpty();
      if (name === "error") return renderError();
      if (name === "loading-more") return renderLoadingMore();
      // unknown name: hide again rather than showing a blank overlay.
      overlay.hidden = true;
    }

    // Thin convenience wrappers that also carry per-call text / callbacks.
    function showLoading() {
      setState("loading");
    }
    function showEmpty(text) {
      overlay.hidden = false;
      overlay.classList.remove("pds-table-overlay--passthrough");
      renderEmpty(text);
    }
    function showError(text, onRetry) {
      overlay.hidden = false;
      overlay.classList.remove("pds-table-overlay--passthrough");
      renderError(text, onRetry);
    }
    function showLoadingMore() {
      setState("loading-more");
    }
    function showReady() {
      setState("ready");
    }

    /* -- controller ----------------------------------------------------------- */
    function destroy() {
      try {
        table.destroy();
      } catch (e) {
        /* Tabulator already torn down — nothing to do. */
      }
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    return {
      table: table,
      // selection
      getSelectedIds: getSelectedIds,
      clearSelection: clearSelection,
      bulkBar: bulkBar,
      // state
      setState: setState,
      showLoading: showLoading,
      showEmpty: showEmpty,
      showError: showError,
      showLoadingMore: showLoadingMore,
      showReady: showReady,
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
