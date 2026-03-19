import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Plus, Search, FolderPlus, MoreHorizontal, Edit2, Trash2, FolderInput, FileText, Sparkles, Folder, ChevronRight, LogOut, Shield, Copy, ChevronUp, User, Settings, Briefcase, Sword, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../context/GlobalContext';
import { api } from '../../services/api';

const MOCK_FOLDERS = []; // Disabling mock folders

const ChatSidebar = ({ isOpen, onClose, onNewChat }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { user, savedChats, selectConversation, logout, folders, createFolder, moveConversation, deleteFolder, deleteConversation, renameConversation, renameFolder, archiveConversation, refreshData } = useGlobal();
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedFolders, setExpandedFolders] = useState([]);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [chatToMove, setChatToMove] = useState(null);
    const [moveTargetIds, setMoveTargetIds] = useState([]);

    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, id: null, title: '' });
    const [renameModal, setRenameModal] = useState({ isOpen: false, id: null, type: null, currentTitle: '' });
    const [newRenameTitle, setNewRenameTitle] = useState('');

    const [summaryModal, setSummaryModal] = useState({ isOpen: false, content: '', isLoading: false });
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleBulkDelete = () => {
        const count = selectedIds.length;
        if (!count) return;
        setDeleteConfirmation({
            isOpen: true,
            type: 'bulk-chat',
            id: null,
            title: `${count} conversation${count === 1 ? '' : 's'}`
        });
    };

    const handleGenerateSummary = async () => {
        setSummaryModal({ isOpen: true, content: '', isLoading: true });
        setIsSelectionMode(false); // Exit selection mode immediately

        const res = await api.generateSummary(selectedIds);

        if (res.error) {
            setSummaryModal({ isOpen: true, content: `Error: ${res.error}`, isLoading: false });
        } else {
            setSummaryModal({ isOpen: true, content: res.summary?.presentation || res.summary?.content || res.summary?.text || res.summary, isLoading: false });
        }
        setSelectedIds([]);
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev =>
            prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
        );
    };

    const confirmDelete = async () => {
        const { type, id } = deleteConfirmation;
        setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' });

        if (type === 'folder') {
            await deleteFolder(id);
        } else if (type === 'chat') {
            await deleteConversation(id);
        } else if (type === 'bulk-chat') {
            await Promise.allSettled(selectedIds.map(conversationId => deleteConversation(conversationId)));
            await refreshData();
            setSelectedIds([]);
            setIsSelectionMode(false);
        }
    };

    const handleDeleteFolder = (folder, e) => {
        e.stopPropagation();
        setDeleteConfirmation({ isOpen: true, type: 'folder', id: folder.id, title: folder.title });
    };

    const handleDeleteChat = (chat, e) => {
        e.stopPropagation();
        setDeleteConfirmation({ isOpen: true, type: 'chat', id: chat.id, title: chat.title });
    };

    const handleArchiveChat = async (chat, e) => {
        e.stopPropagation();
        const newStatus = !chat.is_archived;
        await archiveConversation(chat.id, newStatus);
    };

    const handleBulkArchive = async (shouldArchive) => {
        await Promise.all(selectedIds.map(conversationId => archiveConversation(conversationId, shouldArchive)));
        setSelectedIds([]);
        setIsSelectionMode(false);
    };

    const handleRenameClick = (item, type = 'conversation') => {
        setRenameModal({ isOpen: true, id: item.id, type, currentTitle: item.title });
        setNewRenameTitle(item.title);
        setActiveMenuId(null);
    };

    const confirmRename = async () => {
        if (!newRenameTitle.trim()) return;

        if (renameModal.type === 'conversation') {
            await renameConversation(renameModal.id, newRenameTitle.trim());
        } else if (renameModal.type === 'folder') {
            await renameFolder(renameModal.id, newRenameTitle.trim());
        }
        setRenameModal({ isOpen: false, id: null, type: null, currentTitle: '' });
    };

    const handleCreateFolderSubmit = async (e) => {
        if (e.key === 'Enter' && newFolderName.trim()) {
            await createFolder(newFolderName.trim());
            setNewFolderName('');
            setIsCreatingFolder(false);
        } else if (e.key === 'Escape') {
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    };



    const handleCreateFolderClick = () => {
        setIsCreatingFolder(true);
        setTimeout(() => {
            const input = document.getElementById('new-folder-input');
            if (input) input.focus();
        }, 100);
    };

    const initiateMove = (chat) => {
        setChatToMove(chat);
        setMoveTargetIds([]);
        setShowMoveModal(true);
        setActiveMenuId(null);
    };

    const initiateBulkMove = () => {
        setChatToMove(null);
        setMoveTargetIds(selectedIds);
        setShowMoveModal(true);
    };

    const handleMove = async (folderId) => {
        if (moveTargetIds.length > 0) {
            await Promise.all(moveTargetIds.map(conversationId => moveConversation(conversationId, folderId)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            setMoveTargetIds([]);
        } else if (chatToMove) {
            await moveConversation(chatToMove.id, folderId);
            setChatToMove(null);
        }
        setShowMoveModal(false);
    };



    // Filter chats: Separate Archived vs Active
    const allChats = savedChats || [];
    const archivedChats = allChats.filter(c => c.is_archived);
    const activeChats = allChats.filter(c => !c.is_archived);

    // Filter Active Chats by Search & Folder
    const validFolderIds = new Set((folders || []).map(f => f.id));

    // Unorganized: Active, No Folder (or Invalid Folder), Matches Search
    const unorganizedChats = activeChats.filter(c =>
        (!c.folder_id || !validFolderIds.has(c.folder_id)) &&
        (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Folders: Active, In Folder, Matches Search
    const foldersWithChats = (folders || []).map(f => ({
        ...f,
        chats: activeChats.filter(c => c.folder_id === f.id && (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase()))
    }));

    // Archived View: Matches Search
    const displayedArchivedChats = archivedChats.filter(c =>
        (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If search is active, maybe show flat list? Or keep hierarchy?
    // Let's keep hierarchy.

    const handleChatClick = (chat) => {
        if (isSelectionMode) {
            if (selectedIds.includes(chat.id)) {
                setSelectedIds(prev => prev.filter(id => id !== chat.id));
            } else {
                setSelectedIds(prev => [...prev, chat.id]);
            }
        } else {
            selectConversation(chat.id);
            navigate(`/conversation/${chat.id}`);
            onClose();
        }
    };

    const chatsById = new Map((savedChats || []).map((chat) => [chat.id, chat]));
    const bulkShouldArchive = selectedIds.length === 0
        ? true
        : selectedIds.some(id => !(chatsById.get(id) as any)?.is_archived);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: '#000',
                            zIndex: 40
                        }}
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '85%',
                            maxWidth: '320px',
                            height: '100%',
                            background: 'var(--color-surface)',
                            zIndex: 50,
                            boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}
                    >
                        {/* Header: Close + New Chat */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)' }}
                            >
                                <X size={24} />
                            </button>
                            <button onClick={onNewChat} style={{ border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary-light)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                                <Plus size={18} />
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{t('menu.newChat')}</span>
                            </button>
                        </div>

                        {/* Projects Link */}
                        <div
                            onClick={() => window.location.href = '/projects'}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                                background: 'var(--color-bg-secondary)', borderRadius: '8px', cursor: 'pointer',
                                color: 'var(--color-text)', fontWeight: '600', fontSize: '14px'
                            }}
                        >
                            <Briefcase size={18} color="var(--color-primary)" />
                            <span>My Projects</span>
                        </div>

                        {/* Skills Link */}
                        <div
                            onClick={() => window.location.href = '/skills'}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                                background: 'transparent', borderRadius: '8px', cursor: 'pointer',
                                color: 'var(--color-text)', fontWeight: '600', fontSize: '14px'
                            }}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Sword size={18} color="var(--color-primary)" />
                            <span>Skills</span>
                        </div>

                        {/* Search Bar */}
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 36px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-secondary)',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Folder & Summary Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleCreateFolderClick}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    background: 'transparent',
                                    border: '1px dashed var(--color-border)',
                                    borderRadius: '8px',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                <FolderPlus size={16} />
                                <span>Folder</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    setSelectedIds([]);
                                }}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px',
                                    background: isSelectionMode ? 'var(--color-primary-light)' : 'transparent',
                                    border: isSelectionMode ? '1px solid var(--color-primary)' : '1px dashed var(--color-border)',
                                    borderRadius: '8px',
                                    color: isSelectionMode ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                }}
                            >
                                <FileText size={16} />
                                <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
                            </button>
                        </div>

                        {isSelectionMode && selectedIds.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={handleGenerateSummary}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'var(--color-primary)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Sparkles size={16} />
                                    Generate Summary ({selectedIds.length})
                                </button>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={initiateBulkMove}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '10px',
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            color: 'var(--color-text)',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <FolderInput size={16} />
                                        Move
                                    </button>
                                    <button
                                        onClick={() => handleBulkArchive(bulkShouldArchive)}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '10px',
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            color: 'var(--color-text)',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Archive size={16} />
                                        {bulkShouldArchive ? 'Archive' : 'Unarchive'}
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '10px',
                                            background: '#fee2e2',
                                            border: '1px solid #fecaca',
                                            borderRadius: '8px',
                                            color: '#b91c1c',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}

                        <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginTop: '8px' }}>
                            {t('menu.folders')}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                            {/* New Folder Input */}
                            {isCreatingFolder && (
                                <div style={{ padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Folder size={16} color="var(--color-primary)" />
                                    <input
                                        id="new-folder-input"
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={handleCreateFolderSubmit}
                                        placeholder="Folder name..."
                                        onBlur={() => { if (!newFolderName) setIsCreatingFolder(false); }}
                                        style={{
                                            border: 'none', background: 'transparent', outline: 'none',
                                            fontSize: '14px', width: '100%', color: 'var(--color-text)'
                                        }}
                                    />
                                </div>
                            )}

                            {/* ARCHIVE TOGGLE */}
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                    background: showArchived ? 'var(--color-bg-tertiary)' : 'transparent',
                                    borderRadius: '8px', cursor: 'pointer',
                                    color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '500',
                                    marginBottom: '8px'
                                }}
                            >
                                <Archive size={16} />
                                <span>Archived ({archivedChats.length})</span>
                            </button>

                            {/* ARCHIVED VIEW */}
                            {showArchived ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {displayedArchivedChats.length > 0 ? displayedArchivedChats.map(chat => (
                                        <ChatListItem
                                            key={chat.id}
                                            chat={chat}
                                            handleChatClick={handleChatClick}
                                            isSelectionMode={isSelectionMode}
                                            selectedIds={selectedIds}
                                            activeMenuId={activeMenuId}
                                            setActiveMenuId={setActiveMenuId}
                                            initiateMove={initiateMove}
                                            handleDeleteChat={handleDeleteChat}
                                            handleRenameClick={handleRenameClick}
                                            handleArchiveChat={handleArchiveChat}
                                            isArchivedView={true}
                                        />
                                    )) : (
                                        <div style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>No archived chats.</div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* FOLDERS VIEW */}
                                    {foldersWithChats.map(folder => {

                                        const isExpanded = expandedFolders.includes(folder.id);
                                        return (
                                            <div key={folder.id}>
                                                <div
                                                    onClick={() => toggleFolder(folder.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        background: 'var(--color-bg-secondary)',
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        color: 'var(--color-text)',
                                                        userSelect: 'none',
                                                        position: 'relative'
                                                    }}
                                                    className="group"
                                                >
                                                    <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--color-text-tertiary)' }}>
                                                        <ChevronRight size={14} />
                                                    </div>
                                                    <Folder size={16} color="var(--color-primary)" />
                                                    <span style={{ flex: 1 }}>{folder.title}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{folder.chats.length}</span>

                                                    {/* Folder Delete Action (Visible on hover or if we had a menu, for now just simple X on right?) */}
                                                    {/* Let's double click to delete? Or add a trash icon? */}
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRenameClick(folder, 'folder'); }}
                                                            style={{ border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteFolder(folder, e)}
                                                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                                            animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                                                            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                                            style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}
                                                        >
                                                            {folder.chats.map(chat => (
                                                                    <ChatListItem
                                                                        key={chat.id}
                                                                        chat={chat}
                                                                        handleChatClick={handleChatClick}
                                                                        isSelectionMode={isSelectionMode}
                                                                        selectedIds={selectedIds}
                                                                        activeMenuId={activeMenuId}
                                                                        setActiveMenuId={setActiveMenuId}
                                                                        initiateMove={initiateMove}
                                                                        handleDeleteChat={handleDeleteChat}
                                                                        handleRenameClick={handleRenameClick}
                                                                        handleArchiveChat={handleArchiveChat}
                                                                        isArchivedView={false}
                                                                />
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}

                                    {/* RECENT CHATS */}
                                    <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                        {t('menu.recentChats') || 'Recent Chats'}
                                        <span>({unorganizedChats.length})</span>
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                                        {unorganizedChats.length > 0 ? unorganizedChats.map(chat => (
                                            <ChatListItem
                                                key={chat.id}
                                                chat={chat}
                                                handleChatClick={handleChatClick}
                                                isSelectionMode={isSelectionMode}
                                                selectedIds={selectedIds}
                                                activeMenuId={activeMenuId}
                                                setActiveMenuId={setActiveMenuId}
                                                initiateMove={initiateMove}
                                                handleDeleteChat={handleDeleteChat}
                                                handleRenameClick={handleRenameClick}
                                                handleArchiveChat={handleArchiveChat}
                                                isArchivedView={false}
                                            />
                                        )) : (
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '20px' }}>
                                                {t('menu.noChats') || 'No conversations found.'}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>




                        <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--color-border)', position: 'relative' }}>
                            <div
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: userMenuOpen ? 'var(--color-bg-secondary)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                                className="group"
                            >
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '16px'
                                }}>
                                    {user?.name?.[0]?.toUpperCase() || <User size={18} />}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{user?.name || 'Guest User'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'Sign in'}</div>
                                </div>
                                <ChevronUp size={16} color="var(--color-text-tertiary)" />
                            </div>

                            <AnimatePresence>
                                {userMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        style={{
                                            position: 'absolute',
                                            bottom: '80px', // Above the profile row
                                            left: '16px',
                                            right: '16px',
                                            background: 'var(--color-surface)',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                            border: '1px solid var(--color-border)',
                                            padding: '6px',
                                            zIndex: 60,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px'
                                        }}
                                    >
                                        {user?.email?.toLowerCase() === 'thetboard@gmail.com' && (
                                            <button
                                                onClick={() => window.location.href = '/admin'}
                                                style={popupMenuItemStyle}
                                            >
                                                <Shield size={16} color="var(--color-primary)" />
                                                {t('menu.admin')}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => window.location.href = '/settings'}
                                            style={popupMenuItemStyle}
                                        >
                                            <Settings size={16} />
                                            {t('menu.settings')}
                                        </button>

                                        <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 8px' }} />

                                        <button
                                            onClick={logout}
                                            style={{ ...popupMenuItemStyle, color: '#ef4444' }}
                                        >
                                            <LogOut size={16} />
                                            {t('menu.logout')}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Move Modal */}
                    {showMoveModal && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', width: '300px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border)' }}>
                                    <h3 style={{ marginTop: 0, color: 'var(--color-text)' }}>
                                        {moveTargetIds.length > 0 ? `Move ${moveTargetIds.length} Conversations` : 'Move to Folder'}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                        <button
                                            onClick={() => handleMove(null)} // Unorganized
                                            style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-bg-secondary)', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)' }}
                                        >
                                            No Folder (Unorganized)
                                        </button>
                                        {(folders || []).map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => handleMove(f.id)}
                                                style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)' }}
                                            >
                                                📁 {f.title}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowMoveModal(false);
                                            setChatToMove(null);
                                            setMoveTargetIds([]);
                                        }}
                                        style={{ marginTop: '16px', width: '100%', padding: '8px', border: 'none', background: 'var(--color-bg-tertiary)', borderRadius: '6px', cursor: 'pointer', color: 'var(--color-text)' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* Rename Modal */}
                        {renameModal.isOpen && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    background: 'var(--color-surface)', borderRadius: '16px', padding: '24px', width: '300px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-text)' }}>Rename {renameModal.type === 'folder' ? 'Folder' : 'Chat'}</h3>
                                    <input
                                        value={newRenameTitle}
                                        onChange={(e) => setNewRenameTitle(e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px', borderRadius: '8px',
                                            border: '1px solid var(--color-border)', marginBottom: '16px', fontSize: '14px',
                                            background: 'var(--color-bg)', color: 'var(--color-text)'
                                        }}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') confirmRename();
                                            if (e.key === 'Escape') setRenameModal({ isOpen: false, id: null, type: null, currentTitle: '' });
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => setRenameModal({ isOpen: false, id: null, type: null, currentTitle: '' })}
                                            style={{
                                                padding: '8px 16px', background: 'var(--color-bg-secondary)', border: 'none', // Changed from #f5f5f5
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                                                color: 'var(--color-text)'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmRename}
                                            style={{
                                                padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none',
                                                borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                                            }}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {deleteConfirmation.isOpen && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                                onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' })}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        background: 'var(--color-surface)',
                                        padding: '24px',
                                        borderRadius: '16px',
                                        width: '320px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '48px', height: '48px', background: '#fee2e2', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px auto', color: '#ef4444'
                                    }}>
                                        <Trash2 size={24} />
                                    </div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>
                                        Delete {deleteConfirmation.type === 'folder' ? 'Folder' : deleteConfirmation.type === 'bulk-chat' ? 'Chats' : 'Chat'}?
                                    </h3>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                        Are you sure you want to delete <strong>"{deleteConfirmation.title}"</strong>?
                                        {deleteConfirmation.type === 'folder' && " Chats inside will be moved to Unorganized."}
                                        {(deleteConfirmation.type === 'chat' || deleteConfirmation.type === 'bulk-chat') && " This action cannot be undone."}
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '' })}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)',
                                                background: 'var(--color-surface)', color: 'var(--color-text)', fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                                background: '#ef4444', color: '#fff', fontWeight: '600', cursor: 'pointer'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Summary Modal */}
                        {summaryModal.isOpen && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                        background: 'var(--color-surface)', borderRadius: '16px', padding: '24px',
                                        width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text)' }}>
                                        <Sparkles size={20} color="var(--color-primary)" />
                                        Conversation Summary
                                    </h3>

                                    <div style={{
                                        flex: 1, overflowY: 'auto', background: 'var(--color-bg)',
                                        padding: '16px', borderRadius: '8px', margin: '16px 0',
                                        border: '1px solid var(--color-border)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6,
                                        color: 'var(--color-text)'
                                    }}>
                                        {summaryModal.isLoading ? (
                                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                                                Generating summary... This may take a moment.
                                            </div>
                                        ) : summaryModal.content}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(summaryModal.content);
                                                alert("Summary copied to clipboard!");
                                            }}
                                            style={{
                                                padding: '10px 20px', background: 'var(--color-bg-secondary)', color: 'var(--color-text)',
                                                border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                                                display: 'flex', alignItems: 'center', gap: '8px'
                                            }}
                                        >
                                            <Copy size={16} /> Copy
                                        </button>
                                        <button
                                            onClick={() => setSummaryModal({ isOpen: false, content: '', isLoading: false })}
                                            style={{
                                                padding: '10px 20px', background: 'var(--color-primary)', color: '#fff',
                                                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
};

// Helper Component for Chat Item to reduce duplication
const ChatListItem = ({ chat, handleChatClick, isSelectionMode, selectedIds, activeMenuId, setActiveMenuId, initiateMove, handleDeleteChat, handleRenameClick, handleArchiveChat, isArchivedView }) => {
    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => handleChatClick(chat)}
                style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    paddingRight: isSelectionMode ? '10px' : '30px',
                    background: (isSelectionMode && selectedIds.includes(chat.id)) ? 'var(--color-primary-light)' : 'transparent'
                }}
                className="hover:bg-gray-50"
            >
                {isSelectionMode ? (
                    <div style={{
                        width: '18px',
                        height: '18px',
                        border: selectedIds.includes(chat.id) ? 'none' : '2px solid var(--color-text-tertiary)',
                        borderRadius: '4px',
                        background: selectedIds.includes(chat.id) ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                    }}>
                        {selectedIds.includes(chat.id) && <Plus size={14} style={{ transform: 'rotate(45deg)' }} />}
                    </div>
                ) : (
                    <MessageSquare size={18} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                )}

                <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' }}>{chat.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{chat.date}</div>
                </div>
            </div>

            {/* Meatball Menu Trigger */}
            <button
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === chat.id ? null : chat.id); }}
                style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--color-text-tertiary)'
                }}
            >
                <MoreHorizontal size={16} />
            </button>

            {/* Meatball Dropdown */}
            {activeMenuId === chat.id && (
                <div style={{
                    position: 'absolute',
                    right: '0',
                    top: '36px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 60,
                    width: '140px',
                    overflow: 'hidden'
                }}>
                    <button onClick={() => handleRenameClick(chat)} style={menuItemStyle}><Edit2 size={14} /> Rename</button>
                    <button onClick={() => initiateMove(chat)} style={menuItemStyle}><FolderInput size={14} /> Move</button>
                    <button
                        onClick={(e) => {
                            handleArchiveChat(chat, e);
                            setActiveMenuId(null);
                        }}
                        style={menuItemStyle}
                    >
                        <Archive size={14} />
                        {chat.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button onClick={(e) => handleDeleteChat(chat, e)} style={{ ...menuItemStyle, color: '#ef4444' }}><Trash2 size={14} /> Delete</button>
                </div>
            )}
        </div>
    );
};

const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--color-text)',
    transition: 'background 0.1s'
};

const popupMenuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--color-text)',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.2s'
};



export default ChatSidebar;
