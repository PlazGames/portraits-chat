const CHAT_SERVER = "wss://portraits-chat-server.onrender.com";

const usernames = [
"Agam",
"Satvik",
"Darsh",
"Tejas",
"Devansh"
];

let socket = null;
let currentUser = null;
let connecting = false;

const savedUser = localStorage.getItem("portraitsUsername");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const error = document.getElementById("error");

if (savedUser && usernames.includes(savedUser)) {
usernameInput.value = savedUser;
passwordInput.focus();
}

function login() {
if (connecting) {
return;
}

const username = usernameInput.value.trim();
const password = passwordInput.value;

error.textContent = "";

if (username === "") {
    error.textContent = "Please enter your name.";
    return;
}

if (password === "") {
    error.textContent = "Please enter your password.";
    return;
}

if (!usernames.includes(username)) {
    error.textContent = "User not found.";
    return;
}

connecting = true;
loginButton.disabled = true;
error.textContent = "Connecting to Portraits Chat...";

socket = new WebSocket(CHAT_SERVER);

socket.addEventListener("open", () => {
    socket.send(JSON.stringify({
        type: "login",
        username: username,
        password: password
    }));
});

socket.addEventListener("message", event => {
    let data;

    try {
        data = JSON.parse(event.data);
    } catch {
        return;
    }

    handleServerMessage(data);
});

socket.addEventListener("error", () => {
    connecting = false;
    loginButton.disabled = false;

    error.textContent =
        "Could not connect to the chat server.";
});

socket.addEventListener("close", event => {
    connecting = false;
    loginButton.disabled = false;

    if (!currentUser) {
        if (event.code === 1000) {
            error.textContent = "Connection closed.";
        } else {
            error.textContent =
                "Connection failed. Please try again.";
        }
    } else {
        showDisconnected();
    }
});

}

function handleServerMessage(data) {
if (data.type === "loginResult") {
connecting = false;

    if (!data.success) {
        loginButton.disabled = false;
        error.textContent = data.error;

        if (socket) {
            socket.close();
        }

        return;
    }

    currentUser = usernameInput.value.trim();

    localStorage.setItem(
        "portraitsUsername",
        currentUser
    );

    showHome(currentUser);

    return;
}

if (data.type === "history") {
    data.messages.forEach(message => {
        addMessage(message);
    });

    return;
}

if (data.type === "message") {
    addMessage(data.message);
    return;
}

if (data.type === "system") {
    addSystemMessage(data.text);
    return;
}

if (data.type === "users") {
    updateOnlineUsers(data.users);
    return;
}

}

function createUsersList() {
return usernames
.map(username => {
const initial =
username.charAt(0).toUpperCase();

        return `
            <div
                class="user"
                data-username="${username}"
            >
                <div class="avatar">
                    ${initial}
                </div>

                <div class="user-info">
                    <strong>
                        ${username}
                    </strong>

                    <span class="user-status">
                        Offline
                    </span>
                </div>

                <div class="offline status-dot"></div>
            </div>
        `;
    })
    .join("");

}

function showHome(username) {
document.body.innerHTML = `
<div class="chat-app">

        <aside class="sidebar">

            <div class="brand">
                <div class="brand-logo">
                    P
                </div>

                <span>
                    Portraits Chat
                </span>
            </div>

            <div class="section-title">
                CHATS
            </div>

            <div class="chat-list">
                <div
                    class="chat-item active"
                    id="groupChat"
                >
                    <div class="chat-icon">
                        💬
                    </div>

                    <div class="chat-item-info">
                        <strong>
                            Group Chat
                        </strong>

                        <span>
                            Everyone
                        </span>
                    </div>
                </div>
            </div>

            <div class="section-title">
                USERS
            </div>

            <div class="users-list">
                ${createUsersList()}
            </div>

            <div class="sidebar-bottom">

                <div class="logged-user">

                    <div class="avatar">
                        ${username.charAt(0).toUpperCase()}
                    </div>

                    <div class="logged-user-info">

                        <strong>
                            ${username}
                        </strong>

                        <span>
                            Signed in
                        </span>

                    </div>

                    <div class="online"></div>

                </div>

                <button
                    id="signOutButton"
                    class="sign-out"
                >
                    <span>↪</span>
                    Sign out
                </button>

            </div>

        </aside>

        <main class="chat-area">

            <header class="chat-header">

                <div class="header-title">

                    <h2>
                        💬 Group Chat
                    </h2>

                    <p>
                        Everyone in Portraits Chat
                    </p>

                </div>

                <div class="current-user">
                    ${username}
                </div>

            </header>

            <section
                class="messages"
                id="messages"
            >

                <div
                    class="welcome"
                    id="welcome"
                >

                    <div class="welcome-logo">
                        P
                    </div>

                    <h1>
                        Welcome to Group Chat
                    </h1>

                    <div class="welcome-line"></div>

                    <p>
                        Talk with everyone in Portraits Chat.
                    </p>

                </div>

            </section>

            <div class="message-area">

                <input
                    id="messageInput"
                    type="text"
                    placeholder="Message #Group-Chat"
                    autocomplete="off"
                    maxlength="500"
                >

                <button id="sendButton">
                    ➤
                </button>

            </div>

        </main>

    </div>
`;

addChatStyles();

const signOutButton =
    document.getElementById("signOutButton");

const sendButton =
    document.getElementById("sendButton");

const messageInput =
    document.getElementById("messageInput");

signOutButton.addEventListener(
    "click",
    signOut
);

sendButton.addEventListener(
    "click",
    sendMessage
);

messageInput.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            sendMessage();
        }
    }
);

