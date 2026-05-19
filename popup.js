const deckSelect = document.getElementById("deckSelect");
const noteTypeSelect = document.getElementById("noteTypeSelect");
const saveBtn = document.getElementById("saveBtn");
const statusText = document.getElementById("status");

async function invoke(action, params = {}) {
  const response = await fetch("http://localhost:8765", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      version: 6,
      params,
    }),
  });

  return await response.json();
}

async function loadDecks() {
  const result = await invoke("deckNames");

  result.result.forEach((deck) => {
    const option = document.createElement("option");
    option.value = deck;
    option.textContent = deck;
    deckSelect.appendChild(option);
  });
}

async function loadNoteTypes() {
  const result = await invoke("modelNames");

  result.result.forEach((model) => {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    noteTypeSelect.appendChild(option);
  });
}

async function loadSavedSettings() {
  const saved = await chrome.storage.local.get([
    "selectedDeck",
    "selectedNoteType",
  ]);

  if (saved.selectedDeck) {
    deckSelect.value = saved.selectedDeck;
  }

  if (saved.selectedNoteType) {
    noteTypeSelect.value = saved.selectedNoteType;
  }
}

async function saveSettings() {
  await chrome.storage.local.set({
    selectedDeck: deckSelect.value,
    selectedNoteType: noteTypeSelect.value,
  });

  statusText.textContent = "Saved";

  setTimeout(() => {
    statusText.textContent = "";
  }, 1500);
}

saveBtn.addEventListener("click", saveSettings);

(async () => {
  await loadDecks();
  await loadNoteTypes();
  await loadSavedSettings();
})();
