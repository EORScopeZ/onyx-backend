const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const roblox_username = (req.body.roblox_user || req.body.username || '').toLowerCase().trim()
    const job_id = (req.body.job_id || '').trim()
    if (!roblox_username) return res.json({ ok: false })

    try {
        await supabase
            .from('users')
            .upsert({
                roblox_username,
                last_heartbeat: new Date().toISOString(),
                job_id: job_id || null
            }, { onConflict: 'roblox_username' })

        return res.json({ ok: true })

    } catch (err) {
        console.error('[register-onyx-user]', err)
        return res.json({ ok: false })
    }
})

module.exports = router
