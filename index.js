import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import otproutes from "./routes/otp.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:3000"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("YourTube backend is running ✅");
});

app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/otp", otproutes);

// ─── VoIP Signaling via Socket.IO ──────────────────────────────────────────
const onlineUsers = new Map(); // userId → socketId

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Register user
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`User registered: ${userId}`);
  });

  // Call request
  socket.on("call-user", ({ to, from, signal, callerName }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, signal, callerName });
    } else {
      socket.emit("call-failed", { message: "User is not online" });
    }
  });

  // Accept call
  socket.on("accept-call", ({ to, signal }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-accepted", { signal });
    }
  });

  // Reject call
  socket.on("reject-call", ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-rejected");
    }
  });

  // End call
  socket.on("end-call", ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-ended");
    }
  });

  // ICE candidate relay
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", { candidate });
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const DBURL = process.env.DB_URL;

if (!DBURL) {
  console.error("❌ DB_URL is not set in environment variables");
  process.exit(1);
}

mongoose
  .connect(DBURL)
  .then(() => {
    console.log("✅ MongoDB connected");
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });
