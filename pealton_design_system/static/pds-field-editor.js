/* ============================================================================
 * Pealton Design System — inline field-editor module (PLT-081, Epic 3)
 *
 * The ONE edit grammar the design system defines. A framework-free, ZERO
 * runtime-dep vanilla-JS factory that turns any mount element into a per-field
 * inline editor: display → in-place edit with an explicit ✓ confirm / ✕ cancel,
 * Enter = confirm, Esc = cancel. It is deliberately STANDALONE — it knows
 * nothing about tables — so the SAME grammar is reused inside `pds-table` cells
 * AND inside the Epic 4 detail drawer (contract docs/TABLE-CONTRACT.md
 * §Inline edit: "inline and drawer share ONE grammar").
 *
 * Behaviour (contract §Inline edit, §Concurrency, §Confirm ladder rung 1):
 *   - types: text / select / number, each with an optional validate(value) hook;
 *   - wait-not-optimistic: confirm awaits the consumer's onSave(value) promise;
 *     the control + both buttons are disabled and a spinner shows in flight, and
 *     a second confirm while busy is a no-op (blocks double-submit);
 *   - cancel restores the prior committed value and never calls onSave;
 *   - Esc cancels AND does NOT bubble (stopPropagation) so a drawer-hosted editor
 *     swallows its own Esc instead of closing the outer <dialog>;
 *   - 409 concurrency: if onSave rejects with {conflict:true, current} the editor
 *     refreshes to the SERVER value, shows an inline notice, fires onConflict,
 *     stays re-openable, and NEVER silently overwrites the server value.
 *
 * Security: a single `escapeHtml` helper escapes every string this module turns
 * into HTML; dynamic values use `textContent` (inherently safe). No HR/business
 * field names, no endpoints, no external URL are baked in.
 *
 * API:  window.createFieldEditor(mount, options)  /  window.PDS.createFieldEditor
 *       (also module.exports in Node, for the test harness — no browser change)
 * ========================================================================== */
