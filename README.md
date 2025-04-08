# GYMBOO - GYM步空間

這是一個全面的健身房網站系統，旨在提供健身愛好者一個便捷的在線平台。用戶可以在這裡預約健身課程、租借健身產品、與其他用戶加為好友，並通過即時聊天室進行交流。專案由三個主要部分組成：前端界面、後端 API、以及即時聊天室後端。整個系統基於現代的技術架構，提供用戶優質的服務。

- **前端**：[Gym Next](https://github.com/Owenonroad1014/gym-next)
- **後端**：[Gym Backend](https://github.com/Owenonroad1014/gym-backend)
- **聊天室後端**：[WebSocket Test](https://github.com/yijing0310/websocket-test-back)

## 專案架構

### 1. 前端 (`gym-next`)

- **技術棧**：Next.js, React
- **功能描述**：
  - 前端使用 Next.js 框架來實現用戶界面。
  - 前端與後端進行 API 請求交互，顯示來自後端的數據（如用戶資料等）。
  - 使用 WebSocket 技術實現與聊天室後端的即時通訊功能，用戶能夠在此平台上進行即時聊天。
  
  **運行端口**：`3000`

---

### 2. 後端 (`gym-backend`)

- **技術棧**：Node.js, Express
- **功能描述**：
  - 後端提供 RESTful API，處理來自前端的請求，並返回數據（如用戶資料等）。
  - 使用 Express 框架來管理路由和中介軟體，處理各種 HTTP 請求。
  - 連接到 `gymboo_database` 資料庫，存儲用戶資料、健身數據等信息。

  **運行端口**：`3005`

---

### 3. 聊天室後端 (`websocket-test-back`)

- **技術棧**：Socket.io
- **功能描述**：
  - 聊天室後端使用 Socket.io 來實現實時雙向通訊。
  - 處理聊天室訊息的接收和發送，用戶可以通過 WebSocket 與其他用戶進行即時聊天。

  **運行端口**：`3006`



## 安裝與運行

### 1. 配置資料庫

在開始之前，你需要創建資料庫。請按照以下步驟操作：

- 將在前端的 `database` 資料夾裡的 `gymboo_database.sql`文件中的資料庫數據導入資料庫(MySQL)。

### 2. 安裝前端

1. 克隆前端專案：

   ```bash
   git clone https://github.com/Owenonroad1014/gym-next.git
   cd gym-next
    ```
2. 安裝依賴項目：
     ```bash
     npm install
    ```
3. 運行前端專案：
    ```bash
    npm run dev
    ```
預設情況下，前端將會運行在 http://localhost:3000。

### 3. 安裝後端

1. 克隆後端專案：

   ```bash
   git clone https://github.com/Owenonroad1014/gym-backend.git
   cd gym-backend
    ```
2. 安裝依賴項目：
     ```bash
     npm install
    ```
3. 運行後端專案：
    ```bash
    npm run dev
    ```
預設情況下，後端將會運行在 http://localhost:3005。

### 4. 聊天室後端

1. 克隆聊天室後端專案：

   ```bash
    git clone https://github.com/yijing0310/websocket-test-back.git
    cd websocket-test-back
    ```
2. 安裝依賴項目：
     ```bash
     npm install
    ```
3. 運行聊天室後端專案：
    ```bash
    npm run dev
    ```
預設情況下，聊天室後端將會運行在 http://localhost:3006。


### 5. 完成開發環境
完成以上步驟後，你的開發環境應該已經搭建好，並且三個服務（前端、後端、聊天室後端）都應該能夠在本地運行。

