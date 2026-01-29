// Dummy database
export const usersDB = [
  { username: "Surya", password: "1234" },
  { username: "Bob", password: "1234" },
  { username: "Alice", password: "1234" }
];

// Online WebSocket users
export let onlineUsers = {};  // { username: ws }

export function checkLogin(username, password) {
  return usersDB.some(u => u.username === username && u.password === password);
}

export function addOnlineUser(username, ws) {
  onlineUsers[username] = ws;
}

export function removeOnlineUser(username) {
  delete onlineUsers[username];
}
