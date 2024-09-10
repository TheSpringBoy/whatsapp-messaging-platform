const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection

// Get statistics for all groups
router.get('/groups', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT g.group_name, 
                   COUNT(m.id) as messages_sent,
                   SUM(m.read_count) as total_reads, 
                   SUM(m.reply_count) as total_replies
            FROM groups g
            LEFT JOIN messages m ON g.id = m.group_id
            GROUP BY g.id
            ORDER BY g.id
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Failed to fetch group statistics:', error);
        res.status(500).json({ error: 'Failed to fetch group statistics' });
    }
});

// Get statistics for a specific message
router.get('/message/:id', async (req, res) => {
    const messageId = req.params.id;
    try {
        const result = await db.query(`
            SELECT m.message_text, 
                   m.sent_at, 
                   m.read_count, 
                   m.reply_count
            FROM messages m
            WHERE m.id = $1
        `, [messageId]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Failed to fetch message statistics:', error);
        res.status(500).json({ error: 'Failed to fetch message statistics' });
    }
});

module.exports = router;
