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

        // 2. Fetch nametags to show (whitelisted OR recently active)
        const recentThreshold = new Date(Date.now() - 120000).toISOString()

        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, nametag_enabled, whitelisted, nametag_text, nametag_color, nametag_effect, tag_image, icon_image, outline_color, background_color, last_heartbeat')
            .gt('last_heartbeat', recentThreshold)
            .or('nametag_enabled.is.null,nametag_enabled.eq.true')

        if (error) throw error

        const nametags = data.map(u => ({
            roblox_user: u.roblox_username,
            name_text: u.nametag_text || (u.whitelisted ? "Onyx User" : u.roblox_username),
            name_color: u.nametag_color || (u.whitelisted ? "#8b7fff" : "#ffffff"),
            tag_color: u.background_color || "#0f0f0f",
            glow_color: u.outline_color || "#8b7fff",
            outline_color: u.outline_color || "#8b7fff",
            image_url: u.tag_image,
            icon_image: u.icon_image,
            glitch_anim: u.nametag_effect === "glitch" ? true : false
        }))

        return res.json({ ok: true, nametags })

    } catch (err) {
        console.error('[register-onyx-user]', err)
        return res.json({ ok: false, nametags: [] })
    }
})

module.exports = router
