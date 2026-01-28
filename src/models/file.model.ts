import mongoose from "mongoose";
import { Model, model } from "mongoose";
import { PolyglotFileInfo } from "../types/PolyglotFile";

const fileSchema = new mongoose.Schema<PolyglotFileInfo>({
  _id: {
    type: String,
    required: true,
    default: "",
  },

  // NEW: usato per collegare file secondari (es: immagini delle domande) al nodo padre
  // resta opzionale per non rompere i file esistenti (Read material)
  parentNodeId: {
    type: String,
    required: false,
  },

  filename: {
    type: String,
    required: true,
    default: "test",
  },
  path: {
    type: String,
    required: true,
    default: "path/",
  },
  uploadedAt: { type: Date, default: Date.now },
});

export interface PolyglotFileModel extends Model<PolyglotFileInfo> {}

export default model<PolyglotFileInfo, PolyglotFileModel>("File", fileSchema);
