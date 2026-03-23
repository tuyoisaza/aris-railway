import React from 'react';
import { MessageSquare, MoreHorizontal, Edit2, FolderInput, Archive, Trash2, Plus } from 'lucide-react';

interface ChatListItemProps {
    chat: any;
    handleChatClick: (chat: any) => void;
    isSelectionMode: boolean;
    selectedIds: string[];
    activeMenuId: string | null;
    setActiveMenuId: (id: string | null) => void;
    initiateMove: (chat: any) => void;
    handleDeleteChat: (chat: any, e: any) => void;
    handleRenameClick: (chat: any) => void;
    handleArchiveChat: (chat: any, e: any) => void;
}

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

const ChatListItem: React.FC<ChatListItemProps> = ({
    chat,
    handleChatClick,
    isSelectionMode,
    selectedIds,
    activeMenuId,
    setActiveMenuId,
    initiateMove,
    handleDeleteChat,
    handleRenameClick,
    handleArchiveChat,
}) => {
    const isSelected = selectedIds.includes(chat.id);

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
                    background: (isSelectionMode && isSelected) ? 'var(--color-primary-light)' : 'transparent'
                }}
                className="hover:bg-gray-50"
            >
                {isSelectionMode ? (
                    <div style={{
                        width: '18px',
                        height: '18px',
                        border: isSelected ? 'none' : '2px solid var(--color-text-tertiary)',
                        borderRadius: '4px',
                        background: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                    }}>
                        {isSelected && <Plus size={14} style={{ transform: 'rotate(45deg)' }} />}
                    </div>
                ) : (
                    <MessageSquare size={18} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                )}

                <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--color-text)'
                    }}>
                        {chat.title || 'Untitled'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{chat.date}</div>
                </div>
            </div>

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
                    <button onClick={() => handleRenameClick(chat)} style={menuItemStyle}>
                        <Edit2 size={14} /> Rename
                    </button>
                    <button onClick={() => initiateMove(chat)} style={menuItemStyle}>
                        <FolderInput size={14} /> Move
                    </button>
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
                    <button onClick={(e) => handleDeleteChat(chat, e)} style={{ ...menuItemStyle, color: '#ef4444' }}>
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatListItem;
