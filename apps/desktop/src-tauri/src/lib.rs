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
        .invoke_handler(tauri::generate_handler![greet, trigger_quick_lookup])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
