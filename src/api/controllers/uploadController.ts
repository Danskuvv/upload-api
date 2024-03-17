import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import {FileInfo, TokenContent} from '../../../hybrid-types/DBTypes';
import {MessageResponse} from '../../../hybrid-types/MessageTypes';
import AWS from 'aws-sdk';
import {v4 as uuidv4} from 'uuid';

// Configure AWS with your access and secret key.
const {ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME} = process.env; // These should be set in your .env file

AWS.config.update({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
/* OLD FILE UPLOAD FUNCTION
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

    const fileInfo: FileInfo = {
      filename: req.file.filename, // filename is used as random string because multer creates a random string for filename
      user_id: res.locals.user.user_id, // user_id is used to verify if user is owner of file
    };

    // use fileinfo to create jwt token to be used as filename to store the owner of the file
    const filename = `${jwt.sign(
      fileInfo,
      process.env.JWT_SECRET as string
    )}.${req.file.originalname.split('.').pop()}`;

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

    if (!BUCKET_NAME) {
      throw new Error('Bucket name is not defined');
    }

    // Generate a new filename for this file
    const newFilename = uuidv4() + '.' + req.file.originalname.split('.').pop();

    // Set up parameters for S3 upload
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: newFilename,
      Body: req.file.buffer,
    };

    // Upload file to S3
    s3.upload(
      uploadParams,
      (err: Error, data: AWS.S3.ManagedUpload.SendData) => {
        if (err) {
          console.log('Error', err);
        }
        if (data) {
          console.log('Upload Success', data.Location);

          // Send response to client with URL of uploaded file
          res.json({fileUrl: data.Location});
        }
      }
    );
  } catch (error) {
    next(error);
  }
};

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

export {uploadFile, deleteFile};
