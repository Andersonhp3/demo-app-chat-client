const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const mongoose = require('mongoose')
require('dotenv').config()

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bgev7dl.mongodb.net/?retryWrites=true&w=majority`

let Message = mongoose.model('Message', {
  name: String,
  message: String
})

app.get('/messages', (req, res) => {
  Message.find({}, (err, messages) => {
    res.send(messages)
  })

  Message.findOne({message: 'badword'}, (err, censored) => {
    if(censored) {
      console.log('censored words found', censored);
      Message.remove({_id: censored.id}, (err) => {
        console.log('removed censored message')
      })
    }
  })
})

app.post('/messages', (req, res) => {
  let message = new Message(req.body)

  message.save((err) => {
    if(err) {
      sendStatus(500)
    }
  })

  Message.findOne({message: 'badword'}, (err, censored) => {
    if(censored) {
      console.log('censored words found', censored);
      Message.remove({_id: censored.id}, (err) => {
        console.log('removed censored message')
      })
    }
  })

  io.emit('message', req.body)
  res.sendStatus(200)
})

io.on('connection', (socket) => {
  console.log('use connection');
})

mongoose.connect(dbUrl, (err) => {
  console.log('mongo db connection', err);
})

const server = http.listen(3000, () => {
  console.log('server is listening on port', server.address().port);
})