import express from 'express';
import { z } from 'zod';
import { log } from '../utils/logger.js';
import { requireAuth, validate } from '../middleware.js';
import { schemas } from '../schemas.js';

const router = express.Router();

// GET /api/folders
router.get('/', requireAuth, async (req, res) => {
    try {
        const { data, error } = await req.userClient
            .from('folders')
            .select('*, chats:conversations(id, title, created_at)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const folders = data.map(f => ({
            ...f,
            chats: f.chats || []
        }));

        res.json(folders);
    } catch (err) {
        log('Folders', 'ERROR', 'Get', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/folders
router.post('/', requireAuth, validate(schemas.createFolder), async (req, res) => {
    try {
        const { title } = req.body;
        const { data, error } = await req.userClient
            .from('folders')
            .insert([{ user_id: req.user.id, title }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('Folders', 'ERROR', 'Create', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/folders/:id
router.put('/:id', requireAuth, validate(schemas.createFolder), async (req, res) => {
    try {
        const { title } = req.body;
        const { data, error } = await req.userClient
            .from('folders')
            .update({ title })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        log('Folders', 'ERROR', 'Rename', err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/folders/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        // Move chats back to "Unorganized" (null folder_id)
        await req.userClient
            .from('conversations')
            .update({ folder_id: null })
            .eq('folder_id', req.params.id)
            .eq('user_id', req.user.id);

        const { error } = await req.userClient
            .from('folders')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        log('Folders', 'ERROR', 'Delete', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/conversations/:id/move (Moved here from chat or folders? It's about moving TO a folder)
// In index.js it was app.put('/api/conversations/:id/move', ...)
// I will keep it here but I need to mount it correctly or change the path.
// If I mount folders at /api/folders, this path /move is tricky.
// index.js path: /api/conversations/:id/move
// Ideally this belongs in `chat.js` under `/conversation/:id/move`.
// But it relates to folders.
// Let's put it in `folders.js` but strict path control.
// If folders.js is mounted at `/api/folders`, I can't easily capture `/api/conversations`.
// So I should put it in `chat.js`, OR `index.js` mounts it specially.
// I'll put it in `chat.js` actually, since it modifies a conversation.

// router.put('/conversations/:id/move'...) -> MOVED TO CHAT.JS ... wait I didn't put it in chat.js above.
// I missed it in chat.js. I should append it to chat.js or add it now.
// I will Add it to `chat.js` in a subsequent step or append it to `server/routes/chat.js` using `multi_replace`.
// Actually, I haven't written `chat.js` to disk yet? No wait, I just wrote it in the previous tool call?
// No, I am queuing tool calls. I wrote `chat.js` above.
// I missed `/conversations/:id/move`.
// I will include it in `folders.js` but I'll have to mount `folders.js` at `/api` and define `/folders` inside?
// No, `folders.js` is clearly `/api/folders`.
// I will add `/conversation/:id/move` to `chat.js`.

export default router;
