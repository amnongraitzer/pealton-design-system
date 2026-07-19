/* Tiny hand-rolled DOM stub for the pds-field-editor behavioural harness.
 *
 * ZERO dependencies (no jsdom) — implements ONLY the DOM surface the module
 * touches, plus real bubbling so the "Esc must not bubble to an outer dialog"
 * behaviour is genuinely exercised (dispatchEvent walks up parentNode and stops
 * when a handler calls event.stopPropagation()). It is a TEST-only file. */

class ClassList {
  constructor(el) {
    this.el = el;
  }
  _set() {
    return new Set(
      String(this.el._className || "")
        .split(/\s+/)
        .filter(Boolean)
    );
  }
  _write(set) {
    this.el._className = Array.from(set).join(" ");
  }
  add(c) {
    const s = this._set();
    s.add(c);
    this._write(s);
  }
  remove(c) {
    const s = this._set();
    s.delete(c);
    this._write(s);
  }
  contains(c) {
    return this._set().has(c);
  }
  toggle(c, force) {
    const s = this._set();
    const on = force === undefined ? !s.has(c) : !!force;
    if (on) s.add(c);
    else s.delete(c);
    this._write(s);
    return on;
  }
}

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this._listeners = {};
    this._className = "";
    this._value = "";
    this._text = "";
    this._html = null;
    this.type = "";
    this.disabled = false;
    this.hidden = false;
    this.attributes = {};
    this.classList = new ClassList(this);
  }

  get className() {
    return this._className;
  }
  set className(v) {
    this._className = String(v == null ? "" : v);
  }

  get value() {
    return this._value;
  }
  set value(v) {
    this._value = v == null ? "" : String(v);
  }

  // Setting textContent replaces all content with plain text (no HTML parsing).
  get textContent() {
    if (this._html != null) return "";
    if (this.children.length) {
      return this.children.map((c) => c.textContent).join("");
    }
    return this._text;
  }
  set textContent(v) {
    this.children = [];
    this._html = null;
    this._text = String(v == null ? "" : v);
  }

  // Setting innerHTML replaces content; we keep the raw string (already escaped
  // by the module) — enough to assert what was injected.
  get innerHTML() {
    return this._html == null ? "" : this._html;
  }
  set innerHTML(v) {
    this.children = [];
    this._text = "";
    this._html = String(v == null ? "" : v);
  }

  get firstChild() {
    return this.children[0] || null;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }
  getAttribute(k) {
    return k in this.attributes ? this.attributes[k] : null;
  }
  removeAttribute(k) {
    delete this.attributes[k];
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const i = this.children.indexOf(child);
    if (i >= 0) this.children.splice(i, 1);
    child.parentNode = null;
    return child;
  }

  focus() {
    /* no-op in the stub */
  }

  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }

  dispatchEvent(evt) {
    if (!evt.target) evt.target = this;
    let node = this;
    while (node) {
      const fns = node._listeners[evt.type] || [];
      for (const fn of fns.slice()) fn.call(node, evt);
      if (evt._stop) break; // stopPropagation halts bubbling
      node = node.parentNode;
    }
    return !evt.defaultPrevented;
  }

  // convenience: depth-first find by class (test-only)
  querySelector(sel) {
    const cls = sel.startsWith(".") ? sel.slice(1) : null;
    const stack = this.children.slice();
    while (stack.length) {
      const n = stack.shift();
      if (cls && n.classList.contains(cls)) return n;
      stack.unshift(...n.children);
    }
    return null;
  }
}

export function makeDocument() {
  return {
    createElement: (t) => new El(t),
    querySelector: () => null,
  };
}

export function makeEvent(type, props) {
  return Object.assign(
    {
      type,
      target: null,
      defaultPrevented: false,
      _stop: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this._stop = true;
      },
    },
    props || {}
  );
}

export { El };
