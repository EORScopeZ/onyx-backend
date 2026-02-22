const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/', async (req, res) => {
    try {
        const recentThreshold = new Date(Date.now() - 120000).toISOString()

        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, whitelisted, nametag_enabled, nametag_text, nametag_color, nametag_effect, tag_image, icon_image, outline_color, background_color, last_heartbeat')

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

        return res.json({ nametags })

    } catch (err) {
        console.error('[nametags]', err)
        return res.json({ nametags: [] })
    }
})

module.exports = router
