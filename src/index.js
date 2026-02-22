require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const validateRoute       = require('./routes/validate')
const whitelistRoute      = require('./routes/whitelist')
const blacklistRoute      = require('./routes/blacklist')
const listWhitelistRoute  = require('./routes/list-whitelist')
const setGlobalKeyRoute   = require('./routes/set-global-key')
const setNametagRoute     = require('./routes/set-nametag')
const getNametagRoute     = require('./routes/get-nametag')
const nametagsRoute       = require('./routes/nametags')
const registerUserRoute   = require('./routes/register-onyx-user')
const logExecutionRoute   = require('./routes/log-execution')
const statusRoute         = require('./routes/status')
const getkeyRoute         = require('./routes/getkey')

const app = express()

app.use(cors())
app.use(express.json())

// Rate limiter — relaxed slightly for heartbeat endpoints
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 })
app.use(limiter)

// ── Roblox / public routes ──────────────────────────────────────────────────
app.use('/api/validate',            validateRoute)
app.use('/api/register-onyx-user',  registerUserRoute)
app.use('/api/log-execution',       logExecutionRoute)
app.use('/api/get-nametag',         getNametagRoute)
app.use('/api/nametags',            nametagsRoute)
app.use('/getkey',                  getkeyRoute)

// ── Bot / admin routes (require API_SECRET header) ──────────────────────────
app.use('/api/whitelist',           whitelistRoute)
app.use('/api/unwhitelist',         whitelistRoute)
app.use('/api/blacklist',           blacklistRoute)
app.use('/api/unblacklist',         blacklistRoute)
app.use('/api/list-whitelist',      listWhitelistRoute)
app.use('/api/set-global-key',      setGlobalKeyRoute)
app.use('/api/set-nametag',         setNametagRoute)
app.use('/api/status',              statusRoute)

app.listen(process.env.PORT || 3000, () => {
    console.log(`Onyx backend running on port ${process.env.PORT || 3000}`)
})
