import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Download, Moon, Sun, Check, ArrowLeft, LogOut, Brain, Trash2 } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { VoiceService } from '../../services/voice';
import { api } from '../../services/supabase';
import { useTranslation } from 'react-i18next';
import ChatSidebar from '../conversation/ChatSidebar';

const PLANS = [
    { id: 'free', name: 'Explorer', price: '$0', features: ['Unlimited Conversations', 'Basic Learning Map', 'Project Suggestions'], recommended: false },
    { id: 'plus', name: 'Navigator', price: '$15', features: ['All Explorer Features', 'Detailed Analytics', 'Priority Support', 'Parent Dashboard'], recommended: true },
    { id: 'pro', name: 'Visionary', price: '$29', features: ['All Navigator Features', 'Custom Learning Paths', 'API Access', '1-on-1 Mentorship'], recommended: false }
];

const AccountSettings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, updateUser, logout, setLanguage, family, theme, setTheme, clearMessages } = useGlobal();

    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Profile State
    const [editName, setEditName] = useState('');
    const [editAge, setEditAge] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // PIN State
    const [localPin, setLocalPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');

    // Voices
    const [availableVoices, setAvailableVoices] = useState([]);

    // Agora State
    const [agoraMemory, setAgoraMemory] = useState([]);
    const [agoraLoading, setAgoraLoading] = useState(false);

    const fileInputRef = useRef(null);

    // Derived User Data
    const safeUser = user || {};
    const userName = safeUser.name || 'User';
    const userEmail = safeUser.email || 'No Email';
    const userAge = safeUser.age || '';
    const userJoined = safeUser.created_at ? new Date(safeUser.created_at).toLocaleDateString() : 'Unknown';
    const userDescription = safeUser.description || '';
    const userAvatar = safeUser.avatar_url;
    const userPreferences = safeUser.preferences || {};

    // Initialize Edit State
    useEffect(() => {
        if (user) {
            setEditName(user.name || '');
            setEditAge(user.age || '');
            setEditDescription(user.description || '');
        }
    }, [user]);

    // Voice Loading
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // Load Agora memory when tab is active
    useEffect(() => {
        if (activeTab === 'agora') {
            loadAgoraMemory();
        }
    }, [activeTab]);

    const loadAgoraMemory = async () => {
        setAgoraLoading(true);
        try {
            const data = await api.agora.getMemory();
            // API returns { traits: [...] } with key/value/confidence format
            if (data?.traits && Array.isArray(data.traits)) {
                // Map the API response to match our UI expectations
                const mapped = data.traits.map((t: any) => ({
                    trait_key: t.key,
                    trait_value: t.value,
                    confidence: t.confidence / 100 // API returns percentage, we want 0-1
                }));
                setAgoraMemory(mapped);
            }
        } catch (err) {
            console.error('Failed to load Agora memory:', err);
        } finally {
            setAgoraLoading(false);
        }
    };

    const handleDeleteTrait = async (traitKey: string) => {
        if (!confirm(`Delete trait "${traitKey}"?`)) return;
        try {
            await api.agora.correctMemory(traitKey, { delete: true });
            setAgoraMemory(prev => prev.filter(t => t.trait_key !== traitKey));
        } catch (err) {
            console.error('Failed to delete trait:', err);
        }
    };

    const handleNewChat = () => {
        if (clearMessages) clearMessages();
        setIsSidebarOpen(false);
        navigate('/');
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        // Also persist to user preferences
        if (user?.id) {
            const newPrefs = { ...userPreferences, theme: newTheme };
            updateUser({ preferences: newPrefs });
            api.updatePreferences(newPrefs);
        }
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setUploading(true);
        try {
            // Only send fields that exist in DB schema (name, age)
            // Note: 'description' is not in DB - it's a UI-only field for now
            const updates: { name: string; age: string } = {
                name: editName,
                age: editAge
            };

            // Updates local state (including description for UI display)
            updateUser({ ...updates, description: editDescription });

            // Updates Backend (only DB-valid fields)
            await api.updateUser(user.id, updates);

            setIsEditing(false);
        } catch (e) {
            console.error("Failed to save profile:", e);
            alert("Failed to save changes.");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        setUploading(true);
        try {
            // TODO: Implement file upload to backend
            alert('Avatar upload coming soon!');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const getUserTypeLabel = () => {
        // Simple logic based on email or existing preferences
        if (userEmail.includes('admin') || userEmail === 'thetboard@gmail.com') return 'Admin';
        return 'Student'; // Default
    };

    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', position: 'relative' }}>
            {/* Sidebar */}
            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={handleNewChat}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                {/* Hamburger Button */}
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '4px',
                        marginRight: '-8px'
                    }}
                >
                    <div style={{ width: '18px', height: '2px', background: 'var(--color-text)' }}></div>
                    <div style={{ width: '18px', height: '2px', background: 'var(--color-text)' }}></div>
                    <div style={{ width: '18px', height: '2px', background: 'var(--color-text)' }}></div>
                </button>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        color: 'var(--color-text)',
                        marginLeft: '0'
                    }}
                    className="hover:bg-gray-100"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>{t('settings.account')}</h1>
                <button
                    onClick={() => {
                        logout();
                        navigate('/'); // Force redirect to home/login
                    }}
                    style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}
                    className="hover:text-red-500"
                >
                    <LogOut size={20} />
                    <span>{t('settings.logout')}</span>
                </button>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
                {t('settings.manageProfile')}
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '16px' }}>
                {[
                    { id: 'profile', icon: User, label: t('settings.profile') },
                    { id: 'agora', icon: Brain, label: 'Agora' },
                    { id: 'subscription', icon: CreditCard, label: t('settings.subscription') },
                    { id: 'export', icon: Download, label: t('settings.export') }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                background: activeTab === tab.id ? 'var(--color-text)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Profile Content */}
            {activeTab === 'profile' && (
                <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* User Info Card */}
                    <div className="card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '32px',
                                fontWeight: '700',
                                position: 'relative'
                            }}
                        >
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                userName[0] || 'U'
                            )}

                            {isEditing && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        onClick={handleUploadClick}
                                        style={{
                                            position: 'absolute',
                                            bottom: -10,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 'max-content',
                                            fontSize: '10px',
                                            background: 'var(--color-text)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            zIndex: 10
                                        }}
                                    >
                                        Change Image
                                    </button>
                                </>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            {isEditing ? (
                                <>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        style={{ fontSize: '24px', fontWeight: '700', padding: '4px', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '4px', width: '100%', display: 'block' }}
                                        placeholder="Name"
                                    />
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: '500' }}>Age:</label>
                                            <input
                                                type="number"
                                                value={editAge}
                                                onChange={(e) => setEditAge(e.target.value)}
                                                style={{ width: '60px', padding: '4px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Add a bio or description to guide Aris..."
                                        style={{
                                            fontSize: '14px',
                                            padding: '8px',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            marginTop: '8px',
                                            width: '100%',
                                            display: 'block',
                                            minHeight: '80px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </>
                            ) : (
                                <>
                                    <h2 style={{ margin: 0, fontSize: '24px' }}>{userName}</h2>
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '4px' }}>{t('settings.age')}: {userAge || 'Not set'}</span>
                                        <span style={{ fontSize: '12px', background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '4px' }}>{t('settings.joined')}: {userJoined}</span>
                                    </div>
                                    {userDescription && (
                                        <p style={{ marginTop: '12px', fontSize: '14px', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
                                            "{userDescription}"
                                        </p>
                                    )}
                                </>
                            )}
                            <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>{userEmail}</p>

                            {/* User User Type Label */}
                            <div style={{ marginTop: '8px' }}>
                                <span style={{
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: '600',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    {getUserTypeLabel()}
                                </span>
                            </div>
                        </div>
                        <button
                            className="btn-secondary"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => {
                                if (isEditing) {
                                    handleSaveProfile();
                                } else {
                                    setEditName(userName);
                                    setEditAge(userAge);
                                    setEditDescription(userDescription);
                                    setIsEditing(true);
                                }
                            }}
                        >
                            {isEditing ? t('settings.save') : t('settings.edit')}
                        </button>
                    </div>

                    {/* Preferences Card */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>{t('settings.preferences')}</h3>

                        {/* Theme Toggle */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <button
                                onClick={() => handleThemeChange('light')}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    border: `1px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '8px',
                                    background: 'var(--color-surface)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    color: theme === 'light' ? 'var(--color-primary)' : 'var(--color-text)'
                                }}
                            >
                                <Sun size={24} />
                                <span>{t('settings.light')}</span>
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    border: `1px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '8px',
                                    background: 'var(--color-surface)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    color: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-text)'
                                }}
                            >
                                <Moon size={24} />
                                <span>{t('settings.dark')}</span>
                            </button>
                        </div>

                        {/* Language & Translation */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>{t('settings.language')}</label>
                            <select
                                onChange={(e) => {
                                    const lang = e.target.value;
                                    setLanguage(lang); // Immediate UI update

                                    const isForeign = lang !== 'en-US';
                                    const newPrefs = {
                                        ...userPreferences,
                                        language: lang,
                                        autoTranslate: isForeign,
                                        targetLanguage: lang
                                    };
                                    updateUser({ preferences: newPrefs });
                                    api.updatePreferences(newPrefs);
                                }}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                value={userPreferences?.language || 'en-US'}
                            >
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Español</option>
                                <option value="pt-BR">Português</option>
                            </select>
                            {userPreferences?.autoTranslate && (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                    Aris will automatically translate responses to {userPreferences.targetLanguage}.
                                </p>
                            )}
                        </div>

                        {/* Focus Mode Configuration */}
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Focus Mode Configuration</h4>
                            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                                Set a PIN to secure Focus Mode exiting.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="password"
                                        placeholder="New PIN (4 digits)"
                                        maxLength={4}
                                        value={localPin}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setLocalPin(val);
                                            // Reset error on change
                                            if (pinError) setPinError('');
                                        }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)',
                                            width: '140px',
                                            textAlign: 'center',
                                            fontSize: '18px',
                                            letterSpacing: '4px'
                                        }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm PIN"
                                        maxLength={4}
                                        value={confirmPin}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setConfirmPin(val);
                                            if (pinError) setPinError('');

                                            // Auto-save check
                                            if (localPin.length === 4 && val === localPin) {
                                                updateUser({ pin: localPin });
                                                api.updateUser(safeUser.id, { pin: localPin });
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid ' + (pinError ? 'red' : 'var(--color-border)'),
                                            background: 'var(--color-surface)',
                                            color: 'var(--color-text)',
                                            width: '140px',
                                            textAlign: 'center',
                                            fontSize: '18px',
                                            letterSpacing: '4px'
                                        }}
                                    />

                                    {/* Visual Feedback */}
                                    {localPin.length === 4 && confirmPin.length === 4 && localPin === confirmPin && (
                                        <div style={{ color: 'green', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Check size={20} />
                                            <span style={{ fontSize: '12px', fontWeight: '600' }}>Saved</span>
                                        </div>
                                    )}
                                </div>

                                {localPin && confirmPin && localPin !== confirmPin && (
                                    <span style={{ color: 'red', fontSize: '12px' }}>PINs do not match</span>
                                )}
                            </div>
                        </div>

                        {/* Voice Settings */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontWeight: '500' }}>Voice Output</label>
                                <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={userPreferences?.voice?.enabled !== false} // Default to enabled
                                        onChange={(e) => {
                                            const newPrefs = {
                                                ...userPreferences,
                                                voice: { ...(userPreferences.voice || {}), enabled: e.target.checked }
                                            };
                                            updateUser({ preferences: newPrefs });
                                            api.updatePreferences(newPrefs);
                                        }}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Enable TTS
                                </label>
                            </div>

                            {userPreferences?.voice?.enabled && (
                                <select
                                     onChange={(e) => {
                                         const uri = e.target.value;
                                         const newPrefs = {
                                             ...userPreferences,
                                             voice: { ...(userPreferences.voice || {}), uri }
                                         };
                                         updateUser({ preferences: newPrefs });
                                         api.updatePreferences(newPrefs);
                                         // Preview Voice
                                         const previewLang = userPreferences?.language || 'en-US';
                                         VoiceService.speak("Hello", null, previewLang, uri);
                                     }}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                    value={userPreferences?.voice?.uri || ''}
                                >
                                    <option value="">Default Browser Voice</option>
                                    {availableVoices.map(v => (
                                        <option key={v.voiceURI} value={v.voiceURI}>
                                            {v.name} ({v.lang})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Teacher's Personality */}
                        <div style={{ marginTop: '24px', borderTop: '1px solid var(--color-border-light)', paddingTop: '24px' }}>
                            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Teacher's Personality</h3>

                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Emoticon Usage</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['NONE', 'LOW', 'MEDIUM', 'HIGH'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => {
                                            const newPrefs = {
                                                ...userPreferences,
                                                emoticons: level
                                            };
                                            updateUser({ preferences: newPrefs });
                                            api.updatePreferences(newPrefs);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: userPreferences?.emoticons === level
                                                ? '2px solid var(--color-primary)'
                                                : '1px solid var(--color-border)',
                                            background: userPreferences?.emoticons === level
                                                ? 'var(--color-bg-secondary)'
                                                : 'var(--color-surface)',
                                            color: userPreferences?.emoticons === level
                                                ? 'var(--color-primary)'
                                                : 'var(--color-text)',
                                            fontWeight: userPreferences?.emoticons === level ? '600' : '400',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                                Controls how expressive Aris is with emojis.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Agora Content - What ARIS Thinks */}
            {activeTab === 'agora' && (
                <div style={{ maxWidth: '700px' }}>
                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <Brain size={32} color="var(--color-primary)" />
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px' }}>Agora: What ARIS remembers of you so far</h2>
                                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                    These are patterns ARIS has noticed from your conversations
                                </p>
                            </div>
                        </div>

                        {agoraLoading ? (
                            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
                                Loading your memory profile...
                            </div>
                        ) : agoraMemory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px' }}>
                                <Brain size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
                                <h3 style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No memories yet</h3>
                                <p style={{ color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                                    Have more conversations with ARIS to build your learner profile!
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {agoraMemory.map((trait: any) => (
                                    <div
                                        key={trait.trait_key}
                                        style={{
                                            padding: '16px',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border-light)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {trait.trait_key?.replace(/_/g, ' ')}
                                                </div>
                                                <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--color-text)' }}>
                                                    {trait.trait_value}
                                                </div>
                                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ flex: 1, maxWidth: '150px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                width: `${(trait.confidence || 0) * 100}%`,
                                                                height: '100%',
                                                                background: trait.confidence > 0.7 ? 'var(--color-primary)' : trait.confidence > 0.4 ? '#f59e0b' : '#94a3b8',
                                                                borderRadius: '3px'
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                                        {Math.round((trait.confidence || 0) * 100)}% confidence
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTrait(trait.trait_key)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    color: 'var(--color-text-tertiary)',
                                                    borderRadius: '8px'
                                                }}
                                                title="Remove this trait"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                <strong>🔒 Privacy:</strong> This data is used only to personalize your learning experience.
                                You can delete any trait by clicking the trash icon. ARIS will learn new patterns as you continue to explore.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Subscription Content */}
            {activeTab === 'subscription' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {PLANS.map(plan => (
                        <div key={plan.id} className="card" style={{ padding: '32px', border: plan.recommended ? '2px solid var(--color-primary)' : '1px solid transparent', position: 'relative' }}>
                            {plan.recommended && (
                                <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-primary)', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                                    MOST POPULAR
                                </span>
                            )}
                            <h3 style={{ margin: 0, fontSize: '20px' }}>{plan.name}</h3>
                            <div style={{ fontSize: '36px', fontWeight: '700', margin: '16px 0' }}>
                                {plan.price}<span style={{ fontSize: '16px', fontWeight: '400', color: 'var(--color-text-secondary)' }}>/mo</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {plan.features.map(feature => (
                                    <li key={feature} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
                                        <Check size={16} color="var(--color-primary)" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={plan.recommended ? 'btn-primary' : 'btn-secondary'}
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={async () => {
                                    if (plan.id === 'plus' && safeUser.id) {
                                        const res = await api.createCheckoutSession(safeUser.id, import.meta.env.VITE_STRIPE_PRICE_PLUS);
                                        if (res?.url) window.location.href = res.url;
                                        else alert("Could not initiate checkout. Check console.");
                                    } else if (!safeUser.id) {
                                        alert('Please log in to upgrade your plan.');
                                    } else {
                                        // For Dev/MVP: Directly update plan for Family/Pro
                                        try {
                                            updateUser({ plan: plan.id });
                                            await api.updateUser(safeUser.id, { plan: plan.id });
                                            alert(`Plan upgraded to ${plan.name}!`);
                                        } catch (err) {
                                            console.error("Plan update failed:", err);
                                            alert("Failed to update plan.");
                                        }
                                    }
                                }}
                            >
                                {plan.id === 'plus' ? 'Upgrade Now' : 'Select Plan'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Export Content */}
            {activeTab === 'export' && (
                <div style={{ maxWidth: '600px' }}>
                    <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                        <Download size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: 0 }}>Download Your Data</h3>
                        <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 24px 0' }}>
                            Get a copy of all your conversations, learning map progress, and project data.
                        </p>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button className="btn-secondary">JSON Format</button>
                            <button className="btn-secondary">CSV Format</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;
