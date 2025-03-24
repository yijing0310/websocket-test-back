import express from "express";
import cors from "cors";
import db from "./utils/connect-mysql.js";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const httpServer = createServer();

const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
        callback(null, true);
    },
};
app.use(cors(corsOptions));

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});

let user = "";
let users = {};
io.of("/chat").on("connection", (socket) => {
    socket.on("userId", (id) => {
        user = id;
    });
    socket.emit("sysmsg", `使用者加入聊天室`);

    socket.on("join_room", (room) => {
        socket.join(room); // 用戶加入房間
        console.log(`USER ${user} : 進入房間: ${room}`);
        // socket.broadcast.to(room).emit("message", `你已經加入了房間: ${room}`);
    });

    // 發送訊息
    socket.on("send_message", async (messageData) => {
        console.log("messageData", messageData);
        const { sender_id, chat_id, message } = messageData;
        try {
            // 將訊息插入到 messages 表中
            const sql = `INSERT INTO messages (chat_id, sender_id, message) VALUES (?, ?, ?)`;
            const [result] = await db.query(sql, [chat_id, sender_id, message]);

            if (result.affectedRows > 0) {
                console.log("訊息發送成功並儲存");
            } else {
                console.error("訊息發送失敗");
            }
        } catch (err) {
            console.error(err, "內部伺服器錯誤");
        }
        // socket.broadcast.emit("receive_message_broadcsts", messageData);
        if (chat_id) {
            console.log(chat_id);

            socket.to(chat_id).emit("receive_message_chat", messageData);
            console.log("receive_message", messageData);
        } else {
            if (users[sender_id]) {
                io.to(users[sender_id]).emit("receive_message_sender", messageData);
            }
        }
    });

    // 當用戶斷開連接時
    socket.on("disconnect", () => {
        console.log("user disconnected: " + socket.id);
    });
});

/* ***********設定404在所有路由後************ */
app.use((req, res) => {
    res.status(404).send("404 - 找不到網頁");
});

/* ***********設定監聽頻道************ */

httpServer.listen(3006, function () {
    console.log(`伺服器已啟動....端口${3006}監聽中`);
});
