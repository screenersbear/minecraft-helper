// Pointer events for old Safari, which only has touch events: each finger touching, moving and lifting becomes a
// pointerdown, pointermove and pointerup on the element it started on, with the finger's position. That's all the
// swipe between pages, the hold-to-talk button and the photo crop box need.

if (!('PointerEvent' in window)) {
  const last = new Map();
  const fire = (type, touch, original) => {
    const event = new CustomEvent(type, { bubbles: true, cancelable: true });
    const before = last.get(touch.identifier) || touch;
    Object.assign(event, {
      pointerId: touch.identifier,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
      clientX: touch.clientX,
      clientY: touch.clientY,
      movementX: touch.clientX - before.clientX,
      movementY: touch.clientY - before.clientY,
    });
    last.set(touch.identifier, { clientX: touch.clientX, clientY: touch.clientY });
    if (!touch.target.dispatchEvent(event)) original.preventDefault();
  };
  const on = (touchType, pointerType) =>
    document.addEventListener(
      touchType,
      (e) => {
        for (const touch of e.changedTouches) fire(pointerType, touch, e);
        if (pointerType === 'pointerup' || pointerType === 'pointercancel') for (const touch of e.changedTouches) last.delete(touch.identifier);
      },
      { capture: true, passive: false },
    );
  on('touchstart', 'pointerdown');
  on('touchmove', 'pointermove');
  on('touchend', 'pointerup');
  on('touchcancel', 'pointercancel');
  // A touch already stays with the element it started on, so capturing it does nothing.
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
}
