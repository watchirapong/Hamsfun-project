# HamsterWorld User API Guide

This guide details the public API endpoints available for users and external applications integrating with HamsterWorldServer.

**Base URL:** `/api/v1` (except Auth routes)

---

## 1. Authentication

### 1.1 Discord Login
**URL:** `GET /auth/discord`
**Description:** Initiates the Discord OAuth2 login flow.

| Query Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `redirectUri` | String | No | The URL to redirect back to after successful login. |

### 1.2 Handover
**URL:** `GET /auth/handover`
**Description:** The final destination of the auth flow where the token is passed back to the client.

| Query Parameter | Type | Description |
| :--- | :--- | :--- |
| `token` | String | JWT Token for API authentication. |
| `error` | String | Error message (if any). |
| `redirectUri` | String | The original redirect URI. |

---

## 2. User Profile
**Header:** `Authorization: Bearer <TOKEN>`

### 2.1 Get My Profile
**URL:** `GET /api/v1/users/me`
**Description:** Retrieves the current user's profile.

**Response Structure:**
```json
{
  "_id": "String (User ID)",
  "discordUsername": "String",
  "discordNickname": "String",
  "discordId": "String",
  "avatar": "String (URL)",
  "coins": "Number",
  "rank": {
    "currentTier": "String (e.g., 'Meteor I')",
    "points": "Number",
    "maxPoints": "Number (Points needed for next rank)",
    "nextRank": "String (Name of next rank) or null",
    "nextRankPoints": "Number (Max points of next rank) or null"
  },
  "badges": {
    "[BadgeCategory]": {
      "rank": "String (e.g., 'Bronze', 'Unranked')",
      "points": "Number",
      "maxPoints": "Number (Points needed for next badge rank)",
      "nextRank": "String or null",
      "nextRankPoints": "Number or null"
    }
  },
  "inventory": [
    {
      "_id": "String (Inventory Item ID)",
      "itemId": {
        "_id": "String (Item ID)",
        "name": "String",
        "icon": "String (URL)",
        "description": "String",
        "type": "String (e.g., 'NormalItem', 'TicketItem', 'ExpItem')"
      },
      "quantity": "Number",
      "kind": "String (e.g., 'Stackable', 'Ticket')",
      "status": "String (e.g., 'Unused', 'Approving') - for Tickets",
      "instanceId": "String (Unique ID for Ticket instance)",
      "acquiredAt": "Date String"
    }
  ],
  "activeQuests": [
    {
      "questId": {
        "_id": "String (Quest ID)",
        "title": "String",
        "type": "String",
        "icon": "String (URL)"
      },
      "subQuestsProgress": [
        {
          "subQuestId": "String",
          "status": "String ('Pending', 'Completed')",
          "rewardsClaimed": "Boolean"
        }
      ],
      "isCompleted": "Boolean",
      "acceptedAt": "Date String",
      "status": "String ('Active', 'Pending')",
      "submissionStatus": "String ('Active', 'Pending', 'Completed')"
    }
  ],
  "roles": [
    {
      "id": "String (Discord Role ID)",
      "name": "String",
      "color": "Number (Integer color code)"
    }
  ],
  "dailyShop": {
    "maxItem": "Number",
    "items": [
      {
        "item": "String (Item ID)",
        "price": "Number",
        "stock": "Number"
      }
    ]
  },
  "createdAt": "Date String",
  "updatedAt": "Date String"
}
```

### 2.2 Get User Profile by ID
**URL:** `GET /api/v1/users/:id`
**Description:** Retrieves a specific user's public profile.

**Response Structure:**
Same as **Get My Profile**, but excludes sensitive fields:
- `discordId`
- `email`
- `inventory`
- `activeQuests`
- `roles`

### 2.3 Get My Inventory
**URL:** `GET /api/v1/users/me/inventory`
**Description:** Retrieves the current user's inventory.

**Response Structure:**
Array of Inventory Objects (see `inventory` field in **Get My Profile**).

### 2.4 Use Item
**URL:** `POST /api/v1/users/me/inventory/use`
**Description:** Consumes an item from the inventory.

**Request Body:**
```json
{
  "inventoryItemId": "String (Required) - The _id of the item inside the inventory array",
  "dojoId": "String (Optional) - Required if the item is a Ticket"
}
```

