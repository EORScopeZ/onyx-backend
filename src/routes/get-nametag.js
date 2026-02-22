const express    = require('express')
const router     = express.Router()
const supabase   = require('../services/supabase')

router.get('/:username', async (req, res) => {
    const roblox_username = (req.params.username || '').toLowerCase().trim()
    if (!roblox_username) return res.json({ found: false })

    try {
        const { data: user } = await supabase
            .from('users')
            .select('nametag_enabled, nametag_text, nametag_color, nametag_effect')
            .eq('roblox_username', roblox_username)
            .maybeSingle()

        if (!user || !user.nametag_enabled)
            return res.json({ found: false })

        return res.json({
            found:   true,
            text:    user.nametag_text,
            color:   user.nametag_color,
            effect:  user.nametag_effect,
        })

    } catch (err) {
        console.error('[get-nametag]', err)
        return res.json({ found: false })
    }
})

module.exports = router
