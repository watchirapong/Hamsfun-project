# Hamster Admin API Guide

คู่มือ API สำหรับ **Admin Dashboard** (Hamster Management)

**Base URL:** `/api/v1/admin`
**Authentication:** JWT Token + Admin Role Required

---

## 1. Authentication

### Header
```
Authorization: Bearer <JWT_TOKEN>
```

> **Note:** ผู้ใช้ต้องมี `isAdmin: true` ใน User model

---

## 2. Admin Stats

### 2.1 Get Dashboard Stats
**URL:** `GET /api/v1/admin/stats`
**Description:** ดึงข้อมูลสถิติสำหรับ Admin Dashboard

**Response:**
```json
{
  "totalHamsters": 25,
  "totalHamsterQuests": 10,
  "hamstersByRank": {
    "Enigma": 15,
    "Hamster": 7,
    "Ace": 2,
    "Admin": 1
  }
}
```

---

## 3. Hamster Management

### 3.1 Get All Hamsters
**URL:** `GET /api/v1/admin/hamsters`
**Description:** ดึงรายชื่อ Hamster ทั้งหมด

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `search` | String | ค้นหาด้วย Discord Username/Nickname |
| `rank` | String | กรองตาม Rank (Enigma, Hamster, Ace, Admin) |
| `limit` | Number | จำนวนที่ต้องการ (default: 50) |

**Response:**
```json
{
  "hamsters": [
    {
      "_id": "hamster123...",
      "userId": "user123...",
      "discordId": "123456789",
      "discordUsername": "PlayerOne",
      "discordNickname": "PlayerOneNick",
      "avatar": "https://cdn.discordapp.com/...",
      "hamsterRank": "Hamster",
      "activeQuests": [],
      "completedQuests": [],
      "stats": {
        "totalQuestsCompleted": 5,
        "totalSubmissions": 12
      }
    }
  ],
  "total": 25
}
```

### 3.2 Get Hamster by ID
**URL:** `GET /api/v1/admin/hamsters/:id`
**Description:** ดึงข้อมูล Hamster คนเดียว (รวม quests)

**Response:**
```json
{
  "_id": "hamster123...",
  "userId": "user123...",
  "discordId": "123456789",
  "discordUsername": "PlayerOne",
  "discordNickname": "PlayerOneNick",
  "hamsterRank": "Hamster",
  "activeQuests": [
    {
      "questId": "quest123...",
      "status": "Active",
      "acceptedAt": "2024-01-01T00:00:00.000Z",
      "subQuestsProgress": []
    }
  ],
  "completedQuests": []
}
```

### 3.3 Create Hamster
**URL:** `POST /api/v1/admin/hamsters`
**Description:** สร้าง Hamster ใหม่จาก User ที่มีอยู่

**Request Body:**
```json
{
  "userId": "user123...",
  "hamsterRank": "Enigma"
}
```

**Response:**
```json
{
  "_id": "hamster123...",
  "userId": "user123...",
  "hamsterRank": "Enigma",
  "activeQuests": [],
  "completedQuests": []
}
```

### 3.4 Update Hamster Rank
**URL:** `PATCH /api/v1/admin/hamsters/:id/rank`
**Description:** เปลี่ยน Rank ของ Hamster

**Request Body:**
```json
{
  "hamsterRank": "Ace"
}
```

**Hamster Rank Values:**
- `Enigma` - ระดับเริ่มต้น
- `Hamster` - ระดับกลาง
- `Ace` - ระดับสูง
- `Admin` - ระดับสูงสุด

**Response:**
```json
{
  "_id": "hamster123...",
  "hamsterRank": "Ace"
}
```

### 3.5 Delete Hamster
**URL:** `DELETE /api/v1/admin/hamsters/:id`
**Description:** ลบ Hamster (User ยังคงอยู่)

**Response:**
```json
{
  "message": "Hamster removed successfully"
}
```

### 3.6 Assign Quest to Hamster
**URL:** `POST /api/v1/admin/hamsters/:id/assign-quest`
**Description:** มอบหมาย Quest ให้ Hamster

**Request Body:**
```json
{
  "questId": "quest123..."
}
```

**Response:**
```json
{
  "message": "Quest assigned to hamster successfully",
  "hamster": { ... }
}
```

---

## 4. Hamster Quest Management