messageInput.focus();

}

function sendMessage() {
const input =
document.getElementById("messageInput");

if (!input || !socket) {
    return;
}

const text = input.value.trim();

if (!text) {
    return;
}

if (socket.readyState !== WebSocket.OPEN) {
    return;
}

socket.send(JSON.stringify({
    type: "message",
    text: text
}));

input.value = "";
input.focus();

}

function addMessage(message) {
const messages =
document.getElementById("messages");

if (!messages) {
    return;
}

const welcome =
    document.getElementById("welcome");

if (welcome) {
    welcome.remove();
}

const isMine =
    message.username === currentUser;

const messageElement =
    document.createElement("div");

messageElement.className =
    `message ${isMine ? "mine" : ""}`;

const initial =
    message.username
        .charAt(0)
        .toUpperCase();

const time =
    new Date(message.time)
        .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

messageElement.innerHTML = `
    <div class="message-avatar">
        ${initial}
    </div>

    <div class="message-content">

        <div class="message-top">

            <strong>
                ${message.username}
            </strong>

            <span>
                ${time}
            </span>

        </div>

        <div class="message-text"></div>

    </div>
`;

messageElement
    .querySelector(".message-text")
    .textContent = message.text;

messages.appendChild(messageElement);

messages.scrollTop =
    messages.scrollHeight;

}

function addSystemMessage(text) {
const messages =
document.getElementById("messages");

if (!messages) {
    return;
}

const element =
    document.createElement("div");

element.className =
    "system-message";

element.textContent = text;

messages.appendChild(element);

messages.scrollTop =
    messages.scrollHeight;

}

function updateOnlineUsers(onlineUsers) {
document
.querySelectorAll(".user")
.forEach(element => {

        const username =
            element.dataset.username;

        const status =
            element.querySelector(
                ".user-status"
            );

        const dot =
            element.querySelector(
                ".status-dot"
            );

        const online =
            onlineUsers.includes(username);

        if (online) {
            status.textContent = "Online";

            status.classList.add(
                "online-text"
            );

            dot.classList.remove(
                "offline"
            );

            dot.classList.add(
                "online"
            );
        } else {
            status.textContent = "Offline";

            status.classList.remove(
                "online-text"
            );

            dot.classList.remove(
                "online"
            );

            dot.classList.add(
                "offline"
            );
        }
    });

}

function showDisconnected() {
const input =
document.getElementById("messageInput");

if (input) {
    input.disabled = true;

    input.placeholder =
        "Disconnected from server";
}

}

function signOut() {
if (socket) {
socket.close();
}

localStorage.removeItem(
    "portraitsUsername"
);

currentUser = null;

location.reload();

}

