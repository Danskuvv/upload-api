import {Like, MediaItem, UserWithNoPassword, Comment} from './DBTypes';

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

type MediaResponse = MessageResponse & {
  media: MediaItem | MediaItem[];
};

// for auth server
type LoginResponse = MessageResponse & {
  token: string;
  message: string;
  user: UserWithNoPassword;
};

type UserResponse = MessageResponse & {
  user: UserWithNoPassword;
};

type UserDeleteResponse = MessageResponse & {
  user: {user_id: number};
};

// for upload server
type UploadResponse = MessageResponse & {
  data: {
    filename: string;
    media_type: string;
    filesize: number;
  };
};

type LikeResponse = MessageResponse & {
  like: Like;
};

type CommentResponse = MessageResponse & {
  comment: Comment;
};

export type {
  MessageResponse,
  ErrorResponse,
  MediaResponse,
  LoginResponse,
  UploadResponse,
  UserResponse,
  UserDeleteResponse,
  LikeResponse,
  CommentResponse,
};
