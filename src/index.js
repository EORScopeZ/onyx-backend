require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const validateRoute = require('./routes/validate')

const app = express()

app.use(cors())
app.use(express.json())

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}))

app.use('/api/validate', validateRoute)

app.listen(process.env.PORT || 3000, () => {
    console.log('Onyx backend running')
})