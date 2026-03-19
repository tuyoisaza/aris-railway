
/**
 * Simulated AI Service
 * In a real production environment, this would call OpenAI/Gemini APIs.
 * Currently simulates intelligence using keyword matching and context-aware templates.
 */

const KNOWLEDGE_BASE = {
    'black hole': [
        "A black hole is a region of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it.",
        "The boundary of no return is called the event horizon. It's fascinating because it challenges our understanding of physics.",
        "Did you know supermassive black holes lie at the center of almost every large galaxy?"
    ],
    'event horizon': [
        "The event horizon is the point of no return around a black hole. Once you cross it, you'd need to travel faster than light to escape.",
        "Time behaves strangely near the event horizon due to gravitational time dilation."
    ],
    'stoicism': [
        "Stoicism is a philosophy of personal ethics informed by its system of logic and its views on the natural world.",
        "It teaches us to focus on what we can control and accept what we cannot.",
        "Marcus Aurelius, Epictetus, and Seneca are the most famous Stoic philosophers."
    ],
    'neural network': [
        "Neural networks are computing systems inspired by the biological neural networks that constitute animal brains.",
        "They learn to perform tasks by considering examples, generally without being programmed with task-specific rules."
    ],
    'renaissance': [
        "The Renaissance was a fervent period of European cultural, artistic, political and economic 'rebirth' following the Middle Ages.",
        "It promoted the rediscovery of classical philosophy, literature and art."
    ]
};

const DEFAULT_RESPONSES = [
    "That's a fascinating topic. Tell me more about your thoughts on it.",
    "I see. How does that connect to what you were learning earlier?",
    "Interesting perspective. Can you elaborate?",
    "I'm listening. What else?"
];

export const AIService = {
    /**
     * Process a user message and return an AI response
     * @param {string} text - User's message
     * @returns {Promise<string>} - The AI's response
     */
    /**
     * Process a user message and return an AI response
     * @param {string} text - User's message
     * @param {string} language - Target language
     * @returns {Promise<string>} - The AI's response
     */
    generateResponse: async (text, language = 'English (US)') => {
        return new Promise((resolve) => {
            // Simulate network delay (1-2 seconds)
            const delay = 1000 + Math.random() * 1000;

            setTimeout(() => {
                const lowerText = text.toLowerCase();

                // --- Simulated Translation Layer ---
                if (language && (language.includes('Spanish') || language.includes('Español'))) {
                    if (lowerText.includes('black hole')) {
                        resolve("Un agujero negro es una región del espacio donde la gravedad es tan fuerte que nada puede escapar.");
                        return;
                    }
                    if (lowerText.includes('stoic')) {
                        resolve("El estoicismo es una filosofía de ética personal informada por su sistema de lógica y sus puntos de vista sobre el mundo natural.");
                        return;
                    }
                    resolve("Entiendo. Cuéntame más sobre eso.");
                    return;
                }

                let response = null;

                // check for keywords
                for (const [keyword, answers] of Object.entries(KNOWLEDGE_BASE)) {
                    if (lowerText.includes(keyword)) {
                        response = answers[Math.floor(Math.random() * answers.length)];
                        break;
                    }
                }

                // Default if no keyword match
                if (!response) {
                    response = DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
                }

                resolve(response);
            }, delay);
        });
    }
};
