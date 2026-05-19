const WORKER_URL = "https://luyenviet.theanhmgt1011.workers.dev/";

// ======================
// VOICERSS TTS CONFIG
// ======================
const VOICERSS_KEY = "8d0efcd37c6a41d3b006945bfc81b199";

function ttsUrl(text) {
  return `https://api.voicerss.org/?key=${VOICERSS_KEY}&hl=en-us&src=${encodeURIComponent(text)}&c=MP3&r=5`;
}

// ======================
// INIT CONTEXT MENU
// ======================
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-anki",
    title: "Generate Anki Card",
    contexts: ["selection"],
  });
});

// ======================
// ANKI CONNECT
// ======================
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

// ======================
// UPLOAD MEDIA
// ======================
async function uploadMedia(filename, base64Data) {
  return await invoke("storeMediaFile", {
    filename,
    data: base64Data,
  });
}

// ======================
// FETCH AUDIO AS BASE64
// ======================
async function fetchAudioBase64(url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let b of bytes) {
    binary += String.fromCharCode(b);
  }

  return btoa(binary);
}

// ======================
// MAIN FLOW
// ======================
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "add-to-anki") return;

  try {
    const targetWord = info.selectionText;

    console.log("Generating:", targetWord);

    // ======================
    // SETTINGS
    // ======================
    const saved = await chrome.storage.local.get([
      "selectedDeck",
      "selectedNoteType",
    ]);

    const deckName = saved.selectedDeck || "Default";

    const modelName = saved.selectedNoteType || "Basic";

    // ======================
    // CALL WORKER
    // ======================
    const aiResponse = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetWord,
      }),
    });

    const data = await aiResponse.json();

    console.log("AI DATA:", data);

    // ======================
    // GET FIELDS
    // ======================
    const fieldResponse = await invoke("modelFieldNames", {
      modelName,
    });

    const fieldNames = fieldResponse.result;

    // ======================
    // IMAGE
    // ======================
    let imageFilename = "";

    if (data.ImageBase64) {
      imageFilename = `${targetWord}-image.png`;

      await uploadMedia(imageFilename, data.ImageBase64);
    }

    // ======================
    // AUDIO (VOICERSS)
    // ======================
    let pronouncingFile = "";
    let soundAFile = "";
    let soundBFile = "";

    // WORD AUDIO
    try {
      const url = ttsUrl(targetWord);

      const base64 = await fetchAudioBase64(url);

      pronouncingFile = `${targetWord}-p.mp3`;

      await uploadMedia(pronouncingFile, base64);
    } catch (e) {
      console.log("Pronouncing error", e);
    }

    // EXAMPLE A
    try {
      if (data.Example?.[0]) {
        const url = ttsUrl(data.Example[0]);

        const base64 = await fetchAudioBase64(url);

        soundAFile = `${targetWord}-a.mp3`;

        await uploadMedia(soundAFile, base64);
      }
    } catch (e) {
      console.log("Sound A error", e);
    }

    // EXAMPLE B
    try {
      if (data.Example?.[1]) {
        const url = ttsUrl(data.Example[1]);

        const base64 = await fetchAudioBase64(url);

        soundBFile = `${targetWord}-b.mp3`;

        await uploadMedia(soundBFile, base64);
      }
    } catch (e) {
      console.log("Sound B error", e);
    }

    // ======================
    // BUILD FIELDS
    // ======================
    const generatedFields = {
      Explanation: data.Explanation || targetWord,

      Suggestion: data.Suggestion || "",

      Image: imageFilename ? `<img src="${imageFilename}">` : "",

      Vietnamese: data.Vietnamese || "",

      "Target word": targetWord,

      Transcription: data.Transcription || "",

      "Word type": data["Word type"] || "",

      Example: (data.Example || []).join("<br><br>"),

      Translation: (data.Translation || []).join("<br><br>"),

      Pronouncing: pronouncingFile ? `[sound:${pronouncingFile}]` : "",

      Sound_a: soundAFile ? `[sound:${soundAFile}]` : "",

      Sound_b: soundBFile ? `[sound:${soundBFile}]` : "",
    };

    // ======================
    // MAP FIELDS
    // ======================
    const fields = {};

    fieldNames.forEach((f) => {
      fields[f] = generatedFields[f] || "";
    });

    console.log("FINAL FIELDS:", fields);

    // ======================
    // ADD NOTE
    // ======================
    const addResult = await invoke("addNote", {
      note: {
        deckName,
        modelName,
        fields,
        tags: ["ai-generated"],
      },
    });

    if (addResult.error) {
      alert(addResult.error);
    }
  } catch (err) {
    console.error(err);
  }
});
