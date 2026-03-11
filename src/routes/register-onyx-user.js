const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const roblox_username = (req.body.roblox_user || req.body.username || '').toLowerCase().trim()
    const job_id = (req.body.job_id || '').trim()
    if (!roblox_username) return res.json({ ok: false })

    try {
        // Try insert first so new users get nametag_enabled: true
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                roblox_username,
                nametag_enabled: true,
                last_heartbeat: new Date().toISOString(),
                job_id: job_id || null
            })

        if (insertError) {
            // User already exists — update heartbeat only, don't touch nametag_enabled
            await supabase
                .from('users')
                .update({
                    last_heartbeat: new Date().toISOString(),
                    job_id: job_id || null
                })
                .ilike('roblox_username', roblox_username)
        }

        return res.json({ ok: true })

    } catch (err) {
        console.error('[register-onyx-user]', err)
        return res.json({ ok: false })
    }
})

module.exports = router
