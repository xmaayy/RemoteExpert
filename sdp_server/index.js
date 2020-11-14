// app.js
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000

dataStore = {':hololens': [
    {"SDP":"You got it"}
  ]}
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.post('/data/:id', (req, res) => {
    const deviceId = req.params.id

    if (!dataStore[deviceId]) {
        dataStore[deviceId] = []
    }
    console.log(req.body)
    dataStore[deviceId].push(req.body)
    console.log(dataStore)
    res.statusCode = 200
    res.end()
})

app.get('/data/:id', (req, res) => {
    const deviceId = req.params.id

    if (!dataStore[deviceId] || dataStore[deviceId].length === 0) {
        res.statusCode = 404
        res.end()
    } else {
        const data = dataStore[deviceId].shift()
        console.log(data)
        res.statusCode = 200
        res.end(data)
    }
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))