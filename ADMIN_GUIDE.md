# HamsterWorld API Guide

เอกสารนี้สรุปรายละเอียด API ทั้งหมดสำหรับ HamsterWorldServer โดยแบ่งตามหมวดหมู่การใช้งาน
**Base URL:** `/api/v1` (ยกเว้น Auth)

---

## 1. Authentication (ระบบ Login)

### 1.1 Discord Login
**URL:** `GET /auth/discord`
**Description:** เริ่มต้นกระบวนการ Login ผ่าน Discord

| Query Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `redirectUri` | String | No | URL ที่ต้องการให้ Redirect กลับไปหลัง Login สำเร็จ |

### 1.2 Handover
**URL:** `GET /auth/handover`
**Description:** จุดส่งต่อ Token กลับไปยัง Client (Frontend)

| Query Parameter | Type | Description |
| :--- | :--- | :--- |
| `token` | String | JWT Token สำหรับใช้งาน API |
| `error` | String | ข้อความ Error (ถ้ามี) |
| `redirectUri` | String | URL ปลายทาง |

---

## 2. User APIs
**Header:** `Authorization: Bearer <TOKEN>`

### 2.1 Get My Profile
**URL:** `GET /api/v1/users/me`
**Description:** ดึงข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบัน

**Response Properties:**
| Property | Type | Description |
| :--- | :--- | :--- |
| `_id` | String | User ID |
| `discordUsername` | String | Username (from Discord) |
| `discordNickname` | String | Nickname (from Discord Guild) |
| `discordId` | String | Discord User ID |
| `coins` | Number | จำนวนเหรียญที่มี |
| `rank` | Object | ข้อมูล Rank |
| `badges` | Object | ข้อมูล Badges |

**Response Example:**
```json
{
  "_id": "6566f...",
  "discordUsername": "PlayerOne",
  "discordNickname": "PlayerOneNick",
  "discordId": "123456789",
  "coins": 100,
  "rank": {
    "currentTier": "Meteor I",
    "points": 50,
    "maxPoints": 200,
    "nextRank": "Meteor II",
    "nextRankPoints": 200
  },
  "badges": {
    "GameDesign": {
      "rank": "Unranked",
      "points": 0,
      "maxPoints": 2000,
      "nextRank": "Bronze",
      "nextRankPoints": 2000
    }
  },
  "inventory": [],
  "activeQuests": []
}
```

### 2.2 Get My Inventory
**URL:** `GET /api/v1/users/me/inventory`
**Description:** ดึงข้อมูลไอเทมในกระเป๋า

**Response Example:**
```json
[
  {
    "_id": "65670...",
    "itemId": {
      "_id": "6566e...",
      "name": "Health Potion",
      "description": "Restores 50 HP",
      "type": "NormalItem"
    },
    "kind": "Stackable",
    "quantity": 5,
    "acquiredAt": "2023-11-29T10:00:00.000Z"
  }
]
```

### 2.3 Use Item
**URL:** `POST /api/v1/users/me/inventory/use`
**Description:** ใช้งานไอเทม

**Request Properties:**
| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `inventoryItemId` | String | Yes | `_id` ของ item ใน inventory array (ไม่ใช่ `itemId`) |
| `dojoId` | String | No | จำเป็นต้องใส่ถ้าใช้ Ticket |

**Request Example:**
```json
{
  "inventoryItemId": "65670...",
  "dojoId": "65671..."
}
```

**Response Example:**
```json
{
  "message": "Item used",
  "item": {
    "_id": "65670...",
    "quantity": 4,
    "kind": "Stackable"
  }
}
```

### 2.4 Get Active Quests
**URL:** `GET /api/v1/users/me/active-quests`
**Description:** ดึงเควสที่กำลังทำอยู่

**Response Example:**
```json
[
  {
    "questId": {
      "_id": "65672...",
      "title": "Daily Login",
      "type": "Daily",
      "icon": "/images/daily.png"
    },
    "subQuestsProgress": [],
    "isCompleted": false,
    "status": "Active",
    "submissionStatus": "Active"
  }
]
```

### 2.5 Rank Up
**URL:** `POST /api/v1/users/rank-up`
**Description:** เลื่อนระดับ Rank เมื่อแต้มครบ

**Response Example:**
```json
{
  "message": "Ranked up to Meteor II!",
  "newRank": "Meteor II",
  "maxPoints": 400,
  "points": 0
}
```

---

## 3. Quest APIs

### 3.1 Get All Quests
**URL:** `GET /api/v1/quests`
**Description:** ดึงข้อมูลเควสทั้งหมด

**Response Example:**
```json
[
  {
    "_id": "65672...",
    "title": "Welcome Quest",
    "description": "Say hello to the community",
    "type": "Main",
    "subQuests": [],
    "completionRewards": []
  }
]
```

### 3.2 Submit Quest
**URL:** `POST /api/v1/quests/:id/submit`
**Description:** ส่งงานเควส (Multipart/Form-Data)

**Request Properties (Form Data):**
| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `description` | String | No | ข้อความอธิบายเพิ่มเติม |
| `subQuestId` | String | No | ID ของ Sub-Quest (ถ้าไม่ใส่ = Main Quest) |
| `imageProof` | File | No | ไฟล์รูปภาพหลักฐาน |

