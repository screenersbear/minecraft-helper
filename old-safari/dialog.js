// The block picker uses a <dialog>, which old Safari doesn't have. This gives dialogs what the picker uses:
// showModal (show it, with a dark layer behind that closes it when tapped), close (hide it, and say so with a
// "close" event) and open. styles/old-safari.css places it at the bottom of the screen.

if (typeof window.HTMLDialogElement === 'undefined') {
  const proto = HTMLUnknownElement.prototype;
  const shade = new WeakMap();
  Object.defineProperty(proto, 'open', {
    configurable: true,
    get() {
      return this.hasAttribute('open');
    },
  });
  proto.showModal = function showModal() {
    const back = document.createElement('div');
    back.className = 'dialog-back';
    back.addEventListener('click', () => this.close());
    this.before(back);
    shade.set(this, back);
    this.setAttribute('open', '');
  };
  proto.close = function close() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    shade.get(this)?.remove();
    this.dispatchEvent(new Event('close'));
  };
}
