// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
  cors: {
    origin: "*",  // WARNING: In production, replace with your actual domain
    methods: ["GET", "POST"]
  }
});
var port = process.env.PORT || 3000;
var numUsers = 0;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static('public'));


app.get('/', async (req, res) => {
  res.json({ hello: 'world', numUsers: numUsers });
});


io.on('connection', function (socket) {
  numUsers++;

  socket.on('sendEmojis', function () {
    socket.emit('login', {
      numUsers: numUsers
    });
  });

  socket.on('disconnect', function () {
      --numUsers;
  });
});