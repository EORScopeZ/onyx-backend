const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const roblox_username = (req.body.roblox_user || req.body.username || '').toLowerCase().trim()
    if (!roblox_username) return res.json({ ok: false, nametags: [] })

    try {
        // 1. Record heartbeat for this user (Upsert)
        await supabase
            .from('users')
            .upsert({
                roblox_username,
                last_heartbeat: new Date().toISOString()
            }, { onConflict: 'roblox_username' })

        return res.json({ ok: true })

    } catch (err) {
        console.error('[register-onyx-user]', err)
        return res.json({ ok: false })
    }
})

module.exports = router
