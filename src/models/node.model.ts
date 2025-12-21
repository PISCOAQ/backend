import mongoose, { model, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import validator from "validator";
import { PolyglotNode } from "../types";
const options = { discriminatorKey: "type" };

export interface PolyglotNodeDocument extends PolyglotNode, Document {
  minify(): unknown;
}

export interface PolyglotNodeModel extends Model<PolyglotNode> {}

export const nodeSchema = new mongoose.Schema<PolyglotNode>(
  {
    _id: {
      type: String,
      required: true,
      default: () => uuidv4(),
      validate: {
        validator: (id: string) => validator.isUUID(id),
        message: "Invalid UUID-v4",
      },
    },
    title: {
      type: String,
      default: "Node",
    },
    description: { type: String },
    difficulty: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
    },
    reactFlow: {
      type: {},
    },
    runtimeData: { type: {} },
    platform: {
      type: String,
      default: "VSCode",
    },
  },
  options,
);
//learning nodes:
export const LessonNodeSchema = new mongoose.Schema(
  {
    data: {
      file: { type: {} },
    },
  },
  options,
);

export const LessonTextNodeSchema = new mongoose.Schema(
  {
    data: {
      text: { type: String },
    },
  },
  options,
);

export const WatchVideoNodeSchema = new mongoose.Schema(
  {
    data: {
      link: { type: String },
    },
  },
  options,
);

export const ReadMaterialNodeSchema = new mongoose.Schema(
  {
    data: {
      text: { type: String },
      link: { type: String },
    },
  },
  options,
);

//assessment nodes:
export const closeEndedQuestionNodeSchema = new mongoose.Schema(
  {
    data: {
      question: { type: String },
      correctAnswers: [{ type: String }],
      textToFill: { type: String },
      isAnswerCorrect: [{ type: Boolean }],
    },
  },
  options,
);

export const openQuestionNodeSchema = new mongoose.Schema(
  {
    data: {
      question: { type: String },
      material: { type: String },
      possibleAnswer: { type: String },
    },
  },
  options,
);

export const multipleChoiceQuestionNodeSchema = new mongoose.Schema(
  {
    data: {
      question: { type: String },
      choices: [{ type: String }],
      isChoiceCorrect: [{ type: Boolean }],
    },
  },
  options,
);

export const TrueFalseNodeSchema = new mongoose.Schema(
  {
    data: {
      instructions: { type: String },
      questions: [{ type: String }],
      isQuestionCorrect: [{ type: Boolean }],
      negativePoints: { type: Number },
      positvePoints: { type: Number },
    },
  },
  options,
);

export const CircuitNodeSchema = new mongoose.Schema(
  {
    data: {
      instructions: { type: String },
      pinsList: [{ type: {pin: String, value: String} }],
    },
  },
  options,
);
export const PolyglotNodeModel = model<PolyglotNode, PolyglotNodeModel>(
  "Node",
  nodeSchema,
);

export const LessonNode = PolyglotNodeModel.discriminator(
  "lessonNode",
  LessonNodeSchema,
);

export const LessonTextNode = PolyglotNodeModel.discriminator(
  "lessonTextNode",
  LessonTextNodeSchema,
);

export const WatchVideoNode = PolyglotNodeModel.discriminator(
  "WatchVideoNode",
  WatchVideoNodeSchema,
);

export const ReadMaterialNode = PolyglotNodeModel.discriminator(
  "ReadMaterialNode",
  ReadMaterialNodeSchema,
);


export const CloseEndedQuestionNode = PolyglotNodeModel.discriminator(
  "closeEndedQuestionNode",
  closeEndedQuestionNodeSchema,
);

export const OpenQuestionNode = PolyglotNodeModel.discriminator(
  "OpenQuestionNode",
  openQuestionNodeSchema,
);


export const MultipleChoiceQuestionNode = PolyglotNodeModel.discriminator(
  "multipleChoiceQuestionNode",
  multipleChoiceQuestionNodeSchema,
);

export const TrueFalseNode = PolyglotNodeModel.discriminator(
  "TrueFalseNode",
  TrueFalseNodeSchema,
);

export const CircuitNode = PolyglotNodeModel.discriminator(
  "CircuitNode",
  CircuitNodeSchema,
);
