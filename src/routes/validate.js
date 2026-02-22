const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const { username, roblox_user, key, hwid, secret } = req.body

    // Accept both field names
    const robloxName = (username || roblox_user || '').toLowerCase().trim()

    // Secret is optional for Roblox clients (it's client-side code, secret would be exposed)
    // Only enforce if explicitly provided
    if (secret && secret !== process.env.API_SECRET)
        return res.json({ valid: false, message: 'Forbidden.' })

    if (!robloxName || !hwid)
        return res.json({ valid: false, message: 'Missing username or hwid.' })

    try {
        // ── 1. Fetch user ────────────────────────────────────────────────────
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('roblox_username', robloxName)
            .maybeSingle()

        if (error) throw error
        if (!user)             return res.json({ valid: false, whitelisted: false, message: 'User not found. Ask to be whitelisted.' })
        if (user.blacklisted)  return res.json({ valid: false, whitelisted: false, message: 'You are blacklisted.' })
        if (!user.whitelisted) return res.json({ valid: false, whitelisted: false, message: 'You are not whitelisted.' })

        // ── 2. HWID binding ──────────────────────────────────────────────────
        if (!user.hwid) {
            await supabase.from('users').update({ hwid }).eq('id', user.id)
        } else if (user.hwid !== hwid) {
            return res.json({ valid: false, whitelisted: false, message: 'HWID mismatch. Contact support.' })
        }

        // Build nametag payload
        const nametag = user.nametag_enabled
            ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
            : null

        // ── 3. Whitelisted users skip the key entirely ───────────────────────
        return res.json({ valid: true, whitelisted: true, type: 'whitelisted', nametag })

    } catch (err) {
        console.error('[validate]', err)
        return res.json({ valid: false, message: 'Server error.' })
    }
})

module.exports = router
