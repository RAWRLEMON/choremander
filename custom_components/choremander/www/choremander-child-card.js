/**
 * Choremander Child Card
 * A FUN, kid-friendly Lovelace card for completing chores!
 * Designed for children ages 5-10 with big buttons, bright colors, and celebrations!
 *
 * Version: 0.0.1 - Checkbox-style completion
 * Last Updated: 2026-01-01
 *
 * Features:
 * - Fun synthesized completion sounds (coin, levelup, fanfare, chime, powerup, undo)
 * - No external sound files needed - all sounds generated via Web Audio API
 * - Per-chore sound configuration
 * - Card-level default_sound and undo_sound config options
 * - Chore numbers with colorful, kid-friendly badges
 * - Clickable chore rows with checkbox visual indicator
 */

// Safer LitElement extraction - prevent crashes if HA core hasn't fully loaded
let LitElement;
const huiMasonry = customElements.get("hui-masonry-view");
const huiView = customElements.get("hui-view");

if (huiMasonry) {
  LitElement = Object.getPrototypeOf(huiMasonry);
} else if (huiView) {
  LitElement = Object.getPrototypeOf(huiView);
} else {
  // Fallback to a basic HTMLElement if HA core hasn't loaded Lit yet
  LitElement = class extends HTMLElement {};
  console.warn("[Choremander] LitElement not found on load. Card may not render correctly.");
}

const html = LitElement.prototype.html || ((strings, ...values) => strings[0]);
const css = LitElement.prototype.css || ((strings, ...values) => strings[0]);

class ChoremanderChildCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _loading: { type: Object },
      _celebrating: { type: String },
      _confetti: { type: Array },
      _optimisticCompletions: { type: Object },
      _activeTimeCategory: { type: String },
    };
  }

  constructor() {
    super();
    this._loading = {};
    this._celebrating = null;
    this._confetti = [];
    // Optimistic completions: track chores that were just completed
    // These are used to immediately hide the DONE button before the server confirms
    this._optimisticCompletions = {};
    // Audio context for generating sounds (lazy initialized)
    this._audioContext = null;
    // Active time category for in-card filtering (defaults to config)
    this._activeTimeCategory = null;
    this._configTimeCategory = null;
  }

  /**
   * Get or create the AudioContext (lazy initialization)
   * Must be called after user interaction due to browser autoplay policies
   */
  _getAudioContext() {
    if (!this._audioContext) {
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (required after user interaction)
    if (this._audioContext.state === 'suspended') {
      this._audioContext.resume();
    }
    return this._audioContext;
  }

  /**
   * Play a completion sound using Web Audio API
   * Generates fun synthesized sounds - no external files needed!
   * @param {string} soundName - Name of the sound to play (coin, levelup, fanfare, chime, powerup)
   */
  _playSound(soundName) {
    // Don't play if sound is "none" or not specified
    if (!soundName || soundName === 'none') {
      console.debug('[Choremander] Sound disabled for this chore');
      return;
    }

    try {
      const ctx = this._getAudioContext();
      const now = ctx.currentTime;

      switch (soundName) {
        case 'coin':
          this._playCoinSound(ctx, now);
          break;
        case 'levelup':
          this._playLevelUpSound(ctx, now);
          break;
        case 'fanfare':
          this._playFanfareSound(ctx, now);
          break;
        case 'chime':
          this._playChimeSound(ctx, now);
          break;
        case 'powerup':
          this._playPowerUpSound(ctx, now);
          break;
        case 'undo':
          this._playUndoSound(ctx, now);
          break;
        case 'fart1':
          this._playAudioFile('fart1.mp3');
          break;
        case 'fart2':
          this._playAudioFile('fart2.mp3');
          break;
        case 'fart3':
          this._playAudioFile('fart3.mp3');
          break;
        case 'fart4':
          this._playAudioFile('fart4.mp3');
          break;
        case 'fart5':
          this._playAudioFile('fart5.mp3');
          break;
        case 'fart6':
          this._playAudioFile('fart6.mp3');
          break;
        case 'fart7':
          this._playAudioFile('fart7.mp3');
          break;
        case 'fart8':
          this._playAudioFile('fart8.mp3');
          break;
        case 'fart9':
          this._playAudioFile('fart9.mp3');
          break;
        case 'fart10':
          this._playAudioFile('fart10.mp3');
          break;
        case 'fart_random':
          // Pick a random fart sound (1-10)
          const randomFartNum = Math.floor(Math.random() * 10) + 1;
          this._playAudioFile(`fart${randomFartNum}.mp3`);
          break;
        default:
          console.warn(`[Choremander] Unknown sound: ${soundName}, playing coin`);
          this._playCoinSound(ctx, now);
      }
    } catch (e) {
      console.warn('[Choremander] Error playing sound:', e);
    }
  }

  /**
   * Coin collect sound - classic video game coin pickup
   * Two quick ascending tones
   */
  _playCoinSound(ctx, startTime) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.3;

    // First tone (E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.frequency.value = 1318.5; // E6
    osc1.type = 'square';
    gain1.gain.setValueAtTime(0.5, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
    osc1.start(startTime);
    osc1.stop(startTime + 0.1);

    // Second tone (B6) - higher
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.frequency.value = 1975.5; // B6
    osc2.type = 'square';
    gain2.gain.setValueAtTime(0.5, startTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
    osc2.start(startTime + 0.08);
    osc2.stop(startTime + 0.25);
  }

  /**
   * Level up sound - triumphant ascending arpeggio
   */
  _playLevelUpSound(ctx, startTime) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.25;

    // C major arpeggio going up: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const duration = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.value = freq;
      osc.type = 'square';

      const noteStart = startTime + i * duration;
      gain.gain.setValueAtTime(0.6, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + duration + 0.1);
      osc.start(noteStart);
      osc.stop(noteStart + duration + 0.15);
    });

    // Final sustained chord
    const chordNotes = [523.25, 659.25, 783.99]; // C major chord
    const chordStart = startTime + notes.length * duration;
    chordNotes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.value = freq;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.3, chordStart);
      gain.gain.exponentialRampToValueAtTime(0.01, chordStart + 0.5);
      osc.start(chordStart);
      osc.stop(chordStart + 0.55);
    });
  }

  /**
   * Fanfare sound - celebratory trumpet-like fanfare
   */
  _playFanfareSound(ctx, startTime) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.2;

    // Fanfare pattern: G4, G4, G4, E4, G4, C5 (classic celebration pattern)
    const pattern = [
      { freq: 392.00, duration: 0.1, delay: 0 },      // G4
      { freq: 392.00, duration: 0.1, delay: 0.12 },   // G4
      { freq: 392.00, duration: 0.15, delay: 0.24 },  // G4
      { freq: 329.63, duration: 0.15, delay: 0.42 },  // E4
      { freq: 392.00, duration: 0.15, delay: 0.6 },   // G4
      { freq: 523.25, duration: 0.4, delay: 0.78 },   // C5 (long final note)
    ];

    pattern.forEach(({ freq, duration, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(masterGain);

      osc.frequency.value = freq;
      osc.type = 'sawtooth';

      const noteStart = startTime + delay;
      gain.gain.setValueAtTime(0.5, noteStart);
      gain.gain.setValueAtTime(0.5, noteStart + duration * 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + duration);

      osc.start(noteStart);
      osc.stop(noteStart + duration + 0.05);
    });
  }

  /**
   * Chime sound - simple pleasant bell chime
   */
  _playChimeSound(ctx, startTime) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.3;

    // Bell-like sound using multiple harmonics
    const fundamental = 880; // A5
    const harmonics = [1, 2, 3, 4.2]; // Slight inharmonicity for bell-like quality

    harmonics.forEach((harmonic, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(masterGain);

      osc.frequency.value = fundamental * harmonic;
      osc.type = 'sine';

      // Higher harmonics decay faster
      const amplitude = 0.5 / (i + 1);
      const decayTime = 0.8 / (i + 1);

      gain.gain.setValueAtTime(amplitude, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);

      osc.start(startTime);
      osc.stop(startTime + decayTime + 0.1);
    });
  }

  /**
   * Power up sound - ascending sweep with sparkle
   */
  _playPowerUpSound(ctx, startTime) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.25;

    // Ascending sweep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, startTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, startTime + 0.3);
    gain1.gain.setValueAtTime(0.4, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
    osc1.start(startTime);
    osc1.stop(startTime + 0.4);

    // Sparkle notes at the end
    const sparkleNotes = [1318.5, 1567.98, 1975.5]; // E6, G6, B6
    sparkleNotes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(masterGain);
      osc.frequency.value = freq;
      osc.type = 'sine';

      const noteStart = startTime + 0.25 + i * 0.05;
      gain.gain.setValueAtTime(0.3, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.01, noteStart + 0.2);
      osc.start(noteStart);
      osc.stop(noteStart + 0.25);
    });
  }

  /**
   * Undo sound - sad descending "womp womp" style
   * Two descending tones that sound disappointed/sad
   */
  _playUndoSound(ctx, startTime) {
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = 0.25;

    // First "womp" - descending tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(311.13, startTime);  // Eb4
    osc1.frequency.exponentialRampToValueAtTime(233.08, startTime + 0.25);  // Bb3
    gain1.gain.setValueAtTime(0.6, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.3, startTime + 0.2);
    gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    osc1.start(startTime);
    osc1.stop(startTime + 0.35);

    // Second "womp" - even lower descending tone (the sad part)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(233.08, startTime + 0.3);  // Bb3
    osc2.frequency.exponentialRampToValueAtTime(155.56, startTime + 0.7);  // Eb3
    gain2.gain.setValueAtTime(0.5, startTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.25, startTime + 0.55);
    gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.75);
    osc2.start(startTime + 0.3);
    osc2.stop(startTime + 0.8);

    // Optional: add a subtle low vibrato for extra sadness
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(116.54, startTime + 0.5);  // Bb2 (sub bass)
    gain3.gain.setValueAtTime(0.15, startTime + 0.5);
    gain3.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
    osc3.start(startTime + 0.5);
    osc3.stop(startTime + 0.85);
  }

  /**
   * Play an audio file from the www folder
   * Used for fart sounds (real audio files, not synthesized)
   * CC0 public domain from BigSoundBank.com
   * @param {string} filename - The audio file name (e.g., 'fart1.mp3')
   */
  _playAudioFile(filename) {
    try {
      // Build the URL to the audio file in the www folder
      const audio = new Audio(`/hacsfiles/choremander/${filename}`);
      audio.volume = 1.0;
      audio.play().catch(e => {
        console.warn('[Choremander] Error playing audio file:', e);
      });
    } catch (e) {
      console.warn('[Choremander] Error creating audio element:', e);
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
        /* Softer pastels (less neon / flatter look) */
        --fun-pink: #f4a7b9;
        --fun-purple: #c4b5fd;
        --fun-blue: #93c5fd;
        --fun-green: #86efac;
        --fun-yellow: #fde68a;
        --fun-orange: #fdba74;
        --fun-red: #fca5a5;
        --fun-cyan: #67e8f9;
        /* Uniform color variables - will be set dynamically */
        --uniform-chore-color: var(--fun-blue);
        --uniform-chore-bg-light: #eff6ff;
        --uniform-chore-bg-dark: #dbeafe;
      }

      ha-card {
        overflow: hidden;
        background: var(--ha-card-background, var(--card-background-color));
        background-image: none;
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 24px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
        padding: 0;
        display: flex;
        flex-direction: column;
      }

      .card-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-height: 0; /* allow inner scroller to size correctly */
      }

      ha-card[data-chore-color]:not([data-chore-color="default"]) {
        background: var(--uniform-chore-bg-light);
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.14);
      }

      /* Header with child avatar and points */
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(12px);
        gap: 12px;
        min-width: 0;
        border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
      }

      .child-info {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
        flex-shrink: 1;
      }

      .avatar-container {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: var(--card-background-color, rgba(255, 255, 255, 0.85));
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      .avatar-container ha-icon {
        --mdc-icon-size: 50px;
        color: var(--primary-color, var(--fun-purple));
      }

      .child-name-container {
        min-width: 0;
        flex: 1;
        overflow: hidden;
      }

      .child-name {
        font-size: var(--child-name-font-size, clamp(1.05rem, 4vw, 1.6rem));
        font-weight: 650;
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Points display - BIG and FUN! */
      .points-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.06);
        padding: 10px 12px;
        border-radius: 16px;
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
        min-width: 0;
        max-width: 45%;
        flex-shrink: 1;
      }

      .stars-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        width: 100%;
        justify-content: center;
      }

      .stars-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 0;
        flex-shrink: 1;
      }

      .stars-value {
        font-size: clamp(1rem, 4vw, 1.8rem);
        font-weight: bold;
        line-height: 1;
        display: flex;
        align-items: center;
        gap: 2px;
        white-space: nowrap;
      }

      .stars-value.my-stars {
        color: var(--primary-color, var(--fun-purple));
      }

      .stars-value.waiting-stars {
        color: var(--fun-orange);
        font-size: clamp(0.85rem, 3.5vw, 1.4rem);
        opacity: 0.9;
      }

      .stars-value ha-icon {
        --mdc-icon-size: clamp(16px, 4vw, 24px);
        flex-shrink: 0;
      }

      .stars-value.my-stars ha-icon {
        color: var(--fun-yellow);
        animation: spin-star 4s linear infinite;
      }

      .stars-value.waiting-stars ha-icon {
        color: var(--fun-orange);
        animation: pulse-star 2s ease-in-out infinite;
      }

      @keyframes spin-star {
        0% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(90deg) scale(1.1); }
        50% { transform: rotate(180deg) scale(1); }
        75% { transform: rotate(270deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
      }

      @keyframes pulse-star {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.1); opacity: 1; }
      }

      .stars-label {
        font-size: clamp(0.55rem, 2vw, 0.7rem);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }

      .stars-label.my-stars {
        color: var(--primary-color, var(--fun-purple));
      }

      .stars-label.waiting-stars {
        color: var(--fun-orange);
      }

      .stars-divider {
        width: 2px;
        height: 35px;
        background: var(--divider-color, rgba(0, 0, 0, 0.18));
        opacity: 0.7;
        margin: 0 4px;
        flex-shrink: 0;
      }

      /* Chores container */
      .chores-container {
        padding: 16px 18px 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: transparent;
        min-height: 200px;
        flex: 1 1 auto;
        min-height: 0; /* allow flex child to scroll */
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
      }

      .chores-container[data-chore-color]:not([data-chore-color="default"]) {
        background: rgba(255, 255, 255, 0.10);
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 650;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        padding: 6px 0;
      }

      .section-title ha-icon {
        --mdc-icon-size: 22px;
      }

      .time-category-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 8px 0 4px;
      }

      .time-category-button {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: var(--time-category-filter-font-size, 0.9rem);
        font-weight: 650;
        cursor: pointer;
        color: var(--primary-text-color);
        background: rgba(107, 91, 214, 0.14);
        background: color-mix(in srgb, var(--primary-color, #6b5bd6) 18%, transparent);
        transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.15s ease;
      }

      .time-category-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      }

      .time-category-button:active {
        transform: translateY(0);
      }

      .time-category-button.active {
        background: var(--primary-color, var(--fun-purple));
        color: white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      }

      .time-category-button ha-icon {
        --mdc-icon-size: 18px;
      }

      /* Time-category grouped sections (match reorder card concept, kid-friendly styling) */
      .time-category-section {
        margin-top: 12px;
      }

      .time-category-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--primary-text-color);
        font-weight: 650;
        font-size: var(--time-category-header-font-size, 1rem);
        letter-spacing: 0.1px;
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
      }

      .time-category-header ha-icon {
        --mdc-icon-size: 22px;
        color: var(--primary-color, var(--fun-purple));
      }

      .time-category-header .count {
        margin-left: auto;
        min-width: 34px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0 10px;
        font-size: 0.85em;
        font-weight: 700;
        color: var(--primary-text-color);
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
      }

      .time-category-chores {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: 12px;
      }

      /* Individual chore card - optimized for tablet touch, ENTIRE ROW IS CLICKABLE */
      .chore-card {
        background: var(--card-background-color, white);
        border-radius: 16px;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
        border-left: 0;
        transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        min-height: 70px;
        /* Prevent text selection on touch */
        -webkit-user-select: none;
        user-select: none;
        /* Smooth touch feedback */
        -webkit-tap-highlight-color: transparent;
        /* Make entire row clickable */
        cursor: pointer;
      }

      /* Default alternating colors */
      .chore-card[data-chore-color="default"]:nth-child(odd) {
        border-left: 0;
      }

      .chore-card[data-chore-color="default"]:nth-child(even) {
        border-left: 0;
      }

      .chore-card[data-chore-color="default"]:nth-child(3n) {
        border-left: 0;
      }

      .chore-card[data-chore-color="default"]:nth-child(4n) {
        border-left: 0;
      }

      /* Uniform color mode */
      .chore-card[data-chore-color]:not([data-chore-color="default"]) {
        border-left: 0;
      }

      .chores-container[data-chore-color]:not([data-chore-color="default"]) .chore-card {
        background: rgba(255, 255, 255, 0.55);
        border-color: rgba(255, 255, 255, 0.20);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      }

      @supports (background: color-mix(in srgb, white 50%, black)) {
        .chores-container[data-chore-color]:not([data-chore-color="default"]) .chore-card {
          background: color-mix(in srgb, var(--uniform-chore-bg-light) 30%, white);
          border-color: color-mix(in srgb, var(--uniform-chore-bg-dark) 14%, rgba(255, 255, 255, 0.55));
        }
      }

      /* Touch/hover feedback - works for both touch and mouse */
      .chore-card:active {
        transform: scale(0.99);
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.10);
      }

      @media (hover: hover) {
        .chore-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
        }
      }

      .chore-card.loading {
        opacity: 0.6;
        pointer-events: none;
      }

      .chore-card.celebrating {
        animation: celebrate-wiggle 0.5s ease-in-out;
      }

      @keyframes celebrate-wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-3deg); }
        75% { transform: rotate(3deg); }
      }

      .chore-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
      }

      /* Chore number wrapper (icon removed) */
      .chore-number-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      }

      /* Fun chore number badge */
      .chore-number-badge {
        width: 36px;
        height: 36px;
        min-width: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        font-weight: 650;
        color: white;
        text-shadow: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        transform: none !important;
        transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif);
      }

      .chore-card:hover .chore-number-badge {
        transform: scale(1.04);
      }

      /* Cycle through fun colors for number badges */
      .chore-number-badge.color-0 { background: var(--fun-pink); } /* Pink */
      .chore-number-badge.color-1 { background: var(--fun-blue); } /* Blue */
      .chore-number-badge.color-2 { background: var(--fun-green); } /* Green */
      .chore-number-badge.color-3 { background: var(--fun-orange); } /* Orange */
      .chore-number-badge.color-4 { background: var(--fun-purple); } /* Purple */
      .chore-number-badge.color-5 { background: var(--fun-cyan); } /* Cyan */
      .chore-number-badge.color-6 { background: var(--fun-yellow); } /* Yellow */
      .chore-number-badge.color-7 { background: var(--fun-red); } /* Red */

      /* Completed state for number badge */
      .chore-card.completed .chore-number-badge {
        filter: saturate(0.5);
        opacity: 0.7;
      }

      /* Checkbox for chore completion */
      .chore-checkbox {
        width: 44px;
        height: 44px;
        min-width: 44px;
        border-radius: 12px;
        border: 3px solid #bdc3c7;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .chore-checkbox ha-icon {
        --mdc-icon-size: 28px;
        color: transparent;
        transition: all 0.2s ease;
      }

      /* Unchecked state - hover effect */
      .chore-card:not(.completed):hover .chore-checkbox {
        border-color: var(--fun-green);
        background: rgba(46, 204, 113, 0.1);
      }

      /* Checked state */
      .chore-card.completed .chore-checkbox {
        border-color: var(--fun-green);
        background: var(--fun-green);
        box-shadow: 0 3px 10px rgba(46, 204, 113, 0.4);
      }

      .chore-card.completed .chore-checkbox ha-icon {
        color: white;
      }

      .chore-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        min-width: 0; /* Allow text truncation */
      }

      .chore-name {
        font-size: var(--chore-name-font-size, 1.15rem);
        font-weight: 550;
        letter-spacing: -0.01em;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .chore-points {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: var(--chore-points-font-size, 1.05rem);
        color: var(--secondary-text-color);
        font-weight: 600;
      }

      .chore-points ha-icon {
        --mdc-icon-size: var(--chore-stars-icon-size, 24px);
        color: var(--warning-color, var(--fun-yellow));
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Chore card in completed state - faded green styling */
      .chore-card.completed {
        opacity: 0.72;
        border-left-color: var(--fun-green) !important;
        background-image: none;
        background: rgba(255, 255, 255, 0.50);
        filter: saturate(0.9);
      }

      .chore-card.completed .chore-icon-container {
        background: rgba(255, 255, 255, 0.8);
      }

      .chore-card.completed .chore-name {
        color: var(--primary-text-color);
      }

      .chore-card.completed .chore-points {
        color: var(--secondary-text-color);
        opacity: 0.85;
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation: none !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* Empty state */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }

      .empty-state ha-icon {
        --mdc-icon-size: 80px;
        color: var(--fun-green);
        margin-bottom: 16px;
        animation: bounce 1s ease infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }

      .empty-state .message {
        font-size: 1.6rem;
        font-weight: bold;
        color: var(--fun-purple);
        margin-bottom: 8px;
      }

      .empty-state .submessage {
        font-size: 1.1rem;
        color: #666;
      }

      /* Celebration overlay */
      .celebration-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fade-in 0.3s ease;
      }

      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .celebration-content {
        background: white;
        border-radius: 30px;
        padding: 40px 50px;
        text-align: center;
        animation: pop-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        overflow: hidden;
      }

      @keyframes pop-in {
        from {
          transform: scale(0);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      .celebration-stars {
        font-size: 4rem;
        margin-bottom: 16px;
        animation: star-bounce 0.6s ease infinite;
      }

      @keyframes star-bounce {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.2) rotate(10deg); }
      }

      .celebration-title {
        font-size: 2.5rem;
        font-weight: bold;
        color: var(--fun-purple);
        margin-bottom: 8px;
      }

      .celebration-message {
        font-size: 1.3rem;
        color: #666;
        margin-bottom: 16px;
      }

      .celebration-points {
        font-size: 1.8rem;
        font-weight: bold;
        color: var(--fun-orange);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .celebration-points ha-icon {
        --mdc-icon-size: 28px;
        color: var(--fun-yellow);
      }

      /* Confetti */
      .confetti-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
        overflow: hidden;
      }

      .confetti {
        position: absolute;
        width: 10px;
        height: 10px;
        animation: confetti-fall 3s linear forwards;
      }

      @keyframes confetti-fall {
        0% {
          transform: translateY(-100px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }

      /* Error state */
      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: var(--error-color, #f44336);
        text-align: center;
      }

      .error-state ha-icon {
        --mdc-icon-size: 48px;
        margin-bottom: 16px;
      }

      /* Tablet-first responsive design */
      /* Portrait tablets and phones */
      @media (max-width: 600px) {
        .card-header {
          flex-direction: column;
          gap: 16px;
          text-align: center;
          padding: 24px 20px;
        }

        .child-info {
          flex-direction: column;
        }

        .chores-container {
          padding: 24px 16px;
          gap: 20px;
        }

        .chore-card {
          padding: 16px 18px;
          flex-wrap: wrap;
        }

        .chore-info {
          flex: 1 1 100%;
          margin-bottom: 12px;
        }

        .chore-number-wrapper {
          gap: 10px;
        }

        .chore-number-badge {
          width: 36px;
          height: 36px;
          min-width: 36px;
          font-size: 1.3rem;
        }

        .chore-checkbox {
          width: 40px;
          height: 40px;
          min-width: 40px;
        }

        .chore-checkbox ha-icon {
          --mdc-icon-size: 24px;
        }

        .chore-name {
          font-size: var(--chore-name-font-size, 1.3rem);
        }
      }

      /* Landscape tablets - ensure side-by-side layout */
      @media (min-width: 601px) and (max-height: 600px) {
        .chore-card {
          padding: 16px 20px;
        }

        .chore-checkbox {
          width: 42px;
          height: 42px;
          min-width: 42px;
        }
      }

      /* Large tablets (iPad Pro, etc.) */
      @media (min-width: 1024px) {
        .card-header {
          padding: 24px 32px;
        }

        .chores-container {
          padding: 28px;
          gap: 20px;
        }

        .section-title {
          font-size: 2rem;
        }

        .chore-card {
          padding: 24px 28px;
        }

        .chore-number-wrapper {
          gap: 14px;
        }

        .chore-number-badge {
          width: 48px;
          height: 48px;
          min-width: 48px;
          font-size: 1.7rem;
        }

        .chore-checkbox {
          width: 50px;
          height: 50px;
          min-width: 50px;
          border-radius: 14px;
        }

        .chore-checkbox ha-icon {
          --mdc-icon-size: 32px;
        }

        .chore-name {
          font-size: var(--chore-name-font-size, 1.7rem);
        }

        .chore-points {
          font-size: var(--chore-points-font-size, 1.4rem);
        }
      }

      .chore-card[line-size="small"] .chore-name {
        font-size: 1rem;
      }
      .chore-card[line-size="small"] .chore-points {
        font-size: 0.8rem;
      }
      .chore-card[line-size="small"] .chore-points ha-icon {
        --mdc-icon-size: 18px;
      }

      .chore-card[line-size="large"] .chore-name {
        font-size: 2rem;
      }
      .chore-card[line-size="large"] .chore-points {
        font-size: 1.5rem;
      }
      .chore-card[line-size="large"] .chore-points ha-icon {
        --mdc-icon-size: 32px;
      }
    `;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define an entity (choremander overview sensor)");
    }
    if (!config.child_id) {
      throw new Error("Please define a child_id");
    }
    const nextConfig = {
      time_category: "anytime",
      debug: false,
      default_sound: "coin",  // Default sound to use if chore doesn't specify one
      undo_sound: "undo",     // Sound to play when undoing a completion
      line_size: "medium",
      child_name_font_size: "default",
      time_category_filter_font_size: "default",
      time_category_header_font_size: "default",
      chore_box_font_size: "default",
      chore_padding: "20px 24px",
      chore_color: "default", // "default" for alternating colors, or a color value like "#ff6b9d"
      height: null, // e.g. "420px", "60vh", or 420 (pixels)
      ...config,
    };
    this.config = nextConfig;

    // Sync active time category with config unless the user has already switched
    const nextConfigCategory = nextConfig.time_category || "anytime";
    if (this._activeTimeCategory == null || this._activeTimeCategory === this._configTimeCategory) {
      this._activeTimeCategory = nextConfigCategory;
    }
    this._configTimeCategory = nextConfigCategory;
  }

  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement("choremander-child-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.choremander_overview",
      child_id: "",
      time_category: "morning",
      chore_color: "default",
      child_name_font_size: "default",
      time_category_filter_font_size: "default",
      time_category_header_font_size: "default",
      chore_box_font_size: "default",
    };
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const entity = this.hass.states[this.config.entity];

    if (!entity) {
      return html`
        <ha-card
          data-chore-color="${this.config?.chore_color || 'default'}"
          style="${this._getCardHeightStyle()}${this._getFontSizeVarsStyle()}"
        >
          <div class="error-state">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <div>Entity not found: ${this.config.entity}</div>
          </div>
        </ha-card>
      `;
    }

    // Set uniform color CSS variables if chore_color is specified
    if (this.config.chore_color && this.config.chore_color !== "default") {
      const color = this.config.chore_color;
      // Use the picked color directly for the column background,
      // and derive subtle variants for inner tiles/borders via CSS.
      const slightlyDarker = this._lightenColor(color, -0.06);
      this.style.setProperty("--uniform-chore-color", color);
      this.style.setProperty("--uniform-chore-bg-light", color);
      this.style.setProperty("--uniform-chore-bg-dark", slightlyDarker);
    }

    // Get child info
    const children = entity.attributes.children || [];
    const child = children.find(c => c.id === this.config.child_id);

    if (!child) {
      return html`
        <ha-card
          data-chore-color="${this.config?.chore_color || 'default'}"
          style="${this._getCardHeightStyle()}${this._getFontSizeVarsStyle()}"
        >
          <div class="error-state">
            <ha-icon icon="mdi:account-alert"></ha-icon>
            <div>Child not found: ${this.config.child_id}</div>
          </div>
        </ha-card>
      `;
    }

    // Get chores for this child and time category
    const allChores = entity.attributes.chores || [];
    const activeCategory = this._getActiveTimeCategory();

    // Log raw data for debugging assignment issues
    console.debug(
      `[Choremander] Rendering card for child "${child.name}" (${child.id}), time_category="${activeCategory}"`,
      `\n  Total chores in entity: ${allChores.length}`,
      `\n  Children in entity:`, children.map(c => ({id: c.id, name: c.name}))
    );

    // DEBUG: Create debug info object for visible debugging
    const debugInfo = {
      configChildId: this.config.child_id,
      activeTimeCategory: activeCategory,
      foundChildId: child.id,
      foundChildName: child.name,
      totalChores: allChores.length,
      sampleChores: allChores.slice(0, 3).map(c => ({
        name: c.name,
        assigned_to: c.assigned_to,
        assigned_to_type: typeof c.assigned_to,
        isArray: Array.isArray(c.assigned_to)
      }))
    };
    console.log('[Choremander DEBUG]', JSON.stringify(debugInfo, null, 2));

    const childChores = this._filterAndSortChores(allChores, child, activeCategory);

    // Get today's completions for this child (with timezone-aware filtering as fallback)
    // The backend provides todays_completions, but we also apply client-side filtering
    // to ensure timezone correctness matches the HA frontend timezone
    const allCompletions = entity.attributes.todays_completions || entity.attributes.completions || [];
    const todaysCompletions = this._filterCompletionsForToday(allCompletions);

    // Sort chores so completed ones appear at the bottom of the list (within any list/section)
    const sortDoneLast = (chores) =>
      [...chores].sort((a, b) => {
        const aDone = this._isChoreCompletedForToday(a, child, todaysCompletions);
        const bDone = this._isChoreCompletedForToday(b, child, todaysCompletions);
        if (aDone !== bDone) {
          return aDone ? 1 : -1;
        }
        return 0;
      });

    const childChoresSorted = sortDoneLast(childChores);

    // Log the filtering result
    console.debug(
      `[Choremander] After filtering: showing ${childChores.length} of ${allChores.length} chores for child "${child.name}" (${child.id})`
    );

    // Store debug info for rendering
    this._debugInfo = {
      ...debugInfo,
      filteredCount: childChores.length
    };

    const pointsIcon = entity.attributes.points_icon || "mdi:star";
    const pointsName = entity.attributes.points_name || "Stars";

    // Get child entity for avatar
    const childEntityId = Object.keys(this.hass.states).find(
      eid => this.hass.states[eid].attributes?.child_id === this.config.child_id
    );
    const childEntity = childEntityId ? this.hass.states[childEntityId] : null;
    const avatar = childEntity?.attributes?.avatar || "mdi:account-circle";

    // Get pending points for this child
    const pendingPoints = child.pending_points || 0;

    // Debug logging to help troubleshoot daily limit issues
    if (allCompletions.length > 0 || todaysCompletions.length > 0) {
      console.debug(
        `[Choremander] Child "${child.name}" (${child.id}): ` +
        `allCompletions = ${allCompletions.length}, todaysCompletions = ${todaysCompletions.length}`,
        { allCompletions, todaysCompletions }
      );
    }

    return html`
      <ha-card
        data-chore-color="${this.config.chore_color || 'default'}"
        style="${this._getCardHeightStyle()}${this._getFontSizeVarsStyle()}"
      >
        <div class="card-header">
          <div class="child-info">
            <div class="avatar-container">
              <ha-icon icon="${avatar}"></ha-icon>
            </div>
            <div class="child-name-container">
              <div class="child-name">${child.name}</div>
            </div>
          </div>
          <div class="points-display">
            <div class="stars-row">
              <div class="stars-section">
                <div class="stars-value my-stars">
                  <ha-icon icon="${pointsIcon}"></ha-icon>
                  ${child.points}
                </div>
                <div class="stars-label my-stars">My ${pointsName}</div>
              </div>
              ${pendingPoints > 0 ? html`
                <div class="stars-divider"></div>
                <div class="stars-section">
                  <div class="stars-value waiting-stars">
                    <ha-icon icon="mdi:timer-sand"></ha-icon>
                    +${pendingPoints}
                  </div>
                  <div class="stars-label waiting-stars">Waiting</div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="chores-container" data-chore-color="${this.config.chore_color || 'default'}">
            ${this._renderTimeCategoryFilters(activeCategory)}
            ${childChores.length === 0
              ? this._renderEmptyState()
              : this._renderChoresByTimeCategory({
                  activeCategory,
                  chores: childChoresSorted,
                  child,
                  pointsIcon,
                  todaysCompletions,
                  sortDoneLast,
                })}
          </div>

          ${this.config.debug === true ? html`
            <!-- DEBUG PANEL -->
            <div style="margin-top: 20px; padding: 10px; background: #333; color: #0f0; font-family: monospace; font-size: 11px; border-radius: 8px;">
              <div><strong>DEBUG INFO:</strong></div>
              <div>Config child_id: "${this.config.child_id}"</div>
              <div>Found child.id: "${this._debugInfo?.foundChildId}"</div>
              <div>Found child.name: "${this._debugInfo?.foundChildName}"</div>
              <div>Total chores: ${this._debugInfo?.totalChores}</div>
              <div>Filtered chores: ${this._debugInfo?.filteredCount}</div>
              <div style="margin-top: 5px;"><strong>Sample chores assigned_to:</strong></div>
              ${(this._debugInfo?.sampleChores || []).map(c => html`
                <div>- ${c.name}: ${JSON.stringify(c.assigned_to)} (isArray: ${c.isArray})</div>
              `)}
            </div>
          ` : ""}
        </div>

        ${this._celebrating ? this._renderCelebration() : ""}
        ${this._confetti.length > 0 ? this._renderConfetti() : ""}
      </ha-card>
    `;
  }

  _getCardHeightStyle() {
    const h = this.config?.height;
    if (h == null || h === "") return "";
    if (typeof h === "number" && Number.isFinite(h)) return `height: ${h}px;`;
    const s = String(h).trim();
    if (!s) return "";
    if (/^\d+(\.\d+)?$/.test(s)) return `height: ${s}px;`;
    return `height: ${s};`;
  }

  _getFontSizeVarsStyle() {
    const parts = [];

    const childNameSize = this._getChildNameFontSizeCss();
    if (childNameSize) parts.push(`--child-name-font-size: ${childNameSize}`);

    const filterButtonSize = this._getTimeCategoryFilterFontSizeCss();
    if (filterButtonSize) parts.push(`--time-category-filter-font-size: ${filterButtonSize}`);

    const headerSize = this._getTimeCategoryHeaderFontSizeCss();
    if (headerSize) parts.push(`--time-category-header-font-size: ${headerSize}`);

    const choreBoxVars = this._getChoreBoxFontSizeVarsStyle();
    if (choreBoxVars) parts.push(choreBoxVars);

    return parts.length ? `${parts.join(";")};` : "";
  }

  _getChoreBoxFontSizeVarsStyle() {
    const raw = this.config?.chore_box_font_size;
    if (!raw || raw === "default") return "";

    const num = this._parseNumericFontSizePx(raw);
    if (num == null) return "";

    // Interpret the number as "chore name font size in px", then derive stars/points/icon.
    const namePx = num;
    const pointsPx = Math.max(1, Math.round(namePx * 0.92));
    const iconPx = Math.max(1, Math.round(pointsPx * 1.1));

    return `--chore-name-font-size: ${namePx}px;--chore-points-font-size: ${pointsPx}px;--chore-stars-icon-size: ${iconPx}px`;
  }

  _parseNumericFontSizePx(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return null;

    const s = value.trim().toLowerCase();
    if (!s || s === "default") return null;

    const pxMatch = s.match(/^(-?\\d+(?:\\.\\d+)?)px$/);
    if (pxMatch) return Number(pxMatch[1]);

    const numMatch = s.match(/^-?\\d+(?:\\.\\d+)?$/);
    if (numMatch) return Number(s);

    return null;
  }

  _getChildNameFontSizeCss() {
    const size = this.config?.child_name_font_size;
    if (!size || size === "default") return null;

    const numericPx = this._parseNumericFontSizePx(size);
    if (numericPx != null) return `${numericPx}px`;

    const map = {
      small: "clamp(0.9rem, 3vw, 1.25rem)",
      medium: "clamp(1.05rem, 4vw, 1.6rem)", // current default
      large: "clamp(1.2rem, 5vw, 2.1rem)",
    };
    return map[size] || null;
  }

  _getTimeCategoryFilterFontSizeCss() {
    const size = this.config?.time_category_filter_font_size;
    if (!size || size === "default") return null;

    const numericPx = this._parseNumericFontSizePx(size);
    if (numericPx != null) return `${numericPx}px`;

    const map = {
      small: "0.75rem",
      medium: "0.9rem", // current default
      large: "1.05rem",
    };
    return map[size] || null;
  }

  _getTimeCategoryHeaderFontSizeCss() {
    const size = this.config?.time_category_header_font_size;
    if (!size || size === "default") return null;

    const numericPx = this._parseNumericFontSizePx(size);
    if (numericPx != null) return `${numericPx}px`;

    const map = {
      small: "0.85rem",
      medium: "1rem",
      large: "1.15rem",
    };
    return map[size] || null;
  }

  _getNormalizedTimeCategory(chore) {
    const category = String(chore?.time_category || "").trim().toLowerCase();
    const known = new Set(["morning", "afternoon", "evening", "night", "anytime"]);
    if (known.has(category)) return category;
    // Unknown/missing categories get treated as anytime so they still show up.
    return "anytime";
  }

  _renderChoresByTimeCategory({ activeCategory, chores, child, pointsIcon, todaysCompletions, sortDoneLast }) {
    const timeCategories = ["morning", "afternoon", "evening", "night", "anytime"];

    // When filtering to a single category, keep legacy behavior:
    // include chores in that category PLUS "anytime" chores.
    const categoriesToShow =
      activeCategory === "all"
        ? timeCategories
        : activeCategory === "anytime"
          ? ["anytime"]
          : timeCategories.includes(activeCategory)
            ? [activeCategory, "anytime"]
            : ["anytime"];

    const uniqueCategories = [];
    for (const c of categoriesToShow) {
      if (!uniqueCategories.includes(c)) uniqueCategories.push(c);
    }

    return html`
      ${uniqueCategories.map((category) => {
        const categoryChores = chores.filter((chore) => this._getNormalizedTimeCategory(chore) === category);
        if (categoryChores.length === 0) {
          return "";
        }

        const sorted = sortDoneLast(categoryChores);

        return html`
          <div class="time-category-section">
            <div class="time-category-header">
              <ha-icon icon="${this._getTimeCategoryIcon(category)}"></ha-icon>
              ${this._getTimeCategoryLabel(category)}
              <span class="count">${sorted.length}</span>
            </div>
            <div class="time-category-chores">
              ${sorted.map((chore, index) =>
                this._renderChoreCard(chore, child, pointsIcon, todaysCompletions, index)
              )}
            </div>
          </div>
        `;
      })}
    `;
  }

  _filterAndSortChores(chores, child, activeCategory) {
    const childId = String(child.id || "");
    const childName = child.name;
    const choreOrder = child.chore_order || [];
    const timeCategory = activeCategory || this.config.time_category || "anytime";

    // Debug logging to diagnose assignment filtering issues
    console.debug(
      `[Choremander] Filtering chores for child: id="${childId}" (type: ${typeof childId}), name="${childName}", config.child_id="${this.config.child_id}"`,
      `\n  All chores:`, chores.map(c => ({name: c.name, assigned_to: c.assigned_to, assigned_to_type: typeof c.assigned_to}))
    );

    // First, filter chores for this child and time category
    const filteredChores = chores.filter(chore => {
      // Check time category
      const matchesTime =
        timeCategory === "all" ||
        chore.time_category === timeCategory ||
        chore.time_category === "anytime";

      // Check if chore is assigned to this child
      // If assigned_to is empty or not set, show to ALL children
      // If assigned_to has specific child IDs, only show to those children
      // Ensure assigned_to is always an array
      let assignedTo = chore.assigned_to;
      if (assignedTo == null) { // Use == null to catch both undefined and null
        assignedTo = [];
      } else if (!Array.isArray(assignedTo)) {
        assignedTo = [assignedTo]; // Wrap non-array values
      }

      // Convert all assigned_to values to strings for consistent comparison
      const assignedToStrings = assignedTo.map(id => String(id));

      // STRICT: Only check child ID, not name
      // assigned_to should ONLY contain child IDs, never names
      const isAssignedToAll = assignedToStrings.length === 0;
      const isAssignedToChild = isAssignedToAll || assignedToStrings.includes(childId);

      // Debug logging for each chore with assignments (always log to help debug)
      console.debug(
        `[Choremander] Chore "${chore.name}": ` +
        `assigned_to=${JSON.stringify(assignedTo)} (isArray: ${Array.isArray(chore.assigned_to)}), ` +
        `childId="${childId}", isAssignedToAll=${isAssignedToAll}, ` +
        `isAssignedToChild=${isAssignedToChild}, matchesTime=${matchesTime}, ` +
        `SHOWING=${matchesTime && isAssignedToChild}`
      );

      return matchesTime && isAssignedToChild;
    });

    // Debug: Log the filtered results
    console.debug(
      `[Choremander] FINAL filtered chores for "${childName}" (${childId}): ${filteredChores.length} of ${chores.length}`,
      filteredChores.map(c => c.name)
    );

    // If no custom order is set, return filtered chores as-is
    if (choreOrder.length === 0) {
      return filteredChores;
    }

    // Sort by the child's custom chore order
    // Chores in the order list appear first, in their specified order
    // Chores not in the order list appear after, in their default order
    return filteredChores.sort((a, b) => {
      const indexA = choreOrder.indexOf(a.id);
      const indexB = choreOrder.indexOf(b.id);

      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one is in the order list, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither is in the order list, maintain original order
      return 0;
    });
  }

  _getTimeCategoryIcon(category) {
    const icons = {
      morning: "mdi:weather-sunset-up",
      afternoon: "mdi:weather-sunny",
      evening: "mdi:weather-sunset-down",
      night: "mdi:weather-night",
      anytime: "mdi:clock-outline",
      all: "mdi:clock-outline",
    };
    return icons[category] || icons.anytime;
  }

  /**
   * Lighten or darken a hex color
   * @param {string} hex - Hex color string (e.g., "#ff6b9d")
   * @param {number} amount - Amount to lighten (positive) or darken (negative), -1 to 1 range
   * @returns {string} Modified hex color
   */
  _lightenColor(hex, amount) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b values
    const num = parseInt(hex, 16);
    let r = (num >> 16);
    let g = (num >> 8 & 0x00FF);
    let b = (num & 0x0000FF);

    // Adjust each color component
    r = Math.min(255, Math.max(0, r + (amount * 255)));
    g = Math.min(255, Math.max(0, g + (amount * 255)));
    b = Math.min(255, Math.max(0, b + (amount * 255)));

    // Convert back to hex
    return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
  }

  _getTimeCategoryLabel(category) {
    const labels = {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      night: "Night",
      anytime: "Anytime",
      all: "All",
    };
    return labels[category] || category;
  }

  _getActiveTimeCategory() {
    return this._activeTimeCategory || this.config.time_category || "anytime";
  }

  _setActiveTimeCategory(category) {
    if (!category || this._activeTimeCategory === category) {
      return;
    }
    this._activeTimeCategory = category;
    this.requestUpdate();
  }

  _renderTimeCategoryFilters(activeCategory) {
    const categories = ["morning", "afternoon", "evening", "night", "anytime", "all"];
    return html`
      <div class="time-category-filters" role="group" aria-label="Time category">
        ${categories.map((category) => html`
          <button
            class="time-category-button ${activeCategory === category ? "active" : ""}"
            @click="${() => this._setActiveTimeCategory(category)}"
            title="${this._getTimeCategoryLabel(category)} chores"
            aria-pressed="${activeCategory === category}"
          >
            <ha-icon icon="${this._getTimeCategoryIcon(category)}"></ha-icon>
            ${this._getTimeCategoryLabel(category)}
          </button>
        `)}
      </div>
    `;
  }

  _getDynamicTitle(category) {
    const normalizedCategory = category || this._getActiveTimeCategory();
    const titles = {
      morning: "Morning Chores",
      afternoon: "Afternoon Chores",
      evening: "Evening Chores",
      night: "Night Chores",
      anytime: "Today's Chores",
      all: "Today's Chores",
    };
    return titles[normalizedCategory] || "Today's Chores";
  }

  _getTimezone() {
    // Get timezone from Home Assistant config, fallback to browser timezone
    return this.hass?.config?.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  _getDatePartsInTimezone(date) {
    const timezone = this._getTimezone();
    // Get year, month, day in the HA timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // en-CA formats as YYYY-MM-DD
    const dateStr = formatter.format(date);
    const [year, month, day] = dateStr.split("-").map(Number);
    return { year, month, day };
  }

  _isToday(date) {
    const now = new Date();
    const todayParts = this._getDatePartsInTimezone(now);
    const dateParts = this._getDatePartsInTimezone(date);

    return (
      dateParts.year === todayParts.year &&
      dateParts.month === todayParts.month &&
      dateParts.day === todayParts.day
    );
  }

  _filterCompletionsForToday(completions) {
    // Filter completions to only include those completed today (in HA timezone)
    return completions.filter(comp => {
      if (!comp.completed_at) return false;
      const completedDate = new Date(comp.completed_at);
      return this._isToday(completedDate);
    });
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <ha-icon icon="mdi:party-popper"></ha-icon>
        <div class="message">All Done!</div>
        <div class="submessage">No chores right now. Great job!</div>
      </div>
    `;
  }

  _renderChoreCard(chore, child, pointsIcon, todaysCompletions = [], choreIndex = 0) {
    const isLoading = this._loading[chore.id];
    const isCelebrating = this._celebrating === chore.id;

    // Check how many times this chore was completed today by this child
    // Both pending (awaiting approval) AND approved completions count toward the daily limit
    const childCompletionsToday = todaysCompletions.filter(
      (comp) => comp.chore_id === chore.id && comp.child_id === child.id
    );
    let completionsToday = childCompletionsToday.length;
    const dailyLimit = chore.daily_limit || 1;

    // Check for optimistic completions (chores just completed but not yet confirmed by HA)
    const optimisticKey = `${chore.id}_${child.id}`;
    const optimisticData = this._optimisticCompletions && this._optimisticCompletions[optimisticKey];
    const hasOptimisticCompletion = !!optimisticData;

    // If we have an optimistic completion, always count it toward the limit
    // This is defensive - we'd rather show "completed" incorrectly than allow double-completions
    // The optimistic completion will be cleaned up once we verify the server state reflects it
    if (hasOptimisticCompletion) {
      // Calculate how many optimistic completions we've tracked that aren't yet in the data
      const optimisticCount = optimisticData.count || 1;

      // Get timestamps from actual completions for this chore/child today
      const actualTimestamps = childCompletionsToday.map(comp =>
        comp.completed_at ? new Date(comp.completed_at).getTime() : 0
      );

      // Count how many of our optimistic completions are NOT yet reflected in the data
      // An optimistic completion is "reflected" if there's an actual completion within 2 seconds of it
      const optimisticTimestamps = optimisticData.timestamps || [optimisticData.timestamp || Date.now()];
      let unreflectedOptimistic = 0;
      for (const optTs of optimisticTimestamps) {
        const isReflected = actualTimestamps.some(actTs => Math.abs(actTs - optTs) < 2000);
        if (!isReflected) {
          unreflectedOptimistic += 1;
        }
      }

      completionsToday += unreflectedOptimistic;
    }

    const isCompletedForToday = completionsToday >= dailyLimit;

    // Debug logging to help troubleshoot daily limit issues
    if (childCompletionsToday.length > 0 || isCompletedForToday || hasOptimisticCompletion) {
      console.debug(
        `[Choremander] Chore "${chore.name}" (${chore.id}): ` +
        `completions today = ${completionsToday}, daily limit = ${dailyLimit}, ` +
        `completed = ${isCompletedForToday}, optimistic = ${!!hasOptimisticCompletion}, ` +
        `completions:`,
        childCompletionsToday
      );
    }

    // Check if the most recent completion is pending approval
    const hasPendingCompletion = childCompletionsToday.some((comp) => !comp.approved) || hasOptimisticCompletion;

    // Chore number (1-indexed for display) and color class (cycle through 8 colors)
    const choreNumber = choreIndex + 1;
    const colorClass = `color-${choreIndex % 8}`;

    // Click handler for the entire row
    const handleRowClick = () => {
      if (isLoading) return;
      if (isCompletedForToday) {
        this._handleUndo(chore, child, childCompletionsToday);
      } else {
        this._handleComplete(chore, child);
      }
    };

    // When chore box font size is explicitly overridden, disable small/large presets.
    // (The font-size rules for small/large would otherwise override our CSS variables.)
    const hasChoreBoxOverride = this._parseNumericFontSizePx(this.config?.chore_box_font_size) != null;
    const effectiveLineSize = hasChoreBoxOverride ? "medium" : this.config.line_size;

    return html`
      <div
        class="chore-card ${isLoading ? "loading" : ""} ${isCelebrating ? "celebrating" : ""} ${isCompletedForToday ? "completed" : ""}"
        @click="${handleRowClick}"
        title="${isCompletedForToday ? 'Click to undo' : 'Click to complete'}"
        data-chore-color="${this.config.chore_color || 'default'}"
        line-size="${effectiveLineSize}"
        style="padding: ${this.config.chore_padding};"
      >
        <div class="chore-info">
          <div class="chore-number-wrapper">
            <div class="chore-number-badge ${colorClass}">${choreNumber}</div>
          </div>
          <div class="chore-details">
            <div class="chore-name">${chore.name}</div>
            <div class="chore-points">
              <ha-icon icon="${pointsIcon}"></ha-icon>
              +${chore.points}
              ${dailyLimit > 1 ? html`<span style="font-size: 0.8em; opacity: 0.7;">(${completionsToday}/${dailyLimit})</span>` : ''}
            </div>
          </div>
        </div>
        <div class="chore-checkbox">
          ${isLoading
            ? html`<ha-icon icon="mdi:loading" style="animation: spin 1s linear infinite; color: var(--fun-purple);"></ha-icon>`
            : html`<ha-icon icon="mdi:check-bold"></ha-icon>`}
        </div>
      </div>
    `;
  }

  _isChoreCompletedForToday(chore, child, todaysCompletions = []) {
    const childCompletionsToday = todaysCompletions.filter(
      (comp) => comp.chore_id === chore.id && comp.child_id === child.id
    );
    let completionsToday = childCompletionsToday.length;
    const dailyLimit = chore.daily_limit || 1;

    const optimisticKey = `${chore.id}_${child.id}`;
    const optimisticData = this._optimisticCompletions && this._optimisticCompletions[optimisticKey];
    if (optimisticData) {
      const actualTimestamps = childCompletionsToday.map(comp =>
        comp.completed_at ? new Date(comp.completed_at).getTime() : 0
      );

      const optimisticTimestamps = optimisticData.timestamps || [optimisticData.timestamp || Date.now()];
      let unreflectedOptimistic = 0;
      for (const optTs of optimisticTimestamps) {
        const isReflected = actualTimestamps.some(actTs => Math.abs(actTs - optTs) < 2000);
        if (!isReflected) {
          unreflectedOptimistic += 1;
        }
      }

      completionsToday += unreflectedOptimistic;
    }

    return completionsToday >= dailyLimit;
  }

  _renderCelebration() {
    const entity = this.hass.states[this.config.entity];
    const pointsIcon = entity?.attributes?.points_icon || "mdi:star";
    const celebratingChore = (entity?.attributes?.chores || []).find(
      c => c.id === this._celebrating
    );
    const points = celebratingChore?.points || 0;

    return html`
      <div class="celebration-overlay" @click="${this._closeCelebration}">
        <div class="celebration-content" @click="${(e) => e.stopPropagation()}">
          <div class="celebration-stars">&#127775;&#127775;&#127775;</div>
          <div class="celebration-title">AWESOME!</div>
          <div class="celebration-message">You did it! Keep up the great work!</div>
          <div class="celebration-points">
            <ha-icon icon="${pointsIcon}"></ha-icon>
            +${points}
          </div>
        </div>
      </div>
    `;
  }

  _renderConfetti() {
    const colors = ["#ff6b9d", "#9b59b6", "#3498db", "#2ecc71", "#f1c40f", "#e67e22"];

    return html`
      <div class="confetti-container">
        ${this._confetti.map((piece, index) => html`
          <div
            class="confetti"
            style="
              left: ${piece.x}%;
              animation-delay: ${piece.delay}s;
              background: ${colors[index % colors.length]};
              border-radius: ${piece.round ? '50%' : '0'};
              width: ${piece.size}px;
              height: ${piece.size}px;
            "
          ></div>
        `)}
      </div>
    `;
  }

  async _handleComplete(chore, child) {
    const key = `${chore.id}_${child.id}`;
    const dailyLimit = chore.daily_limit || 1;

    // Check if already loading for this chore (prevent double-clicks during loading)
    if (this._loading[chore.id]) {
      console.debug(`[Choremander] Chore "${chore.name}" is already loading, ignoring click`);
      return;
    }

    // Get current completion count including optimistic completions
    const entity = this.hass.states[this.config.entity];
    const allCompletions = entity?.attributes?.todays_completions || [];
    const todaysCompletions = this._filterCompletionsForToday(allCompletions);
    const actualCompletionsToday = todaysCompletions.filter(
      (comp) => comp.chore_id === chore.id && comp.child_id === child.id
    ).length;

    // Count existing optimistic completions for this chore/child
    const existingData = this._optimisticCompletions[key];
    const existingOptimisticCount = existingData?.count || 0;

    // Calculate total completions (actual + optimistic)
    // This is a simplified count - we're being defensive and not trying to dedupe
    const totalCompletions = actualCompletionsToday + existingOptimisticCount;

    // Guard: If daily limit already reached, don't allow another completion
    if (totalCompletions >= dailyLimit) {
      console.debug(
        `[Choremander] Daily limit already reached for chore "${chore.name}": ` +
        `${actualCompletionsToday} actual + ${existingOptimisticCount} optimistic >= ${dailyLimit} limit`
      );
      this.requestUpdate(); // Force re-render to show completed state
      return;
    }

    // IMMEDIATELY set optimistic completion BEFORE making the service call
    // This prevents double-clicks even if the button hasn't re-rendered yet
    const now = Date.now();
    const existingTimestamps = existingData?.timestamps || [];
    this._optimisticCompletions = {
      ...this._optimisticCompletions,
      [key]: {
        timestamp: now,
        timestamps: [...existingTimestamps, now],
        count: existingOptimisticCount + 1,
      },
    };

    this._loading = { ...this._loading, [chore.id]: true };
    this.requestUpdate();

    try {
      await this.hass.callService("choremander", "complete_chore", {
        chore_id: chore.id,
        child_id: child.id,
      });

      // Trigger celebration!
      this._celebrating = chore.id;
      this._spawnConfetti();

      // Play completion sound!
      // Use the chore's completion_sound, fall back to config default, then to 'coin'
      const soundToPlay = chore.completion_sound || this.config.default_sound || 'coin';
      this._playSound(soundToPlay);

      this.requestUpdate();

      // Auto-close celebration after 2.5 seconds
      setTimeout(() => {
        this._closeCelebration();
      }, 2500);

      // Clean up optimistic completion after 30 seconds (by then HA state should be updated)
      setTimeout(() => {
        const newOptimistic = { ...this._optimisticCompletions };
        delete newOptimistic[key];
        this._optimisticCompletions = newOptimistic;
        this.requestUpdate();
      }, 30000);

    } catch (error) {
      console.error("Failed to complete chore:", error);

      // Remove the optimistic completion since the service call failed
      const newOptimistic = { ...this._optimisticCompletions };
      const currentData = newOptimistic[key];
      if (currentData) {
        // Remove the timestamp we just added
        const newTimestamps = currentData.timestamps.filter(ts => ts !== now);
        if (newTimestamps.length === 0) {
          delete newOptimistic[key];
        } else {
          newOptimistic[key] = {
            ...currentData,
            timestamps: newTimestamps,
            count: newTimestamps.length,
          };
        }
        this._optimisticCompletions = newOptimistic;
      }

      // Show error notification
      if (this.hass.callService) {
        this.hass.callService("persistent_notification", "create", {
          title: "Oops!",
          message: `Something went wrong: ${error.message}`,
          notification_id: `choremander_error_${chore.id}`,
        });
      }
    } finally {
      this._loading = { ...this._loading, [chore.id]: false };
      this.requestUpdate();
    }
  }

  async _handleUndo(chore, child, childCompletionsToday) {
    // Check if already loading for this chore (prevent double-clicks during loading)
    if (this._loading[chore.id]) {
      console.debug(`[Choremander] Chore "${chore.name}" is already loading, ignoring undo click`);
      return;
    }

    // Find the most recent completion for this chore/child to undo
    // Sort by completed_at descending to get the most recent
    const sortedCompletions = [...childCompletionsToday].sort((a, b) => {
      const dateA = new Date(a.completed_at || 0);
      const dateB = new Date(b.completed_at || 0);
      return dateB - dateA;
    });

    const completionToUndo = sortedCompletions[0];
    // Check for completion_id (from sensor) or id (fallback)
    const completionId = completionToUndo?.completion_id || completionToUndo?.id;
    if (!completionToUndo || !completionId) {
      console.warn(`[Choremander] No completion found to undo for chore "${chore.name}"`, sortedCompletions);
      return;
    }

    console.debug(`[Choremander] Undoing completion "${completionId}" for chore "${chore.name}"`);

    this._loading = { ...this._loading, [chore.id]: true };
    this.requestUpdate();

    try {
      // Call the reject_chore service to remove the completion
      await this.hass.callService("choremander", "reject_chore", {
        completion_id: completionId,
      });

      console.debug(`[Choremander] Successfully undid completion for chore "${chore.name}"`);

      // Play undo sound (sad/descending tone)
      const undoSoundToPlay = this.config.undo_sound || 'undo';
      this._playSound(undoSoundToPlay);

      // Clear any optimistic completion data for this chore/child
      const key = `${chore.id}_${child.id}`;
      const newOptimistic = { ...this._optimisticCompletions };
      delete newOptimistic[key];
      this._optimisticCompletions = newOptimistic;

    } catch (error) {
      console.error("Failed to undo chore completion:", error);

      // Show error notification
      if (this.hass.callService) {
        this.hass.callService("persistent_notification", "create", {
          title: "Oops!",
          message: `Couldn't undo: ${error.message}`,
          notification_id: `choremander_undo_error_${chore.id}`,
        });
      }
    } finally {
      this._loading = { ...this._loading, [chore.id]: false };
      this.requestUpdate();
    }
  }

  _spawnConfetti() {
    const confetti = [];
    for (let i = 0; i < 50; i++) {
      confetti.push({
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 6,
        round: Math.random() > 0.5,
      });
    }
    this._confetti = confetti;

    // Clear confetti after animation
    setTimeout(() => {
      this._confetti = [];
      this.requestUpdate();
    }, 3500);
  }

  _closeCelebration() {
    this._celebrating = null;
    this.requestUpdate();
  }
}

