/* Behavioural harness for pds-field-editor.js — runs under Node against the
 * hand-rolled DOM stub (no browser, no deps). Prints a JSON summary and exits
 * non-zero on any failure. Driven by tests/test_field_editor.py. */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { makeDocument, makeEvent } from "./dom-stub.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULE_PATH = path.resolve(
  __dirname,
  "../../pealton_design_system/static/pds-field-editor.js"
);

// Install the stub globals BEFORE loading the module, then require the exact
// shipped file (CommonJS module.exports branch).
globalThis.document = makeDocument();
globalThis.window = globalThis;
const require = createRequire(import.meta.url);
const { createFieldEditor } = require(MODULE_PATH);

const doc = globalThis.document;
const tick = () => new Promise((r) => setTimeout(r, 0));

const cases = [];
function check(name, cond, detail) {
  cases.push({ name, ok: !!cond, detail: cond ? "" : detail || "assertion failed" });
}

// Build an outer container (a stand-in for a <dialog>) wrapping the mount.
function scaffold() {
  const outer = doc.createElement("div");
  const mount = doc.createElement("div");
  outer.appendChild(mount);
  return { outer, mount };
}
function controlOf(ed) {
  return ed.element.querySelector(".pds-field-editor__control");
}
function displayText(ed) {
  const d = ed.element.querySelector(".pds-field-editor__display");
  return d ? d.textContent : null;
}

