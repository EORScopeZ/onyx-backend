const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/', async (req, res) => {
    try {
        // Only return users whose heartbeat is within the last 2 minutes
        // This ensures registeredNames on the client only contains currently-executing users
        const recentThreshold = new Date(Date.now() - 120000).toISOString()

        const { data, error } = await supabase
            .from('users')
            .select('roblox_username')
            .gte('last_heartbeat', recentThreshold)

        if (error) {
            console.error('Error fetching registered users:', error)
            return res.status(500).json({ error: 'Failed to fetch registered users' })
        }

        const usernames = data
            .filter(user => user.roblox_username)
            .map(user => user.roblox_username.toLowerCase())

        console.log(`[registered-users] ${usernames.length} active users`)
        res.status(200).json({ usernames })
    } catch (err) {
        console.error('Unexpected error:', err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