// Card Editor
class ChoremanderChildCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  static get styles() {
    return css`
      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .form-group input,
      .form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 1em;
        box-sizing: border-box;
      }

      .form-group small {
        display: block;
        margin-top: 4px;
        color: var(--secondary-text-color);
        font-size: 0.85em;
      }

      .color-row {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .color-row input[type="color"] {
        width: 44px;
        height: 36px;
        padding: 0;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: transparent;
      }

      .color-row .hex-input {
        flex: 1;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      }

      .inline-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 10px;
        padding: 8px 10px;
        cursor: pointer;
        white-space: nowrap;
      }

      .inline-button:hover {
        filter: brightness(1.03);
      }
    `;
  }

  _isValidHexColor(value) {
    return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim());
  }

  _getEditorChoreColorValue() {
    const value = this.config?.chore_color;
    if (!value || value === "default") return "#93c5fd";
    return this._isValidHexColor(value) ? value : "#93c5fd";
  }

  _getNumericFontSizeInputValue(value) {
    if (value === undefined || value === null) return "";
    const s = String(value).trim().toLowerCase();
    if (!s || s === "default") return "";

    const pxMatch = s.match(/^(-?\\d+(?:\\.\\d+)?)px$/);
    if (pxMatch) {
      const n = Number(pxMatch[1]);
      return Number.isFinite(n) ? n : "";
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : "";
  }

  setConfig(config) {
    this.config = config;
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    // Get children from overview entity
    const overviewEntity = this.hass.states[this.config.entity];
    const children = overviewEntity?.attributes?.children || [];

    return html`
      <div class="form-group">
        <label>Overview Entity</label>
        <input
          type="text"
          .value="${this.config.entity || ""}"
          @input="${this._entityChanged}"
          placeholder="sensor.choremander_overview"
        />
        <small>The Choremander overview sensor entity</small>
      </div>

      <div class="form-group">
        <label>Child</label>
        <select @change="${this._childIdChanged}">
          <option value="">Select a child...</option>
          ${children.map(
            (child) => html`
              <option value="${child.id}" ?selected="${this.config.child_id === child.id}">
                ${child.name}
              </option>
            `
          )}
        </select>
        <small>Which child is this card for?</small>
      </div>

      <div class="form-group">
        <label>Time Category</label>
        <select @change="${this._timeCategoryChanged}">
          <option value="morning" ?selected="${this.config.time_category === "morning"}">
            Morning Chores
          </option>
          <option value="afternoon" ?selected="${this.config.time_category === "afternoon"}">
            Afternoon Chores
          </option>
          <option value="evening" ?selected="${this.config.time_category === "evening"}">
            Evening Chores
          </option>
          <option value="night" ?selected="${this.config.time_category === "night"}">
            Night Chores
          </option>
          <option value="anytime" ?selected="${this.config.time_category === "anytime"}">
            Today's Chores (Anytime)
          </option>
          <option value="all" ?selected="${this.config.time_category === "all"}">
            Today's Chores (All)
          </option>
        </select>
        <small>Which time of day to show chores for (also sets the card title)</small>
      </div>

      <div class="form-group">
        <label>Child Name Font Size</label>
        <input
          type="number"
          min="1"
          step="1"
          .value="${this._getNumericFontSizeInputValue(this.config.child_name_font_size)}"
          @input="${this._childNameFontSizeChanged}"
          placeholder="Default (px)"
        />
        <small>Font size for the child name in the header</small>
      </div>

      <div class="form-group">
        <label>Time Category Button Font Size</label>
        <input
          type="number"
          min="1"
          step="1"
          .value="${this._getNumericFontSizeInputValue(this.config.time_category_filter_font_size)}"
          @input="${this._timeCategoryFilterFontSizeChanged}"
          placeholder="Default (px)"
        />
        <small>Font size for the morning/afternoon/etc filter buttons</small>
      </div>

      <div class="form-group">
        <label>Time Category Header Font Size</label>
        <input
          type="number"
          min="1"
          step="1"
          .value="${this._getNumericFontSizeInputValue(this.config.time_category_header_font_size)}"
          @input="${this._timeCategoryHeaderFontSizeChanged}"
          placeholder="Default (px)"
        />
        <small>Font size for the grouped time category headers</small>
      </div>

      <div class="form-group">
        <label>Chore Color</label>
        <div class="color-row">
          <input
            type="color"
            .value="${this._getEditorChoreColorValue()}"
            @input="${this._choreColorPicked}"
            title="Pick a color"
          />
          <input
            class="hex-input"
            type="text"
            .value="${this._getEditorChoreColorValue()}"
            @input="${this._choreColorTextChanged}"
            placeholder="#RRGGBB"
            inputmode="text"
            autocomplete="off"
          />
          <button class="inline-button" @click="${this._resetChoreColor}">
            Default
          </button>
        </div>
        <small>
          Pick any color (best results are pastel). Click Default to return to alternating colors.
        </small>
      </div>

      <div class="form-group">
        <label>Chore Box Font Size</label>
        <input
          type="number"
          min="1"
          step="1"
          .value="${this._getNumericFontSizeInputValue(this.config.chore_box_font_size)}"
          @input="${this._choreBoxFontSizeChanged}"
          placeholder="Default (px)"
        />
        <small>
          Overrides the chore box text/stars size when set. (Leaves `line_size` behavior unchanged when blank.)
        </small>
      </div>

      <div class="form-group">
        <label>Chore Padding</label>
        <input
          type="text"
          .value="${this.config.chore_padding || "20px 24px"}"
          @input="${this._chorePaddingChanged}"
          placeholder="e.g., 10px 15px"
        />
        <small>Set the padding for each chore row (e.g., "15px 20px")</small>
      </div>

      <div class="form-group">
        <label>Card Height</label>
        <input
          type="text"
          .value="${this.config.height || ""}"
          @input="${this._heightChanged}"
          placeholder='e.g., 420px, 60vh, or 420'
        />
        <small>
          Optional. Sets a fixed height for the entire card. If there are more chores than can fit,
          the chores area will scroll inside the card.
        </small>
      </div>

      <div class="form-group">
        <label>
          <input
            type="checkbox"
            ?checked="${this.config.debug === true}"
            @change="${this._debugChanged}"
            style="margin-right: 8px;"
          />
          Show Debug Panel
        </label>
        <small>Display debug information at the bottom of the card</small>
      </div>
    `;
  }

  _entityChanged(e) {
    this._updateConfig("entity", e.target.value);
  }

  _childIdChanged(e) {
    this._updateConfig("child_id", e.target.value);
  }

  _timeCategoryChanged(e) {
    this._updateConfig("time_category", e.target.value);
  }

  _childNameFontSizeChanged(e) {
    this._updateConfig("child_name_font_size", e.target.value);
  }

  _timeCategoryFilterFontSizeChanged(e) {
    this._updateConfig("time_category_filter_font_size", e.target.value);
  }

  _timeCategoryHeaderFontSizeChanged(e) {
    this._updateConfig("time_category_header_font_size", e.target.value);
  }

  _choreBoxFontSizeChanged(e) {
    this._updateConfig("chore_box_font_size", e.target.value);
  }

  _lineSizeChanged(e) {
    this._updateConfig("line_size", e.target.value);
  }

  _choreColorChanged(e) {
    this._updateConfig("chore_color", e.target.value);
  }

  _choreColorPicked(e) {
    const value = e.target.value;
    if (this._isValidHexColor(value)) {
      this._updateConfig("chore_color", value);
    }
  }

  _choreColorTextChanged(e) {
    const value = String(e.target.value || "").trim();
    if (this._isValidHexColor(value)) {
      this._updateConfig("chore_color", value);
    }
  }

  _resetChoreColor() {
    this._updateConfig("chore_color", "default");
  }

  _chorePaddingChanged(e) {
    this._updateConfig("chore_padding", e.target.value);
  }

  _heightChanged(e) {
    this._updateConfig("height", e.target.value);
  }

  _debugChanged(e) {
    this._updateConfig("debug", e.target.checked);
  }

  _updateConfig(key, value) {
    const newConfig = { ...this.config, [key]: value };
    if (value === undefined || value === "") {
      delete newConfig[key];
    }
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

// Register the cards
customElements.define("choremander-child-card", ChoremanderChildCard);
customElements.define("choremander-child-card-editor", ChoremanderChildCardEditor);

// Register with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: "choremander-child-card",
  name: "Choremander Child Card",
  description: "A fun, kid-friendly card for children to complete their chores!",
  preview: true,
});

console.info(
  "%c CHOREMANDER-CHILD-CARD %c v0.0.1 %c For Kids! ",
  "background: #9b59b6; color: white; font-weight: bold; border-radius: 4px 0 0 4px;",
  "background: #2ecc71; color: white; font-weight: bold;",
  "background: #f1c40f; color: #333; font-weight: bold; border-radius: 0 4px 4px 0;"
);
