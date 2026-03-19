// Debug Configuration Manager for SuperAdmin Debugging

export class DebugConfig {
    private static instance: DebugConfig;
    private isDebugEnabled: boolean = false;
    
    private constructor() {
        this.loadConfig();
    }
    
    static getInstance(): DebugConfig {
        if (!DebugConfig.instance) {
            DebugConfig.instance = new DebugConfig();
        }
        return DebugConfig.instance;
    }
    
    private loadConfig() {
        const urlParams = new URLSearchParams(window.location.search);
        const debugMode = urlParams.get('debug') || urlParams.get('superadmin') || localStorage.getItem('aris_debug_mode');
        
        this.isDebugEnabled = debugMode === 'true' || debugMode === 'superadmin' || process.env.NODE_ENV === 'development';
        
        if (this.isDebugEnabled) {
            console.log('🎯 [DEBUG] SuperAdmin Debug Mode ENABLED');
            console.log('🎯 [DEBUG] URL Parameters:', Object.fromEntries(urlParams.entries()));
            console.log('🎯 [DEBUG] Local Storage debug:', localStorage.getItem('aris_debug_mode'));
        }
    }
    
    isEnabled(): boolean {
        return this.isDebugEnabled;
    }
    
    enable() {
        localStorage.setItem('aris_debug_mode', 'true');
        this.isDebugEnabled = true;
        console.log('🎯 [DEBUG] SuperAdmin Debug Mode ENABLED (local)');
        
        // Reload to apply debug mode
        setTimeout(() => {
            window.location.search = '?debug=true';
        }, 100);
    }
    
    disable() {
        localStorage.removeItem('aris_debug_mode');
        this.isDebugEnabled = false;
        console.log('🎯 [DEBUG] SuperAdmin Debug Mode DISABLED');
        
        // Reload to apply
        setTimeout(() => {
            window.location.search = '';
        }, 100);
    }
    
    // Artifact tracking
    static trackArtifact(type: string, data: any, source: string = 'unknown') {
        const config = DebugConfig.getInstance();
        if (config.isEnabled()) {
            console.log(`🎯 [DEBUG] ARTIFACT TRACKER - ${type}:`, {
                type,
                data,
                source,
                timestamp: new Date().toISOString(),
                stackTrace: new Error().stack?.split('\n').slice(0, 3)
            });
        }
    }
    
    // Topic creation tracking
    static trackTopicCreation(action: string, topic: string, userId: string, source: string) {
        const config = DebugConfig.getInstance();
        if (config.isEnabled()) {
            console.log(`🎯 [DEBUG] TOPIC CREATION - ${action}:`, {
                action,
                topic,
                userId,
                source,
                timestamp: new Date().toISOString(),
                callerStack: new Error().stack?.split('\n').slice(0, 5)
            });
        }
    }
}

// Auto-initialize
const debugConfig = DebugConfig.getInstance();

// Global access
(window as any).ARIS_DEBUG = {
    isEnabled: () => debugConfig.isEnabled(),
    enable: () => debugConfig.enable(),
    disable: () => debugConfig.disable(),
    trackArtifact: (type: string, data: any, source?: string) => DebugConfig.trackArtifact(type, data, source),
    trackTopicCreation: (action: string, topic: string, userId: string, source?: string) => DebugConfig.trackTopicCreation(action, topic, userId, source)
};

console.log('🎯 [DEBUG] Debug utilities loaded. Status:', debugConfig.isEnabled() ? 'ENABLED' : 'DISABLED');