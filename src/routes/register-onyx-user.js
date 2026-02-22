const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('username')

        if (error) {
            console.error('Error fetching registered users:', error)
            return res.status(500).json({ error: 'Failed to fetch registered users' })
        }

        const usernames = data.map(user => user.username.toLowerCase())
        res.status(200).json({ usernames })
    } catch (err) {
        console.error('Unexpected error:', err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
