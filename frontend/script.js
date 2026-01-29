
if(document.getElementById("loginBtn")){
  document.getElementById("loginBtn").onclick = async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });

    if(res.ok){
      localStorage.setItem("username", username);
      window.location.href = "chat.html";
    }else{
      const data = await res.json();
      document.getElementById("error").innerText = data.message;
    }
  };
}


if(document.getElementById("sendBtn")){
  const username = localStorage.getItem("username");
  document.getElementById("user").innerText = username;

  const ws = new WebSocket("ws://localhost:3000");
  let currentRoom = null;
  let currentChatUser = null;

  ws.onopen = () => ws.send(JSON.stringify({ type: "login", username }));

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);


    if(data.type === "online_users"){
      const onlineList = document.getElementById("onlineList");
      onlineList.innerHTML = "";
      data.users.forEach(u => {
        if(u !== username){
          const li = document.createElement("li");
          li.innerText = u;
          li.style.cursor = "pointer";
          li.onclick = () => {
            currentChatUser = u;
            currentRoom = null;
            document.getElementById("currentRoom").innerText = `Private chat with ${u}`;
            document.getElementById("chatBox").innerHTML = "";
          };
          onlineList.appendChild(li);
        }
      });
    }

    else if(data.type === "system" || data.type === "message"){
      const chatBox = document.getElementById("chatBox");
      chatBox.innerHTML += `<p>${data.type === "system" ? "[SYSTEM]" : data.username}: ${data.message || data.text}</p>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    // One-to-one chat
    else if(data.type === "chat"){
      const chatBox = document.getElementById("chatBox");
      chatBox.innerHTML += `<p>${data.from}: ${data.text}</p>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Error messages
    else if(data.type === "error"){
      alert(data.message);
    }
  };

  // Join room
  document.getElementById("joinBtn").onclick = () => {
    const room = document.getElementById("roomName").value;
    if(!room) return alert("Enter room name");

    currentRoom = room;
    currentChatUser = null;
    document.getElementById("currentRoom").innerText = room;
    ws.send(JSON.stringify({ type: "join_room", username, room }));
    document.getElementById("chatBox").innerHTML = "";
  };

  // Send message
  document.getElementById("sendBtn").onclick = () => {
    const text = document.getElementById("message").value;
    if(!text) return;

    if(currentChatUser){
      ws.send(JSON.stringify({ type: "message", username, to: currentChatUser, text }));
    } else if(currentRoom){
      ws.send(JSON.stringify({ type: "message", username, room: currentRoom, text }));
    } else {
      alert("Join a room or select a user first");
    }

    document.getElementById("message").value = "";
  };
}