**Response Structure:**
```json
{
  "message": "String",
  "item": {
    "_id": "String (Inventory Item ID)",
    "quantity": "Number (Remaining quantity)",
    "status": "String (Updated status)"
  }
}
```

> [!NOTE]
> **Item Types & Effects:**
> - **Stackable / Consumable:** Quantity decreases by 1. Effect is applied immediately.
> - **Ticket:** Status changes to 'Approving'. A TicketSubmission is created.
> - **QuestItem:** Grants the associated Quest to the user.
>   - If the user already has the quest (Active/Completed), it returns an error.
>   - If successful, the item is consumed (Quantity - 1) and the quest is added to `activeQuests`.

### 2.5 Get Active Quests
**URL:** `GET /api/v1/users/me/active-quests`
**Description:** Retrieves quests currently in progress.

**Response Structure:**
Array of Active Quest Objects (see `activeQuests` field in **Get My Profile**).

### 2.6 Get Completed Quests
**URL:** `GET /api/v1/users/me/completed-quests`
**Description:** Retrieves a history of completed quests.

**Response Structure:**
```json
[
  {
    "questId": {
      "_id": "String",
      "title": "String",
      "icon": "String",
      "type": "String"
    },
    "acceptedAt": "Date String",
    "completedAt": "Date String"
  }
]
```

### 2.7 Rank Up
**URL:** `POST /api/v1/users/rank-up`
**Description:** Attempts to rank up the user if they have enough points.

**Response Structure:**
```json
{
  "message": "String",
  "newRank": "String",
  "maxPoints": "Number",
  "points": "Number"
}
```

---

## 3. Quests
**Header:** `Authorization: Bearer <TOKEN>`

### 3.1 Get All Quests
**URL:** `GET /api/v1/quests`
**Description:** Retrieves all available quests.

**Response Structure:**
```json
[
  {
    "_id": "String",
    "title": "String",
    "description": "String",
    "icon": "String (URL)",
    "type": "String ('Main', 'Daily', 'Weekly', 'Special')",
    "nextQuest": "String (Quest ID) or null",
    "previousQuest": "String (Quest ID) or null",
    "subQuests": [
      {
        "title": "String",
        "description": "String",
        "rewards": [
          {
            "chance": "Number (0-1)",
            "entries": [
              {
                "type": "String ('Item', 'Coin', 'BadgePoint', 'RankPoint')",
                "itemId": "String (Item ID) or null",
                "badgeCategory": "String or null",
                "minAmount": "Number",
                "maxAmount": "Number",
                "weight": "Number"
              }
            ]
          }
        ]
      }
    ],
    "completionRewards": [
      // Same structure as subQuests rewards
    ],
    "createdAt": "Date String",
    "updatedAt": "Date String"
  }
]
```

### 3.2 Leaderboard
**URL:** `GET /api/v1/leaderboard`
**Description:** Retrieves the global leaderboard.

**Response Structure:**
```json
{
  "users": [
    {
      "discordUsername": "String",
      "discordNickname": "String",
      "leaderboardScore": "Number",
      "rank": { "currentTier": "String" }
    }
  ],
  "houses": [
    {
      "_id": "String",
      "name": "String",
      "score": "Number",
      "memberCount": "Number",
      "members": [
        {
          "_id": "String",
          "discordUsername": "String",
          "discordNickname": "String",
          "avatar": "String",
          "leaderboardScore": "Number"
        }
      ]
    }
  ]
}
```

---

## 4. Real-Time Updates (WebSocket)

The server supports real-time updates via Socket.IO.

### 4.1 Connection

- **URL:** `http://<SERVER_IP>:5000`
- **Auth:** JWT Token (Same as API)
    - Pass via `auth.token` object or `Authorization` header.

**Client Example (JS):**
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN"
  }
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});
```

### 4.2 Events

#### `quest_updated`
Emitted when a quest submission is reviewed (Approved/Rejected).

**Payload:**
```json
{
  "type": "Quest",
  "status": "Approved", // or "Rejected"
  "questId": "65672...",
  "submissionId": "65673...",
  "reason": "Feedback message" // (Optional, if rejected)
}
```