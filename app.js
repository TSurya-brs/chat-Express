const express = require("express");
const http = require("http");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const bodyParser = require("body-parser");
const path = require("path");
const { Server } = require("socket.io");

const port = 9000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const adapter = new FileSync("db.json");
const db = low(adapter);

db.defaults({ messages: [] }).write();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/chat", (req, res) => {
  const { name, message } = req.body;

  if (!name || !message) {
    return res.status(400).send("Name and message are required.");
  }

  db.get("messages").push({ name, message }).write();

  io.emit("chat message", { name, message });

  res.send(`${name}: ${message}`);
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (data) => {
    socket.broadcast.emit("chat message", data); // Use broadcast.emit to avoid sending to the sender
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server connected to port ${port}`);
});
