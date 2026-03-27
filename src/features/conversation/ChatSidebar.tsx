import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderPlus, FolderInput, Archive, Trash2, Folder, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../../context/GlobalContext';
import { api } from '../../services/api';
import SidebarHeader from './components/SidebarHeader';
import SidebarUserMenu from './components/SidebarUserMenu';
import ChatListItem from './components/ChatListItem';
import { MoveModal, RenameModal, DeleteConfirmModal, SummaryModal } from './components/SidebarModals';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose, onNewChat }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        user, savedChats, selectConversation, logout, folders,
        createFolder, deleteFolder, deleteConversation,
        renameConversation, renameFolder, archiveConversation, refreshData
    } = useGlobal();

    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolderInProgress, setIsCreatingFolderInProgress] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [chatToMove, setChatToMove] = useState<any>(null);
    const [moveTargetIds, setMoveTargetIds] = useState<string[]>([]);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [renameModal, setRenameModal] = useState({ isOpen: false, id: '', type: 'chat' as 'folder' | 'chat' });
    const [newRenameTitle, setNewRenameTitle] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, title: '' });
    const [summaryModal, setSummaryModal] = useState({ isOpen: false, content: '', isLoading: false });

    const allChats = savedChats || [];
    const archivedChats = allChats.filter((c: any) => c.is_archived);
    const activeChats = allChats.filter((c: any) => !c.is_archived);
    const validFolderIds = new Set((folders || []).map((f: any) => f.id));

    const unorganizedChats = activeChats.filter((c: any) =>
        (!c.folder_id || !validFolderIds.has(c.folder_id)) &&
        (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const foldersWithChats = (folders || []).map((f: any) => ({
        ...f,
        chats: activeChats.filter((c: any) =>
            c.folder_id === f.id && (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
        )
    }));

    const displayedArchivedChats = archivedChats.filter((c: any) =>
        (c.title || 'Untitled').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const chatsById = new Map(allChats.map((c: any) => [c.id, c]));
    const bulkShouldArchive = selectedIds.length === 0 || selectedIds.some(id => !(chatsById.get(id) as any)?.is_archived);

    const handleChatClick = (chat: any) => {
        if (isSelectionMode) {
            setSelectedIds(prev =>
                prev.includes(chat.id) ? prev.filter(id => id !== chat.id) : [...prev, chat.id]
            );
        } else {
            selectConversation(chat.id);
            navigate(`/conversation/${chat.id}`);
            onClose();
        }
    };

    const handleMove = async (folderId: string | null) => {
        if (chatToMove) {
            await api.moveConversationToFolder(chatToMove.id, folderId);
        } else {
            await Promise.all(moveTargetIds.map(id => api.moveConversationToFolder(id, folderId)));
        }
        setShowMoveModal(false);
        setChatToMove(null);
        setMoveTargetIds([]);
        await refreshData();
    };

    const initiateMove = (chat: any) => {
        setChatToMove(chat);
        setMoveTargetIds([]);
        setShowMoveModal(true);
        setActiveMenuId(null);
    };

    const handleRenameClick = (item: any, type: 'folder' | 'chat') => {
        setRenameModal({ isOpen: true, id: item.id, type });
        setNewRenameTitle(item.title || item.name || '');
    };

    const confirmRename = async () => {
        if (renameModal.type === 'chat') {
            await renameConversation(renameModal.id, newRenameTitle.trim());
        } else {
            await renameFolder(renameModal.id, newRenameTitle.trim());
        }
        setRenameModal({ isOpen: false, id: '', type: 'chat' });
        setNewRenameTitle('');
    };

    const confirmDelete = async () => {
        const id = deleteConfirm.title;
        await deleteConversation(id);
        setDeleteConfirm({ isOpen: false, title: '' });
    };

    const handleCreateFolderSubmit = async (e: React.KeyboardEvent) => {
        e.preventDefault();
        if (isCreatingFolderInProgress) return;
        
        if (e.key === 'Enter' && newFolderName.trim()) {
            setIsCreatingFolderInProgress(true);
            try {
                await createFolder(newFolderName.trim());
            } finally {
                setNewFolderName('');
                setIsCreatingFolder(false);
                setIsCreatingFolderInProgress(false);
            }
        } else if (e.key === 'Escape') {
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    };

    const handleBulkDelete = () => {
        if (!selectedIds.length) return;
        setDeleteConfirm({ isOpen: true, title: `${selectedIds.length} conversations` });
    };

    const handleGenerateSummary = async () => {
        setSummaryModal({ isOpen: true, content: '', isLoading: true });
        setIsSelectionMode(false);
        const res = await api.generateSummary(selectedIds);
        if (res.error) {
            setSummaryModal({ isOpen: true, content: `Error: ${res.error}`, isLoading: false });
        } else {
            setSummaryModal({
                isOpen: true,
                content: res.summary?.presentation || res.summary?.content || res.summary?.text || res.summary,
                isLoading: false
            });
        }
        setSelectedIds([]);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: '#000', zIndex: 40
                        }}
                    />

                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, width: '85%', maxWidth: '320px',
                            height: '100%', background: 'var(--color-surface)', zIndex: 50,
                            boxShadow: '2px 0 10px rgba(0,0,0,0.1)', padding: '24px',
                            display: 'flex', flexDirection: 'column', gap: '20px'
                        }}
                    >
                        <SidebarHeader onClose={onClose} onNewChat={onNewChat} />

                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 10px 10px 36px',
                                    borderRadius: '8px', border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-secondary)', fontSize: '14px', outline: 'none',
                                    color: 'var(--color-text)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', padding: '10px', background: 'transparent',
                                    border: '1px dashed var(--color-border)', borderRadius: '8px',
                                    color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px'
                                }}
                            >
                                <FolderPlus size={16} />
                                <span>Folder</span>
                            </button>
                            <button
                                onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '8px', padding: '10px', background: 'transparent',
                                    border: '1px dashed var(--color-border)', borderRadius: '8px',
                                    color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px'
                                }}
                            >
                                Select
                            </button>
                        </div>

                        {isSelectionMode && selectedIds.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleGenerateSummary}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setShowMoveModal(true)}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    <FolderInput size={16} /> Move
                                </button>
                                <button
                                    onClick={() => Promise.all(selectedIds.map(id => archiveConversation(id, bulkShouldArchive)))}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    <Archive size={16} /> {bulkShouldArchive ? 'Archive' : 'Unarchive'}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        )}

                        <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginTop: '8px' }}>
                            {t('menu.folders')}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
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
                                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%', color: 'var(--color-text)' }}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                                    background: showArchived ? 'var(--color-bg-tertiary)' : 'transparent',
                                    borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '13px', fontWeight: '500', marginBottom: '8px'
                                }}
                            >
                                <Archive size={16} />
                                <span>Archived ({archivedChats.length})</span>
                            </button>

                            {showArchived ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {displayedArchivedChats.length > 0 ? displayedArchivedChats.map((chat: any) => (
                                        <ChatListItem
                                            key={chat.id}
                                            chat={chat}
                                            handleChatClick={handleChatClick}
                                            isSelectionMode={isSelectionMode}
                                            selectedIds={selectedIds}
                                            activeMenuId={activeMenuId}
                                            setActiveMenuId={setActiveMenuId}
                                            initiateMove={initiateMove}
                                            handleDeleteChat={(c) => setDeleteConfirm({ isOpen: true, title: c.title })}
                                            handleRenameClick={(c) => handleRenameClick(c, 'chat')}
                                            handleArchiveChat={(c) => archiveConversation(c.id, !c.is_archived)}
                                            isArchivedView={true}
                                        />
                                    )) : (
                                        <div style={{ padding: '10px', fontSize: '13px', color: 'var(--color-text-tertiary)' }}>No archived chats.</div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {foldersWithChats.map((folder: any) => (
                                        <div key={folder.id}>
                                            <div
                                                onClick={() => setExpandedFolders(prev =>
                                                    prev.includes(folder.id) ? prev.filter(id => id !== folder.id) : [...prev, folder.id]
                                                )}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                                                    borderRadius: '8px', cursor: 'pointer', background: 'var(--color-bg-secondary)',
                                                    fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', userSelect: 'none'
                                                }}
                                            >
                                                <div style={{ transform: expandedFolders.includes(folder.id) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--color-text-tertiary)' }}>
                                                    <ChevronRight size={14} />
                                                </div>
                                                <Folder size={16} color="var(--color-primary)" />
                                                <span style={{ flex: 1 }}>{folder.title}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{folder.chats.length}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameClick(folder, 'folder'); }}
                                                    style={{ border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}
                                                >
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                                                >
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {expandedFolders.includes(folder.id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                                        style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}
                                                    >
                                                        {folder.chats.map((chat: any) => (
                                                            <ChatListItem
                                                                key={chat.id}
                                                                chat={chat}
                                                                handleChatClick={handleChatClick}
                                                                isSelectionMode={isSelectionMode}
                                                                selectedIds={selectedIds}
                                                                activeMenuId={activeMenuId}
                                                                setActiveMenuId={setActiveMenuId}
                                                                initiateMove={initiateMove}
                                                                handleDeleteChat={(c) => setDeleteConfirm({ isOpen: true, title: c.title })}
                                                                handleRenameClick={(c) => handleRenameClick(c, 'chat')}
                                                                handleArchiveChat={(c) => archiveConversation(c.id, !c.is_archived)}
                                                                isArchivedView={false}
                                                            />
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    <h3 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                        {t('menu.recentChats') || 'Recent Chats'}
                                        <span>({unorganizedChats.length})</span>
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                                        {unorganizedChats.length > 0 ? unorganizedChats.map((chat: any) => (
                                            <ChatListItem
                                                key={chat.id}
                                                chat={chat}
                                                handleChatClick={handleChatClick}
                                                isSelectionMode={isSelectionMode}
                                                selectedIds={selectedIds}
                                                activeMenuId={activeMenuId}
                                                setActiveMenuId={setActiveMenuId}
                                                initiateMove={initiateMove}
                                                handleDeleteChat={(c) => setDeleteConfirm({ isOpen: true, title: c.title })}
                                                handleRenameClick={(c) => handleRenameClick(c, 'chat')}
                                                handleArchiveChat={(c) => archiveConversation(c.id, !c.is_archived)}
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

                        <SidebarUserMenu
                            isOpen={userMenuOpen}
                            user={user}
                            onClose={() => setUserMenuOpen(!userMenuOpen)}
                            logout={logout}
                        />

                        <MoveModal
                            isOpen={showMoveModal}
                            folders={folders || []}
                            moveTargetIds={moveTargetIds}
                            chatToMove={chatToMove}
                            onMove={handleMove}
                            onClose={() => { setShowMoveModal(false); setChatToMove(null); setMoveTargetIds([]); }}
                        />

                        <RenameModal
                            isOpen={renameModal.isOpen}
                            type={renameModal.type}
                            currentTitle=""
                            newTitle={newRenameTitle}
                            onChange={setNewRenameTitle}
                            onConfirm={confirmRename}
                            onClose={() => setRenameModal({ isOpen: false, id: '', type: 'chat' })}
                        />

                        <DeleteConfirmModal
                            isOpen={deleteConfirm.isOpen}
                            title={deleteConfirm.title}
                            onConfirm={confirmDelete}
                            onClose={() => setDeleteConfirm({ isOpen: false, title: '' })}
                        />

                        <SummaryModal
                            isOpen={summaryModal.isOpen}
                            content={summaryModal.content}
                            isLoading={summaryModal.isLoading}
                            onClose={() => setSummaryModal({ isOpen: false, content: '', isLoading: false })}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatSidebar;
