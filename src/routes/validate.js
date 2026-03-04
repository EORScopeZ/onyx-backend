const express  = require('express')
const router   = express.Router()
const supabase = require('../services/supabase')

router.post('/', async (req, res) => {
    const { username, roblox_user, key, hwid, secret } = req.body
    const robloxName = (username || roblox_user || '').toLowerCase().trim()

    if (secret && secret !== process.env.API_SECRET)
        return res.json({ valid: false, message: 'Forbidden.' })

    if (!robloxName || !hwid)
        return res.json({ valid: false, message: 'Missing username or hwid.' })

    try {
        // ── 1. Check users table for whitelist / blacklist ────────────────────
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('roblox_username', robloxName)
            .maybeSingle()

        if (userError) throw userError

        if (user && user.blacklisted)
            return res.json({ valid: false, message: 'You are blacklisted.' })

        // Permanently whitelisted — skip key entirely
        if (user && user.whitelisted) {
            if (!user.hwid) {
                await supabase.from('users').update({ hwid }).eq('id', user.id)
            } else if (user.hwid !== hwid) {
                return res.json({ valid: false, message: 'HWID mismatch. Contact support.' })
            }
            const nametag = user.nametag_enabled
                ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
                : null
            return res.json({ valid: true, whitelisted: true, type: 'whitelisted', nametag })
        }

        // ── 2. Key required for everyone else ─────────────────────────────────
        if (!key)
            return res.json({ valid: false, message: 'Key required. Visit the key page to get your key.' })

        // ── 3. Look up key in issued_keys ─────────────────────────────────────
        const { data: issued, error: keyError } = await supabase
            .from('issued_keys')
            .select('*')
            .eq('key', key.trim())
            .maybeSingle()

        if (keyError) throw keyError

        if (!issued)
            return res.json({ valid: false, message: 'Invalid key. Get your key from the key page.' })

        if (new Date(issued.expires_at) < new Date())
            return res.json({ valid: false, type: 'expired', message: 'Key expired. Visit the key page to get a new one.' })

        // ── 4. HWID binding ───────────────────────────────────────────────────
        if (!issued.hwid) {
            // First use — bind HWID and username to this key
            await supabase
                .from('issued_keys')
                .update({ hwid, roblox_username: robloxName })
                .eq('id', issued.id)
        } else if (issued.hwid !== hwid) {
            return res.json({ valid: false, message: 'This key is locked to a different device.' })
        }

        // ── 5. Username consistency check ─────────────────────────────────────
        // Once a key is bound to a username, reject different usernames using it
        if (issued.roblox_username && issued.roblox_username !== robloxName) {
            return res.json({ valid: false, message: 'This key is already bound to a different account.' })
        }

        const nametag = (user && user.nametag_enabled)
            ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
            : null

        return res.json({ valid: true, whitelisted: false, type: 'temp_key', expires_at: issued.expires_at, nametag })

    } catch (err) {
        console.error('[validate]', err)
        return res.json({ valid: false, message: 'Server error.' })
    }
})

module.exports = router
