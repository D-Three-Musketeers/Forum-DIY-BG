import { get, set, ref, push } from "firebase/database";
import { db } from "../config/firebase-config";

export const createComment = async (
  commentID: string,
  author: string,
  text: string,
  timestamp: string,
  userUID: string,
  postID: string
) => {
  const result = await push(ref(db, "comments"));
  const id = result.key;
  const comment = {
    commentID,
    author,
    text,
    timestamp,
    userUID,
    postID,
    likedBy: [],
    dislikedBy: [],
    likes: 0,
    disliked: 0,
  };
  await set(ref(db, `comments/${id}`), comment);

  await set(ref(db, `posts/${postID}/comments/${id}`), comment);
};

export const createPost = async (
  title: string,
  content: any,
  userUID: string,
  userHandle: string,
  timestamp: string,
  category: string,
  tags?: string[]
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
    category,
    likes: 0,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: {},
    tags: tags || [],
  };
  await set(ref(db, `posts/${id}`), post);
};

export const getPostByCategory = async (category: string) => {
  const posts = await getAllPosts();

  if (category) {
    return posts.filter((post) => post.category === category);
  }

  return [];
};

export const getPostByID = async (id: any) => {
  const snapshot = await get(ref(db, `posts/${id}`));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

export const getAllPosts = async (search = "") => {
  const snapshot = await get(ref(db, "posts"));
  if (!snapshot.exists()) {
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
    category: string;
    comments: Record<string, any>;
    tags?: string[];
  }>;

  if (search) {
    return posts.filter((post) =>
      post.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  return posts;
};

export const getPostsByUID = async (uid: string) => {
  const posts = await getAllPosts();

  return posts.filter((post) => post.userUID === uid);
};

export const getAllComments = async (search = "") => {
  const posts = await getAllPosts();
  if (search) {
    return posts.filter((post) =>
      Object.values(post.comments).filter((comment: { text: string }) =>
        comment.text.toLowerCase().includes(search.toLowerCase())
      )
    );
  }

  return posts.flatMap((post) => Object.values(post.comments));
};