async function run() {
  /* 1. confirm applies (via the ✓ button click path) */
  {
    let saved = null;
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "a",
      onSave: (v) => {
        saved = v;
        return Promise.resolve();
      },
    });
    ed.open();
    controlOf(ed).value = "b";
    ed.element.querySelector(".pds-field-editor__confirm").dispatchEvent(makeEvent("click"));
    await tick();
    await tick();
    check("confirm calls onSave with new value", saved === "b", `saved=${saved}`);
    check("confirm commits the value", ed.getValue() === "b", `value=${ed.getValue()}`);
    check("confirm returns to display showing new value", displayText(ed) === "b", `disp=${displayText(ed)}`);
  }

  /* 2. cancel restores the prior value and never calls onSave (✕ path) */
  {
    let calls = 0;
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "keep",
      onSave: () => {
        calls++;
        return Promise.resolve();
      },
    });
    ed.open();
    controlOf(ed).value = "changed";
    ed.element.querySelector(".pds-field-editor__cancel").dispatchEvent(makeEvent("click"));
    await tick();
    check("cancel does not call onSave", calls === 0, `calls=${calls}`);
    check("cancel restores prior value", ed.getValue() === "keep", `value=${ed.getValue()}`);
    check("cancel returns to display with prior value", displayText(ed) === "keep", `disp=${displayText(ed)}`);
  }

  /* 3. Esc = cancel AND does NOT bubble to an outer dialog */
  {
    let outerSaw = false;
    let calls = 0;
    const { outer, mount } = scaffold();
    outer.addEventListener("keydown", () => {
      outerSaw = true;
    });
    const ed = createFieldEditor(mount, {
      value: "orig",
      onSave: () => {
        calls++;
        return Promise.resolve();
      },
    });
    ed.open();
    controlOf(ed).value = "typed";
    controlOf(ed).dispatchEvent(makeEvent("keydown", { key: "Escape" }));
    await tick();
    check("Esc cancels (no save)", calls === 0, `calls=${calls}`);
    check("Esc restores prior value", ed.getValue() === "orig", `value=${ed.getValue()}`);
    check("Esc does NOT bubble to outer dialog", outerSaw === false, "outer keydown fired");
    check("Esc leaves editor not editing", ed.isEditing() === false, "still editing");
  }

  /* 4. Enter = confirm */
  {
    let saved = null;
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "1",
      onSave: (v) => {
        saved = v;
        return Promise.resolve();
      },
    });
    ed.open();
    controlOf(ed).value = "9";
    controlOf(ed).dispatchEvent(makeEvent("keydown", { key: "Enter" }));
    await tick();
    await tick();
    check("Enter confirms (onSave called with new value)", saved === "9", `saved=${saved}`);
  }

  /* 5. busy blocks double-submit; control disabled in flight */
  {
    let calls = 0;
    let resolveSave;
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "x",
      onSave: (v) => {
        calls++;
        return new Promise((res) => {
          resolveSave = res;
        });
      },
    });
    ed.open();
    const ctl = controlOf(ed);
    ctl.value = "y";
    ed.confirm();
    await tick();
    check("busy: onSave called once after first confirm", calls === 1, `calls=${calls}`);
    check("busy: control disabled in flight", ctl.disabled === true, "control not disabled");
    check("busy: isBusy() true in flight", ed.isBusy() === true, "not busy");
    ed.confirm(); // second submit while busy → must be a no-op
    await tick();
    check("busy: second confirm does not re-call onSave", calls === 1, `calls=${calls}`);
    resolveSave();
    await tick();
    await tick();
    check("busy: commits after save resolves", ed.getValue() === "y", `value=${ed.getValue()}`);
    check("busy: no longer busy after resolve", ed.isBusy() === false, "still busy");
  }

  /* 6. 409 conflict: fresh value shown + onConflict fires + no silent overwrite */
  {
    let conflictWith = "__none__";
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "mine",
      onSave: () => Promise.reject({ conflict: true, current: "theirs" }),
      onConflict: (cur) => {
        conflictWith = cur;
      },
    });
    ed.open();
    controlOf(ed).value = "mine-edited";
    ed.confirm();
    await tick();
    await tick();
    check("conflict: onConflict fires with server current", conflictWith === "theirs", `got=${conflictWith}`);
    check("conflict: value refreshed to server value (no silent overwrite)", ed.getValue() === "theirs", `value=${ed.getValue()}`);
    check("conflict: display shows the fresh value", displayText(ed) === "theirs", `disp=${displayText(ed)}`);
    check("conflict: an inline notice is shown", !!ed.element.querySelector(".pds-field-editor__notice"), "no notice");
    check("conflict: editor re-openable", ed.isEditing() === false, "left in editing state");
    // re-open works
    ed.open();
    check("conflict: can re-open after conflict", ed.isEditing() === true, "did not re-open");
  }

  /* 7. validate blocks an invalid confirm */
  {
    let calls = 0;
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "5",
      type: "number",
      validate: (v) => (Number(v) > 0 ? true : "must be positive"),
      onSave: () => {
        calls++;
        return Promise.resolve();
      },
    });
    ed.open();
    controlOf(ed).value = "-3";
    ed.confirm();
    await tick();
    check("validate: invalid value blocks onSave", calls === 0, `calls=${calls}`);
    check("validate: stays in edit mode", ed.isEditing() === true, "left edit mode");
    check("validate: inline message shown", !ed.element.querySelector(".pds-field-editor__msg").hidden, "msg hidden");
  }

  /* 8. select type commits the chosen option value */
  {
    let saved = null;
    const { mount } = scaffold();
    const ed = createFieldEditor(mount, {
      value: "open",
      type: "select",
      choices: [
        { value: "open", label: "Open" },
        { value: "done", label: "Done" },
      ],
      onSave: (v) => {
        saved = v;
        return Promise.resolve();
      },
    });
    ed.open();
    check("select: control seeded with current value", controlOf(ed).value === "open", `v=${controlOf(ed).value}`);
    controlOf(ed).value = "done";
    ed.confirm();
    await tick();
    await tick();
    check("select: commits chosen value", saved === "done", `saved=${saved}`);
  }

  const failed = cases.filter((c) => !c.ok);
  const summary = { passed: cases.length - failed.length, failed: failed.length, cases };
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => {
  process.stdout.write(JSON.stringify({ passed: 0, failed: 1, error: String(e && e.stack || e) }) + "\n");
  process.exit(1);
});
