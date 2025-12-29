/**
 * SaveMenu - Save/Load UI Component
 *
 * Per agent-c's perspective (Issue #37):
 * - Separate from GameRenderer to maintain SRP
 * - Only calls SaveManager methods, no persistence logic
 *
 * Per agent-e's perspective (Issue #37):
 * - Confirmation dialogs for overwrite/delete
 * - Loading states for async operations
 * - XSS protection - use textContent, not innerHTML
 *
 * @module ui/save-menu
 */

import type { Engine } from '../engine/engine.js';
import { SaveManager, type SaveSlotId, type SaveSlotMetadata, type SaveError } from '../engine/save-manager.js';

/**
 * Modal mode - determines available actions.
 */
type ModalMode = 'save' | 'load';

/**
 * Callback type for pending confirm actions.
 */
type ConfirmCallback = () => void | Promise<void>;

/**
 * SaveMenu - UI component for save/load modal dialogs.
 *
 * Manages modal state, renders save slots, handles user interactions.
 * Delegates persistence to SaveManager.
 *
 * @example
 * ```typescript
 * const saveMenu = new SaveMenu(engine);
 * saveMenu.initialize();
 *
 * // Open save modal
 * saveMenu.openSaveModal();
 *
 * // Open load modal
 * saveMenu.openLoadModal();
 * ```
 */
export class SaveMenu {
  /** Engine instance for state access */
  private engine: Engine;

  /** SaveManager for persistence operations */
  private saveManager: SaveManager;

  /** Current modal mode (save or load) */
  private currentMode: ModalMode;

  /** Pending confirm action callback */
  private pendingConfirmAction: ConfirmCallback | null;

  /** DOM element references */
  private elements: {
    saveLoadModal: HTMLElement | null;
    saveLoadTitle: HTMLElement | null;
    saveSlotsContainer: HTMLElement | null;
    saveLoadCancel: HTMLElement | null;

    confirmDialog: HTMLElement | null;
    confirmTitle: HTMLElement | null;
    confirmMessage: HTMLElement | null;
    confirmOk: HTMLElement | null;
    confirmCancel: HTMLElement | null;

    mainMenu: HTMLElement | null;
    mainMenuClose: HTMLElement | null;

    headerBtns: {
      menu: HTMLElement | null;
      save: HTMLElement | null;
      load: HTMLElement | null;
    };
  };

  /**
   * Create SaveMenu instance.
   *
   * @param engine - Initialized Engine instance
   */
  constructor(engine: Engine) {
    this.engine = engine;
    this.saveManager = new SaveManager();
    this.currentMode = 'save';
    this.pendingConfirmAction = null;

    // Cache DOM references
    this.elements = {
      saveLoadModal: document.querySelector('[data-test-id="save-load-modal"]'),
      saveLoadTitle: document.querySelector('[data-test-id="save-load-title"]'),
      saveSlotsContainer: document.querySelector('[data-test-id="save-slots"]'),
      saveLoadCancel: document.querySelector('[data-test-id="save-load-cancel"]'),

      confirmDialog: document.querySelector('[data-test-id="confirm-dialog"]'),
      confirmTitle: document.querySelector('[data-test-id="confirm-title"]'),
      confirmMessage: document.querySelector('[data-test-id="confirm-message"]'),
      confirmOk: document.querySelector('[data-test-id="confirm-ok"]'),
      confirmCancel: document.querySelector('[data-test-id="confirm-cancel"]'),

      mainMenu: document.querySelector('[data-test-id="main-menu"]'),
      mainMenuClose: document.querySelector('[data-test-id="main-menu-close"]'),

      headerBtns: {
        menu: document.querySelector('#btn-menu'),
        save: document.querySelector('#btn-save'),
        load: document.querySelector('#btn-load'),
      },
    };

    // Bind methods to preserve `this`
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleLoadClick = this.handleLoadClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleConfirmOk = this.handleConfirmOk.bind(this);
    this.handleConfirmCancel = this.handleConfirmCancel.bind(this);
  }

