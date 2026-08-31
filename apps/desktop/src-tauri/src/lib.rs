use tauri::Emitter;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Lingora Desktop.", name)
}

#[tauri::command]
fn trigger_quick_lookup(app: tauri::AppHandle) -> Result<(), String> {
    println!("[Tauri Rust] Triggering instant quick lookup window...");
    app.emit("open-quick-lookup", ())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // AI provider calls (OpenAI, Mistral, Gemini, Claude, DeepL, ElevenLabs, Deepgram) are
        // BYOK direct-to-provider requests from the frontend — routed through this plugin (see
        // src/services/desktopFetch.ts) instead of the WebView's own fetch, since the WebView is
        // still subject to browser CORS and none of those providers send
        // Access-Control-Allow-Origin for a page origin. A Rust-side request has no page origin,
        // so it isn't subject to CORS at all.
        .plugin(tauri_plugin_http::init())
        // Backup/CSV/Markdown/Anki export-import file picking and saving (see
        // src/services/desktopFileStorage.ts) — the native "Open"/"Save As" dialogs plus the
        // actual disk read/write, both routed through Rust rather than any browser file API.
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, trigger_quick_lookup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
