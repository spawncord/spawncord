const socket = io();

let currentUser = "";

//const SECRET_ADMIN_KEY = process.env.BAN_KEY;
const SECRET_ADMIN_KEY = "1234"; // This is for testing, comment this out on actual build

document.getElementById("start-chat-btn").addEventListener("click", () => {
  const username = document.getElementById("username-input").value.trim();

  if (username) {
    currentUser = username;
    showChat();
    document.getElementById("chat-title").textContent = `Spawncord (Chatting as: ${currentUser})`;
    socket.emit('set-username', username);
  } else {
    alert("Please enter a valid username.");
  }
});

socket.on('online-count', (count) => {
  document.getElementById('online_user_count').textContent = "Online Users: " + count;
})

function showChat() {
  document.getElementById("name-prompt").style.display = "none";
  document.getElementById("chat-container").style.display = "flex";
  document.getElementById("chat-title").style.display = "block";
}

document.getElementById("send-btn").addEventListener("click", () => {
  const messageInput = document.getElementById("message-input");
  const messageText = messageInput.value.trim();

  if (messageText) {
    socket.emit('chat message', { text: messageText });
    messageInput.value = "";
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    const messageInput = document.getElementById("message-input");
    const messageText = messageInput.value.trim();

    if (messageText) {
      socket.emit('chat message', { text: messageText });
      messageInput.value = "";
    }
  }
})

socket.on('chat message', (data) => {
  if (!data) return;
  addMessage(data.username, data.text);

  if (data.ips) {
    let IP_String = "";
    for (let i = 0; i < data.ips.length; i++) {
      IP_String += String(data.ips[i]) + "\n";
    }
    IP_List.textContent = IP_String;
  }
});

socket.on('ip-list', (ips) => {
  let out = "";
  for (const entry of ips) {
    out += `${entry.username} : ${entry.ip}\n`;
  }
  document.getElementById("IP_List").textContent = out;
});

socket.on('blocked', (data) => {
  addMessage("SERVER", data.reason);
});

function addMessage(username, message) {
  const messagesContainer = document.getElementById("messages");
  const messageBlock = document.createElement("div");
  messageBlock.classList.add("message-block");

  const usernameTime = document.createElement("div");
  usernameTime.classList.add("username-time");
  const usernameElement = document.createElement("span");
  usernameElement.classList.add("username");
  usernameElement.textContent = username;

  const timeElement = document.createElement("span");
  timeElement.classList.add("time");
  timeElement.textContent = getCurrentTime();

  usernameTime.appendChild(usernameElement);
  usernameTime.appendChild(timeElement);

  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.textContent = message;

  messageBlock.appendChild(usernameTime);
  messageBlock.appendChild(messageElement);
  messagesContainer.appendChild(messageBlock);

  requestAnimationFrame(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function toggleRules() {
  const rules = document.getElementById("rules");
  rules.style.display = (rules.style.display === "none") ? "block" : "none";
}

function toggleAdmin() {
  let passcode = prompt("Enter passcode:")

  if (passcode === SECRET_ADMIN_KEY) {
    const admin = document.getElementById("admin-panel");
    admin.style.display = (admin.style.display === "none") ? "block" : "none";
  }
}