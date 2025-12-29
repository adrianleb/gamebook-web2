/**
 * DOS UI Keyboard Navigation
 *
 * Arrow key navigation for choice list that skips disabled choices.
 * Per STYLE_GUIDE.md: Tab order is Text → Choices → Stats → Inventory.
 *
 * Features:
 * - Arrow Up/Down navigates through choices, skipping disabled
 * - Home/End jumps to first/last enabled choice
 * - Number keys 1-9 quick-select enabled choices
 * - Enter activates focused choice
 *
 * Accessibility: WCAG 2.1 compliant, ARIA attributes maintained.
 */

/**
 * Keyboard navigation manager for choice lists.
 * Skips disabled buttons and maintains focus within the choices panel.
 */
export class ChoiceKeyboardNav {
  /**
   * @param {string} choicesListSelector - Selector for the choices list container
   * @param {Function} onChoiceSelect - Callback when choice is selected (choiceIndex) => void
   */
  constructor(choicesListSelector, onChoiceSelect) {
    this.choicesListSelector = choicesListSelector;
    this.onChoiceSelect = onChoiceSelect;
    this.choicesList = null;
    this.enabledButtons = [];
    this.focusedIndex = -1;
    this.boundKeyDown = null;
  }

  /**
   * Initialize keyboard navigation on the choices list.
   * Call this after the DOM is ready.
   */
  init() {
    this.choicesList = document.querySelector(this.choicesListSelector);
    if (!this.choicesList) {
      console.warn('[ChoiceKeyboardNav] Choices list not found:', this.choicesListSelector);
      return;
    }

    this.updateEnabledButtons();
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.choicesList.addEventListener('keydown', this.boundKeyDown);

    // Set initial focus to first enabled choice
    if (this.enabledButtons.length > 0) {
      this.enabledButtons[0].tabIndex = 0;
      this.enabledButtons[0].focus();
      this.focusedIndex = 0;
    }

    console.log('[ChoiceKeyboardNav] Initialized with', this.enabledButtons.length, 'enabled choices');
  }

  /**
   * Update the cached list of enabled choice buttons.
   * Call this after choices are added/removed or disabled state changes.
   */
  updateEnabledButtons() {
    if (!this.choicesList) return;

    const allButtons = Array.from(
      this.choicesList.querySelectorAll('.choice-button')
    );

    // Filter only enabled (not disabled) buttons
    this.enabledButtons = allButtons.filter(btn => !btn.disabled);

    // Reset tabIndex for all buttons
    allButtons.forEach(btn => btn.tabIndex = -1);

    // Only enabled buttons are focusable via Tab
    this.enabledButtons.forEach((btn, index) => {
      btn.tabIndex = 0;
      btn.setAttribute('data-enabled-index', index);
    });
  }

