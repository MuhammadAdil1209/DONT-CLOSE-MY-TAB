document.addEventListener("DOMContentLoaded", function () {
  const enabledCheckbox = document.getElementById("enabled");
  const confirmationCheckbox = document.getElementById("showConfirmation");
  const statusDiv = document.getElementById("status");

  if (!chrome.storage) {
    console.error("Chrome storage API not available");
    statusDiv.textContent = "❌ Extension Error";
    statusDiv.className = "status inactive";
    return;
  }

  chrome.storage.sync.get(["enabled", "showConfirmation"], function (result) {
    if (chrome.runtime.lastError) {
      console.error("Error loading settings:", chrome.runtime.lastError);
      statusDiv.textContent = "❌ Settings Error";
      statusDiv.className = "status inactive";
      return;
    }

    enabledCheckbox.checked = result.enabled !== false;
    confirmationCheckbox.checked = result.showConfirmation !== false;
    updateStatus();
    updateConfirmationState();
  });

  function updateStatus() {
    if (enabledCheckbox.checked) {
      statusDiv.className = "status active";
      statusDiv.textContent = "🟢 Protection Active";
    } else {
      statusDiv.className = "status inactive";
      statusDiv.textContent = "🔴 Protection Disabled";
    }
  }

  function updateConfirmationState() {
    if (!enabledCheckbox.checked) {
      confirmationCheckbox.disabled = true;
      confirmationCheckbox.style.opacity = "0.5";
    } else {
      confirmationCheckbox.disabled = false;
      confirmationCheckbox.style.opacity = "1";
    }
  }

  enabledCheckbox.addEventListener("change", function () {
    const enabled = enabledCheckbox.checked;
    chrome.storage.sync.set({ enabled: enabled }, function () {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving enabled setting:",
          chrome.runtime.lastError
        );
        return;
      }
      updateStatus();
      updateConfirmationState();
    });
  });

  confirmationCheckbox.addEventListener("change", function () {
    const showConfirmation = confirmationCheckbox.checked;
    chrome.storage.sync.set(
      { showConfirmation: showConfirmation },
      function () {
        if (chrome.runtime.lastError) {
          console.error(
            "Error saving confirmation setting:",
            chrome.runtime.lastError
          );
        }
      }
    );
  });

  updateConfirmationState();
});
