// Small things old Safari doesn't have, added only when they're missing: replaceChildren (empty an element and
// put new things in it) and matchAll (every match of a pattern in some text).

if (!Element.prototype.replaceChildren) {
  Element.prototype.replaceChildren = function replaceChildren(...nodes) {
    while (this.lastChild) this.removeChild(this.lastChild);
    this.append(...nodes);
  };
}

if (!String.prototype.matchAll) {
  String.prototype.matchAll = function* matchAll(pattern) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    let m = re.exec(this);
    while (m) {
      yield m;
      if (!m[0]) re.lastIndex += 1;
      m = re.exec(this);
    }
  };
}