function addChatStyles() {
const style =
document.createElement("style");

style.textContent = `

    .chat-app {
        width: 100vw;
        height: 100vh;
        display: flex;
        background: #09070e;
        color: white;
        font-family: "Segoe UI", Arial, sans-serif;
    }

    .sidebar {
        width: 270px;
        padding: 20px 15px;
        background: #100a18;
        border-right: 1px solid rgba(255,255,255,0.07);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .brand {
        height: 55px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 8px 20px;
        font-weight: 700;
        font-size: 15px;
    }

    .brand-logo {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: linear-gradient(135deg,#9b5cff,#7040d8);
        font-weight: 800;
        box-shadow: 0 5px 20px rgba(120,60,220,0.3);
    }

    .section-title {
        padding: 15px 10px 9px;
        color: #70667c;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1px;
    }

    .chat-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .chat-item {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 10px;
        border-radius: 12px;
        cursor: pointer;
        background: rgba(145,85,239,0.13);
    }

    .chat-icon {
        width: 39px;
        height: 39px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: linear-gradient(135deg,#8850e8,#5930ae);
        font-size: 17px;
    }

    .chat-item-info {
        display: flex;
        flex-direction: column;
    }

    .chat-item-info strong {
        font-size: 13px;
        font-weight: 600;
    }

    .chat-item-info span {
        margin-top: 3px;
        color: #756b80;
        font-size: 11px;
    }

    .users-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
        overflow-y: auto;
    }

    .user {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 8px 10px;
        border-radius: 12px;
        transition: background 0.15s;
    }

    .user:hover {
        background: rgba(255,255,255,0.045);
    }

    .avatar,
    .message-avatar {
        width: 39px;
        height: 39px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg,#8850e8,#5930ae);
        font-weight: 700;
    }

    .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .user-info strong {
        font-size: 13px;
        font-weight: 600;
    }

    .user-info span {
        margin-top: 3px;
        color: #756b80;
        font-size: 11px;
    }

    .user-info span.online-text {
        color: #62ca7d;
    }

    .online,
    .offline {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
        border-radius: 50%;
    }

    .online {
        background: #59dc79;
        box-shadow: 0 0 9px rgba(89,220,121,0.7);
    }

    .offline {
        background: #514a58;
    }

    .sidebar-bottom {
        margin-top: auto;
        padding-top: 15px;
        border-top: 1px solid rgba(255,255,255,0.06);
    }

    .logged-user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
    }

    .logged-user-info {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .logged-user-info strong {
        font-size: 12px;
    }

    .logged-user-info span {
        margin-top: 3px;
        color: #756b80;
        font-size: 10px;
    }

    .sign-out {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 8px;
        padding: 10px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: #8c8295;
        font-size: 12px;
        cursor: pointer;
        text-align: left;
        transition: 0.15s;
    }

    .sign-out:hover {
        background: rgba(255,70,100,0.08);
        color: #ff7089;
    }

    .sign-out span {
        font-size: 16px;
    }

    .chat-area {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .chat-header {
        height: 76px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 25px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
    }

    .chat-header h2 {
        margin: 0;
        font-size: 16px;
    }

    .chat-header p {
        margin: 4px 0 0;
        color: #756b80;
        font-size: 11px;
    }

    .current-user {
        padding: 9px 14px;
        border-radius: 10px;
        background: rgba(255,255,255,0.05);
        color: #d8d0df;
        font-size: 12px;
    }

    .messages {
        flex: 1;
        padding: 25px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 13px;
    }

    .welcome {
        margin: auto;
        text-align: center;
    }

    .welcome-logo {
        width: 70px;
        height: 70px;
        margin: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 20px;
        background: linear-gradient(135deg,#9b5cff,#7040d8);
        font-size: 30px;
        font-weight: 800;
        box-shadow: 0 15px 35px rgba(110,55,210,0.25);
    }

    .welcome h1 {
        margin: 20px 0 12px;
        font-size: 21px;
    }

    .welcome-line {
        width: 260px;
        height: 1px;
        margin: 0 auto 12px;
        background: rgba(255,255,255,0.16);
    }

    .welcome p {
        margin: 0;
        color: #756b80;
        font-size: 13px;
    }

    .message {
        display: flex;
        gap: 11px;
        max-width: 80%;
    }

    .message.mine {
        align-self: flex-end;
        flex-direction: row-reverse;
    }

    .message-avatar {
        width: 35px;
        height: 35px;
        font-size: 12px;
    }

    .message-content {
        min-width: 0;
    }

    .message-top {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
    }

    .message.mine .message-top {
        justify-content: flex-end;
    }

    .message-top strong {
        color: #cfc5db;
        font-size: 12px;
    }

    .message-top span {
        color: #62596b;
        font-size: 10px;
    }

    .message-text {
        padding: 10px 13px;
        border-radius: 12px;
        background: rgba(255,255,255,0.055);
        color: #e7e1eb;
        font-size: 13px;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    .message.mine .message-text {
        background: rgba(139,76,231,0.28);
    }

    .system-message {
        align-self: center;
        padding: 5px 12px;
        border-radius: 20px;
        color: #71677b;
        background: rgba(255,255,255,0.035);
        font-size: 10px;
    }

    .message-area {
        display: flex;
        gap: 10px;
        padding: 18px 22px;
        border-top: 1px solid rgba(255,255,255,0.04);
    }

    .message-area input {
        flex: 1;
        padding: 14px 15px;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        outline: none;
        background: rgba(255,255,255,0.045);
        color: white;
        font-size: 13px;
    }

    .message-area input:focus {
        border-color: #965cff;
        box-shadow: 0 0 0 3px rgba(150,92,255,0.10);
    }

    .message-area input::placeholder {
        color: #686070;
    }

    .message-area button {
        width: 50px;
        border: none;
        border-radius: 12px;
        background: linear-gradient(135deg,#9b5cff,#7040d8);
        color: white;
        cursor: pointer;
        font-size: 17px;
        transition: 0.15s;
    }

    .message-area button:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
    }

    .message-area button:active {
        transform: translateY(0);
    }

`;

document.head.appendChild(style);

}

loginButton.addEventListener(
"click",
login
);

passwordInput.addEventListener(
"keydown",
event => {
if (event.key === "Enter") {
login();
}
}
);