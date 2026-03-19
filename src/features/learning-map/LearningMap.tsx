import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Network, Search, ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TopicCard from './TopicCard';
import GraphView from './GraphView';
import { useGlobal } from '../../context/GlobalContext';
import { api } from '../../services/api';
import ChatSidebar from '../conversation/ChatSidebar';
import BulkDeleteBar from '../../components/BulkDeleteBar';

const LearningMap = () => {
    const { t } = useTranslation();
    const { topics, refreshData, addTopic } = useGlobal();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');
    const [remapping, setRemapping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Bulk Delete State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedIds([]);
        } else {
            setIsSelectionMode(true);
            setViewMode('grid'); // Force grid view for selection
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Using force? Delete ${selectedIds.length} topics permanently?`)) return;

        setIsBulkDeleting(true);
        try {
            // Use sequential calls for now as api.deleteTopic handles graph cleanup properly
            await Promise.all(selectedIds.map(id => api.deleteTopic(id)));
            refreshData();
            setSelectedIds([]);
            setIsSelectionMode(false);
        } catch (e) {
            alert("Some topics failed to delete.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleMerge = async () => {
        if (!confirm(`Merge these ${selectedIds.length} topics? This will combine their XP and use AI to unify their identity.`)) return;

        setIsMerging(true);
        try {
            const result = await api.mergeTopics(selectedIds);
            if (result.error) {
                alert(`Merge failed: ${result.error}`);
            } else {
                alert(`Successfully merged into: ${result.title}`);
                refreshData();
                setSelectedIds([]);
                setIsSelectionMode(false);
            }
        } catch (e: any) {
            alert(`Merge error: ${e.message}`);
        } finally {
            setIsMerging(false);
        }
    };

    const handleAddTopic = async (title: string) => {
        if (!title.trim()) return;

        // Check for duplicates (Case Insensitive)
        const normalize = (s: string) => s.trim().toLowerCase();
        const exists = topics.some((t: any) =>
            normalize(t.title || t.name || '') === normalize(title)
        );

        if (exists) {
            alert(t('learningMap.topicExists'));
            return;
        }

        await addTopic({ title });
    };

    const handleRemap = async () => {
        if (!confirm(t('learningMap.confirmRemap'))) return;
        setRemapping(true);
        const res = await api.remapTopics();

        if (res.error) {
            alert(t('common.error') + ': ' + res.error);
        } else if (res.debug) {
            console.log('Remap Debug:', res.debug);
            const preview = typeof res.debug.responseRaw === 'string'
                ? res.debug.responseRaw.substring(0, 500)
                : JSON.stringify(res.debug.responseRaw);

            alert(`${t('common.success')}!\n\nEdges Found: ${res.edge_count}\nModel: ${res.debug.model}\n\nResponse Preview:\n${preview}`);
        }

        await refreshData();
        setRemapping(false);
    };

    return (
        <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px', height: '100%', display: 'flex', flexDirection: 'column' }}>

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
                {t('common.back')}
            </button>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontWeight: '700', fontSize: '32px' }}>{t('learningMap.title')}</h1>
                    <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)' }}>{t('learningMap.subtitle')}</p>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>

                    {/* Selection Button (Only in Grid Mode or switches to Grid) */}
                    <button
                        onClick={toggleSelectionMode}
                        style={{
                            display: 'flex', gap: '8px', alignItems: 'center',
                            background: isSelectionMode ? 'var(--color-bg-secondary)' : 'transparent',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                            fontWeight: '600', cursor: 'pointer'
                        }}
                    >
                        {isSelectionMode ? 'Cancel' : 'Select'}
                    </button>

                    {/* Remap Button (Graph Only) */}
                    {viewMode === 'graph' && (
                        <button
                            onClick={handleRemap}
                            disabled={remapping}
                            style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                color: remapping ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: remapping ? 'wait' : 'pointer'
                            }}
                        >
                            <RefreshCw size={18} className={remapping ? 'spin' : ''} />
                            {remapping ? t('learningMap.analyzing') : t('learningMap.reCreateConnections')}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            const title = prompt(t('learningMap.enterTopicName'));
                            if (title) handleAddTopic(title);
                        }}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <Plus size={18} />
                        {t('learningMap.addTopic')}
                    </button>
                    {/* View Toggle */}
                    <div style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '4px',
                        display: 'flex'
                    }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                background: viewMode === 'grid' ? 'var(--color-bg-secondary)' : 'transparent',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                color: viewMode === 'grid' ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <LayoutGrid size={18} />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{t('learningMap.grid')}</span>
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('graph');
                                if (isSelectionMode) toggleSelectionMode(); // Exit selection mode on graph view
                            }}
                            style={{
                                background: viewMode === 'graph' ? 'var(--color-bg-secondary)' : 'transparent',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                color: viewMode === 'graph' ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Network size={18} />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{t('learningMap.graph')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <BulkDeleteBar
                selectedCount={selectedIds.length}
                onDelete={handleBulkDelete}
                onMerge={handleMerge}
                onCancel={() => setSelectedIds([])}
                isDeleting={isBulkDeleting}
                isMerging={isMerging}
                itemName="Topics"
            />

            {/* Content */}
            <div style={{ flex: 1 }}>
                {viewMode === 'grid' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {topics.map(topic => (
                            <div key={topic.id} style={{ display: 'contents' }}>
                                <TopicCard
                                    topic={topic}
                                    selected={selectedIds.includes(topic.id)}
                                    onToggleSelect={isSelectionMode ? handleToggleSelect : undefined}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <GraphView topics={topics} onNodeClick={(id) => navigate(`/topic/${id}`)} />
                )}
            </div>
        </div>
    );
};

export default LearningMap;
