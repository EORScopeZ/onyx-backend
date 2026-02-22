const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, nametag_text, nametag_color, nametag_effect, tag_image, outline_color, background_color, text_color')
            .eq('nametag_enabled', true)
            .eq('whitelisted', true)

        if (error) throw error

        const nametags = data.map(u => ({
            roblox_user: u.roblox_username,
            name_text: u.nametag_text,
            name_color: u.text_color || u.nametag_color,
            tag_color: u.background_color || "#0f0f0f",
            glow_color: u.outline_color || "#ffffff",
            icon_image: u.tag_image || null,
            glitch_anim: u.nametag_effect === "glitch" ? true : false,
        }))

        return res.json({ nametags })

    } catch (err) {
        console.error('[nametags]', err)
        return res.json({ nametags: [] })
    }
})

module.exports = router
