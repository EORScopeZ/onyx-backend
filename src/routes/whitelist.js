const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

// Handles both POST /api/whitelist and POST /api/unwhitelist
router.post('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    // req.path is always '/' inside a subrouter — use originalUrl instead
    const isUnwhitelist = req.originalUrl.includes('unwhitelist') || req.body.action === 'remove'
    const roblox_username = (req.body.roblox_username || req.body.username || req.body.roblox_user || '').toLowerCase().trim()
    const discord_id      = req.body.discord_id || null

    if (!roblox_username)
        return res.status(400).json({ error: 'roblox_username required.' })

    try {
        if (isUnwhitelist) {
            const { error } = await supabase
                .from('users')
                .update({ whitelisted: false, hwid: null })
                .eq('roblox_username', roblox_username)

            if (error) throw error
            return res.json({ success: true, action: 'unwhitelisted', roblox_username })
        }

        const { data, error } = await supabase
            .from('users')
            .upsert(
                { roblox_username, discord_id, whitelisted: true, blacklisted: false },
                { onConflict: 'roblox_username', ignoreDuplicates: false }
            )
            .select()
            .single()

        if (error) throw error
        return res.json({ success: true, action: 'whitelisted', roblox_username, user: data })

    } catch (err) {
        console.error('[whitelist]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
