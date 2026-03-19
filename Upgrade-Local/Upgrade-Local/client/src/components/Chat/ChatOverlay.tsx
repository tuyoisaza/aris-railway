import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MENTORS = [
    { id: 'marcus', name: 'Marcus (Stoic)', color: 'bg-stone-800' },
    { id: 'sarah', name: 'Sarah (Strategist)', color: 'bg-blue-900' },
    { id: 'david', name: 'David (Psych)', color: 'bg-emerald-900' },
    { id: 'alex', name: 'Alex (Hacker)', color: 'bg-purple-900' }
];

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatOverlay() {
    const { session } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [mentor, setMentor] = useState(MENTORS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg = { role: 'user' as const, content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    mentorId: mentor.id,
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.body) throw new Error("No response body");

            // Prepare placeholder for AI response
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                aiContent += chunk;

                // Update last message with new content
                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = aiContent;
                    return newMsgs;
                });
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: Unable to connect to mentor." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className={`p-4 ${mentor.color} flex justify-between items-center bg-opacity-50 border-b border-zinc-700`}>
                            <div className="flex items-center gap-2">
                                <div className="font-bold text-white">{mentor.name}</div>
                                {/* Dropdown Trigger (Simplified for speed - could be full select) */}
                                <select
                                    className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
                                    value={mentor.id}
                                    onChange={(e) => {
                                        setMentor(MENTORS.find(m => m.id === e.target.value) || MENTORS[0]);
                                        setMessages([]); // Clear chat on switch
                                    }}
                                >
                                    {MENTORS.map(m => <option key={m.id} value={m.id} className="text-black">{m.name}</option>)}
                                </select>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-zinc-500 text-sm mt-10">
                                    Start a conversation with {mentor.name.split(' ')[0]}...
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your question..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 px-4 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 top-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-500 transition-colors"
                aria-label="Toggle Chat"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </motion.button>
        </div>
    );
}
