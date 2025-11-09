import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProgress extends Document {
  discordId: string;
  username: string;
  unlockedPlanets: number[];
  earth6Completed: boolean;
  points: number;
  atk: number;
  hp: number;
  agi: number;
  updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    discordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

const UserProgress: Model<IUserProgress> =
  mongoose.models.UserProgress ||
  mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;

