# Hamster API Guide

คู่มือ API สำหรับผู้ใช้ที่เป็น **Hamster** (Users with `isHamster: true`)

**Base URL:** `/api/v1`
**Authentication:** JWT Token (Hamster Role Required)

---

## 1. Authentication

### Header
```
Authorization: Bearer <JWT_TOKEN>
```

> **Note:** ผู้ใช้ต้องมี `isHamster: true` ใน User model จึงจะใช้ Hamster APIs ได้

---

## 2. Hamster Profile (Self)

### 2.1 Get My Hamster Profile
**URL:** `GET /api/v1/hamsters/me`
**Description:** ดึงข้อมูล Hamster Profile ของตัวเอง

**Response:**
```json
{
  "_id": "hamster123...",
  "userId": "user123...",
  "discordId": "123456789",
  "discordUsername": "PlayerOne",
  "discordNickname": "PlayerOneNick",
  "avatar": "https://cdn.discordapp.com/...",
  "hamsterRank": "Enigma",
  "balls": 150,
  "leaderboardScore": 500,
  "activeQuests": [],
  "completedQuests": []
}
```

### 2.2 Get My Active Quests
**URL:** `GET /api/v1/hamsters/me/active-quests`
**Description:** ดึง Quest ที่กำลังทำอยู่

**Response:**
```json
[
  {
    "questId": {
      "_id": "quest123...",
      "title": "Hamster Training",
      "type": "Main",
      "icon": "https://pub-xxxx.r2.dev/items/quest.png"
    },
    "status": "Active",
    "acceptedAt": "2024-01-01T00:00:00.000Z",
    "subQuestsProgress": []
  }
]
```

### 2.3 Get My Completed Quests
**URL:** `GET /api/v1/hamsters/me/completed-quests`
**Description:** ดึง Quest ที่ทำสำเร็จแล้ว

**Response:**
```json
[
  {
    "questId": {
      "_id": "quest123...",
      "title": "Hamster Training",
      "type": "Main"
    },
    "status": "Completed",
    "completedAt": "2024-01-02T00:00:00.000Z"
  }
]
```

---

## 3. Ball Currency

### 3.1 Request Ball
**URL:** `POST /api/v1/hamsters/me/request-ball`
**Description:** ขอ Ball จาก Admin (Multipart/Form-Data)

**Request (Form Data):**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `amount` | Number | Yes | จำนวน Ball ที่ต้องการ |
| `reason` | String | Yes | เหตุผลในการขอ |
| `imageProof` | File | No | รูปหลักฐาน (optional) |

**Response:**
```json
{
  "message": "Ball request submitted successfully",
  "submission": {
    "_id": "submission123...",
    "type": "Ball",
    "requestedAmount": 100,
    "reason": "Need balls for event",
    "status": "Pending"
  }
}
```

> **Note:** Request จะต้องรอ Admin อนุมัติก่อนถึงจะได้รับ Ball

---

## 4. Hamster Leaderboard

### 4.1 Get Hamster Leaderboard
**URL:** `GET /api/v1/leaderboard/hamster`
**Description:** ดึง Leaderboard สำหรับ Hamsters และ Teams

**Response:**
```json
{
  "hamsters": [
    {
      "_id": "hamster123...",
      "discordUsername": "PlayerOne",
      "discordNickname": "PlayerOneNick",
      "avatar": "https://...",
      "hamsterRank": "Ace",
      "leaderboardScore": 500
    }
  ],
  "teams": [
    {
      "_id": "team123...",
      "name": "Alpha Squad",
      "icon": "🔥",
      "memberCount": 5,
      "totalScore": 1500,
      "avgScore": 300,
      "members": [
        {
          "_id": "hamster123...",
          "discordNickname": "PlayerOne",
          "hamsterRank": "Ace",
          "leaderboardScore": 500
        }
      ]
    }
  ]
}
```

---

## 5. Quest Submission (Hamster)

> [!IMPORTANT]
> Hamsters must use the **dedicated Hamster endpoint** for quest submissions. This ensures proper approval workflow without auto-approve.

