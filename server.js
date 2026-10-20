const WebSocket = require("ws");

const PORT = 3000;

const users = {
    Agam: "AgamThursday8383",
    Satvik: "SaturniteMagma9393",
    Darsh: "DraculaIron3333",
    Tejas: "TejuTragic6969",
    Devansh: "PortraitDaOwener"
};

const server = new WebSocket.Server({
    port: PORT
});

const connectedUsers = new Map();
const messages = [];

console.log(`Portraits Chat server running on port ${PORT}`);

function send(socket, data) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}

function broadcast(data) {
    const message = JSON.stringify(data);

    for (const socket of server.clients) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(message);
        }
    }
}

function getOnlineUsers() {
    return Array.from(connectedUsers.keys());
}

function broadcastUserList() {
    broadcast({
        type: "users",
        users: getOnlineUsers()
    });
}

server.on("connection", socket => {

    let currentUsername = null;

    socket.on("message", rawMessage => {

        let data;

        try {
            data = JSON.parse(rawMessage.toString());
        } catch {
            return;
        }

        if (data.type === "login") {

            const username = data.username;
            const password = data.password;

            if (!users[username]) {
                send(socket, {
                    type: "loginResult",
                    success: false,
                    error: "User not found."
                });

                return;
            }

            if (users[username] !== password) {
                send(socket, {
                    type: "loginResult",
                    success: false,
                    error: "Incorrect password."
                });

                return;
            }

            if (connectedUsers.has(username)) {
                send(socket, {
                    type: "loginResult",
                    success: false,
                    error: "This user is already online."
                });

                return;
            }

            currentUsername = username;

            connectedUsers.set(username, socket);

            send(socket, {
                type: "loginResult",
                success: true
            });

            send(socket, {
                type: "history",
                messages: messages
            });

            broadcastUserList();

            broadcast({
                type: "system",
                text: `${username} joined the Group Chat.`
            });

            return;
        }

        if (data.type === "message") {

            if (!currentUsername) {
                return;
            }

            const text = String(data.text || "").trim();

            if (!text) {
                return;
            }

            if (text.length > 500) {
                return;
            }

            const message = {
                username: currentUsername,
                text: text,
                time: Date.now()
            };

            messages.push(message);

            if (messages.length > 200) {
                messages.shift();
            }

            broadcast({
                type: "message",
                message: message
            });

            return;
        }
    });

    socket.on("close", () => {

        if (!currentUsername) {
            return;
        }

        connectedUsers.delete(currentUsername);

        broadcast({
            type: "system",
            text: `${currentUsername} left the Group Chat.`
        });

        broadcastUserList();
    });

    socket.on("error", () => {});
});