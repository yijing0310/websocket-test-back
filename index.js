import express from "express";
import cors from "cors";
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

io.on("connection", (socket) => {
    console.log(socket.id, " user connected");

    // 監聽來自用戶的訊息
    socket.on("message", (msg) => {
        console.log("message: " + msg);
        // 廣播訊息給所有連接的用戶
        // io.emit("message", msg);
        socket.broadcast.emit(
            "message",
            JSON.stringify({
                user: socket.id,
                message: msg,
            })
        );
    });
    socket.on("userid", (msg) => {
        console.log("message: " + msg);
        // 廣播訊息給所有連接的用戶
        // io.emit("message", msg);
        socket.broadcast.emit(
            "message",
            JSON.stringify({
                user: socket.id,
                message: msg,
            })
        );
    });

    // 當用戶斷開連接時
    socket.on("disconnect", () => {
        console.log("user disconnected");
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
