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
router.get('/', async (req, res) => {
    const session_id = (req.query.session || '').trim()
    const ip         = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim()

    if (!session_id) {
        return res.status(400).json({ error: 'Missing session ID.' })
    }

    const expires_at = getWindowExpiry()
    const now        = new Date().toISOString()

    try {
        // ── Look for an existing VALID (non-expired) key for this session ─────
        // BUG FIX 1: Old code used .eq('expires_at', expires_at) which only matched
        // keys with the exact current window expiry timestamp. Keys issued just before
        // a rotation had a different expires_at, so the lookup missed them and generated
        // a brand new key every visit — users got different keys each time they opened
        // the page, then wondered why their key didn't work (they were using an old one).
        // Fix: .gt('expires_at', now) — return any key for this session that's still valid.
        const { data: existing, error: lookupError } = await supabase
            .from('issued_keys')
            .select('*')
            .eq('session_id', session_id)
            .gt('expires_at', now)
            .maybeSingle()

        // BUG FIX 2: Old code threw on any lookup error, returning 500 to the browser.
        // If the session_id column doesn't exist in your DB schema (common if the table
        // was created before this column was added), every single page visit 500'd and
        // showed "Server error" instead of a key. Fix: log and fall through to generation.
        if (lookupError) {
            console.error('[get-user-key] session lookup error:', lookupError.message)
            // fall through to generate a new key below
        } else if (existing) {
            return res.json({ key: existing.key, expires_at: existing.expires_at, fresh: false })
        }

        // ── Generate a fresh key ──────────────────────────────────────────────
        const key = generateKey()

        const { error: insertError } = await supabase
            .from('issued_keys')
            .insert({ key, session_id, ip_address: ip, expires_at })

        if (insertError) {
            // If insert fails, still return the key so the user isn't hard-blocked.
            // They just won't get the same key on refresh — acceptable fallback.
            console.error('[get-user-key] insert error:', insertError.message)
            return res.json({ key, expires_at, fresh: true })
        }

        return res.json({ key, expires_at, fresh: true })

    } catch (err) {
        console.error('[get-user-key] unexpected error:', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
module.exports.generateKey     = generateKey
module.exports.getWindowExpiry = getWindowExpiry
