const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')
const { verifySecret } = require('../middleware')

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let key = 'ONYX-'
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) key += '-'
        key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
}

// POST /api/issue-manual-key — bot generates a one-time key not tied to an IP
router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    try {
        const key        = req.body.key || generateKey()
        const expires_at = req.body.expires_at
            ? new Date(req.body.expires_at).toISOString()
            : new Date(Date.now() + 48 * 3600 * 1000).toISOString()

        const { error } = await supabase
            .from('issued_keys')
            .insert({ key, ip_address: 'manual', expires_at })

        if (error) throw error

        return res.json({ success: true, key, expires_at })
    } catch (err) {
        console.error('[issue-manual-key]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
