const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')
const { verifySecret } = require('../middleware')

router.get('/', async (req, res) => {
    if (!verifySecret(req))
        return res.status(403).json({ error: 'Forbidden.' })

    try {
        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, discord_id, hwid, has_permanent_key, permanent_key, nametag_enabled, created_at')
            .eq('whitelisted', true)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Normalize fields — bot expects roblox_user and key
        const users = data.map(u => ({
            ...u,
            roblox_user: u.roblox_username,
            key:         u.permanent_key || null,
        }))

        return res.json({ count: users.length, users })

    } catch (err) {
        console.error('[list-whitelist]', err)
        return res.status(500).json({ error: 'Server error.' })
    }
})

module.exports = router
