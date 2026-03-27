import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { AIService } from '../services/ai';
import { api } from '../services/api';
import { clearTokenCache } from '../services/api/base-client';
import i18n from '../i18n';
import { parseV2Message, parseHistoryMessage } from '../utils/messageParser';

const GlobalContext = createContext(null);

// Load initial user from storage, but ONLY if we also have an access token
const token = localStorage.getItem('aris_token');
const loadedState = StorageService.loadState(null);
const storedUser = (loadedState?.user && token) ? loadedState.user : null;

const INITIAL_STATE = {
    user: storedUser,
    family: {
        id: null,
        name: '',
        pin: '1234',
        selectedMemberId: 'all',
        members: [], // Will fetch from DB
        stats: { weeklyUsage: 0, avgSession: '0m', activeTopics: 0 },
        weeklyData: []
    },
    topics: [], // Will fetch from DB
    projects: [],
    folders: [], // Will fetch from DB
    messages: [],
    savedChats: [],
    activeConversationId: null,
    isInitialized: false
};

export const GlobalProvider = ({ children }) => {
    const [state, setState] = useState(INITIAL_STATE);
    const [language, setLanguage] = useState(i18n.language || 'en-US'); // Init from detected language
    const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'light');
    const [loadingConversation, setLoadingConversation] = useState(false);

    // --- THEME ---
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
    };

    // --- PERSISTENCE ---
    useEffect(() => {
        // Save user preferences locally when they change
        if (state.user) {
            StorageService.saveState({ user: state.user });
            // Sync theme from user prefs if available and different
            if (state.user.preferences?.theme && state.user.preferences.theme !== theme) {
                setThemeState(state.user.preferences.theme);
            }
        }
    }, [state.user, theme]);

    // --- DATA FETCHING ---
    // --- DATA FETCHING ---

    // Actual implementation of the function above to be replaced with full body:
    const refreshData = useCallback(async () => {
        // Capture userId from current render scope (safe because it's in deps)
        const userId = state.user?.id;
        if (!userId) return;

        console.log("[Global] Refreshing Data. User:", userId);

        // Fetch Update User Data
        try {
            const userData = await api.getUser(userId);
            if (userData) {
                setState(prev => ({
                    ...prev,
                    user: { ...prev.user, ...userData }
                }));
            }
        } catch (e) {
            console.error("Error refreshing user:", e);
        }

        // Fetch Family Data
        try {
            const familyData = await api.getFamily(userId);

            if (familyData && familyData.id) {
                setState(prev => ({
                    ...prev,
                    family: {
                        ...prev.family,
                        id: familyData.id,
                        name: familyData.name,
                        pin: familyData.pin,
                        members: familyData.members || [],
                        // IMPORTANT: Use prev.family to preserve local stats if API doesn't return them
                        stats: prev.family.stats,
                        weeklyData: prev.family.weeklyData
                    }
                }));
            }
        } catch (e) {
            console.error("Error refreshing family:", e);
        }

        // Fetch Topics
        const topics = await api.getTopics(userId);
        if (topics && topics.length > 0) {
            setState(prev => ({ ...prev, topics }));
        }

        // 3. Conversations & Folders
        const chats = await api.getConversations(userId);
        console.log("[Global] Fetched Chats:", chats?.length); // Log length

        if (chats && Array.isArray(chats)) {
            setState(prev => ({ ...prev, savedChats: chats }));
        } else {
            console.warn("[Global] Chats response invalid:", chats);
        }

        const folders = await api.getFolders();
        console.log("[Global] Fetched Folders:", folders?.length);
        if (folders) {
            setState(prev => ({ ...prev, folders }));
        }

        // Fetch Projects
        const projects = await api.getProjects(userId);
        if (projects) {
            setState(prev => ({ ...prev, projects }));
        }

        // Final Step: Mark state as fully hydrated from DB
        setState(prev => ({ ...prev, isInitialized: true }));
    }, [state.user?.id]); // REMOVED family stats/weeklyData from dependencies


    // Initial Load
    useEffect(() => {
        // Register auto-logout on 401
        api.setUnauthorizedCallback(() => {
            console.warn("[Global] Session expired. Logging out.");
            logout();
        });

        // Auth Listener
        const { data } = api.onAuthStateChange((event, session) => {
            console.log(`[Global] Auth Event: ${event}`, session?.user?.id);

            if (event === 'SIGNED_IN') {
                if (session?.user) {
                    if (!state.user || state.user.id !== session.user.id) {
                        setState(prev => ({ ...prev, user: { ...prev.user, ...session.user } }));
                        refreshData();
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                logout();
            }
        });

        // Check existing session
        const { data: sessionData } = api.getSession();
        if (sessionData.session && sessionData.user) {
            setState(prev => ({ ...prev, user: sessionData.user }));
            refreshData();
        }

        return () => {
            data.unsubscribe();
        };
    }, []);


    // --- ACTIONS ---

    const updateUser = (updates) => {
        setState(prev => ({
            ...prev,
            user: { ...prev.user, ...updates }
        }));
    };

    const logout = () => {
        setState(prev => ({ ...prev, user: null, messages: [] }));
        StorageService.clearState();
        localStorage.removeItem('aris_token');
        clearTokenCache();
    };

    const addMessage = (role, text, metadata = {}) => {
        setState(prev => ({
            ...prev,
            messages: [...prev.messages, { role, text, timestamp: new Date().toISOString(), ...metadata }]
        }));
    };

    const selectConversation = async (id) => {
        setState(prev => ({ ...prev, activeConversationId: id, messages: [] }));
        setLoadingConversation(true);

        let chat = state.savedChats.find(c => c.id === id);

        // If not in cache, fetch from API
        if (!chat) {
            console.log("[Global] Conversation not in cache, fetching:", id);
            try {
                // Fetch all conversations and find the one we need
                // Or ideally have a single-conversation endpoint, but for now:
                const allChats = await api.getConversations(state.user?.id);
                if (allChats) {
                    setState(prev => ({ ...prev, savedChats: allChats }));
                    chat = allChats.find(c => c.id === id);
                }
            } catch (e) {
                console.error("[Global] Failed to fetch conversation:", e);
                setLoadingConversation(false);
                return;
            }
        }

        if (chat) {
            // Transform and parse messages using centralized parser
            const parsedMessages = (chat.messages || []).map(m => parseHistoryMessage(m));

            setState(prev => ({
                ...prev,
                activeConversationId: id,
                messages: parsedMessages
            }));

            // Sync global language state with conversation's language
            setLanguage(chat.language || 'en-US');
        }

        setLoadingConversation(false);
    };

    const sendMessage = async (text) => {
        addMessage('user', text);

        let conversationId = state.activeConversationId;
        let isNew = false;



        // ... (existing code)

        // 1. Create Conversation if new
        if (!conversationId && state.user?.id) {
            console.log("[Global] Creating new conversation for user:", state.user.id);
            try {
                const newConv = await api.createConversation(state.user.id, text.substring(0, 30) + '...', null, language);
                console.log("[Global] createConversation result:", newConv);

                if (newConv?.error) {
                    console.error("[Global] createConversation error:", newConv.error);
                    addMessage('ai', `Failed to create conversation: ${newConv.error}`);
                    return;
                }

                if (newConv && newConv.id) {
                    conversationId = newConv.id;
                    isNew = true;
                    const conversationObj = { ...newConv, messages: [], language };
                    console.log("[Global] Optimistically adding new chat to sidebar:", conversationObj);

                    setState(prev => ({
                        ...prev,
                        activeConversationId: conversationId,
                        savedChats: [conversationObj, ...prev.savedChats]
                    }));
                } else if (newConv) {
                    console.error("[Global] createConversation returned invalid data:", newConv);
                }
            } catch (e: any) {
                console.error("Failed to create conversation persistence:", e?.message || e);
            }
        } else if (!state.user?.id) {
            console.error("[Global] User ID missing in sendMessage!");
        }

        // 2. Persist User Message & Get AI Response
        if (conversationId) {
            try {
                console.log(`[Global] Sending message to conversation ${conversationId}:`, text);

                // Send message to backend and await response (which includes AI reply)
                const response = await api.createMessage(conversationId, 'user', text);
                console.log("[Global] API Response for createMessage:", response);

                if (response?.error) {
                    console.error("API Error:", response.error);
                    const errorMsg = `Error: ${response.error}. Please try logging out and back in.`;
                    addMessage('ai', errorMsg);
                    return errorMsg;
                }

                // Enhanced validation for response structure
                if (!response) {
                    console.warn("[Global] Empty response received from API");
                    const fallbackMsg = "I received your message, but got an empty response.";
                    addMessage('ai', fallbackMsg);
                    return fallbackMsg;
                }

                if (response.messages || response.aiMessage || response.text || response.content) {
                    // NEW: Handle Array of Messages (e.g., Milestone + Text)
                    if (response.messages && Array.isArray(response.messages)) {
                        console.log("[Global] Received Multiple Messages:", response.messages.length);
                        const newMessages = [];
                        let shouldRefresh = false;

                        response.messages.forEach(msg => {
                            // Skip user messages as they were added optimistically
                            if (msg.role === 'user') return;

                            const rawContent = msg.content || msg.text || "";
                            const parsed = parseV2Message(rawContent, msg.role || 'ai');

                            if (parsed.shouldRefresh) shouldRefresh = true;

                            // Add to local state
                            addMessage(parsed.role || 'ai', parsed.text, {
                                options: parsed.options,
                                action: parsed.action,
                                type: parsed.type,
                                projectData: parsed.projectData,
                                milestoneType: parsed.milestoneType,
                                topic: parsed.topic
                            });

                            // Push structured object for Sidebar/History
                            newMessages.push({
                                role: parsed.role || 'ai',
                                content: parsed.text,
                                options: parsed.options,
                                action: parsed.action,
                                type: parsed.type,
                                projectData: parsed.projectData,
                                milestoneType: parsed.milestoneType,
                                topic: parsed.topic
                            });
                        });

                        // Update sidebar with simplified history
                        setState(prev => {
                            const updatedChats = prev.savedChats.map(c => {
                                if (c.id === conversationId) {
                                    return {
                                        ...c,
                                        messages: [
                                            ...(c.messages || []),
                                            { role: 'user', content: text },
                                            ...newMessages
                                        ]
                                    };
                                }
                                return c;
                            });
                            return { ...prev, savedChats: updatedChats };
                        });

                        return newMessages[newMessages.length - 1].content; // Return last message text as "result"

                    } else {
                        // LEGACY: Single Message
                        const aiMessageObj = response.aiMessage || response;
                        const aiText = aiMessageObj.content || aiMessageObj.text || "I'm listening, but I didn't have a response.";

                        console.log("[Global] AI Message Received:", aiText);

                        addMessage('ai', aiText);

                        // Update sidebar legacy
                        setState(prev => {
                            const updatedChats = prev.savedChats.map(c => {
                                if (c.id === conversationId) {
                                    return {
                                        ...c,
                                        messages: [
                                            ...(c.messages || []),
                                            { role: 'user', content: text },
                                            { role: 'ai', content: aiText }
                                        ]
                                    };
                                }
                                return c;
                            });
                            return { ...prev, savedChats: updatedChats };
                        });

                        return aiText;
                    }
                } else {
                    console.warn("[Global] Response structure unexpected:", {
                        hasMessages: !!response.messages,
                        hasAiMessage: !!response.aiMessage,
                        hasText: !!response.text,
                        hasContent: !!response.content,
                        responseKeys: Object.keys(response),
                        response
                    });
                    const fallback = "I received your message, but the response format was unexpected.";
                    addMessage('ai', fallback);
                    return fallback;
                }
            } catch (error) {
                console.error("Message Send Error:", error);
                const errorText = "I apologize, but I'm having trouble retrieving a response. Please check your connection.";
                addMessage('ai', errorText);
                return errorText;
            }
        } else {
            console.error("[Global] FAILED to get conversationId. User:", state.user?.id, "Active Conv:", state.activeConversationId);
            const errorMsg = "I apologize, but I'm having trouble starting the conversation. Please try refreshing the page.";
            addMessage('ai', errorMsg);
            return errorMsg;
        }

        return "Message sent."; // Fallback if no conversation ID (shouldn't happen due to #1)
    };

    const clearMessages = () => setState(prev => ({
        ...prev,
        messages: [],
        activeConversationId: null // FIX: Ensure new chat starts fresh 
    }));


    // --- CONVERSATION ACTIONS ---
    const deleteConversation = async (conversationId) => {
        const result = await api.deleteConversation(conversationId);
        if (result && result.success) {
            setState(prev => {
                const updatedChats = prev.savedChats.filter(c => c.id !== conversationId);
                return {
                    ...prev,
                    savedChats: updatedChats,
                    activeConversationId: prev.activeConversationId === conversationId ? null : prev.activeConversationId,
                    messages: prev.activeConversationId === conversationId ? [] : prev.messages
                };
            });
            return { success: true };
        }
        return { success: false, error: result?.error };
    };


    const renameConversation = async (conversationId, newTitle) => {
        const result = await api.renameConversation(conversationId, newTitle);
        if (result && result.id) {
            setState(prev => {
                const updatedChats = prev.savedChats.map(c =>
                    c.id === conversationId ? { ...c, title: newTitle } : c
                );
                return { ...prev, savedChats: updatedChats };
            });
            return { success: true };
        }
        return { success: false, error: result?.error };
    };

    const archiveConversation = async (conversationId, isArchived) => {
        const result = await api.updateConversation(conversationId, { is_archived: isArchived });
        if (result && result.id) {
            setState(prev => {
                const updatedChats = prev.savedChats.map(c =>
                    c.id === conversationId ? { ...c, is_archived: isArchived } : c
                );
                return {
                    ...prev,
                    savedChats: updatedChats,
                    // If we archived the active chat, clear it? Or just keep it visible until they move away?
                    // Let's keep it visible but maybe show an archived badge.
                };
            });
            await refreshData(); // Ensure consistency
            return { success: true };
        }
        return { success: false, error: result?.error };
    };


    // --- FOLDER ACTIONS ---
    const createFolder = async (title) => {
        if (!state.user?.id) return;
        const newFolder = await api.createFolder(title);
        if (newFolder) {
            await refreshData();
            return { success: true };
        }
        return { success: false, error: 'Failed to create folder' };
    };

    const deleteFolder = async (folderId) => {
        const result = await api.deleteFolder(folderId);
        if (result && result.success) {
            await refreshData();
            return { success: true };
        }
        return { success: false, error: result?.error || 'Failed to delete' };
    };

    const renameFolder = async (folderId, newTitle) => {
        const result = await api.renameFolder(folderId, newTitle);
        if (result && result.id) {
            // Optimistic update of folders list (or refresh)
            setState(prev => ({
                ...prev,
                folders: prev.folders.map(f => f.id === folderId ? { ...f, title: newTitle } : f)
            }));
            await refreshData(); // To be safe and get fresh state
            return { success: true };
        }
        return { success: false, error: result?.error };
    };

    const moveConversation = async (conversationId, folderId) => {
        const result = await api.moveConversationToFolder(conversationId, folderId);
        if (result) {
            await refreshData(); // Refresh to update conversation list (which might need new folder_id)
            return { success: true };
        }
        return { success: false };
    };

    const createFamily = async (name) => {
        if (state.user?.id) {
            console.log("[Global] Creating family for user:", state.user.id);
            const result = await api.createFamily(state.user.id, name);

            // Check for both .id (success) and .error (failure)
            if (result && result.id) {
                // Optimistically update state to prevent UI loop in ParentDashboard
                setState(prev => ({
                    ...prev,
                    family: {
                        ...prev.family,
                        id: result.id,
                        name: result.name,
                        members: prev.family.members // Keep existing (empty) members until refresh
                    }
                }));

                await refreshData();
                return { success: true };
            }
            // Return the specific error from backend if available
            return { success: false, error: result?.error || 'Unknown error during family creation' };
        }
        console.error("[Global] Cannot create family: User not authenticated (missing ID).");
        return { success: false, error: 'User not authenticated' };
    };

    // --- FAMILY ACTIONS ---

    const updateFocusPin = async (newPin) => {
        if (state.family.id) {
            const success = await api.updatePin(state.family.id, newPin);
            if (success) refreshData();
        }
    };

    const inviteMember = async (email) => {
        if (state.family.id) {
            const result = await api.inviteMember(state.family.id, email, state.user.id);
            return result; // contains link
        }
    };

    const cancelInvite = async (inviteId) => {
        return await api.deleteInvite(inviteId);
    };

    const getInvites = async () => {
        if (state.family.id) {
            return await api.getInvites(state.family.id);
        }
        return [];
    };

    const setSelectedMemberId = (id) => {
        setState(prev => ({
            ...prev,
            family: { ...prev.family, selectedMemberId: id }
        }));
    };

    const value = useMemo(() => ({
        ...state,
        updateUser,
        logout,
        addMessage,
        sendMessage,
        clearMessages,
        updateFocusPin,
        inviteMember,
        cancelInvite,
        getInvites,
        createFamily,
        setSelectedMemberId,
        selectConversation,
        refreshData,
        loadingConversation,
        theme,
        setTheme,
        language,
        setLanguage: (newLang) => {
            setLanguage(newLang);
            i18n.changeLanguage(newLang); // Sync UI translation

            // Persist to active conversation immediately
            if (state.activeConversationId) {
                console.log("[Global] Persisting language change to DB:", newLang);
                api.updateConversation(state.activeConversationId, { language: newLang })
                    .then(res => {
                        if (res && res.id) {
                            // Update local simplified state in savedChats
                            setState(prev => ({
                                ...prev,
                                savedChats: prev.savedChats.map(c =>
                                    c.id === state.activeConversationId ? { ...c, language: newLang } : c
                                )
                            }));
                        }
                    });
            }
        },
        // Folder Actions
        createFolder,
        deleteFolder,
        renameFolder,
        moveConversation,
        deleteConversation,
        renameConversation,
        archiveConversation,
        // Topic Actions
        addTopic: async (data: any) => {
            const result = await api.createTopic(data);
            if (result) refreshData();
            return result;
        },
        deleteTopic: async (id) => {
            const result = await api.deleteTopic(id);
            if (result.success) refreshData();
            return result;
        },
        // Project Actions
        addProject: async (projectData) => {
            if (!state.user?.id) return;
            const newProject = await api.createProject({ ...projectData, userId: state.user.id });
            if (newProject) refreshData();
        },
        updateProject: async (id, updates) => {
            const updated = await api.updateProject(id, updates);
            if (updated) refreshData();
        },
        deleteProject: async (id) => {
            const success = await api.deleteProject(id);
            if (success) refreshData();
        }
    }), [state, language, refreshData]);

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};
