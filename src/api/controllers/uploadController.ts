import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import jwt from 'jsonwebtoken';
//import fs from 'fs';
import {FileInfo, TokenContent} from '../../../hybrid-types/DBTypes';
import {MessageResponse} from '../../../hybrid-types/MessageTypes';
//import AWS from 'aws-sdk';
import {DeleteObjectCommand, S3Client} from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import {fileFilter} from '../routes/fileRoute';
import {MulterFile} from '../../../types';
//import {v4 as uuidv4} from 'uuid';

// Configure AWS with your access and secret key.
//const {ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME} = process.env; // These should be set in your .env file

//AWS.config.update({
//accessKeyId: process.env.ACCESS_KEY_ID,
//secretAccessKey: process.env.SECRET_ACCESS_KEY,
//});

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID as string,
    secretAccessKey: process.env.SECRET_ACCESS_KEY as string,
  },
});

const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME as string,
    key: function (req, file, cb) {
      const extension = file.originalname.split('.').pop();
      cb(null, `${Date.now().toString()}.${extension}`);
    },
  }),
  fileFilter: fileFilter,
});

// LOCAL FILE BASED UPLOAD FUNCTION
/*
const uploadFile = async (
  req: Request,
  res: Response<{}, {user: TokenContent}>,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      const err = new CustomError('file not valid', 400);
      next(err);
      return;
    }

    //
    //const fileInfo: FileInfo = {
      //filename: req.file.filename, // filename is used as random string because multer creates a random string for filename
      //user_id: res.locals.user.user_id, // user_id is used to verify if user is owner of file
    //};

    // use fileinfo to create jwt token to be used as filename to store the owner of the file
    //const filename = `${jwt.sign(
      //fileInfo,
      //process.env.JWT_SECRET as string
    //)}.${req.file.originalname.split('.').pop()}`;
      //

    // Generate a new filename for this file
    const filename = uuidv4() + '.' + req.file.originalname.split('.').pop();

    // change file name of req.file.path to filename
    fs.renameSync(req.file.path, `${req.file.destination}/${filename}`);
    // if thumbnail exists, change thumbnail name of req.file.path + '_thumb' to filename + '_thumb'
    if (fs.existsSync(`${req.file.path}-thumb.png`)) {
      fs.renameSync(
        `${req.file.path}-thumb.png`,
        `${req.file.destination}/${filename}-thumb.png`
      );
    }

    const response = {
      message: 'file uploaded',
      data: {
        filename,
        media_type: req.file.mimetype,
        filesize: req.file.size,
      },
    };
    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};
*/
// AWS UPLOAD SYSTEM
const uploadFile = async (
  req: Request,
  res: Response<{}, {user: TokenContent}>,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      const err = new CustomError('file not valid', 400);
      next(err);
      return;
    }

    const file = req.file as unknown as MulterFile;

    const response = {
      message: 'file uploaded',
      data: {
        filename: file.key,
        media_type: file.mimetype,
        filesize: file.size,
      },
    };
    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

/*
const deleteFile = async (
  req: Request<{filename: string}>,
  res: Response<MessageResponse, {user: TokenContent}>,
  next: NextFunction
) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      const err = new CustomError('filename not valid', 400);
      next(err);
      return;
    }

    // check if not admin
    if (res.locals.user.level_name !== 'Admin') {
      // get filename without extension for jwt verification
      // filename has multiple dots, so split by dot and remove last element
      const filenameWithoutExtension = filename
        .split('.')
        .slice(0, -1)
        .join('.');
      if (!filenameWithoutExtension) {
        const err = new CustomError('filename not valid', 400);
        next(err);
        return;
      }

      console.log('filenameWithoutExtension', filenameWithoutExtension);

      // check from token if user is owner of file
      const decodedTokenFromFileName = jwt.verify(
        filenameWithoutExtension,
        process.env.JWT_SECRET as string
      ) as FileInfo;

      if (decodedTokenFromFileName.user_id !== res.locals.user.user_id) {
        const err = new CustomError('user not authorized', 401);
        next(err);
        return;
      }
    }

    // delete  from uploads folder
    if (fs.existsSync(`./uploads/${filename}-thumb.png`)) {
      fs.unlinkSync(`./uploads/${filename}-thumb.png`);
    }

    if (!fs.existsSync(`./uploads/${filename}`)) {
      const err = new CustomError('file not found', 404);
      next(err);
      return;
    }

    fs.unlinkSync(`./uploads/${filename}`);

    const response: MessageResponse = {
      message: 'File deleted',
    };
    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};
*/

//AWS FILE DELETE FUNCTION
const deleteFile = async (
  req: Request<{filename: string}>,
  res: Response<MessageResponse, {user: TokenContent}>,
  next: NextFunction
) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      const err = new CustomError('filename not valid', 400);
      console.log(filename);
      next(err);
      return;
    }
    /*
    // check if not admin
    if (res.locals.user.level_name !== 'Admin') {
      // get filename without extension for jwt verification
      // filename has multiple dots, so split by dot and remove last element
      const filenameWithoutExtension = filename
        .split('.')
        .slice(0, -1)
        .join('.');
      if (!filenameWithoutExtension) {
        const err = new CustomError('filename not valid', 400);
        next(err);
        return;
      }

      console.log('filenameWithoutExtension', filenameWithoutExtension);

      // check from token if user is owner of file
      const decodedTokenFromFileName = jwt.verify(
        filenameWithoutExtension,
        process.env.JWT_SECRET as string
      ) as FileInfo;

      if (decodedTokenFromFileName.user_id !== res.locals.user.user_id) {
        const err = new CustomError('user not authorized', 401);
        next(err);
        return;
      }
    }
*/
    // delete from S3 bucket
    const deleteParams = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: filename,
    };
    try {
      await s3.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('An error occurred while deleting the file');
      }
    }
    const response: MessageResponse = {
      message: 'File deleted',
    };
    res.json(response);
  } catch (error) {
    next(new CustomError((error as Error).message, 400));
  }
};

export {uploadFile, deleteFile, uploadMiddleware};
