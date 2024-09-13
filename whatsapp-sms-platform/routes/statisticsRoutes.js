const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const db = require('../db');

// Get statistics for all groups
router.get('/groups', authController.verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            WITH message_stats AS (
                SELECT 
                    group_id, 
                    message_group_id, 
                    COUNT(*) AS total_recipients, 
                    SUM(read_count) AS total_reads,
                    COUNT(DISTINCT CASE WHEN reply_count > 0 THEN whatsapp_message_id END) AS unique_replies  -- Count only distinct replies
                FROM messages
                GROUP BY group_id, message_group_id
            )

            SELECT 
                g.group_name,
                COUNT(DISTINCT ms.message_group_id) AS messages_sent,
                SUM(ms.total_reads) AS total_reads,
                SUM(ms.unique_replies) AS total_replies,  -- Total unique replies
                ROUND(AVG(COALESCE((ms.total_reads * 100.0 / ms.total_recipients), 0))) AS avg_read_percentage,
                ROUND(AVG(COALESCE((ms.unique_replies * 100.0 / ms.total_recipients), 0))) AS avg_reply_percentage  -- Calculate reply percentage
            FROM 
                groups g
            LEFT JOIN 
                message_stats ms ON g.id = ms.group_id
            GROUP BY 
                g.group_name, g.id
            ORDER BY 
                g.id;
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Failed to fetch group statistics:', error);
        res.status(500).json({ error: 'Failed to fetch group statistics' });
    }
});

// Get statistics per message
router.get('/per-message', authController.verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                m.message_group_id,
                m.message_text,
                g.group_name,
                COUNT(m.id) AS total_sent,
                SUM(CASE WHEN m.read_count > 0 THEN 1 ELSE 0 END) AS total_reads,
                SUM(CASE WHEN m.reply_count > 0 THEN 1 ELSE 0 END) AS total_replies,
                (SUM(CASE WHEN m.read_count > 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(m.id) AS read_percentage,
                (SUM(CASE WHEN m.reply_count > 0 THEN 1 ELSE 0 END) * 100.0) / COUNT(m.id) AS reply_percentage
            FROM messages m
            JOIN groups g ON m.group_id = g.id
            GROUP BY m.message_group_id, m.group_id, g.group_name, m.message_text
            ORDER BY m.group_id;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch per-message statistics:', error);
        res.status(500).json({ error: 'Failed to fetch per-message statistics' });
    }
});


module.exports = router;
