
import { SystemService } from './src/services/system.service';

async function run() {
    console.log("Enabling debug mode via script...");
    try {
        await SystemService.updateSetting('debug_mode', true, null as any);
        console.log("Debug Mode ENABLED.");
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
