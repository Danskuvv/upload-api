import express, {Request} from 'express';
import {
  deleteFile,
  uploadFile,
  uploadMiddleware,
} from '../controllers/uploadController';
import multer, {FileFilterCallback} from 'multer';
import {authenticate, makeThumbnail} from '../../middlewares';

export const fileFilter = (
  request: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.includes('image') || file.mimetype.includes('video')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
// Multer for local file storage thing
//const upload = multer({dest: './uploads/', fileFilter});

//Multer for aws s3 upload
//const upload = multer({storage: multer.memoryStorage(), fileFilter});
const router = express.Router();

// TODO: validation

router.route('/upload').post(
  authenticate,
  uploadMiddleware.single('file'),
  //makeThumbnail,
  uploadFile
);

router.route('/delete/:filename').delete(authenticate, deleteFile);

export default router;
