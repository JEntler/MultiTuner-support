(() => {
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) return;

    const player = document.querySelector('#reference-player');
    const status = document.querySelector('#reference-status');
    const stopButton = document.querySelector('#reference-stop');
    const buttons = document.querySelectorAll('.reference-card button');
    const sounds = new Map();
    const segmentSeconds = 2;
    let context;
    let output;
    let session;

    function stop() {
        const playing = session;
        session = undefined;
        if (playing) {
            playing.note?.classList.remove('is-playing');
            if (playing.source) {
                playing.source.onended = null;
                playing.source.stop();
                playing.source.disconnect();
                playing.envelope.disconnect();
            }
            if (playing.trigger.hasAttribute('data-play')) {
                playing.trigger.textContent = 'Play all notes';
                playing.trigger.setAttribute('aria-label', playing.triggerLabel);
            }
        }
        player.hidden = true;
        status.textContent = '';
    }

    function getSound(name) {
        if (!sounds.has(name)) {
            const request = fetch(`assets/tuning-audio/${name}.mp3`)
                .then(response => {
                    if (!response.ok) throw new Error('Audio unavailable');
                    return response.arrayBuffer();
                })
                .then(data => context.decodeAudioData(data))
                .catch(error => {
                    sounds.delete(name);
                    throw error;
                });
            sounds.set(name, request);
        }
        return sounds.get(name);
    }

    function playNext(playing, buffer, index) {
        if (session !== playing) return;
        const note = playing.notes[index];
        if (!note) {
            const restoreFocus = document.activeElement === stopButton;
            stop();
            if (restoreFocus) playing.trigger.focus();
            return;
        }

        playing.note?.classList.remove('is-playing');
        playing.note = note;
        note.classList.add('is-playing');
        const noteName = note.querySelector('strong').textContent;
        status.textContent = `Playing ${noteName} · ${playing.instrument}`;

        const source = context.createBufferSource();
        const envelope = context.createGain();
        const start = context.currentTime + 0.015;
        const duration = playing.notes.length === 1 ? 1.88 : 1.1;
        const segment = Number(note.dataset.segment);
        source.buffer = buffer;
        source.connect(envelope);
        envelope.connect(output);
        envelope.gain.setValueAtTime(1, start);
        envelope.gain.setValueAtTime(1, start + duration - 0.12);
        envelope.gain.linearRampToValueAtTime(0, start + duration);
        source.onended = () => {
            playing.source = undefined;
            source.disconnect();
            envelope.disconnect();
            playNext(playing, buffer, index + 1);
        };
        playing.source = source;
        playing.envelope = envelope;
        source.start(start, segment * segmentSeconds, duration);
    }

    async function play(trigger) {
        const wasPlaying = session?.trigger === trigger;
        stop();
        if (wasPlaying) return;

        const card = trigger.closest('.reference-card');
        const instrument = card.querySelector('h3').textContent;
        const allNotes = trigger.hasAttribute('data-play');
        const notes = allNotes ? [...card.querySelectorAll('.reference-note')] : [trigger];
        const playing = { trigger, triggerLabel: trigger.getAttribute('aria-label'), instrument, notes };
        session = playing;
        player.hidden = false;
        status.textContent = `Loading sound · ${instrument}`;
        if (allNotes) {
            trigger.textContent = 'Stop';
            trigger.setAttribute('aria-label', `Stop ${instrument}`);
        }

        try {
            if (!context) {
                context = new AudioContextType();
                output = context.createGain();
                output.gain.value = 0.85;
                output.connect(context.destination);
            }
            const [, buffer] = await Promise.all([context.resume(), getSound(card.dataset.sound)]);
            playNext(playing, buffer, 0);
        } catch {
            if (session !== playing) return;
            stop();
            player.hidden = false;
            status.textContent = 'Audio could not play. Try the note again.';
        }
    }

    stopButton.addEventListener('click', () => {
        const trigger = session?.trigger;
        stop();
        trigger?.focus();
    });
    for (const button of buttons) {
        button.disabled = false;
        button.addEventListener('click', () => play(button));
    }
    window.addEventListener('pagehide', stop);
})();