(function () {
  "use strict";

  /* The global object in a browser (window) OR under Node (globalThis), so the
   * source-level test harness can load this exact file with a DOM stub. */
  var root =
    typeof window !== "undefined"
      ? window
      : typeof globalThis !== "undefined"
      ? globalThis
      : this;

  /* -- sanitiser -------------------------------------------------------------
   * The SINGLE place a string becomes HTML in this module (notice/error copy).
   * Values themselves are set via textContent, which never parses HTML. */
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

  function clearEl(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /* Normalise a select's choices: accept [{value,label}] OR bare values. */
  function normaliseChoices(choices) {
    return (choices || []).map(function (c) {
      if (c && typeof c === "object") {
        return { value: c.value, label: c.label == null ? c.value : c.label };
      }
      return { value: c, label: c };
    });
  }

  /* -- createFieldEditor(mount, options) -------------------------------------
   * Build a per-field editor inside `mount` and return a controller. */
  function createFieldEditor(mount, options) {
    options = options || {};

    var host = resolveEl(mount);
    if (!host) {
      throw new Error("createFieldEditor: mount element not found");
    }
    if (typeof options.onSave !== "function") {
      throw new Error("createFieldEditor: options.onSave (a promise) is required");
    }

    var type = options.type || "text";
    var choices = normaliseChoices(options.choices || options.options);
    var validate = typeof options.validate === "function" ? options.validate : null;

    // Neutral, non-business fallbacks — real per-view copy is caller-supplied.
    var conflictText =
      options.conflictText != null
        ? options.conflictText
        : "This value changed elsewhere — review the current value and re-apply.";
    var errorText =
      options.errorText != null ? options.errorText : "Could not save — try again.";

    // Our own root inside the mount, so we never clobber sibling cell content.
    var rootEl = makeEl("div", "pds-field-editor");
    host.appendChild(rootEl);

    /* -- state --------------------------------------------------------------- */
    var committed = options.value; // the last value the server accepted
    var editing = false;
    var busy = false;
    var notice = null; // { text, kind } shown in display mode after a conflict/…

    // live edit-mode references (rebuilt each open)
    var control = null;
    var confirmBtn = null;
    var cancelBtn = null;
    var msgEl = null;

    function displayText() {
      return committed == null ? "" : String(committed);
    }

    /* -- display mode --------------------------------------------------------
     * A clickable value that opens the editor, plus any lingering notice. */
    function renderDisplay() {
      clearEl(rootEl);
      control = confirmBtn = cancelBtn = msgEl = null;

      var value = makeEl("button", "pds-field-editor__display");
      value.type = "button";
      value.textContent = displayText(); // textContent = no HTML parsing
      value.addEventListener("click", open);
      rootEl.appendChild(value);

      if (notice) {
        var note = makeEl(
          "div",
          "pds-field-editor__notice pds-field-editor__notice--" + notice.kind
        );
        // escapeHtml keeps caller copy inert even though it is our own default.
        note.innerHTML = escapeHtml(notice.text);
        rootEl.appendChild(note);
      }
    }

    /* -- edit mode ----------------------------------------------------------- */
    function buildControl() {
      var el;
      if (type === "select") {
        el = makeEl("select", "pds-field-editor__control");
        choices.forEach(function (c) {
          var opt = makeEl("option");
          opt.value = c.value;
          opt.textContent = c.label == null ? "" : String(c.label);
          el.appendChild(opt);
        });
        el.value = committed == null ? "" : String(committed);
      } else {
        el = makeEl("input", "pds-field-editor__control");
        el.type = type === "number" ? "number" : "text";
        el.value = committed == null ? "" : String(committed);
      }
      return el;
    }

    function onKeydown(e) {
      if (e.key === "Enter") {
        // Swallow Enter so it cannot also submit an outer form / double-fire.
        e.preventDefault();
        e.stopPropagation();
        confirm();
      } else if (e.key === "Escape" || e.key === "Esc") {
        // CRITICAL: cancel WITHOUT bubbling — a drawer's own <dialog> must not
        // close because the user cancelled an inline field (contract Keyboard).
        e.preventDefault();
        e.stopPropagation();
        cancel();
      }
    }

    function renderEdit() {
      clearEl(rootEl);
      notice = null;

      control = buildControl();
      control.addEventListener("keydown", onKeydown);
      rootEl.appendChild(control);

      var actions = makeEl("span", "pds-field-editor__actions");
      confirmBtn = makeEl("button", "pds-field-editor__confirm");
      confirmBtn.type = "button";
      confirmBtn.setAttribute("aria-label", "confirm");
      confirmBtn.textContent = "✓"; // ✓
      confirmBtn.addEventListener("click", confirm);

      cancelBtn = makeEl("button", "pds-field-editor__cancel");
      cancelBtn.type = "button";
      cancelBtn.setAttribute("aria-label", "cancel");
      cancelBtn.textContent = "✕"; // ✕
      cancelBtn.addEventListener("click", cancel);

      actions.appendChild(confirmBtn);
      actions.appendChild(cancelBtn);
      rootEl.appendChild(actions);

      msgEl = makeEl("div", "pds-field-editor__msg");
      msgEl.hidden = true;
      rootEl.appendChild(msgEl);

      if (control.focus) control.focus();
    }

    function showMessage(text, kind) {
      if (!msgEl) return;
      msgEl.className = "pds-field-editor__msg pds-field-editor__msg--" + kind;
      msgEl.innerHTML = escapeHtml(text); // escaped: copy may be caller-supplied
      msgEl.hidden = false;
    }

    /* Toggle the in-flight busy lock: control + both buttons disabled, spinner
     * shown. This is what makes commit wait-not-optimistic and double-submit-safe. */
    function setBusy(on) {
      busy = on;
      if (control) control.disabled = on;
      if (confirmBtn) {
        confirmBtn.disabled = on;
        confirmBtn.classList.toggle("is-busy", on);
      }
      if (cancelBtn) cancelBtn.disabled = on;
    }

    function currentInputValue() {
      return control ? control.value : committed;
    }

    /* -- commit / cancel ----------------------------------------------------- */
    function confirm() {
      if (!editing || busy) return; // busy → no-op: blocks double-submit

      var value = currentInputValue();

      if (validate) {
        var verdict = validate(value);
        if (verdict !== true && verdict !== undefined && verdict !== null) {
          // string/false → invalid; keep editing and surface the reason.
          showMessage(typeof verdict === "string" ? verdict : "Invalid value", "error");
          return;
        }
      }

      // No change → nothing to persist; close like a cancel (no onSave).
      if (String(value) === String(committed == null ? "" : committed)) {
        cancel();
        return;
      }

      setBusy(true);
      Promise.resolve()
        .then(function () {
          return options.onSave(value);
        })
        .then(
          function () {
            // success: server accepted → adopt the value (wait-not-optimistic).
            committed = value;
            editing = false;
            busy = false;
            notice = null;
            renderDisplay();
            if (typeof options.onCommit === "function") options.onCommit(value);
          },
          function (err) {
            if (err && err.conflict === true) {
              handleConflict(err);
            } else {
              // recoverable failure: unlock and let the user retry in place.
              setBusy(false);
              showMessage(err && err.message ? err.message : errorText, "error");
            }
          }
        );
    }

    /* 409 concurrency: refresh to the SERVER value, notify, never overwrite. */
    function handleConflict(err) {
      var current = err && "current" in err ? err.current : committed;
      committed = current; // adopt the server's value — no silent overwrite
      editing = false;
      busy = false;
      notice = { text: conflictText, kind: "conflict" };
      renderDisplay(); // shows the FRESH value + the inline notice
      if (typeof options.onConflict === "function") options.onConflict(current);
    }

    function cancel() {
      if (busy) return; // never abandon an in-flight save mid-request
      editing = false;
      notice = null;
      renderDisplay(); // restores the prior committed value
      if (typeof options.onCancel === "function") options.onCancel();
    }

    function open() {
      if (editing || busy) return;
      editing = true;
      renderEdit();
    }

    function close() {
      editing = false;
      renderDisplay();
    }

    function destroy() {
      if (rootEl.parentNode) rootEl.parentNode.removeChild(rootEl);
    }

    // start in display mode
    renderDisplay();

    return {
      element: rootEl,
      open: open,
      close: close,
      confirm: confirm,
      cancel: cancel,
      getValue: function () {
        return committed;
      },
      isBusy: function () {
        return busy;
      },
      isEditing: function () {
        return editing;
      },
      destroy: destroy,
    };
  }

  /* Expose BOTH ways (mirrors pds.js / pds-table.js), plus a Node export so the
   * source-level behavioural harness can require this exact file. */
  root.createFieldEditor = createFieldEditor;
  root.PDS = root.PDS || {};
  root.PDS.createFieldEditor = createFieldEditor;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createFieldEditor: createFieldEditor };
  }
})();
