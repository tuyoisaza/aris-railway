
/**
 * Voice Service using Web Speech API
 * Handles Text-to-Speech (TTS) and Speech-to-Text (STT/ASR)
 */


let recognition = null;

export const VoiceService = {
    // --- Text to Speech ---

    getVoices: () => {
        return new Promise((resolve) => {
            let voices = window.speechSynthesis.getVoices();
            if (voices.length) {
                resolve(voices);
                return;
            }
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                resolve(voices);
            };
        });
    },

    speak: (text, onEnd, lang = 'en-US', voiceUri) => {
        let resolvedOnEnd = onEnd;
        let resolvedLang = lang;
        let resolvedVoiceUri = voiceUri;

        if (typeof onEnd === 'string') {
            resolvedVoiceUri = onEnd;
            resolvedOnEnd = null;
            resolvedLang = lang || 'en-US';
        }

        if (!window.speechSynthesis) {
            console.error('Text-to-Speech not supported.');
            if (resolvedOnEnd) resolvedOnEnd();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = resolvedLang; // 'en-US', 'es-ES', 'pt-BR'

        utterance.onend = () => {
            if (resolvedOnEnd) resolvedOnEnd();
        };

        utterance.onerror = (e) => {
            console.error("TTS Error", e);
            if (resolvedOnEnd) resolvedOnEnd(); // Ensure we don't hang on error
        };

        const speakWithVoice = (voices) => {
            if (resolvedVoiceUri) {
                const selectedVoice = voices.find((voice) => voice.voiceURI === resolvedVoiceUri);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            // Cancel previous speech right before speaking
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        };

        VoiceService.getVoices().then(speakWithVoice);
    },

    stop: () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    },

    // --- Speech to Text ---

    listen: async (onResult, onError, onEnd, lang = 'en-US') => {
        // Check browser support and HTTPS
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const errorMsg = 'Speech Recognition not supported. Try Chrome, Edge, or Safari.';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return null;
        }

        // Check HTTPS requirement
        const isHttps = location.protocol === 'https:';
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isHttps && !isLocalhost) {
            const errorMsg = 'HTTPS required for microphone access in production.';
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return null;
        }

        // Check microphone permission first
        try {
            console.log('Requesting microphone permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log('Microphone permission granted');
        } catch (error) {
            const errorMsg = `Microphone access denied: ${error.message}`;
            console.error(errorMsg);
            if (onError) onError(errorMsg);
            return null;
        }

        if (!recognition) {
            try {
                recognition = new SpeechRecognition();
                recognition.continuous = true; // CONTINUOUS MODE for dictation
                recognition.interimResults = true; // Enable interim results
                console.log('Speech Recognition initialized successfully');
            } catch (e) {
                const errorMsg = `Failed to initialize Speech Recognition: ${e.message}`;
                console.error(errorMsg);
                if (onError) onError(errorMsg);
                return null;
            }
        }

        recognition.lang = lang;
        let finalTranscript = '';
        let silenceTimer = null;
        let hasEnded = false; // Prevent double firing of onEnd/FinalResult

        const resetSilenceTimer = () => {
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                console.log("Silence detected (5s), stopping recognition.");
                // Ensure we stop properly
                stopRecognitionInternal();
            }, 5000); // 5s silence timeout (increased from 2.5s)
        };

        const stopRecognitionInternal = () => {
            if (recognition) {
                try { recognition.stop(); } catch (e) { console.warn("Stop error", e); }
            }
        };

        recognition.onstart = () => {
            console.log("Listening...");
            hasEnded = false;
            finalTranscript = ''; // Ensure clean start
            // We do NOT start the silence timer here immediately to avoid cutting off 
            // if the user takes a moment to start speaking. 
            // The browser has its own 'no-speech' timeout (usually ~10s).
            // We only want to detect silence AFTER speech has started (in onresult),
            // OR we can set a longer initial safety timer if needed. 
            // For now, let's rely on browser for start, and use our timer for "end of speech".
        };

        recognition.onresult = (event) => {
            resetSilenceTimer(); // Activity detected - NOW we strictly enforce silence timeout

            let interimTranscript = '';
            // Reconstruct final transcript from ALL results in session because continuous=true keeps history
            finalTranscript = '';

            for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Emit Progress (Not Final yet unless stopped)
            let liveText = finalTranscript + interimTranscript;

            if (onResult && liveText && !hasEnded) {
                onResult(liveText, false);
            }
        };

recognition.onerror = (event) => {
            clearTimeout(silenceTimer);
            
            let userFriendlyError = event.error;
            switch (event.error) {
                case 'not-allowed':
                    userFriendlyError = 'Microphone permission denied. Please allow microphone access in your browser.';
                    break;
                case 'no-speech':
                    console.log("No speech detected, continuing to listen...");
                    return; // Don't show error for no speech
                case 'network':
                    userFriendlyError = 'Network error. Please check your internet connection.';
                    break;
                case 'service-not-allowed':
                    userFriendlyError = 'Speech recognition service not available. Try refreshing the page.';
                    break;
                case 'aborted':
                    userFriendlyError = 'Speech recognition was aborted.';
                    break;
            }
            
            console.error("Speech Error:", event.error);
            if (onError) onError(userFriendlyError);
        };

        recognition.onend = () => {
            clearTimeout(silenceTimer);
            if (hasEnded) return; // Prevent double handling
            hasEnded = true;

            console.log("Recognition ended. Final:", finalTranscript);
            // NOW we send the final result!
            if (onResult && finalTranscript.trim()) {
                onResult(finalTranscript, true); // isFinal = true
            }
            if (onEnd) onEnd();
        };

        try {
            console.log(`Starting speech recognition with language: ${lang}`);
            recognition.start();
            console.log('Speech recognition started successfully');
        } catch (e) {
            const errorMsg = `Failed to start recognition: ${e.message}`;
            console.error(errorMsg);
            if (onError) onError(errorMsg);
        }

        return recognition;
    },

    stopListening: (instance) => {
        // Use internal recognition if no instance provided
        const target = instance || recognition;
        if (target) {
            try {
                target.stop();
            } catch (e) {
                console.warn("Error stopping:", e);
            }
        }
    },
};
