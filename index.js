import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { log } from "console";

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

let users = {};
io.on("connection", (socket) => {
    socket.emit("sysmsg", `${socket.id}歡迎加入聊天室`);
    socket.on("chatMessage", (msg) => {
        console.log("message", msg);
        socket.broadcast.emit("chatMessage", msg);
    });

    socket.on("set_username", (username) => {
        users[username] = socket.id;
    });
    socket.on("join_room", (room) => {
        console.log(`${socket.id} 進入房間: ${room}`);
        socket.join(room); // 用戶加入房間
        socket.emit("message", `你已經加入了房間: ${room}`);
    });

    // 發送訊息
    socket.on('send_message', (messageData) => {
        console.log("messageData", messageData);
        const {sender_id,chat_id,message} = messageData;
        if(chat_id){
            io.to(chat_id).emit('receive_message', messageData);
        }else{
            if(users[sender_id]){
                io.to(users[sender_id]).emit('receive_message', messageData);
        }
    }}) 
    // 1 . 儲存到資料庫
    // 2. 發送給所有在同一個房間的用戶
    // 監聽來自用戶的訊息
    // socket.on("message", (msg) => {
    //     console.log("message: " + msg);
    //     // 廣播訊息給所有連接的用戶
    //     // io.emit("message", msg);
    //     socket.broadcast.emit(
    //         "message",
    //         JSON.stringify({
    //             user: socket.id,
    //             message: msg,
    //         })
    //     );
    // });
    // socket.on("userid", (msg) => {
    //     console.log("message: " + msg);
    //     // 廣播訊息給所有連接的用戶
    //     // io.emit("message", msg);
    //     socket.broadcast.emit(
    //         "message",
    //         JSON.stringify({
    //             user: socket.id,
    //             message: msg,
    //         })
    //     );
    // });
    // 當用戶斷開連接時
    // socket.on("disconnect", () => {
    //     console.log("user disconnected");
    // });
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
