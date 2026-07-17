/* ============================================================================
 * Pealton Design System — behaviour module (PLT-059, phase 5)
 *
 * The ONE small vanilla-JS file the DS ships (no framework, no deps). Today it
 * wires the overlay open/close API. Because overlays are native <dialog> +
 * showModal(), the hard parts — focus trap, Escape to close, focus restored to
 * the invoker — are handled by the browser, NOT re-implemented here.
 *
 * Markup API (no JS to write in the apps):
 *   <button data-pds-open="my-dialog">open</button>
 *   <dialog class="pds-modal" id="my-dialog"> … <button data-pds-close>×</button> </dialog>
 * Programmatic API:  PDS.openDialog(id)  /  PDS.closeDialog(id)
 * ========================================================================== */
(function () {
  "use strict";

  function open(dlg) {
    if (dlg && typeof dlg.showModal === "function" && !dlg.open) dlg.showModal();
  }
  function close(dlg) {
    if (dlg && dlg.open) dlg.close();
  }

  document.addEventListener("click", function (e) {
    // opener
    var opener = e.target.closest("[data-pds-open]");
    if (opener) {
      open(document.getElementById(opener.getAttribute("data-pds-open")));
      return;
    }
    // explicit close control
    var closer = e.target.closest("[data-pds-close]");
    if (closer) {
      close(closer.closest("dialog"));
      return;
    }
    // backdrop click: the event target is the <dialog> itself, and the click
    // lands OUTSIDE its content box. Measuring the box makes this robust no
    // matter where padding sits.
    if (e.target.tagName === "DIALOG" && e.target.open) {
      var r = e.target.getBoundingClientRect();
      var outside =
        e.clientX < r.left || e.clientX > r.right ||
        e.clientY < r.top  || e.clientY > r.bottom;
      if (outside) close(e.target);
    }
  });

  // Escape closes the top-most open dialog. Native <dialog> already does this for
  // real users; this is a belt-and-suspenders fallback — some automation/headless
  // engines deliver the (trusted) Escape keydown to the page but never invoke the
  // UA "close request", and older engines vary. Focus is trapped in the top-most
  // modal, so the dialog owning activeElement IS the one to close. close() is
  // idempotent, so this never fights or double-closes the native behaviour.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    // The top-most modal owns focus (it's trapped), so the dialog containing
    // activeElement IS the top one. Fallback: the LAST open dialog in the DOM
    // (closest to the top layer), never the first.
    var focused = document.activeElement && document.activeElement.closest("dialog");
    var openDialogs = document.querySelectorAll("dialog[open]");
    close(focused || openDialogs[openDialogs.length - 1]);
  });

  window.PDS = window.PDS || {};
  window.PDS.openDialog  = function (id) { open(document.getElementById(id)); };
  window.PDS.closeDialog = function (id) { close(document.getElementById(id)); };
})();
