(() => {
    const players = [...document.querySelectorAll('.reference-audio')];

    for (const player of players) {
        const card = player.closest('.reference-card');
        const fullTuning = card.querySelector('.reference-return');
        const track = card.querySelector('[data-reference-track]');
        const errorNotice = card.querySelector('[data-reference-error]');
        const openFile = errorNotice.querySelector('a');
        let currentNote;
        let request = 0;

        function selectClip(event) {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
                event.shiftKey || event.altKey || !player.canPlayType('audio/mpeg')) return;
            event.preventDefault();

            const link = event.currentTarget;
            const thisRequest = ++request;
            const isFullTuning = link === fullTuning;
            currentNote?.removeAttribute('aria-current');
            currentNote = isFullTuning ? undefined : link;
            currentNote?.setAttribute('aria-current', 'true');
            if (isFullTuning) {
                track.textContent = 'Full tuning';
                fullTuning.textContent = 'Replay full tuning';
            } else {
                const note = link.querySelector('strong').textContent;
                const string = link.querySelector('.reference-string').textContent;
                track.textContent = `${note} · String ${string}`;
                fullTuning.textContent = 'Play full tuning';
                fullTuning.hidden = false;
            }
            openFile.href = link.href;
            errorNotice.hidden = true;

            if (player.src !== link.href) {
                player.src = link.href;
            } else if (player.currentTime) {
                player.currentTime = 0;
            }
            // Call play directly during the link activation for Safari's media policy.
            player.play()?.catch(error => {
                if (thisRequest === request && error.name !== 'AbortError') errorNotice.hidden = false;
            });
        }

        for (const link of card.querySelectorAll('.reference-note, .reference-return')) {
            link.addEventListener('click', selectClip);
        }
        player.addEventListener('error', () => {
            if (player.error) errorNotice.hidden = false;
        });
        player.addEventListener('play', () => {
            if (player.paused) return;
            errorNotice.hidden = true;
            for (const other of players) {
                if (other !== player) other.pause();
            }
        });
    }

    window.addEventListener('pagehide', () => {
        for (const player of players) player.pause();
    });
})();
