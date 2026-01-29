import { onlineUsers } from "./users.js";

export let rooms = {}; // { roomName: [username,...] }

export function joinRoom(username, room) {
  if (!rooms[room]) rooms[room] = [];
  if (!rooms[room].includes(username)) rooms[room].push(username);
}

export function broadcastToRoom(room, message) {
  if (!rooms[room]) return;
  rooms[room].forEach(u => {
    const ws = onlineUsers[u];
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}
