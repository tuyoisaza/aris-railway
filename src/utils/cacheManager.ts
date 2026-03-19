// Cache debugging and clearing utilities

export class CacheManager {
    static forceClearCache() {
        console.log('[CacheManager] Force clearing all caches...');
        
        // Clear service worker caches
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    console.log(`[CacheManager] Deleting cache: ${cacheName}`);
                    caches.delete(cacheName);
                });
            });
        }

        // Clear localStorage cache
        if (typeof localStorage !== 'undefined') {
            const keysToKeep = ['theme', 'language', 'access_token'];
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    console.log(`[CacheManager] Clearing localStorage key: ${key}`);
                    localStorage.removeItem(key);
                }
            });
        }

        // Clear sessionStorage
        if (typeof sessionStorage !== 'undefined') {
            console.log('[CacheManager] Clearing sessionStorage');
            sessionStorage.clear();
        }

        // Force reload to clear memory caches
        setTimeout(() => {
            window.location.reload(true);
        }, 1000);
    }

    static logCacheStatus() {
        console.log('[CacheManager] Cache status:');
        
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                console.log(' - Service Worker Caches:', cacheNames);
            });
        }

        if (typeof localStorage !== 'undefined') {
            console.log(' - localStorage keys:', Object.keys(localStorage));
        }

        if (typeof sessionStorage !== 'undefined') {
            console.log(' - sessionStorage keys:', Object.keys(sessionStorage));
        }
    }
}

// Add global function for emergency cache clearing
if (typeof window !== 'undefined') {
    (window as any).clearARISCache = () => {
        CacheManager.forceClearCache();
    };
}

console.log('[CacheManager] Cache clearing utilities loaded. Use window.clearARISCache() to force clear.');