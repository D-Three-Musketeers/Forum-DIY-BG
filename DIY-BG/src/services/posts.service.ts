import { get, set, ref, push, update, increment, remove } from "firebase/database";
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
  tags: string[] = [],  // Changed to default empty array
  images: string[] = []
) => {
  try {
    // 1. Create post reference
    const postRef = await push(ref(db, "posts"));
    const postId = postRef.key;
    if (!postId) throw new Error("Failed to generate post ID");

    const uniqueTags = [...new Set(tags.filter(tag => tag.length >= 2 && tag.length <= 12))];

    // 4. Prepare post data
    const postData = {
      id: postId,
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
      images,
      tags: uniqueTags.map(tag => `#${tag}`),
    };

    // 5. Prepare all updates
    const updates: Record<string, any> = {
      [`posts/${postId}`]: postData
    };

    // 6. Add tag updates
    uniqueTags.forEach(tag => {
      updates[`tags/${tag}/posts/${postId}`] = true;
      updates[`tags/${tag}/count`] = increment(1);
    });

    // 7. Execute all updates
    await update(ref(db), updates);

    return postId;
  } catch (error) {
    console.error("Error in createPost:", error);
    throw error;
  }
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


export const deletePostCompletely = async (postId: string) => {
  if (!postId) throw new Error('Post ID is required');

  try {
    const postSnapshot = await get(ref(db, `posts/${postId}`));
    if (!postSnapshot.exists()) {
      throw new Error('Post not found');
    }
    const post = postSnapshot.val();

    // Delete all comments
    if (post.comments) {
      await Promise.all(
        Object.keys(post.comments).map(commentId =>
          remove(ref(db, `comments/${commentId}`))
        )
      );
    }

    // Remove postId from all tags
    if (Array.isArray(post.tags)) {
      await Promise.all(
        post.tags.map((displayTag: string) => {
          const tag = displayTag.substring(1);
          return remove(ref(db, `tags/${tag}/posts/${postId}`));
        })
      );
    }

    // Update tag counts (decrement)
    const countUpdates: Record<string, any> = {};
    if (Array.isArray(post.tags)) {
      post.tags.forEach((displayTag: string) => {
        const tag = displayTag.substring(1);
        countUpdates[`tags/${tag}/count`] = increment(-1);
      });
      await update(ref(db), countUpdates);
    }

    // deleting the post itself
    await remove(ref(db, `posts/${postId}`));

    return true;
  } catch (error) {
    console.error('Complete post deletion failed:', error);
    throw error;
  }
};