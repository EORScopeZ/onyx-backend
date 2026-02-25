const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')
const { verifySecret } = require('../middleware')

// POST /rotate-all-keys
// Deletes all expired keys. New ones are generated on demand when users visit /getkey.
router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    try {
        const { error, count } = await supabase
            .from('issued_keys')
            .delete({ count: 'exact' })
            .lt('expires_at', new Date().toISOString())

        if (error) throw error

        console.log(`[rotate-keys] Cleared ${count ?? '?'} expired keys.`)
        return res.json({ success: true, cleared: count ?? 0 })

    } catch (err) {
        console.error('[rotate-keys]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
