import mongoose, { Schema, Document, Model } from 'mongoose';

export interface Answer {
  text?: string;
  imageUrl?: string;
  fileUrl?: string; // For file uploads (not just images)
  earthNumber?: number;
  createdAt?: Date;
  status?: 'pending' | 'accepted' | 'declined';
  adminComment?: string; // Comment from admin when declined
  reviewedAt?: Date;
  reviewedBy?: string; // Admin Discord ID
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  unlockedAt: Date;
}

export interface IUserProgress extends Document {
  discordId: string;
  name: string; // User's display name from Discord
  username: string; // Discord username
  nickname?: string; // Guild nickname
  avatarUrl?: string;
  hamsterCoin: number; // In-game currency
  gachaTicket: number; // Gacha tickets for future use
  unlockedPlanets: number[]; // World progression - unlocked planets/earths
  earth6Completed: boolean;
  points: number; // Upgrade points
  atk: number; // Attack stat
  hp: number; // Health stat
  agi: number; // Agility stat
  answers?: {
    unityBasic: Answer[]; // Answers for Unity Basic world (with text, images, files per earth)
    unityAsset: Answer[]; // Answers for Unity Asset world (with text, images, files per earth)
  };
  declinedAnswers?: Array<{
    earthNumber: number;
    answerType: 'unityBasic' | 'unityAsset';
    answerText?: string;
    answerImageUrl?: string;
    adminComment: string;
    reviewedAt: Date;
    reviewedBy: string;
    declinedAt: Date;
  }>; // Declined answers with admin comments for user to see
  achievements?: Achievement[]; // Achievements unlocked by the user
  purchasedAssets?: string[]; // Array of purchased asset IDs
  updatedAt: Date;
  createdAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    discordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    hamsterCoin: {
      type: Number,
      default: 0,
    },
    gachaTicket: {
      type: Number,
      default: 0,
    },
    unlockedPlanets: {
      type: [Number],
      default: [1],
    },
    earth6Completed: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 10,
    },
    atk: {
      type: Number,
      default: 10,
    },
    hp: {
      type: Number,
      default: 10,
    },
    agi: {
      type: Number,
      default: 10,
    },
    answers: {
      type: {
        unityBasic: [{
          text: String,
          imageUrl: String,
          fileUrl: String, // For file uploads
          earthNumber: Number,
          createdAt: { type: Date, default: Date.now },
          status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
          adminComment: String,
          reviewedAt: Date,
          reviewedBy: String,
        }],
        unityAsset: [{
          text: String,
          imageUrl: String,
          fileUrl: String, // For file uploads
          earthNumber: Number,
          createdAt: { type: Date, default: Date.now },
          status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
          adminComment: String,
          reviewedAt: Date,
          reviewedBy: String,
        }],
      },
      default: {
        unityBasic: [],
        unityAsset: [],
      },
    },
    declinedAnswers: {
      type: [{
        earthNumber: Number,
        answerType: String,
        answerText: String,
        answerImageUrl: String,
        adminComment: String,
        reviewedAt: { type: Date, default: Date.now },
        reviewedBy: String,
        declinedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    achievements: {
      type: [{
        id: String,
        name: String,
        description: String,
        unlockedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    purchasedAssets: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const UserProgress: Model<IUserProgress> =
  mongoose.models.UserProgress ||
  mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;

