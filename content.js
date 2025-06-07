(function () {
  "use strict";

  const TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let isEnabled = true;
  let showConfirmation = true;
  let hasUserInteracted = false;
  let protectionActive = false;
  let beforeUnloadAttached = false;

  console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: Initializing protection`);

  function activateProtection() {
    if (hasUserInteracted) return;

    hasUserInteracted = true;
    protectionActive = isEnabled && showConfirmation;

    console.log(
      `� DON'T CLOSE MY TAB [${TAB_ID}]: User interaction detected - PROTECTION ACTIVE`
    );

    if (!beforeUnloadAttached && protectionActive) {
      window.addEventListener("beforeunload", preventTabClose, {
        passive: false,
      });
      beforeUnloadAttached = true;
      console.log(
        `� DON'T CLOSE MY TAB [${TAB_ID}]: beforeunload handler attached`
      );
    }

    showProtectionIndicator();
  }

  const interactionEvents = [
    "click",
    "keydown",
    "mousedown",
    "touchstart",
    "scroll",
    "focus",
  ];
  interactionEvents.forEach((eventType) => {
    document.addEventListener(eventType, activateProtection, {
      once: true,
      passive: true,
      capture: true,
    });
  });

  window.addEventListener("focus", activateProtection, {
    once: true,
    passive: true,
  });

  function loadSettings() {
    try {
      chrome.storage.sync.get(
        ["enabled", "showConfirmation"],
        function (result) {
          if (chrome.runtime.lastError) {
            console.warn(
              `� DON'T CLOSE MY TAB [${TAB_ID}]: Storage error:`,
              chrome.runtime.lastError
            );

            return;
          }

          const oldEnabled = isEnabled;
          const oldConfirmation = showConfirmation;

          isEnabled = result.enabled !== false;
          showConfirmation = result.showConfirmation !== false;

          console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: Settings loaded`, {
            isEnabled,
            showConfirmation,
            changed:
              oldEnabled !== isEnabled || oldConfirmation !== showConfirmation,
          });

          protectionActive = hasUserInteracted && isEnabled && showConfirmation;
        }
      );
    } catch (error) {
      console.warn(
        `� DON'T CLOSE MY TAB [${TAB_ID}]: Failed to load settings:`,
        error
      );
    }
  }

  try {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      if (namespace === "sync") {
        let settingsChanged = false;

        if (changes.enabled) {
          isEnabled = changes.enabled.newValue;
          settingsChanged = true;
          console.log(
            `� DON'T CLOSE MY TAB [${TAB_ID}]: Protection ${
              isEnabled ? "ENABLED" : "DISABLED"
            }`
          );
        }

        if (changes.showConfirmation) {
          showConfirmation = changes.showConfirmation.newValue;
          settingsChanged = true;
          console.log(
            `� DON'T CLOSE MY TAB [${TAB_ID}]: Confirmation ${
              showConfirmation ? "ENABLED" : "DISABLED"
            }`
          );
        }

        if (settingsChanged) {
          protectionActive = hasUserInteracted && isEnabled && showConfirmation;
          console.log(
            `� DON'T CLOSE MY TAB [${TAB_ID}]: Protection state updated:`,
            protectionActive
          );
        }
      }
    });
  } catch (error) {
    console.warn(
      `� DON'T CLOSE MY TAB [${TAB_ID}]: Storage listener error:`,
      error
    );
  }

  function preventTabClose(event) {
    if (
      !protectionActive ||
      !hasUserInteracted ||
      !isEnabled ||
      !showConfirmation
    ) {
      return;
    }

    console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: ⚠️ PREVENTING TAB CLOSE`);

    event.preventDefault();
    const message = "� DON'T CLOSE MY TAB! Are you sure you want to leave?";
    event.returnValue = message;
    return message;
  }

  function handleKeyboardShortcuts(event) {
    if (
      !protectionActive ||
      !hasUserInteracted ||
      !isEnabled ||
      !showConfirmation
    ) {
      return;
    }

    const isCtrlW =
      (event.ctrlKey || event.metaKey) &&
      (event.key === "w" || event.key === "W" || event.keyCode === 87);

    const isCtrlShiftW =
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      (event.key === "w" || event.key === "W" || event.keyCode === 87);

    if (isCtrlW || isCtrlShiftW) {
      console.log(
        `� DON'T CLOSE MY TAB [${TAB_ID}]: ⚠️ KEYBOARD SHORTCUT DETECTED: ${
          isCtrlShiftW ? "Ctrl+Shift+W" : "Ctrl+W"
        }`
      );

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setTimeout(() => {
        const shouldClose = confirm(
          `� DON'T CLOSE MY TAB!\n\n${
            isCtrlShiftW ? "Close window?" : "Close tab?"
          }`
        );
        if (shouldClose) {
          console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: User confirmed close`);

          protectionActive = false;
          if (isCtrlShiftW) {
            window.close();
          } else {
            window.close();
          }
        } else {
          console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: User cancelled close`);
        }
      }, 10);

      return false;
    }
  }

  document.addEventListener("keydown", handleKeyboardShortcuts, {
    capture: true,
    passive: false,
  });
  window.addEventListener("keydown", handleKeyboardShortcuts, {
    capture: true,
    passive: false,
  });

  const originalWindowClose = window.close;
  window.close = function () {
    if (
      protectionActive &&
      hasUserInteracted &&
      isEnabled &&
      showConfirmation
    ) {
      console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: ⚠️ window.close() called`);

      const shouldClose = confirm(
        "� DON'T CLOSE MY TAB!\n\nAre you sure you want to close this tab?"
      );
      if (shouldClose) {
        console.log(
          `� DON'T CLOSE MY TAB [${TAB_ID}]: User confirmed close via window.close()`
        );
        protectionActive = false;
        originalWindowClose.call(window);
      } else {
        console.log(
          `� DON'T CLOSE MY TAB [${TAB_ID}]: Prevented close via window.close()`
        );
      }
    } else {
      originalWindowClose.call(window);
    }
  };

  function showProtectionIndicator() {
    if (!isEnabled || document.getElementById("tab-close-guard-indicator"))
      return;

    const indicator = document.createElement("div");
    indicator.id = "tab-close-guard-indicator";
    indicator.innerHTML = `� Tab Protection Active (${TAB_ID.slice(-4)})`;
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 11px;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: opacity 0.3s;
      pointer-events: none;
    `;

    function addIndicator() {
      if (document.body) {
        document.body.appendChild(indicator);

        setTimeout(() => {
          indicator.style.opacity = "0";
          setTimeout(() => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          }, 300);
        }, 4000);
      } else {
        setTimeout(addIndicator, 100);
      }
    }

    addIndicator();
  }

  const originalRemoveEventListener = window.removeEventListener;
  window.removeEventListener = function (type, listener, options) {
    if (type === "beforeunload" && listener === preventTabClose) {
      console.log(
        `� DON'T CLOSE MY TAB [${TAB_ID}]: ⚠️ Prevented removal of protection handler`
      );
      return;
    }
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  function initialize() {
    console.log(`� DON'T CLOSE MY TAB [${TAB_ID}]: 🚀 INITIALIZATION COMPLETE`);

    loadSettings();

    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      setTimeout(activateProtection, 100);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        setTimeout(activateProtection, 100);
      });
    }
  }

  initialize();

  setInterval(() => {
    console.log(
      `� DON'T CLOSE MY TAB [${TAB_ID}]: Status check - Enabled: ${isEnabled}, Confirmation: ${showConfirmation}, Interacted: ${hasUserInteracted}, Active: ${protectionActive}`
    );
  }, 10000);
})();
