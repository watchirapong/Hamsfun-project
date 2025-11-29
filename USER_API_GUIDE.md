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

### 3.2 Submit Quest
**URL:** `POST /api/v1/quests/:id/submit`
**Description:** Submits proof for a quest or sub-quest.
**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `imageProof` | File | No | Image file as proof. |
| `description` | String | No | Additional notes. |
| `subQuestId` | String | No | ID of the sub-quest. If omitted, submits the Main Quest. |

**Response Structure:**
```json
{
  "message": "String",
  "submission": {
    "_id": "String",
    "status": "String ('Pending')",
    "imageProof": "String (URL)",
    "description": "String",
    "type": "String ('Quest')",
    "questId": "String",
    "subQuestId": "String or null",
    "userId": "String",
    "createdAt": "Date String"
  },
  "grantedRewards": {
    "coins": "Number",
    "rankPoints": "Number",
    "badgePoints": {
      "[BadgeCategory]": "Number"
    },
    "items": [
      {
        "itemId": "String",
        "name": "String",
        "quantity": "Number"
      }
    ]
  }
}
```
*Note: `grantedRewards` is only present if rewards were automatically granted (e.g., for Sub-Quests).*

---

## 4. Items
**Header:** `Authorization: Bearer <TOKEN>` (Optional for GET)

### 4.1 Get All Items
**URL:** `GET /api/v1/items`
**Description:** Retrieves a list of all game items.

**Response Structure:**
```json
{
  "message": "success",
  "data": [
    {
      "_id": "String",
      "name": "String",
      "description": "String",
      "icon": "String (URL)",
      "type": "String",
      "canStack": "Boolean",
      "createdAt": "Date String",
      "updatedAt": "Date String"
    }
  ]
}
```

### 4.2 Get Item by ID
**URL:** `GET /api/v1/items/:id`
**Description:** Retrieves details of a specific item.

**Response Structure:**
```json
{
  "message": "success",
  "data": {
    // Same fields as item object in Get All Items
  }
}
```

---

## 5. Dojos
**Header:** `Authorization: Bearer <TOKEN>`

### 5.1 Get All Dojos
**URL:** `GET /api/v1/dojos`
**Description:** Retrieves a list of all Dojos.

**Response Structure:**
```json
[
  {
    "_id": "String",
    "name": "String",
    "status": "String ('Prepare', 'Open', 'Closed')",
    "whitelist": ["String (User ID)"],
    "specialQuestId": "String (Quest ID) or null",
    "startTime": "Date String",
    "endTime": "Date String",
    "createdAt": "Date String",
    "updatedAt": "Date String"
  }
]
```

### 5.2 Get Dojo Status
**URL:** `GET /api/v1/dojos/:id/status`
**Description:** Checks if the user has access to a specific Dojo.

**Response Structure:**
```json
{
  "dojoId": "String",
  "name": "String",
  "access": "String ('Granted', 'Denied')"
}
```

---

## 6. Leaderboard
**Header:** `Authorization: Bearer <TOKEN>` (Optional)

### 6.1 Get Leaderboard
**URL:** `GET /api/v1/leaderboard`
**Description:** Retrieves the current leaderboard for Users and Houses.