**Response Example:**
```json
{
  "message": "Sub-quest submitted and completed",
  "submission": {
    "_id": "65673...",
    "status": "Pending",
    "imageProof": "/images/proof-123.jpg"
  },
  "grantedRewards": {
    "coins": 100,
    "rankPoints": 50
  }
}
```

---

## 4. Dojo APIs

### 4.1 Get Dojos
**URL:** `GET /api/v1/dojos`
**Description:** ดึงรายชื่อ Dojo ทั้งหมด

**Response Example:**
```json
[
  {
    "_id": "65674...",
    "name": "Fire Dojo",
    "status": "Prepare",
    "whitelist": []
  }
]
```

### 4.2 Get Dojo Status
**URL:** `GET /api/v1/dojos/:id/status`
**Description:** เช็คสิทธิ์การเข้า Dojo

**Response Example:**
```json
{
  "dojoId": "65674...",
  "name": "Fire Dojo",
  "access": "Granted"
}
```

---

## 5. Item APIs

### 5.1 Get Items
**URL:** `GET /api/v1/items`
**Description:** ดึงรายชื่อ Item ทั้งหมด

**Response Example:**
```json
{
  "message": "success",
  "data": [
    {
      "_id": "6566e...",
      "name": "Health Potion",
      "type": "Consumable"
    }
  ]
}
```

### 5.2 Create Item
**URL:** `POST /api/v1/items`
**Description:** สร้างไอเทมใหม่

**Request Properties:**
| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Yes | ชื่อไอเทม |
| `description` | String | No | รายละเอียด |
| `type` | String | No | ประเภท (Default: Other) |

**Request Example:**
```json
{
  "name": "Magic Stone",
  "description": "A stone with magical power",
  "type": "NormalItem"
}
```

**Response Example:**
```json
{
  "message": "success",
  "data": {
    "_id": "65675...",
    "name": "Magic Stone",
    "type": "NormalItem"
  }
}
```

---

## 6. Leaderboard APIs

### 6.1 Get Leaderboard
**URL:** `GET /api/v1/leaderboard`
**Description:** ดึงข้อมูลจัดอันดับ

**Response Example:**
```json
{
  "users": [
    {
      "discordUsername": "TopPlayer",
      "discordNickname": "TopPlayerNick",
      "leaderboardScore": 5000,
      "rank": { "currentTier": "Star I" }
    }
  ],
  "houses": [
    {
      "_id": "65676...",
      "name": "House of Valor",
      "score": 15000,
      "memberCount": 10,
      "members": [
        {
           "discordUsername": "Member1",
           "leaderboardScore": 1000
        }
      ]
    }
  ]
}
```

---

## 7. Admin APIs (Require Admin Role)

### 7.1 Create Quest
**URL:** `POST /api/v1/admin/quests`
**Description:** สร้างเควสใหม่ (Multipart/Form-Data)

**Request Properties (Form Data):**
| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | ชื่อเควส |
| `type` | String | Yes | ประเภท (Main, Daily, Weekly, Special) |
| `description` | String | No | รายละเอียด |
| `icon` | File | No | รูปไอคอน |
| `subQuests` | JSON String | No | Array ของ Sub-Quests |
| `completionRewards` | JSON String | No | Array ของ Rewards |

**Response Example:**
```json
{
  "_id": "65677...",
  "title": "New Adventure",
  "type": "Main"
}
```

### 7.2 Assign Quest to User
**URL:** `POST /api/v1/admin/users/:userId/quests`
**Description:** มอบหมายเควสให้ผู้ใช้

**Request Example:**
```json
{
  "questId": "65677..."
}
```

**Response Example:**
```json
{
  "message": "Quest assigned",
  "activeQuests": [ ... ]
}
```

### 7.3 Get Submissions
**URL:** `GET /api/v1/admin/submissions`
**Description:** ดูรายการส่งงานที่รออนุมัติ

**Response Example:**
```json
[
  {
    "_id": "65673...",
    "type": "Quest",
    "status": "Pending",
    "user": { "discordUsername": "PlayerOne" },
    "questId": { "title": "Welcome Quest" },
    "subQuestTitle": "Say Hello"
  }
]
```

### 7.4 Approve Submission
**URL:** `PUT /api/v1/admin/submissions/:id/approve`
**Description:** อนุมัติการส่งงาน

**Response Example:**
```json
{ "message": "Submission approved" }
```

### 7.5 Grant Item
**URL:** `POST /api/v1/admin/users/:userId/grant-item`
**Description:** เสกไอเทมให้ผู้ใช้

**Request Example:**
```json
{
  "itemId": "6566e...",
  "quantity": 5
}
```

**Response Example:**
```json
{
  "message": "Item granted",
  "inventory": [ ... ]
}
```

### 7.6 Grant Badge Points
**URL:** `POST /api/v1/admin/users/:userId/grant-badge`
**Description:** เพิ่มแต้ม Badge

**Request Example:**
```json
{
  "badgeCategory": "GameDesign",
  "points": 100
}
```

**Response Example:**
```json
{
  "message": "Badge points granted",
  "badges": { ... }
}
```

### 7.7 Create House
**URL:** `POST /api/v1/admin/houses`
**Description:** สร้างบ้านใหม่

**Request Example:**
```json
{
  "name": "House of Wisdom",
  "discordRoleId": "987654321"
}
```

**Response Example:**
```json
{
  "_id": "65678...",
  "name": "House of Wisdom",
  "discordRoleId": "987654321"
}
```