### 5.1 Submit Quest (Hamster Only)
**URL:** `POST /api/v1/hamster/quests/:id/submit`
**Description:** Submit quest completion for Hamsters (Multipart/Form-Data)

**Request (Form Data):**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `description` | String | No | Additional description |
| `subQuestId` | String | No | ID of Sub-Quest |
| `imageProof` | File | No | Proof image |

**Response:**
```json
{
  "message": "Sub-quest submitted for review",
  "submission": {
    "_id": "submission123",
    "status": "Pending",
    "autoApprove": false
  }
}
```

### Hamster Quest Behavior

| Feature | Behavior |
|---------|----------|
| **Auto-Approve** | ❌ **Never** - ทุก submission ต้องรอ Star Master approve |
| **Immediate Rewards** | ❌ **Never** - Rewards จะ grant เมื่อ approve เท่านั้น |
| **Submission Status** | Always `Pending` |
| **Star Master Notification** | ✅ Always |

> [!CAUTION]
> **DO NOT use** `/api/v1/quests/:id/submit` for Hamster quests. That endpoint is for Regular Users only and may cause incorrect behavior.

**Quest Reward Types:**
- `Item` - Item rewards
- `Coin` - Coin rewards
- `RankPoint` - Rank points
- `BadgePoint` - Badge points
- `LeaderboardScore` - Leaderboard score
- `PetExp` - Pet experience points
- `Ball` - Ball currency (Hamster only)

---

## 6. User APIs (Shared)

Hamsters สามารถใช้ User APIs ทั้งหมดได้ด้วย:

| API | URL | Description |
|-----|-----|-------------|
| Get My Profile | `GET /api/v1/users/me` | ดึงข้อมูล User Profile |
| Get Inventory | `GET /api/v1/users/me/inventory` | ดึง Inventory |
| Use Item | `POST /api/v1/users/me/inventory/use` | ใช้ไอเทม |
| Get Active Quests | `GET /api/v1/users/me/active-quests` | Quest ที่กำลังทำ |
| Get Completed Quests | `GET /api/v1/users/me/completed-quests` | Quest ที่ทำสำเร็จ |
| Rank Up | `POST /api/v1/users/rank-up` | เลื่อนระดับ Rank |
| Get Shop | `GET /api/v1/shop/products` | ดูสินค้าในร้าน |
| Get Leaderboard | `GET /api/v1/leaderboard` | Leaderboard ปกติ |

> ดูรายละเอียดเพิ่มที่ **USER_API_GUIDE.md**

---

## 7. Member Quest System (Teams)
 
 ### 7.1 Leader Actions
 
 #### 7.1.1 Get Team Quests
 **URL:** `GET /api/v1/hamsters/team-quests`
 **Description:** ดู Team Quests ทั้งหมดที่ทีมของตนได้รับมอบหมาย
 
 #### 7.1.2 Create Member Quest (Assign Work)
 **URL:** `POST /api/v1/hamsters/team-quests/:id/member-quests`
 **Description:** สร้าง Member Quest ย่อยและมอบหมายให้สมาชิกในทีม
 
 **Request Body:**
 ```json
 {
   "title": "Design Logo",
   "description": "Create a logo for the team",
   "assignedTo": "hamsterId...",
   "deadline": "2024-01-01"
 }
 ```
 
 #### 7.1.3 Update Member Quest
 **URL:** `PUT /api/v1/hamsters/team-quests/:id/member-quests/:mqId`
 
 #### 7.1.4 Delete Member Quest
 **URL:** `DELETE /api/v1/hamsters/team-quests/:id/member-quests/:mqId`
 
 #### 7.1.5 Approve Member Quest Work
 **URL:** `PUT /api/v1/hamsters/team-quests/:id/member-quests/:mqId/approve`
 **Description:** อนุมัติงานที่สมาชิกส่งมา
 
 #### 7.1.6 Reject Member Quest Work
 **URL:** `PUT /api/v1/hamsters/team-quests/:id/member-quests/:mqId/reject`
 **Description:** สั่งแก้เกน (สามารถระบุ Note ได้)
 
 #### 7.1.7 Submit Team Quest (For Review)
 **URL:** `POST /api/v1/hamsters/team-quests/:id/submit`
 **Description:** ส่งงาน Team Quest ทั้งหมดให้ Admin/Manager ตรวจสอบ
 
 ---
 
 ### 7.2 Member Actions
 
 #### 7.2.1 Get My Member Quests
 **URL:** `GET /api/v1/hamsters/my-quests`
 **Description:** ดูรายการงานที่ได้รับมอบหมาย
 
 #### 7.2.2 Submit Member Quest Work
 **URL:** `POST /api/v1/hamsters/team-quests/:id/member-quests/:mqId/submit`
 **Description:** ส่งหลักฐานการทำงาน (รูปภาพ/ข้อความ)
 
 **Request (Form Data):**
 | Field | Type | Required | Description |
 | :--- | :--- | :--- | :--- |
 | `description` | String | No | รายละเอียดงานที่ทำ |
 | `imageProof` | File | No | รูปภาพหลักฐาน (Screenshot) |
 
 **Response:**
 ```json
 {
   "message": "Work submitted successfully",
   "memberQuest": { ...Updated Object... }
 }
 ```

 ---

 ### 7.3 SubQuest Actions
 
 #### 7.3.1 Submit SubQuest Work (Member)
 **URL:** `POST /api/v1/hamsters/team-quests/:id/member-quests/:mqId/sub-quests/:sqId/submit`
 **Description:** ส่งงาน SubQuest ย่อย
 
 #### 7.3.2 Approve SubQuest (Leader)
 **URL:** `PUT /api/v1/hamsters/team-quests/:id/member-quests/:mqId/sub-quests/:sqId/approve`
 
 #### 7.3.3 Reject SubQuest (Leader)
 **URL:** `PUT /api/v1/hamsters/team-quests/:id/member-quests/:mqId/sub-quests/:sqId/reject`