  /**
   * Initialize the save menu.
   * Sets up event listeners for modals and header buttons.
   */
  initialize(): void {
    // Header button listeners
    this.elements.headerBtns.menu?.addEventListener('click', () => this.openMainMenu());
    this.elements.headerBtns.save?.addEventListener('click', () => this.openSaveModal());
    this.elements.headerBtns.load?.addEventListener('click', () => this.openLoadModal());

    // Save/load modal listeners
    this.elements.saveLoadCancel?.addEventListener('click', () => this.closeSaveLoadModal());

    // Slot action listeners (delegated)
    this.elements.saveSlotsContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const slotBtn = target.closest('.slot-action-btn') as HTMLElement;
      if (slotBtn) {
        const action = slotBtn.dataset.action;
        const slot = slotBtn.dataset.slot;
        if (action && slot) {
          this.handleSlotAction(action, parseInt(slot, 10) as SaveSlotId);
        }
      }
    });

    // Confirmation dialog listeners
    this.elements.confirmOk?.addEventListener('click', this.handleConfirmOk);
    this.elements.confirmCancel?.addEventListener('click', this.handleConfirmCancel);

    // Main menu listeners
    this.elements.mainMenuClose?.addEventListener('click', () => this.closeMainMenu());
    this.elements.mainMenu?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const menuBtn = target.closest('.menu-option-btn') as HTMLElement;
      if (menuBtn) {
        const action = menuBtn.dataset.action;
        if (action) {
          this.handleMenuAction(action);
        }
      }
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Close modals on backdrop click
    this.elements.saveLoadModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.saveLoadModal) {
        this.closeSaveLoadModal();
      }
    });

    this.elements.confirmDialog?.addEventListener('click', (e) => {
      if (e.target === this.elements.confirmDialog) {
        this.closeConfirmDialog();
      }
    });

    this.elements.mainMenu?.addEventListener('click', (e) => {
      if (e.target === this.elements.mainMenu) {
        this.closeMainMenu();
      }
    });

    console.log('[SaveMenu] Initialized');
  }

  /**
   * Open save modal.
   * Shows available save slots with Save actions enabled.
   */
  async openSaveModal(): Promise<void> {
    this.currentMode = 'save';
    if (this.elements.saveLoadTitle) {
      this.elements.saveLoadTitle.textContent = 'Save Game';
    }

    await this.refreshSlots();
    this.showModal(this.elements.saveLoadModal);
  }

  /**
   * Open load modal.
   * Shows available save slots with Load actions enabled.
   */
  async openLoadModal(): Promise<void> {
    this.currentMode = 'load';
    if (this.elements.saveLoadTitle) {
      this.elements.saveLoadTitle.textContent = 'Load Game';
    }

    await this.refreshSlots();
    this.showModal(this.elements.saveLoadModal);
  }

  /**
   * Open main menu overlay.
   */
  openMainMenu(): void {
    this.showModal(this.elements.mainMenu);
  }

  /**
   * Close save/load modal.
   */
  closeSaveLoadModal(): void {
    this.hideModal(this.elements.saveLoadModal);
  }

  /**
   * Close confirmation dialog.
   */
  closeConfirmDialog(): void {
    this.pendingConfirmAction = null;
    this.hideModal(this.elements.confirmDialog);
  }

  /**
   * Close main menu.
   */
  closeMainMenu(): void {
    this.hideModal(this.elements.mainMenu);
  }

  /**
   * Close all open modals.
   */
  closeAllModals(): void {
    this.closeSaveLoadModal();
    this.closeConfirmDialog();
    this.closeMainMenu();
  }

  /**
   * Refresh save slot display.
   * Loads metadata from SaveManager and updates UI.
   */
  private async refreshSlots(): Promise<void> {
    try {
      const slots = await this.saveManager.getAllSlotMetadata();

      for (const slot of slots) {
        this.renderSlot(slot);
      }
    } catch (error) {
      console.error('[SaveMenu] Failed to load slot metadata:', error);
      this.showError('Failed to load save games. Please try again.');
    }
  }

  /**
   * Render a single save slot.
   *
   * @param slot - Slot metadata to render
   */
  private renderSlot(slot: SaveSlotMetadata): void {
    const slotEl = document.querySelector(`[data-slot-id="${slot.slotId}"]`);
    if (!slotEl) return;

    // Update status (use textContent for XSS protection per agent-e)
    const statusEl = slotEl.querySelector(`[data-test-id="slot-${slot.slotId}-status"]`);
    if (statusEl) {
      statusEl.textContent = slot.hasData ? 'Occupied' : 'Empty';
    }

    // Update metadata
    const metadataEl = slotEl.querySelector(`[data-test-id="slot-${slot.slotId}-metadata"]`);
    if (metadataEl) {
      if (slot.hasData) {
        const date = slot.timestamp ? new Date(slot.timestamp).toLocaleString() : 'Unknown';
        metadataEl.textContent = `${slot.sceneTitle || slot.sceneId || 'Unknown'} — ${date}`;
      } else {
        metadataEl.textContent = 'No saved data';
      }
    }

    // Update button states
    const saveBtn = slotEl.querySelector('[data-action="save"]') as HTMLButtonElement;
    const loadBtn = slotEl.querySelector('[data-action="load"]') as HTMLButtonElement;
    const deleteBtn = slotEl.querySelector('[data-action="delete"]') as HTMLButtonElement;

    if (this.currentMode === 'save') {
      // Save mode: can always save (overwrite or new)
      if (saveBtn) saveBtn.disabled = false;
      if (loadBtn) loadBtn.disabled = true;
      if (deleteBtn) deleteBtn.disabled = !slot.hasData;
    } else {
      // Load mode: only load if has data
      if (saveBtn) saveBtn.disabled = true;
      if (loadBtn) loadBtn.disabled = !slot.hasData;
      if (deleteBtn) deleteBtn.disabled = !slot.hasData;
    }
  }

  /**
   * Handle slot action button click.
   *
   * @param action - Action type (save, load, delete)
   * @param slotId - Slot ID (1-3)
   */
  private async handleSlotAction(action: string, slotId: SaveSlotId): Promise<void> {
    switch (action) {
      case 'save':
        await this.handleSaveClick(slotId);
        break;
      case 'load':
        await this.handleLoadClick(slotId);
        break;
      case 'delete':
        await this.handleDeleteClick(slotId);
        break;
    }
  }

  /**
   * Handle save button click.
   * Shows confirmation if slot has data (overwrite).
   *
   * @param slotId - Slot ID to save to
   */
  private async handleSaveClick(slotId: SaveSlotId): Promise<void> {
    try {
      // Check if slot has data for overwrite confirmation (per agent-e)
      const metadata = await this.saveManager.getSlotMetadata(slotId);

      if (metadata.hasData) {
        // Show overwrite confirmation
        this.showConfirmation(
          'Overwrite Save?',
          `Slot ${slotId} contains saved data. Overwrite with current progress?`,
          async () => {
            await this.performSave(slotId);
          }
        );
      } else {
        // Empty slot - save directly
        await this.performSave(slotId);
      }
    } catch (error) {
      console.error('[SaveMenu] Save check failed:', error);
      this.showError(this.getErrorMessage(error));
    }
  }

  /**
   * Perform the actual save operation.
   *
   * @param slotId - Slot ID to save to
   */
  private async performSave(slotId: SaveSlotId): Promise<void> {
    try {
      // Get current scene title
      const scene = this.engine.getCurrentScene();
      const sceneTitle = scene?.title || scene?.id || 'Unknown';

      // Save via SaveManager
      await this.saveManager.save(slotId, this.engine.getState(), sceneTitle);

      console.log(`[SaveMenu] Saved to slot ${slotId}`);

      // Refresh and close modal
      await this.refreshSlots();
      this.closeSaveLoadModal();

      // Show success feedback
      this.showSuccess(`Game saved to Slot ${slotId}`);
    } catch (error) {
      console.error('[SaveMenu] Save failed:', error);
      this.showError(this.getErrorMessage(error));
    }
  }

  /**
   * Handle load button click.
   * Loads game state from slot and applies to engine.
   * Per agent-e (Intent #93): Shows loading state and handles rollback on failure.
   *
   * @param slotId - Slot ID to load from
   */
  private async handleLoadClick(slotId: SaveSlotId): Promise<void> {
    try {
      // Load via SaveManager
      const gameState = await this.saveManager.load(slotId);

      console.log(`[SaveMenu] Loaded from slot ${slotId}, applying to engine`);

      // Apply to engine using new loadState() method
      // Per agent-e: Engine has fail-safe rollback if scene load fails
      await this.engine.loadState(gameState);

      console.log(`[SaveMenu] State applied successfully`);

      // Close modal and show success
      this.closeSaveLoadModal();
      this.showSuccess(`Game loaded from Slot ${slotId}`);
    } catch (error) {
      console.error('[SaveMenu] Load failed:', error);
      this.showError(this.getErrorMessage(error));
    }
  }

  /**
   * Handle delete button click.
   * Shows confirmation before deleting (per agent-e).
   *
   * @param slotId - Slot ID to delete
   */
  private async handleDeleteClick(slotId: SaveSlotId): Promise<void> {
    // Show delete confirmation (per agent-e's recommendation)
    this.showConfirmation(
      'Delete Save?',
      `Are you sure you want to delete Slot ${slotId}? This cannot be undone.`,
      async () => {
        await this.performDelete(slotId);
      }
    );
  }

  /**
   * Perform the actual delete operation.
   *
   * @param slotId - Slot ID to delete
   */
  private async performDelete(slotId: SaveSlotId): Promise<void> {
    try {
      await this.saveManager.delete(slotId);

      console.log(`[SaveMenu] Deleted slot ${slotId}`);

      // Refresh slots
      await this.refreshSlots();
    } catch (error) {
      console.error('[SaveMenu] Delete failed:', error);
      this.showError(this.getErrorMessage(error));
    }
  }

  /**
   * Handle menu option button click.
   *
   * @param action - Action type (resume, save, load, quit)
   */
  private handleMenuAction(action: string): void {
    switch (action) {
      case 'resume':
        this.closeMainMenu();
        break;
      case 'save':
        this.closeMainMenu();
        this.openSaveModal();
        break;
      case 'load':
        this.closeMainMenu();
        this.openLoadModal();
        break;
      case 'quit':
        // Show quit confirmation before resetting game
        this.showConfirmation(
          'Quit to Title?',
          'Are you sure you want to quit? All unsaved progress will be lost.',
          async () => {
            await this.engine.reset();
            this.closeMainMenu();
          }
        );
        break;
    }
  }

  /**
   * Show confirmation dialog.
   * Stores pending action for execution on confirmation.
   *
   * @param title - Dialog title
   * @param message - Confirmation message
   * @param onConfirm - Callback to execute if user confirms
   */
  private showConfirmation(title: string, message: string, onConfirm: ConfirmCallback): void {
    if (this.elements.confirmTitle) {
      this.elements.confirmTitle.textContent = title;
    }
    if (this.elements.confirmMessage) {
      this.elements.confirmMessage.textContent = message;
    }

    this.pendingConfirmAction = onConfirm;
    this.showModal(this.elements.confirmDialog);
  }

  /**
   * Handle confirm dialog OK button.
   * Executes pending confirm action.
   */
  private async handleConfirmOk(): Promise<void> {
    if (this.pendingConfirmAction) {
      const action = this.pendingConfirmAction;
      this.closeConfirmDialog();
      await action();
    }
  }

  /**
   * Handle confirm dialog cancel button.
   * Cancels pending action.
   */
  private handleConfirmCancel(): void {
    this.closeConfirmDialog();
  }

  /**
   * Show modal with aria-hidden management.
   *
   * @param modal - Modal element to show
   */
  private showModal(modal: HTMLElement | null): void {
    if (!modal) return;

    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');

    // Focus first focusable element
    setTimeout(() => {
      const focusable = modal.querySelector('button') as HTMLElement;
      focusable?.focus();
    }, 100);
  }

  /**
   * Hide modal with aria-hidden management.
   *
   * @param modal - Modal element to hide
   */
  private hideModal(modal: HTMLElement | null): void {
    if (!modal) return;

    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
  }

  /**
   * Get user-friendly error message from SaveError.
   *
   * @param error - Error object
   * @returns User-friendly message
   */
  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'type' in error) {
      const saveError = error as SaveError;
      switch (saveError.type) {
        case 'quota-exceeded':
          return 'Storage full. Please clear browser data.';
        case 'privacy-mode':
          return 'Storage unavailable. You may be in private browsing mode.';
        case 'invalid-data':
          return 'Save file is corrupted or invalid.';
        case 'version-mismatch':
          return 'Save file is from an incompatible version.';
        case 'storage-unavailable':
          return 'Storage is not available in your browser.';
        default:
          return saveError.message || 'An unknown error occurred.';
      }
    }
    return error instanceof Error ? error.message : 'An unknown error occurred.';
  }

  /**
   * Show error message to user.
   * Uses error overlay for consistency with game renderer.
   *
   * @param message - Error message to display
   */
  private showError(message: string): void {
    const overlay = document.querySelector('[data-test-id="error-overlay"]');
    const errorText = document.querySelector('[data-test-id="error-message"]');

    if (overlay && errorText) {
      errorText.textContent = message;
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Show success message (temporary).
   *
   * @param message - Success message
   */
  private showSuccess(message: string): void {
    // For now, use console log - could add toast notification later
    console.log(`[SaveMenu] ${message}`);
  }
}
