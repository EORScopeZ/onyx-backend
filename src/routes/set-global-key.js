const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    const key   = (req.body.key || '').trim()
    const hours = parseInt(req.body.hours) || 24

    // The bot sends expires_at as Unix SECONDS — detect by size and convert to ms
    const rawExpiry  = req.body.expires_at
    const expires_at = rawExpiry
        ? new Date(Number(rawExpiry) < 1e12 ? Number(rawExpiry) * 1000 : Number(rawExpiry)).toISOString()
        : new Date(Date.now() + hours * 3600 * 1000).toISOString()

    if (!key)
        return res.status(400).json({ error: 'key required.' })

    try {
        const { error } = await supabase
            .from('system_settings')
            .upsert(
                { type: 'global_key', value: key, expires_at },
                { onConflict: 'type' }
            )

        if (error) throw error
        return res.json({ success: true, key, expires_at })

    } catch (err) {
        console.error('[set-global-key]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
