const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('roblox_username, nametag_text, nametag_color, nametag_effect')
            .eq('nametag_enabled', true)
            .eq('whitelisted', true)

        if (error) throw error

        const nametags = data.map(u => ({
            roblox_user:  u.roblox_username,
            text:         u.nametag_text,
            color:        u.nametag_color,
            effect:       u.nametag_effect,
        }))

        return res.json({ nametags })

    } catch (err) {
        console.error('[nametags]', err)
        return res.json({ nametags: [] })
    }
})

module.exports = router
