import express from "express";
import cors from "cors";
import db from "./utils/connect-mysql.js";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app); // 傳入 app 給 createServer

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

// 用於存儲用戶與 socket 的對應關係
let users = {};
// 用於存儲用戶所在的房間
let userRooms = {};

io.of("/chat").on("connection", (socket) => {
    console.log("新用戶連接，socket ID:", socket.id);
    let nowuserId;
    // 處理用戶 ID
    socket.on("userId", (id) => {
        // 記錄用戶的 socket ID
        nowuserId = id;
        users[id] = socket.id;
        console.log(`用戶 ${id} 連接，socket ID: ${socket.id}`);

        // 發送連接成功消息
        socket.emit("sysmsg", `使用者已連接到聊天系統`);
    });

    // 加入房間
    socket.on("join_room", (room) => {
        // 轉換為字符串確保相容性
        const roomId = String(room);
        socket.join(roomId);

        // 記錄這個 socket 在哪個房間
        userRooms[socket.id] = roomId;

        console.log(`Socket ${socket.id} 進入房間: ${roomId}`);

        // 通知用戶成功加入房間
        socket.emit("room_joined", {
            room: roomId,
            message: `已加入聊天室: ${roomId}`,
        });

        const fetchRead = async () => {
            try {
                // 確認聊天訊息和聊天室
                const sqlchat = `
                    SELECT messages.id 
                    FROM messages 
                    LEFT JOIN chats ON messages.chat_id = chats.id 
                    WHERE chat_id = ? AND sender_id != ? AND messages.is_read = 0
                `;
                const [messages] = await db.query(sqlchat, [roomId, nowuserId]);

                if (messages.length > 0) {
                    const messageIds = messages.map((msg) => msg.id);

                    // 將更新已讀訊息
                    const updateSql = `
                        UPDATE messages 
                        SET is_read = 1 
                        WHERE id IN (?) AND chat_id = ? AND sender_id != ?
                    `;
                    const [result] = await db.query(updateSql, [
                        messageIds,
                        roomId,
                        nowuserId,
                    ]);

                    if (result.affectedRows > 0) {
                        console.log("已讀訊息成功");

                        // 通知聊天室內的所有用戶訊息已讀
                        io.of("/chat").to(roomId).emit("messageRead", {
                            messageIds,
                            userId: nowuserId,
                        });
                    } else {
                        console.log("已讀訊息失敗");
                    }
                }
            } catch (err) {
                console.error("資料庫錯誤:", err);
            }
        };

        fetchRead();
    });

    // 離開房間
    socket.on("leave_room", (room) => {
        const roomId = String(room);
        socket.leave(roomId);
        console.log(`Socket ${socket.id} 離開房間: ${roomId}`);

        // 移除房間記錄
        if (userRooms[socket.id] === roomId) {
            delete userRooms[socket.id];
        }
    });

    // 離開所有房間
    socket.on("leave_all_rooms", () => {
        // 獲取 socket 加入的所有房間
        const rooms = Array.from(socket.rooms);

        // 第一個房間是 socket 自己的 ID，從索引 1 開始才是真正加入的房間
        for (let i = 1; i < rooms.length; i++) {
            const roomId = rooms[i];
            socket.leave(roomId);
            console.log(`Socket ${socket.id} 離開房間: ${roomId}`);
        }

        // 清除房間記錄
        delete userRooms[socket.id];
    });

    // 發送訊息
    socket.on("send_message", async (messageData) => {
        console.log("接收到訊息數據:", messageData);

        const { sender_id, chat_id, message } = messageData;

        if (!chat_id) {
            console.error("缺少聊天室 ID");
            socket.emit("error_message", "缺少聊天室 ID");
            return;
        }

        try {
            // 將訊息插入到 messages 表中
            const sql = `INSERT INTO messages (chat_id, sender_id, message, is_read) VALUES (?, ?, ?, 0)`;
            const [result] = await db.query(sql, [chat_id, sender_id, message]);

            if (result.affectedRows > 0) {
                console.log("訊息成功儲存到資料庫");

                // 轉換為字符串以確保相容性
                const roomId = String(chat_id);

                // 獲取聊天室中的其他用戶
                const room = io.of("/chat").adapter.rooms.get(roomId);
                const otherUsers = Array.from(room || []).filter(
                    (id) => id !== socket.id
                );

                // 檢查是否有其他用戶在聊天室中
                const hasOtherUsers = otherUsers.length > 0;

                // 如果有其他用戶在聊天室中，立即將訊息標記為已讀
                if (hasOtherUsers) {
                    // 更新資料庫中的已讀狀態
                    const updateQuery = `
                        UPDATE messages 
                        SET is_read = 1 
                        WHERE id = ? AND chat_id = ? AND sender_id != ?
                    `;
                    await db.query(updateQuery, [
                        result.insertId,
                        chat_id,
                        sender_id,
                    ]);

                    // 獲取更新後的未讀數量
                    const unreadQuery = `
                        SELECT COUNT(*) as unread_count 
                        FROM messages 
                        WHERE chat_id = ? AND sender_id != ? AND is_read = 0
                    `;
                    const [unreadResult] = await db.query(unreadQuery, [
                        chat_id,
                        sender_id,
                    ]);
                    const unreadCount = unreadResult[0].unread_count;

                    // 通知所有用戶訊息已讀
                    io.of("/chat")
                        .to(roomId)
                        .emit("messageRead", {
                            messageIds: [result.insertId],
                            userId: otherUsers[0], // 使用第一個在聊天室中的用戶ID
                        });

                    // 通知所有相關用戶更新未讀數量
                    io.of("/chat").emit("unread_update", {
                        chat_id,
                        unread_count: unreadCount,
                    });
                }

                // 向所有在該房間的用戶廣播消息（包括發送者）
                io.of("/chat")
                    .to(roomId)
                    .emit("receive_message_chat", {
                        ...messageData,
                        id: result.insertId,
                        is_read: hasOtherUsers ? 1 : 0, // 如果有其他用戶在聊天室中，設置為已讀
                    });

                console.log(`訊息已廣播至房間 ${roomId} 的所有成員`);
            } else {
                console.error("訊息儲存失敗");
                socket.emit("error_message", "訊息發送失敗");
            }
        } catch (err) {
            console.error("資料庫錯誤:", err);
            socket.emit("error_message", "伺服器內部錯誤");
        }
    });

    // 處理訊息已讀
    socket.on("markAsRead", async ({ messageIds, chat_id, userId }) => {
        try {
            console.log("收到已讀請求:", { messageIds, chat_id, userId });

            // 檢查用戶是否在指定的聊天室中
            const userSocketId = users[userId];
            if (!userSocketId || userRooms[userSocketId] !== String(chat_id)) {
                console.log(
                    `用戶 ${userId} 不在聊天室 ${chat_id} 中，忽略已讀請求`
                );
                return;
            }

            // 更新資料庫中的已讀狀態
            const updateQuery = `
            UPDATE messages 
            SET is_read = 1 
            WHERE id IN (?) AND chat_id = ? AND sender_id != ?
            `;

            await db.query(updateQuery, [messageIds, chat_id, userId]);

            // 獲取更新後的未讀數量
            const unreadQuery = `
            SELECT COUNT(*) as unread_count 
            FROM messages 
            WHERE chat_id = ? AND sender_id != ? AND is_read = 0
            `;
            const [unreadResult] = await db.query(unreadQuery, [
                chat_id,
                userId,
            ]);
            const unreadCount = unreadResult[0].unread_count;

            // 通知聊天室內的所有用戶訊息已讀
            io.of("/chat").to(String(chat_id)).emit("messageRead", {
                messageIds,
                userId,
            });

            // 通知所有相關用戶更新未讀數量
            io.of("/chat").emit("unread_update", {
                chat_id,
                unread_count: unreadCount,
            });

            console.log(
                `訊息 ${messageIds} 已被用戶 ${userId} 標記為已讀，未讀數量: ${unreadCount}`
            );
        } catch (error) {
            console.error("更新已讀狀態時發生錯誤:", error);
            socket.emit("error_message", "更新已讀狀態失敗");
        }
    });

    // 當用戶斷開連接時
    socket.on("disconnect", () => {
        console.log("用戶斷開連接, socket ID:", socket.id);

        // 清理用戶資料
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }

        // 清理房間資料
        delete userRooms[socket.id];
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
