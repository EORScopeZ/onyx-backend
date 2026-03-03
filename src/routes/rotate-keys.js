const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')
const { verifySecret } = require('../middleware')

// POST /rotate-all-keys
// Wipes ALL issued keys so everyone gets a fresh one next time they visit /getkey.
// Call this at the start of each new 48-hour window (e.g. from the Discord bot on a timer).
router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    try {
        // Delete ALL keys — not just expired ones.
        // The synchronized window means "expired" and "current" keys share the same
        // expiry timestamp, so we just nuke everything and let users regenerate.
        const { error, count } = await supabase
            .from('issued_keys')
            .delete({ count: 'exact' })
            .neq('id', 0)   // matches all rows (Supabase requires a filter)

        if (error) throw error

        console.log(`[rotate-keys] Cleared ${count ?? '?'} keys. New window started.`)
        return res.json({ success: true, cleared: count ?? 0 })

    } catch (err) {
        console.error('[rotate-keys]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