**Response Structure:**
```json
{
  "users": [
    {
      "_id": "String",
      "discordUsername": "String",
      "discordNickname": "String",
      "leaderboardScore": "Number",
      "rank": {
        "currentTier": "String"
      },
      "badges": { ... },
      "roles": [ ... ]
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

## 7. Admin APIs
**Header:** `Authorization: Bearer <TOKEN>` (Admin role required)

> [!WARNING]
> All endpoints in this section require admin privileges. Unauthorized access will result in a `403 Forbidden` response.

### 7.1 Create Quest
**URL:** `POST /api/v1/admin/quests`
**Description:** Creates a new quest.
**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | String | Yes | Quest title |
| `type` | String | Yes | Quest type ('Main', 'Daily', 'Weekly', 'Special') |
| `description` | String | No | Quest description |
| `icon` | File | No | Quest icon image |
| `subQuests` | JSON String | No | Array of sub-quests |
| `completionRewards` | JSON String | No | Main quest completion rewards |

**Response Structure:**
```json
{
  "_id": "String",
  "title": "String",
  "type": "String",
  "description": "String",
  "icon": "String (URL)",
  "subQuests": [...],
  "completionRewards": [...]
}
```

### 7.2 Delete Quest
**URL:** `DELETE /api/v1/admin/quests/:id`
**Description:** Deletes a quest and removes it from all users.

**Response Structure:**
```json
{
  "message": "Quest removed"
}
```

### 7.3 Assign Quest to User
**URL:** `POST /api/v1/admin/users/:userId/quests`
**Description:** Assigns a quest to a specific user.

**Request Body:**
```json
{
  "questId": "String (Required)"
}
```

**Response Structure:**
```json
{
  "message": "Quest assigned",
  "activeQuests": [...]
}
```

### 7.4 Assign Quest to Multiple Users (Bulk)
**URL:** `POST /api/v1/admin/quests/:questId/assign-bulk`
**Description:** Assigns a quest to multiple users based on house or role.

**Request Body:**
```json
{
  "houseId": "String (Optional)",
  "roleName": "String (Optional)"
}
```

**Response Structure:**
```json
{
  "message": "Quest assigned to [N] users"
}
```

### 7.5 Get All Submissions
**URL:** `GET /api/v1/admin/submissions`
**Description:** Retrieves all pending submissions.

**Response Structure:**
```json
[
  {
    "_id": "String",
    "type": "String ('Quest', 'Ticket')",
    "status": "String",
    "userId": {
      "_id": "String",
      "discordUsername": "String",
      "avatar": "String"
    },
    "questId": {
      "_id": "String",
      "title": "String"
    },
    "subQuestId": "String or null",
    "subQuestTitle": "String (if sub-quest)",
    "imageProof": "String (URL)",
    "description": "String",
    "createdAt": "Date String"
  }
]
```

### 7.6 Approve Submission
**URL:** `PUT /api/v1/admin/submissions/:id/approve`
**Description:** Approves a submission and grants rewards if applicable.

**Response Structure:**
```json
{
  "message": "Submission approved"
}
```

### 7.7 Reject Submission
**URL:** `PUT /api/v1/admin/submissions/:id/reject`
**Description:** Rejects a submission with optional feedback.

**Request Body:**
```json
{
  "feedback": "String (Optional)"
}
```

**Response Structure:**
```json
{
  "message": "Submission rejected"
}
```

### 7.8 Get All Users
**URL:** `GET /api/v1/admin/users`
**Description:** Retrieves a list of all users.

**Response Structure:**
```json
[
  {
    "_id": "String",
    "discordUsername": "String",
    "discordNickname": "String",
    "coins": "Number",
    "rank": {...},
    "leaderboardScore": "Number",
    "createdAt": "Date String"
  }
]
```

### 7.9 Get User by ID
**URL:** `GET /api/v1/admin/users/:id`
**Description:** Retrieves detailed information about a specific user.

**Response Structure:**
Same as **Get My Profile** (Section 2.1), including all fields.

### 7.10 Grant Item to User
**URL:** `POST /api/v1/admin/users/:userId/grant-item`
**Description:** Grants items to a user's inventory.

**Request Body:**
```json
{
  "itemId": "String (Required)",
  "quantity": "Number (Required)"
}
```

**Response Structure:**
```json
{
  "message": "Item granted",
  "inventory": [...]
}
```

### 7.11 Grant Badge Points
**URL:** `POST /api/v1/admin/users/:userId/grant-badge`
**Description:** Grants badge points to a user.

**Request Body:**
```json
{
  "badgeCategory": "String (Required)",
  "points": "Number (Required)"
}
```

**Response Structure:**
```json
{
  "message": "Badge points granted",
  "badges": {...}
}
```

### 7.12 Grant Leaderboard Score
**URL:** `POST /api/v1/admin/users/:userId/grant-leaderboard`
**Description:** Grants leaderboard score to a user.

**Request Body:**
```json
{
  "score": "Number (Required)"
}
```

**Response Structure:**
```json
{
  "message": "Leaderboard score granted",
  "leaderboardScore": "Number"
}
```

### 7.13 Get All Houses
**URL:** `GET /api/v1/admin/houses`
**Description:** Retrieves all houses.

**Response Structure:**
```json
[
  {
    "_id": "String",
    "name": "String",
    "discordRoleId": "String"
  }
]
```

### 7.14 Create House
**URL:** `POST /api/v1/admin/houses`
**Description:** Creates a new house.

**Request Body:**
```json
{
  "name": "String (Required)",
  "discordRoleId": "String (Required)"
}
```

**Response Structure:**
```json
{
  "_id": "String",
  "name": "String",
  "discordRoleId": "String"
}
```

### 7.15 Update House
**URL:** `PUT /api/v1/admin/houses/:id`
**Description:** Updates a house's information.

**Request Body:**
```json
{
  "name": "String (Optional)",
  "discordRoleId": "String (Optional)"
}
```

**Response Structure:**
```json
{
  "_id": "String",
  "name": "String",
  "discordRoleId": "String"
}
```

### 7.16 Delete House
**URL:** `DELETE /api/v1/admin/houses/:id`
**Description:** Deletes a house.

**Response Structure:**
```json
{
  "message": "House removed"
}
```
