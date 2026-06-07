// ==================== АУДИО МОДУЛЬ ====================
let ambientAudio = null;
let audioUnlocked = false;

function initAudio() {
    if (!ambientAudio) {
        ambientAudio = new Audio('ambient.mp3');
        ambientAudio.loop = true;
        ambientAudio.volume = 0.25;
    }
}

function tryAutoPlay() {
    initAudio();
    if (!ambientAudio) return;
    ambientAudio.play().then(() => {
        audioUnlocked = true;
        state.soundEnabled = true;
        updateSoundButton();
    }).catch(() => {
        state.soundEnabled = false;
        updateSoundButton();
    });
}

function onFirstInteraction() {
    if (!ambientAudio || audioUnlocked) return;
    ambientAudio.play().then(() => {
        audioUnlocked = true;
        state.soundEnabled = true;
        updateSoundButton();
    }).catch(() => {});
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('touchstart', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
}

document.addEventListener('click', onFirstInteraction);
document.addEventListener('touchstart', onFirstInteraction);
document.addEventListener('keydown', onFirstInteraction);

function toggleSound() {
    initAudio();
    if (!ambientAudio) return;
    if (state.soundEnabled) {
        ambientAudio.pause();
        state.soundEnabled = false;
    } else {
        ambientAudio.play().then(() => {
            state.soundEnabled = true;
            audioUnlocked = true;
        }).catch(() => {
            state.soundEnabled = false;
        });
    }
    updateSoundButton();
}

function updateSoundButton() {
    const btn = document.getElementById('soundToggle');
    if (btn) btn.textContent = state.soundEnabled ? '🔊' : '🔇';
}

tryAutoPlay();
