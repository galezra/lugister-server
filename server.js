// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var cors = require('cors');
var io = require('socket.io')(server, {
  cors: {
    origin: "*",  // WARNING: In production, replace with your actual domain
    methods: ["GET", "POST"]
  }
});
var port = process.env.PORT || 3000;

// Store connected users
const users = new Map();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static('public'));

// Enable CORS for all routes
app.use(cors({
  origin: '*', // In production, replace with your frontend domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add this endpoint after the static middleware
app.get('/users', (req, res) => {
  const userList = Array.from(users.values()).map(user => ({
    email: user.email,
    suffix: user.suffix
  }));
  res.json(userList);
});

io.on('connection', function (socket) {
  // Get email from query parameters
  const email = socket.handshake.query.email;

  if (!email || !email.includes('@')) {
    socket.disconnect();
    return;
  }

  // Generate suffix on the server
  const suffix = Math.random().toString(36).substring(2, 8);

  // Store user information with server-generated suffix
  users.set(socket.id, {
    id: socket.id,
    email: email,
    suffix: suffix,
    socket: socket
  });

  // Handle emoji sending
  socket.on('sendEmoji', function (data) {
    const { emoji, targetEmails } = data;
    const sender = users.get(socket.id);

    if (!emoji) return;

    // Send to specific users by email (all tabs of that email)
    targetEmails.forEach(targetEmail => {
      const targetUsers = Array.from(users.values()).filter(user => user.email === targetEmail);
      targetUsers.forEach(targetUser => {
        targetUser.socket.emit('newEmoji', {
          emoji,
          from: {
            email: sender.email,
            suffix: sender.suffix
          }
        });
      });
    });
  });

  // Handle disconnection
  socket.on('disconnect', function () {
    users.delete(socket.id);
  });
});