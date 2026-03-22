import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, TrendingUp, Activity, Lock, Users, Settings as SettingsIcon, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGlobal } from '../../context/GlobalContext';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import ActivityFeed from './ActivityFeed';
import AddMemberModal from './AddMemberModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ChatSidebar from '../conversation/ChatSidebar';
import SkillCard from '../skills/SkillCard';

const truncate = (str, n) => {
    return (str?.length > n) ? str.substr(0, n - 1) + '...' : str;
};

const ParentDashboard = () => {
    const { t } = useTranslation();
    const { family, isInitialized, addFamilyMember, updateFocusPin, topics, setSelectedMemberId, inviteMember, createFamily, logout, user, cancelInvite, updateUser, refreshData } = useGlobal();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isConfiguringFocus, setIsConfiguringFocus] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Family Filter State
    const selectedMemberId = family.selectedMemberId || 'all';
    const [dashboardTopics, setDashboardTopics] = useState([]);

    // Skills State
    const [skills, setSkills] = useState([]);
    const [loadingSkills, setLoadingSkills] = useState(false);

    // Fetch skills
    const fetchSkills = async () => {
        setLoadingSkills(true);
        try {
            const result = await api.getSkills();
            if (result?.data) {
                setSkills(result.data || []);
            } else if (Array.isArray(result)) {
                setSkills(result);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSkills(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'skills' && user?.id) {
            fetchSkills();
        }
    }, [activeTab, user]);

    // Fetch topics when selected member changes
    React.useEffect(() => {
        const fetchTopics = async () => {
            const targetId = selectedMemberId === 'all' ? user?.id : selectedMemberId;
            if (targetId) {
                const data = await api.getTopics(targetId);
                setDashboardTopics(data || []);
            }
        };
        fetchTopics();
    }, [selectedMemberId, user?.id]);



    // Form state for PIN
    const [pinInput, setPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitations, setInvitations] = useState([]);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, id: null, title: '' });

    // Auto-create state
    const [isCreating, setIsCreating] = useState(false);
    const [creationError, setCreationError] = useState(null);

    const { getInvites } = useGlobal();

    React.useEffect(() => {
        if (family.id) {
            getInvites().then(setInvitations);
        }
    }, [family.id]);

    // Feature Gating: Parent Dashboard
    React.useEffect(() => {
        if (!isInitialized) return; // Wait for full profile sync (plan, family, etc)

        const isPaid = (user?.plan === 'plus' || user?.plan === 'family' || user?.plan === 'pro');
        if (!isPaid && user?.id) { // Ensure user is loaded
            alert("Parent Dashboard is a Scholar/Family feature. Redirecting to Settings.");
            navigate('/settings');
        }
    }, [user, isInitialized, navigate]);

    // Auto-create Family Logic
    React.useEffect(() => {
        // Only run if user is loaded, data is initialized, NO family exists, and not already creating/errored
        if (user?.id && isInitialized && !family.id && !isCreating && !creationError) {
            const autoCreate = async () => {
                setIsCreating(true);
                try {
                    console.log("Auto-creating Family...");
                    const result = await createFamily("My Family");

                    if (result && result.success) {
                        updateUser({ ...user, plan: 'family' });
                        // Success - state change will re-render and remove this block
                    } else {
                        const errorMsg = result?.error || "Unknown Error";
                        console.error("Auto-create error:", errorMsg);
                        setCreationError(errorMsg);
                    }
                } catch (err) {
                    console.error("Auto-create exception:", err);
                    setCreationError(err.message);
                } finally {
                    setIsCreating(false);
                }
            };
            autoCreate();
        }
    }, [user, family.id, isCreating, creationError, createFamily, updateUser]);

    const handleAddMember = () => {
        setShowAddMemberModal(true);
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        const result = await inviteMember(inviteEmail);

        if (result && result.link) {
            const newInvite = {
                id: result.invite.id, // Use real DB UUID
                email: inviteEmail,
                status: 'Pending',
                link: result.link
            };
            setInvitations([...invitations, newInvite]);
            alert(`Invite Created! Share this link manually (since we are in Dev/MVP):\n\n${result.link}`);
            setInviteEmail('');
        } else {
            alert("Failed to create invite. Check console/network.");
        }
    };

    const handleCopyLink = (link) => {
        navigator.clipboard.writeText(link);
        alert(`Copied invite link: ${link}`);
    };

    const handleRemoveInvite = (id, email) => {
        setDeleteConfirmation({ isOpen: true, type: 'invite', id, title: email });
    };

    // Updated delete handler to support deleting members too
    const handleRemoveMember = (member) => {
        setDeleteConfirmation({ isOpen: true, type: 'member', id: member.id, title: member.name });
    };

    const confirmDeleteAction = async () => {
        const { id, type } = deleteConfirmation;

        try {
            if (type === 'invite') {
                const result = await cancelInvite(id);
                if (result && result.success) {
                    setInvitations(prev => prev.filter(i => i.id !== id));
                } else {
                    alert('Failed to remove invite.');
                }
            } else if (type === 'member') {
                const success = await api.deleteFamilyMember(id);
                if (success) {
                    await refreshData();
                } else {
                    alert('Failed to delete family member.');
                }
            }
        } catch (err) {
            alert('Error performing delete.');
        }
        setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' });
    };

    const handleSavePin = () => {
        if (pinInput.length === 4 && pinInput === confirmPinInput) {
            updateFocusPin(pinInput);
            alert("Focus PIN Updated!");
            setIsConfiguringFocus(false);
            setPinInput('');
            setConfirmPinInput('');
        } else {
            alert("PINs do not match or are invalid.");
        }
    };

    // Derived State for Filtering
    const currentStats = (selectedMemberId === 'all'
        ? family.stats
        : family.members.find(m => m.id === selectedMemberId)?.stats) || { weeklyUsage: 0, avgSession: '0m', activeTopics: 0 };

    // FIX: weeklyData is inside stats
    const currentWeeklyData = currentStats.weeklyData || [];

    const currentTopics = dashboardTopics.length > 0 ? dashboardTopics : topics;

    const memberName = family.members.find(m => m.id === selectedMemberId)?.name || 'Member';
    const headerTitle = selectedMemberId === 'all'
        ? 'Parent VIEW'
        : `Monitoring ${memberName}`;

    const StatCard = ({ icon: Icon, label, value, subtext }) => (
        <div className="card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>{label}</span>
                <Icon size={20} color="var(--color-primary)" />
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>{value}</div>
            {subtext && <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{subtext}</div>}
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>

            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onNewChat={() => window.location.href = '/conversation'}
            />

            <button
                onClick={() => setIsSidebarOpen(true)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 50,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    color: 'var(--color-text)'
                }}
            >
                <div style={{ width: '24px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                <div style={{ width: '16px', height: '2px', background: 'currentColor', marginBottom: '4px' }}></div>
                <div style={{ width: '24px', height: '2px', background: 'currentColor' }}></div>
            </button>

            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    padding: 0
                }}
            >
                <ArrowLeft size={18} />
                Back
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>{headerTitle}</h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>Monitor learning progress and well-being.</p>
                    </div>
                </div>

                {/* Family Member Filter */}
                <div style={{ display: 'flex', gap: '12px', background: 'var(--color-bg-secondary)', padding: '6px', borderRadius: '40px' }}>
                    {/* 'All' Option */}
                    <button
                        onClick={() => setSelectedMemberId('all')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '32px',
                            border: 'none',
                            background: selectedMemberId === 'all' ? '#fff' : 'transparent',
                            boxShadow: selectedMemberId === 'all' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            cursor: 'pointer',
                            color: selectedMemberId === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Users size={16} />
                        <span>All Family</span>
                    </button>

                    {/* Individual Members */}
                    {family.members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => setSelectedMemberId(member.id)}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                border: selectedMemberId === member.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                fontSize: '14px',
                                fontWeight: '700',
                                color: 'var(--color-text)',
                                transition: 'all 0.2s'
                            }}
                            title={member.name}
                        >
                            {member.name.charAt(0)}
                        </button>
                    ))}

                    {/* Add Member Button - Small */}
                    <button
                        onClick={handleAddMember}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: '1px dashed var(--color-border)',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--color-text-tertiary)'
                        }}
                        title="Add Member"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--color-border-light)' }}>
                {['overview', 'skills', 'topics', 'settings'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0 0 12px 0',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                            fontWeight: activeTab === tab ? '600' : '500',
                            textTransform: 'capitalize',
                            fontSize: '15px',
                            cursor: 'pointer'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Create Family Prompt (Auto-creation / Error State) */}
            {!family.id && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 24px',
                    textAlign: 'center',
                    minHeight: '60vh'
                }}>
                    <Shield size={64} color="var(--color-primary)" style={{ marginBottom: '24px' }} />

                    {!creationError ? (
                        <>
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                                {t('parent.welcomeTitle')}
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                                Setting up your family space...
                            </p>
                            <div className="spinner" style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid var(--color-bg-secondary)',
                                borderTop: '4px solid var(--color-primary)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <style>{`
                                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            `}</style>
                        </>
                    ) : (
                        <>
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#ef4444' }}>
                                Setup Failed
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                                {creationError}
                            </p>
                            <button
                                className="btn-primary"
                                onClick={() => setCreationError(null)} // Retry triggers effect again
                                style={{ padding: '12px 32px' }}
                            >
                                Retry Setup
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => {
                            logout();
                            navigate('/');
                        }}
                        style={{ marginTop: '32px', border: 'none', background: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {t('parent.logout')}
                    </button>
                </div>
            )}

            {/* Overview Content */}
            {activeTab === 'overview' && family.id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <StatCard icon={TrendingUp} label="Weekly Activity" value={currentStats.weeklyUsage || '0 Acts'} subtext="Start a streak!" />
                        <StatCard icon={Activity} label="Top Skill" value={truncate(currentStats.activeTopics, 15) || 'None'} subtext="Most practiced" />
                        <StatCard icon={Clock} label="Focus Level" value={currentStats.avgSession || 'N/A'} subtext=" Based on activity" />
                    </div>

                    {/* Engagement Chart */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Weekly Engagement</h3>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '6px' }}>
                                Daily Limit: 8h
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingBottom: '24px', position: 'relative' }}>
                            {/* 8h Limit Line */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                borderTop: '1px dashed var(--color-border)',
                                zIndex: 0
                            }} />

                            {currentWeeklyData.map((data, index) => {
                                const MAX_DAILY_HOURS = 8;
                                const heightPercentage = Math.min((data.hours / MAX_DAILY_HOURS) * 100, 100);

                                return (
                                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, height: '100%', zIndex: 1 }}>
                                        <div style={{ position: 'relative', width: '32px', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            {/* Background Track */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                width: '100%',
                                                height: '100%',
                                                background: '#f3f4f6', // var(--color-bg-secondary)
                                                borderRadius: '6px'
                                            }} />

                                            {/* Active Bar */}
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPercentage}%` }}
                                                transition={{ duration: 0.8, type: 'spring' }}
                                                style={{
                                                    width: '100%',
                                                    background: 'var(--color-primary)',
                                                    borderRadius: '6px',
                                                    zIndex: 1,
                                                    position: 'relative'
                                                }}
                                            />

                                            {/* Hours Label */}
                                            <motion.span
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 + (index * 0.1) }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: `calc(${heightPercentage}% + 4px)`,
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: 'var(--color-text-secondary)',
                                                    zIndex: 2,
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                {data.hours}h
                                            </motion.span>
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)' }}>{data.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Recent Activity</h3>
                        <ActivityFeed familyId={family.id} />
                    </div>
                </div>
            )}

            {/* Skills Content */}
            {activeTab === 'skills' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {loadingSkills ? (
                        <div>Loading Skills...</div>
                    ) : skills.length > 0 ? (
                        skills.map(skill => (
                            <SkillCard key={skill.id} skill={skill} t={t} />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            No skills found. Start learning to see them here!
                        </div>
                    )}
                </div>
            )}

            {/* Topics Content */}
            {activeTab === 'topics' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {currentTopics.map(topic => (
                        <div
                            key={topic.id}
                            className="card hover-card"
                            style={{
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => navigate(`/parent/topic/${topic.id}`)}
                        >
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{topic.title}</h3>
                                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Engagement Score: {topic.engagement}%</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Avg Depth</span>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>Layer {topic.depth}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Settings Content */}
            {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Focus Mode Config */}
                    <motion.div
                        className="card"
                        layout
                        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Lock size={20} color="var(--color-primary)" />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Focus Mode</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Restrict access with a PIN.</p>
                            </div>
                            <button
                                onClick={() => setIsConfiguringFocus(!isConfiguringFocus)}
                                style={{ border: '1px solid var(--color-border)', background: 'transparent', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                {isConfiguringFocus ? 'Cancel' : 'Configure'}
                            </button>
                        </div>

                        {isConfiguringFocus && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}
                            >
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Set 4-Digit PIN</label>
                                        <input
                                            type="password"
                                            placeholder="e.g. 1234"
                                            maxLength={4}
                                            value={pinInput}
                                            onChange={(e) => setPinInput(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Confirm PIN</label>
                                        <input
                                            type="password"
                                            placeholder="Confirm"
                                            maxLength={4}
                                            value={confirmPinInput}
                                            onChange={(e) => setConfirmPinInput(e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ alignSelf: 'flex-end' }}
                                    onClick={handleSavePin}
                                >
                                    Save Changes
                                </button>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Family Members */}
                    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Users size={20} color="var(--color-primary)" />
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Family Members</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Manage profiles and permissions.</p>
                            </div>
                            <button onClick={handleAddMember} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>+ Add</button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                            {family.members.map(member => (
                                <div key={member.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>

                                    {/* Delete Button (Hover or Always Visible in Settings) */}
                                    <button
                                        onClick={() => handleRemoveMember(member)}
                                        style={{
                                            position: 'absolute', top: '-6px', right: '-6px',
                                            padding: '4px', background: '#ef4444', color: 'white',
                                            border: 'none', borderRadius: '50%', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transform: 'scale(0.8)',
                                            zIndex: 1
                                        }}
                                        title="Remove Member"
                                    >
                                        <Trash2 size={12} />
                                    </button>

                                    {member.avatar ? (
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700' }}>
                                            {member.name[0]}
                                        </div>
                                    )}
                                    <span style={{ fontSize: '12px', fontWeight: '500' }}>{member.name}</span>
                                </div>
                            ))}

                            {/* Pending Invitations */}
                            {invitations.map(invite => (
                                <div key={invite.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                                    <button
                                        onClick={() => handleRemoveInvite(invite.id, invite.email)}
                                        style={{
                                            position: 'absolute', top: '-6px', right: '-6px',
                                            padding: '4px', background: '#ef4444', color: 'white',
                                            border: 'none', borderRadius: '50%', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transform: 'scale(0.8)',
                                            zIndex: 1
                                        }}
                                        title="Cancel Invite"
                                    >
                                        <Trash2 size={12} />
                                    </button>

                                    <div
                                        onClick={() => handleCopyLink(invite.link)}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            border: '2px dashed var(--color-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-primary)',
                                            background: 'var(--color-primary-light)',
                                            cursor: 'pointer',
                                            position: 'relative'
                                        }}
                                        title="Click to copy invite link"
                                    >
                                        <Clock size={20} />
                                    </div>
                                    <span style={{
                                        fontSize: '11px',
                                        color: 'var(--color-text-secondary)',
                                        fontWeight: '500',
                                        textAlign: 'center',
                                        maxWidth: '60px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }} title={invite.email}>
                                        {invite.email.split('@')[0]}
                                    </span>
                                </div>
                            ))}

                            {/* Clickable New Member Button */}
                            <div
                                onClick={handleAddMember}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.5, cursor: 'pointer' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>+</div>
                                <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>New</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            <AddMemberModal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                onSendInvite={async (email) => {
                    const result = await inviteMember(email);
                    if (result && result.link) {
                        const newInvite = {
                            id: result.invite.id,
                            email: email,
                            status: 'Pending',
                            link: result.link
                        };
                        setInvitations([...invitations, newInvite]);
                        alert(`Invite Created! Share this link manually:\n\n${result.link}`);
                    } else {
                        alert("Failed to create invite.");
                    }
                }}
                onCopyLink={(link) => {
                    navigator.clipboard.writeText(link);
                    alert(`Copied invite link: ${link}`);
                }}
                onRemoveInvite={(id, email) => setDeleteConfirmation({ isOpen: true, type: 'invite', id, title: email })}
                invitations={invitations}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                title={deleteConfirmation.title}
                onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' })}
                onConfirm={confirmDeleteAction}
            />
        </div>
    );
};

export default ParentDashboard;
