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

// ── Synchronized 48-hour window ───────────────────────────────────────────────
const WINDOW_MS = 48 * 60 * 60 * 1000
const EPOCH     = new Date('2025-01-01T00:00:00Z').getTime()

function getWindowExpiry() {
    const now           = Date.now()
    const elapsed       = now - EPOCH
    const currentWindow = Math.floor(elapsed / WINDOW_MS)
    return new Date(EPOCH + (currentWindow + 1) * WINDOW_MS).toISOString()
}

// GET /get-user-key?session=<id>
// session_id comes from the browser's sessionStorage.
//   - Same session (refresh) → same ID → returns the existing key
//   - New session (closed tab, new window) → new ID → generates a new key
router.get('/', async (req, res) => {
    const session_id = (req.query.session || '').trim()
    const ip         = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim()

    if (!session_id) {
        return res.status(400).json({ error: 'Missing session ID.' })
    }

    const expires_at = getWindowExpiry()

    try {
        // ── Look for an existing key for this session in the current window ────
        const { data: existing, error } = await supabase
            .from('issued_keys')
            .select('*')
            .eq('session_id', session_id)
            .eq('expires_at', expires_at)
            .maybeSingle()

        if (error) throw error

        if (existing) {
            // Same session, same window — return the exact same key
            return res.json({ key: existing.key, expires_at: existing.expires_at, fresh: false })
        }

        // ── New session or new window — generate a fresh key ──────────────────
        const key = generateKey()

        const { error: insertError } = await supabase
            .from('issued_keys')
            .insert({ key, session_id, ip_address: ip, expires_at })

        if (insertError) throw insertError

        return res.json({ key, expires_at, fresh: true })

    } catch (err) {
        console.error('[get-user-key]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
module.exports.generateKey     = generateKey
module.exports.getWindowExpiry = getWindowExpiry