### 4.1 Get Hamster Quests
**URL:** `GET /api/v1/admin/hamster-quests`
**Description:** ดึงรายการ Quest สำหรับ Hamster

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `search` | String | ค้นหาด้วย title |
| `type` | String | กรองตามประเภท (Main, Special, Boss, etc.) |
| `limit` | Number | จำนวนที่ต้องการ |

**Response:**
```json
{
  "quests": [
    {
      "_id": "quest123...",
      "title": "Hamster Training",
      "description": "Complete the hamster training program",
      "type": "Main",
      "targetUserType": "hamster",
      "subQuests": [
        {
          "_id": "subquest123...",
          "title": "Step 1",
          "description": "Complete first step",
          "rewards": []
        }
      ],
      "completionRewards": []
    }
  ],
  "total": 10
}
```

### 4.2 Create Hamster Quest
**URL:** `POST /api/v1/admin/hamster-quests`
**Description:** สร้าง Quest ใหม่สำหรับ Hamster

**Request Body:**
```json
{
  "title": "New Hamster Quest",
  "description": "Quest description",
  "type": "Main",
  "subQuests": [
    {
      "title": "Sub Quest 1",
      "description": "Description",
      "rewards": [
        {
          "chance": 1,
          "entries": [
            {
              "type": "Coin",
              "minAmount": 100,
              "maxAmount": 100,
              "weight": 100
            }
          ]
        }
      ]
    }
  ],
  "completionRewards": []
}
```

**Quest Types:**
- `Main` - Quest หลัก
- `Special` - Quest พิเศษ
- `Boss` - Quest บอส
- `Challenge` - Quest ท้าทาย
- `Daily` - Quest รายวัน
- `Weekly` - Quest รายสัปดาห์
- `Monthly` - Quest รายเดือน

**Reward Types:**
- `Item` - ไอเทม (ต้องระบุ itemId)
- `Coin` - เหรียญ
- `RankPoint` - แต้ม Rank
- `BadgePoint` - แต้ม Badge (ต้องระบุ badgeCategory)
- `LeaderboardScore` - คะแนน Leaderboard
- `PetExp` - ค่าประสบการณ์ Pet

**Response:**
```json
{
  "_id": "quest123...",
  "title": "New Hamster Quest",
  "type": "Main",
  "targetUserType": "hamster"
}
```

### 4.3 Update Hamster Quest
**URL:** `PUT /api/v1/admin/hamster-quests/:id`
**Description:** แก้ไข Quest

**Request Body:** (Same as Create)

**Response:**
```json
{
  "_id": "quest123...",
  "title": "Updated Quest",
  "type": "Main"
}
```

### 4.4 Delete Hamster Quest
**URL:** `DELETE /api/v1/admin/hamster-quests/:id`
**Description:** ลบ Quest

**Response:**
```json
{
  "message": "Hamster quest deleted successfully"
}
```

---

## 5. User Activity Logs

### 5.1 Get User Activity
**URL:** `GET /api/v1/admin/users/:id/activity`
**Description:** ดึงประวัติกิจกรรมของ User

**Response:**
```json
{
  "activities": [
    {
      "date": "2024-01-01",
      "webSlots": [1, 2, 3],
      "discordVoiceSlots": [4, 5, 6]
    }
  ]
}
```

### 5.2 Get Activity Summary
**URL:** `GET /api/v1/admin/activity/summary`
**Description:** สรุปภาพรวมกิจกรรมทั้งหมด

---

## 6. Example Code (Frontend)

