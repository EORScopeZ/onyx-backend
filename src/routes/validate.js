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

        // ── 2. Check global temp key (for non-whitelisted users) ─────────────
        if (key) {
            const { data: setting, error: keyError } = await supabase
                .from('system_settings')
                .select('*')
                .eq('type', 'global_key')
                .maybeSingle()

            if (keyError) throw keyError

            if (setting && setting.value === key.trim()) {
                // Check expiry
                if (setting.expires_at && new Date(setting.expires_at) < new Date()) {
                    return res.json({ valid: false, message: 'Key has expired. Get a new key.' })
                }

                // Key is valid! HWID bind if user exists, otherwise allow through
                if (user) {
                    if (user.blacklisted)
                        return res.json({ valid: false, message: 'You are blacklisted.' })

                    if (!user.hwid) {
                        await supabase.from('users').update({ hwid }).eq('id', user.id)
                    } else if (user.hwid !== hwid) {
                        return res.json({ valid: false, message: 'HWID mismatch. Contact support.' })
                    }

                    const nametag = user.nametag_enabled
                        ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
                        : null

                    return res.json({ valid: true, whitelisted: false, type: 'temp_key', nametag })
                }

                // User not in DB but key is valid — let them through as temp key user
                return res.json({ valid: true, whitelisted: false, type: 'temp_key', nametag: null })
            } else {
                return res.json({ valid: false, message: 'Invalid key.' })
            }
        }

        // ── 3. No key provided — require whitelist ───────────────────────────
        if (!user)             return res.json({ valid: false, whitelisted: false, message: 'User not found. Ask to be whitelisted or use a key.' })
        if (user.blacklisted)  return res.json({ valid: false, whitelisted: false, message: 'You are blacklisted.' })
        if (!user.whitelisted) return res.json({ valid: false, whitelisted: false, message: 'You are not whitelisted. Use a key or ask for access.' })

        // ── 4. HWID binding ──────────────────────────────────────────────────
        if (!user.hwid) {
            await supabase.from('users').update({ hwid }).eq('id', user.id)
        } else if (user.hwid !== hwid) {
            return res.json({ valid: false, whitelisted: false, message: 'HWID mismatch. Contact support.' })
        }

        // Build nametag payload
        const nametag = user.nametag_enabled
            ? { text: user.nametag_text, color: user.nametag_color, effect: user.nametag_effect }
            : null

        // ── 5. Whitelisted user — always valid, skip key ─────────────────────
        return res.json({ valid: true, whitelisted: true, type: 'whitelisted', nametag })

    } catch (err) {
        console.error('[validate]', err)
        return res.json({ valid: false, message: 'Server error.' })
    }
})

module.exports = router
