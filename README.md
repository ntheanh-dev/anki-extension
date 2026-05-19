# Anki AI Generator

Anki Chrome extension that generates Anki cards from selected text using an external AI worker and AnkiConnect.

## Purpose

- Send the selected text to an AI worker to generate fields (explanation, examples, image, translations, transcription, etc.).
- Create an Anki note via AnkiConnect and upload generated media (images and TTS audio).

## Prerequisites

- Anki with the AnkiConnect add-on installed and running (default HTTP API at `http://localhost:8765`).
- Chrome/Chromium (or Edge) to load the extension.
- Internet access for the configured AI worker and VoiceRSS TTS service.

## Install (load unpacked)

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and choose this repository folder.

## Configuration

- Deck and note type are selected from the extension popup: open the toolbar action (click the extension icon) and pick a deck and note type.
- Worker URL and TTS key are set in `background.js`:
  - `WORKER_URL` (host permission is declared in `manifest.json`).
  - `VOICERSS_KEY` is the VoiceRSS TTS API key. Replace this key with your own.

Files:

- [manifest.json](manifest.json#L1-L20)
- [background.js](background.js#L1-L400)
- [popup.html](popup.html#L1-L200)
- [popup.js](popup.js#L1-L200)

## Usage

1. Start Anki with AnkiConnect running.
2. (Optional) Open the extension popup and select the deck and note type to use.
3. On any webpage, select a word or phrase, right-click, and choose "Generate Anki Card".
4. The extension will call the AI worker, upload media to Anki, and add the note.

## Troubleshooting

- If nothing appears in Anki, confirm AnkiConnect is reachable:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"version","version":6}' http://localhost:8765
```

- Check the extension console for `background.js` logs (Open Chrome extensions page, click "service worker" link for the extension to view console) and the webpage console for popup logs.
- If TTS or image upload fails, ensure external services are reachable and that `WORKER_URL` is correct.

## Security & Notes

- Replace `VOICERSS_KEY` with your own key; do not commit private keys to repositories.
- `host_permissions` in `manifest.json` must include the worker origin and `http://localhost:8765` for AnkiConnect where applicable.

## Development

- To change the AI endpoint or adjust fields mapping, edit `background.js`.
- The extension expects the AI worker response to include keys like `Explanation`, `Example` (array), `ImageBase64` (base64 PNG string), `Vietnamese`, `Transcription`, `Translation` (array), and `Word type`.

## License

Add a license if desired.
