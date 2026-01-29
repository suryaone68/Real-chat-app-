// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

import { checkLogin, addOnlineUser, removeOnlineUser, onlineUsers } from "./users.js";
import { joinRoom, broadcastToRoom } from "./room.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });


app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// --- LOGIN API ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (checkLogin(username, password)) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: "Invalid login" });
  }
});

// Broadcast online users to all clients
function broadcastOnlineUsers() {
  const users = Object.keys(onlineUsers);
  wss.clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "online_users", users }));
    }
  });
}

// --- WEBSOCKET ---
wss.on("connection", (ws) => {

  ws.on("message", (data) => {
    const msg = JSON.parse(data);

    // WebSocket login
    if (msg.type === "login") {
      addOnlineUser(msg.username, ws);
      ws.username = msg.username;
      ws.send(JSON.stringify({ type: "login_success" }));
      broadcastOnlineUsers(); // update online users
    }

    // Join Room
    if (msg.type === "join_room") {
      joinRoom(msg.username, msg.room);

      broadcastToRoom(msg.room, {
        type: "system",
        message: `${msg.username} joined the room`
      });
    }

    // Chat Message (room or one-to-one)
    if (msg.type === "message") {
      if (msg.to) {
        // One-to-one chat
        const targetWs = onlineUsers[msg.to];
        if (targetWs && targetWs.readyState === targetWs.OPEN) {
          targetWs.send(JSON.stringify({ type: "chat", from: msg.username, text: msg.text }));
          ws.send(JSON.stringify({ type: "chat", from: msg.username, text: msg.text })); // echo to sender
        } else {
          ws.send(JSON.stringify({ type: "error", message: "User offline" }));
        }
      } else if (msg.room) {
        // Room chat
        broadcastToRoom(msg.room, {
          type: "message",
          username: msg.username,
          text: msg.text
        });
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Join a room or select a user first" }));
      }
    }
  });

  // User disconnect
  ws.on("close", () => {
    if (ws.username) {
      removeOnlineUser(ws.username);
      broadcastOnlineUsers(); // update online users
    }
  });

});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
