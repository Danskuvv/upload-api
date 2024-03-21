declare namespace Express {
  namespace Multer {
    interface File {
      [key: string]: unknown; // This allows any additional properties
    }
  }
}

export interface MulterFile extends Express.Multer.File {
  key: string; // This adds the 'key' property
}
