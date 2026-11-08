'use strict';

(() => {
  const from = document.getElementById('from-tuning');
  const to = document.getElementById('to-tuning');
  const sharps = document.getElementById('sharp-names');
  if (!from || !to || !sharps) return;

  const tunings = new Map([...to.options].map(option => [option.value, {
    name: option.textContent,
    notes: option.dataset.notes.split(',').map(Number),
    preset: option.dataset.preset,
    summary: option.dataset.summary
  }]));
  const rows = [...document.querySelectorAll('.string-comparison tbody tr')];
  const flatNames = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  const sharpNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

  function noteName(midi) {
    return (sharps.checked ? sharpNames : flatNames)[midi % 12] + (Math.floor(midi / 12) - 1);
  }

  function interval(semitones) {
    const steps = Math.abs(semitones) / 2;
    const whole = Math.floor(steps);
    const fraction = steps % 1 ? '½' : '';
    const number = whole ? String(whole) + fraction : fraction;
    return `${semitones < 0 ? 'Down' : 'Up'} ${number} ${steps === 1 || steps === 0.5 ? 'step' : 'steps'}`;
  }

  function render(updateAddress = true) {
    const start = tunings.get(from.value);
    const target = tunings.get(to.value);
    const changed = [];

    rows.forEach((row, index) => {
      const delta = target.notes[index] - start.notes[index];
      if (delta) changed.push(6 - index);
      row.classList.toggle('changed', delta !== 0);
      row.querySelector('.from-note').textContent = noteName(start.notes[index]);
      row.querySelector('.target-note').textContent = noteName(target.notes[index]);
      row.querySelector('.movement').textContent = delta ? interval(delta) : 'Keep this string';
    });

    document.getElementById('comparison-title').textContent = `${start.name} → ${target.name}`;
    document.getElementById('target-notes').textContent = target.notes.map(noteName).join(' · ');
    document.getElementById('comparison-caption').textContent = `Six-string guitar, thickest to thinnest. Starting in ${start.name}, changing to ${target.name}.`;
    document.getElementById('comparison-status').textContent = changed.length === 0
      ? 'These are the same tuning. No strings need to change.'
      : changed.length === 1
        ? `Only string ${changed[0]} changes. Keep the other five strings as they are.`
        : changed.length === 6
          ? 'All six strings change. Check each target note, then recheck the whole guitar.'
          : `Change strings ${changed.join(', ')}. Keep the other strings as they are.`;
    document.getElementById('target-explanation').textContent = target.summary;
    document.getElementById('app-tuning-guidance').textContent = target.preset
      ? `${target.name} is a built-in Guitar preset in MultiTuner, included free. Save it within your two free tuners.`
      : `Use MultiTuner’s free Chromatic mode to reach these notes. Creating a saved ${target.name} preset uses Premium’s custom-tuning feature.`;

    if (updateAddress) {
      const state = new URLSearchParams({from: from.value, to: to.value, names: sharps.checked ? 'sharps' : 'flats'});
      history.replaceState(null, '', '#' + state.toString());
    }
  }

  function restoreAddress() {
    const hash = location.hash.slice(1);
    if (tunings.has(hash)) {
      from.value = 'standard';
      to.value = hash;
      sharps.checked = false;
    } else {
      const state = new URLSearchParams(hash);
      from.value = tunings.has(state.get('from')) ? state.get('from') : 'standard';
      to.value = tunings.has(state.get('to')) ? state.get('to') : 'drop-d';
      sharps.checked = state.get('names') === 'sharps';
    }
    render(false);
  }

  from.addEventListener('change', () => render());
  to.addEventListener('change', () => render());
  sharps.addEventListener('change', () => render());
  document.getElementById('swap-tunings').addEventListener('click', () => {
    const previous = from.value;
    from.value = to.value;
    to.value = previous;
    render();
  });
  document.querySelectorAll('.finder-examples button').forEach(button => {
    button.addEventListener('click', () => {
      from.value = button.dataset.from;
      to.value = button.dataset.to;
      render();
    });
  });
  window.addEventListener('hashchange', restoreAddress);
  restoreAddress();
  document.querySelectorAll('.finder-controls, .finder-toolbar, .finder-examples').forEach(element => {
    element.hidden = false;
  });
})();