---

## 8. Example Code (Frontend)

### JavaScript (React)
```javascript
// api/hamster.js
import { request, requestFormData } from './client';

export async function getMyHamsterProfile() {
  return request('/hamsters/me');
}

export async function getMyActiveQuests() {
  return request('/hamsters/me/active-quests');
}

export async function getMyCompletedQuests() {
  return request('/hamsters/me/completed-quests');
}

export async function requestBall(amount, reason, imageProof) {
  const formData = new FormData();
  formData.append('amount', amount);
  formData.append('reason', reason);
  if (imageProof) formData.append('imageProof', imageProof);
  return requestFormData('/hamsters/me/request-ball', formData);
}

export async function getHamsterLeaderboard() {
  return request('/leaderboard/hamster');
}
```

---

## 8. WebSocket Events

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### Events (Receive)

#### `quest_updated`
เมื่อ Quest submission ได้รับการ Review

```json
{
  "type": "Quest",
  "status": "Approved",
  "questId": "65672...",
  "submissionId": "65673...",
  "grantedRewards": {
    "coins": 500,
    "rankPoints": 100,
    "leaderboardScore": 50,
    "badgePoints": { "GameDesign": 200 },
    "items": [
      { "name": "Golden Sword", "quantity": 1, "type": "Equipment" }
    ],
    "petExp": 150,
    "petLevelUps": [{ "level": 5 }],
    "balls": 10
  }
}
```

**grantedRewards Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `coins` | Number | Amount of Coins granted |
| `rankPoints` | Number | Amount of Rank Points granted |
| `leaderboardScore` | Number | Amount of Leaderboard Score granted |
| `badgePoints` | Object | Badge Points by category |
| `items` | Array | Items granted `[{ name, quantity, type }]` |
| `petExp` | Number | Pet EXP granted (optional) |
| `petLevelUps` | Array | Level ups that occurred (optional) |
| `balls` | Number | Balls granted - Hamster only (optional) |

#### `quest_assigned`
เมื่อได้รับ Quest ใหม่โดยอัตโนมัติ (เช่น หลังจากจบ Quest ก่อนหน้าใน Chain)

```json
{
  "type": "Quest",
  "questId": "65672...",
  "title": "New Quest Title"
}
```

#### `ball_request_updated`
เมื่อ Ball Request ได้รับการ Review

```json
{
  "type": "Ball",
  "status": "Approved",
  "grantedAmount": 100
}
```