  /**
   * Handle keyboard navigation events.
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    const currentFocused = document.activeElement;
    const currentIndex = this.enabledButtons.indexOf(currentFocused);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextChoice(currentIndex);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousChoice(currentIndex);
        break;

      case 'Home':
        event.preventDefault();
        this.focusFirstChoice();
        break;

      case 'End':
        event.preventDefault();
        this.focusLastChoice();
        break;

      case 'Enter':
      case ' ':
        if (currentFocused && this.enabledButtons.includes(currentFocused)) {
          event.preventDefault();
          const choiceIndex = parseInt(currentFocused.getAttribute('data-choice-index'));
          this.onChoiceSelect(choiceIndex);
        }
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        // Quick select by number
        event.preventDefault();
        const quickIndex = parseInt(event.key) - 1;
        this.quickSelectChoice(quickIndex);
        break;
    }
  }

  /**
   * Focus the next enabled choice.
   * Wraps around to the first choice if at the end.
   */
  focusNextChoice(currentIndex) {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= this.enabledButtons.length) {
      nextIndex = 0; // Wrap to first
    }
    this.focusChoice(nextIndex);
  }

  /**
   * Focus the previous enabled choice.
   * Wraps around to the last choice if at the beginning.
   */
  focusPreviousChoice(currentIndex) {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.enabledButtons.length - 1; // Wrap to last
    }
    this.focusChoice(prevIndex);
  }

  /**
   * Focus the first enabled choice.
   */
  focusFirstChoice() {
    if (this.enabledButtons.length > 0) {
      this.focusChoice(0);
    }
  }

  /**
   * Focus the last enabled choice.
   */
  focusLastChoice() {
    if (this.enabledButtons.length > 0) {
      this.focusChoice(this.enabledButtons.length - 1);
    }
  }

  /**
   * Focus a specific enabled choice by index.
   * @param {number} enabledIndex - Index in the enabled buttons array
   */
  focusChoice(enabledIndex) {
    if (enabledIndex >= 0 && enabledIndex < this.enabledButtons.length) {
      const button = this.enabledButtons[enabledIndex];
      button.focus();
      this.focusedIndex = enabledIndex;
    }
  }

  /**
   * Quick select a choice by its absolute index (1-9).
   * Only works if that choice exists and is enabled.
   * @param {number} choiceIndex - Zero-based choice index
   */
  quickSelectChoice(choiceIndex) {
    const button = this.enabledButtons[choiceIndex];
    if (button) {
      button.focus();
      button.classList.add('selected');
      const actualIndex = parseInt(button.getAttribute('data-choice-index'));
      this.onChoiceSelect(actualIndex);
    }
  }

  /**
   * Clean up event listeners.
   * Call this when destroying the component or navigating away.
   */
  destroy() {
    if (this.choicesList && this.boundKeyDown) {
      this.choicesList.removeEventListener('keydown', this.boundKeyDown);
    }
    this.enabledButtons = [];
    this.focusedIndex = -1;
  }
}

/**
 * Helper function to create a disabled choice button with ARIA attributes.
 * @param {Object} choice - Choice object from engine
 * @param {number} index - Choice index for data attributes
 * @returns {HTMLButtonElement} Configured button element
 */
export function createChoiceButton(choice, index) {
  const button = document.createElement('button');
  button.className = 'choice-button';
  button.setAttribute('data-choice-number', index + 1);
  button.setAttribute('data-choice-index', index);
  button.setAttribute('data-test-id', `choice-button-${index}`);

  const isDisabled = choice.conditions && !evaluateConditions(choice.conditions);

  if (isDisabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');

    // Add disabled hint for accessibility and visual display
    const hint = choice.disabledHint || 'Locked';
    button.setAttribute('data-disabled-hint', hint);
    button.setAttribute('aria-label', `Choice ${index + 1}: ${choice.label} — ${hint}`);

    // Add sr-only text for screen readers
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = ` (${hint})`;
    button.appendChild(srText);
  } else {
    button.setAttribute('aria-label', `Choice ${index + 1}: ${choice.label}`);
  }

  button.textContent = choice.label;

  return button;
}

/**
 * Mock condition evaluator - replace with actual engine import.
 * @param {Array} conditions - Array of condition objects
 * @returns {boolean} True if conditions are met
 */
function evaluateConditions(conditions) {
  // This is a placeholder - integrate with actual ConditionEvaluator
  // For now, assume conditions fail to demonstrate disabled state
  return false;
}

/**
 * Update a choice button's disabled state with hint.
 * Call this when game state changes that affect choice availability.
 *
 * @param {HTMLButtonElement} button - The choice button element
 * @param {boolean} isDisabled - Whether the choice should be disabled
 * @param {string} hint - Optional hint text for why disabled
 */
export function updateChoiceDisabledState(button, isDisabled, hint = 'Locked') {
  if (isDisabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('data-disabled-hint', hint);
    button.setAttribute('aria-label', button.textContent + ' — ' + hint);
  } else {
    button.disabled = false;
    button.removeAttribute('aria-disabled');
    button.removeAttribute('data-disabled-hint');
    button.setAttribute('aria-label', button.textContent);
  }
}

/**
 * Export a singleton instance for convenience.
 */
export const defaultKeyboardNav = {
  create: (selector, callback) => new ChoiceKeyboardNav(selector, callback),
  createButton: createChoiceButton,
  updateDisabledState: updateChoiceDisabledState,
};
