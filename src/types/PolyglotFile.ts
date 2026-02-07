export interface PolyglotFileInfo {
  _id: string;           // imageId
  parentNodeId: string;  // nodo padre
  filename: string;
  path: string;          // S3 key
  contentType?: string;
  size?: number;
  uploadedAt?: Date;
}

