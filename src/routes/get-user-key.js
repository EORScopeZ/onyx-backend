const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let key = 'ONYX-'
    for (let i = 0; i < 16; i++) {
        if (i > 0 && i % 4 === 0) key += '-'
        key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
}

// GET /get-user-key — no username needed, identified by IP
router.get('/', async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim()

    try {
        // ── Check if this IP already has a valid key this window ─────────────
        const { data: existing, error } = await supabase
            .from('issued_keys')
            .select('*')
            .eq('ip_address', ip)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) throw error

        if (existing) {
            // Return the key whether or not it's HWID-bound — user may need to copy it again on login
            return res.json({ key: existing.key, expires_at: existing.expires_at, fresh: false })
        }

        // ── No valid key for this IP — generate one ───────────────────────────
        const key        = generateKey()
        const expires_at = new Date(Date.now() + 48 * 3600 * 1000).toISOString()

        const { error: insertError } = await supabase
            .from('issued_keys')
            .insert({ key, ip_address: ip, expires_at })

        if (insertError) throw insertError

        return res.json({ key, expires_at, fresh: true })

    } catch (err) {
        console.error('[get-user-key]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
module.exports.generateKey = generateKey
