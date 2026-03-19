export async function fetchRemoteDebugMode(): Promise<boolean | null> {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();

        if (data && typeof data.debug_mode === 'boolean') {
            return data.debug_mode;
        }
    } catch (_err) {
        // Silent fail if api not ready
    }
    return null;
}
