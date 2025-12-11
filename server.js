const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const repl = require('repl');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// haha this is great security :3
const bannedIPs = new Set();

const ADMINS = new Set(['Abaka']); // Fine for now, as this is just a test build. Although some security expert, we NEED to change this later on
// const SECRET_ADMIN_KEY = process.env.BAN_KEY;
const SECRET_ADMIN_KEY = "1234"; // This is for testing, comment this out on actual build

let online_users = 0
let online_user_list = []

io.on('connection', (socket) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

  socket.on('set-username', (username) => {
    const cleanIp = ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
    socket.username = username;
    socket.ip = cleanIp;

    online_users++;
    online_user_list.push({ username, ip: cleanIp });

    io.emit('online-count', online_users);
    io.emit('ip-list', online_user_list);
  });

  socket.on('chat message', (data) => {
    const msg = typeof data === 'string' ? data : data.text;

    if (!msg) return;

    if (socket.ip && bannedIPs.has(socket.ip)) {
      socket.emit('blocked', { reason: 'Your IP is banned' });
      console.log('Attempted message send from', socket.username);
      return;
    }

    if (msg.startsWith('/ban ')) {
      const parts = msg.split(' ');
      const targetIp = parts[1];
      const password = parts[2];

      if (password === SECRET_ADMIN_KEY) {
        bannedIPs.add(targetIp);
        console.log(`BANNED IP ${targetIp} by ${socket.username}`);
        io.emit('chat message', { username: 'SERVER', text: `IP ${targetIp} was banned by ${socket.username}`, ips: online_user_list});
      } else {
        socket.emit('chat message', { username: 'SERVER', text: 'Invalid password for /ban' });
      }
      return;
    }

    if (msg.startsWith('/unban ')) {
      const parts = msg.split(' ');
      const targetIp = parts[1];
      const password = parts[2];

      if (password === SECRET_ADMIN_KEY) {
        bannedIPs.delete(targetIp);
        console.log(`UNBANNED IP ${targetIp} by ${socket.username}`);
        io.emit('chat message', { username: 'SERVER', text: `IP ${targetIp} was unbanned by ${socket.username}` });
      } else {
        socket.emit('chat message', { username: 'SERVER', text: 'Invalid password for /unban' });
      }
      return;
    }

    io.emit('chat message', { username: socket.username, text: msg });
});

  socket.on('disconnect', () => {
    online_users--;
    online_user_list = online_user_list.filter(x => x.ip !== socket.ip);
    io.emit('online-count', online_users);
    io.emit('ip-list', online_user_list);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

repl.start({
  prompt: 'server> ',
  eval: (cmd, context, filename, callback) => {
    try {
      const result = eval(cmd);
      callback(null, result);
    } catch (err) {
      callback(err);
    }
  }
});