### JavaScript (React)
```javascript
// api/admin.js
import { request } from './client';

export async function getAdminStats() {
  return request('/admin/stats');
}

export async function getHamsters(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return request(`/admin/hamsters?${queryString}`);
}

export async function createHamster(data) {
  return request('/admin/hamsters', {
    method: 'POST',
    body: data,
  });
}

export async function updateHamsterRank(id, hamsterRank) {
  return request(`/admin/hamsters/${id}/rank`, {
    method: 'PATCH',
    body: { hamsterRank },
  });
}

export async function deleteHamster(id) {
  return request(`/admin/hamsters/${id}`, {
    method: 'DELETE',
  });
}

export async function assignQuestToHamster(hamsterId, questId) {
  return request(`/admin/hamsters/${hamsterId}/assign-quest`, {
    method: 'POST',
    body: { questId },
  });
}

export async function getHamsterQuests(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return request(`/admin/hamster-quests?${queryString}`);
}

export async function createHamsterQuest(data) {
  return request('/admin/hamster-quests', {
    method: 'POST',
    body: data,
  });
}

export async function updateHamsterQuest(id, data) {
  return request(`/admin/hamster-quests/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export async function deleteHamsterQuest(id) {
  return request(`/admin/hamster-quests/${id}`, {
    method: 'DELETE',
  });
}
```

---

## 7. Ball Currency Management (Admin)

### 7.1 Grant Ball to Hamster
**URL:** `POST /api/v1/admin/hamsters/:id/grant-ball`
**Description:** เพิ่ม Ball ให้ Hamster

**Request Body:**
```json
{
  "amount": 100,
  "reason": "Reward for completing task"
}
```

**Response:**
```json
{
  "message": "Granted 100 balls to hamster",
  "balls": 150,
  "ballHistory": [
    {
      "amount": 100,
      "reason": "Reward for completing task",
      "type": "grant",
      "adminId": "admin123...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 7.2 Deduct Ball from Hamster
**URL:** `POST /api/v1/admin/hamsters/:id/deduct-ball`
**Description:** ลด Ball จาก Hamster

**Request Body:**
```json
{
  "amount": 50,
  "reason": "Penalty for rule violation"
}
```

**Response:**
```json
{
  "message": "Deducted 50 balls from hamster",
  "balls": 100,
  "ballHistory": [...]
}
```

### 7.3 Get Ball Submissions
**URL:** `GET /api/v1/admin/ball-submissions`
**Description:** ดึงรายการ Ball Request ที่รออนุมัติ

**Query Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `status` | String | กรองตามสถานะ (Pending, Approved, Rejected) |
| `page` | Number | หน้าที่ต้องการ (default: 1) |
| `limit` | Number | จำนวนต่อหน้า (default: 20) |

**Response:**
```json
{
  "submissions": [
    {
      "_id": "submission123...",
      "userId": {
        "discordUsername": "PlayerOne",
        "discordNickname": "PlayerOneNick",
        "avatar": "https://cdn.discordapp.com/..."
      },
      "type": "Ball",
      "requestedAmount": 100,
      "reason": "Need balls for event participation",
      "imageProof": "/uploads/proof-123.jpg",
      "status": "Pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

### 7.4 Approve Ball Submission
**URL:** `PUT /api/v1/admin/ball-submissions/:id/approve`
**Description:** อนุมัติ Ball Request

**Request Body:**
```json
{
  "grantedAmount": 100
}
```

> **Note:** `grantedAmount` เป็น optional หากไม่ใส่จะใช้ `requestedAmount` ที่ Hamster ขอมา

**Response:**
```json
{
  "message": "Ball submission approved. Granted 100 balls.",
  "submission": {...},
  "hamsterBalls": 150
}
```

### 7.5 Reject Ball Submission
**URL:** `PUT /api/v1/admin/ball-submissions/:id/reject`
**Description:** ปฏิเสธ Ball Request

**Request Body:**
```json
{
  "feedback": "Insufficient justification for request"
}
```

**Response:**
```json
{
  "message": "Ball submission rejected",
  "submission": {...}
}
```

---

## 9. Team Management

### 9.1 Get All Teams
**URL:** `GET /api/v1/admin/teams`
**Description:** ดึงรายการ Team ทั้งหมด

**Response:**
```json
[
  {
    "_id": "team123...",
    "name": "Alpha Squad",
    "icon": "🔥",
    "memberCount": 5,
    "totalBalls": 500,
    "members": [
      {
        "_id": "hamster123...",
        "hamsterRank": "Ace",
        "balls": 100,
        "discordUsername": "PlayerOne",
        "discordNickname": "PlayerOneNick",
        "avatar": "https://..."
      }
    ]
  }
]
```

### 9.2 Create Team
**URL:** `POST /api/v1/admin/teams`
**Description:** สร้าง Team ใหม่

**Request Body:**
```json
{
  "name": "Alpha Squad",
  "icon": "🔥"
}
```

**Response:**
```json
{
  "_id": "team123...",
  "name": "Alpha Squad",
  "icon": "🔥",
  "members": []
}
```

### 9.3 Update Team
**URL:** `PUT /api/v1/admin/teams/:id`
**Description:** แก้ไข Team

**Request Body:**
```json
{
  "name": "Beta Squad",
  "icon": "⚡"
}
```

### 9.4 Delete Team
**URL:** `DELETE /api/v1/admin/teams/:id`
**Description:** ลบ Team

**Response:**
```json
{
  "message": "Team removed"
}
```

### 9.5 Add Member to Team
**URL:** `POST /api/v1/admin/teams/:id/members`
**Description:** เพิ่ม Hamster เข้า Team

**Request Body:**
```json
{
  "hamsterId": "hamster123..."
}
```

> **Note:** Hamster จะถูกลบออกจาก Team อื่นอัตโนมัติ (1 Hamster = 1 Team)

**Response:**
```json
{
  "message": "Member added to team",
  "team": {...}
}
```

### 9.6 Remove Member from Team
**URL:** `DELETE /api/v1/admin/teams/:id/members/:hamsterId`
**Description:** ลบ Hamster ออกจาก Team

**Response:**
```json
{
  "message": "Member removed from team",
  "team": {...}
}
```

---

## 10. Hamster Leaderboard

> **Note:** Leaderboard นี้ใช้สำหรับ **Hamster users เท่านั้น** - User ปกติจะใช้ Leaderboard มาตรฐาน

### 10.1 Get Hamster Leaderboard
**URL:** `GET /api/v1/leaderboard/hamster`
**Description:** ดึง Leaderboard สำหรับ Hamsters และ Teams (sorted by balls)
**Access:** Hamster Role Required

**Logic:**
1. ดึง Top Hamsters เรียงตาม `balls` (มากไปน้อย)
2. ดึง Teams พร้อมสมาชิก โดยรวม `totalBalls` จากสมาชิกทั้งหมด
3. เรียง Teams ตาม `totalBalls` (มากไปน้อย)

**Response:**
```json
{
  "hamsters": [
    {
      "_id": "hamster123...",
      "discordUsername": "PlayerOne",
      "discordNickname": "PlayerOneNick",
      "avatar": "https://cdn.discordapp.com/...",
      "hamsterRank": "Ace",
      "balls": 500
    }
  ],
  "teams": [
    {
      "_id": "team123...",
      "name": "Alpha Squad",
      "icon": "🔥",
      "memberCount": 5,
      "totalBalls": 1500,
      "avgBalls": 300,
      "members": [
        {
          "_id": "hamster123...",
          "discordNickname": "PlayerOneNick",
          "discordUsername": "PlayerOne",
          "avatar": "https://cdn.discordapp.com/...",
          "hamsterRank": "Ace",
          "balls": 500
        }
      ]
    }
  ]
}
```

**Field Descriptions:**

| Field | Description |
| :--- | :--- |
| `hamsters[].balls` | จำนวน Ball ของ Hamster (เรียงมากไปน้อย) |
| `teams[].totalBalls` | ผลรวม balls ของสมาชิกทุกคนใน Team |
| `teams[].avgBalls` | ค่าเฉลี่ย balls ต่อสมาชิก |
| `teams[].memberCount` | จำนวนสมาชิกใน Team |
| `teams[].members` | รายชื่อสมาชิก (เรียงตาม balls มากไปน้อย, แสดงบางส่วน) |

---

## 11. Logging

ทุก Admin Action จะถูก Log ไว้ใน Console:
```
[🔴 ADMIN] admin123 | CREATE_HAMSTER | userId=user123
[🔴 ADMIN] admin123 | UPDATE_HAMSTER_RANK | hamsterId=hamster123, newRank=Ace
[🔴 ADMIN] admin123 | ASSIGN_QUEST | hamsterId=hamster123, questId=quest123
[🔴 ADMIN] admin123 | GRANT_BALL | hamsterId=hamster123, amount=100
[🔴 ADMIN] admin123 | DEDUCT_BALL | hamsterId=hamster123, amount=50
[🔴 ADMIN] admin123 | APPROVE_BALL_SUBMISSION | submissionId=sub123
[🔴 ADMIN] admin123 | REJECT_BALL_SUBMISSION | submissionId=sub123
[🔴 ADMIN] admin123 | CREATE_TEAM | teamName=Alpha Squad
[🔴 ADMIN] admin123 | ADD_TEAM_MEMBER | teamName=Alpha Squad, hamsterUsername=PlayerOne
[🔴 ADMIN] admin123 | REMOVE_TEAM_MEMBER | teamName=Alpha Squad, hamsterUsername=PlayerOne
```

```
