import {
  get,
  set,
  ref,
  query,
  equalTo,
  orderByChild,
  push,
  update,
} from "firebase/database";
import { db } from "../config/firebase-config";

export const createPost = async (
  title: string,
  content: any,
  userUID: string,
  userHandle: string,
  timestamp: string
) => {
  const result = await push(ref(db, "posts"));
  const id = result.key;

  const post = {
    id,
    title,
    content,
    userUID,
    userHandle,
    timestamp,
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: {},
  };
  await set(ref(db, `posts/${id}`), post);
};

export const getPostByID = async (id: any) => {
  const snapshot = await get(ref(db, `posts/${id}`));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

export const getAllPosts = async (search = '') => {
  const snapshot = await get(ref(db,'posts'));
  if(!snapshot.exists()){
    return [];
  }

  const posts = Object.values(snapshot.val()) as Array<{
    id: string;
    title: string;
    content: any;
    userUID: string;
    userHandle: string;
    timestamp: string;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    comments: Record<string, any>;
  }>;

  if(search) {
    return posts.filter(post => post.title.toLowerCase().includes(search.toLowerCase()));
  }

  return posts;
}

export const getPostsByUID = async (uid:string) => {
  const posts = await getAllPosts();

  return posts.filter(post => post.userUID===uid);
}

export const getAllComments = async (search='') => {
  const posts = await getAllPosts();
  if(search) {
    return posts.filter(post => post.comments)
  }
}