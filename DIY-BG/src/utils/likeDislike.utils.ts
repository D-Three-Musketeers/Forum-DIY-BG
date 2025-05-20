import { db } from "../config/firebase-config";
import { ref, update } from "firebase/database";

export interface Likeable {
  likedBy?: string[];
  dislikedBy?: string[];
}

export interface Post extends Likeable {
  commentCount: number;
  id: string; //id can be a id?
  title: string;
  content: string;
  timestamp: string;
  userUID: string;
  userHandle: string;
  likes?: number;
  dislikes?: number;
  category: string;
  comments: object;
  tags?: string[]
  // potentially other properties like images, etc.
}

export interface Comment extends Likeable {
  commentId?: string;
  text: string;
  author: string;
  timestamp: string;
  userUID: string;
  likedBy?: string[];
  dislikedBy?: string[];
}

export const handleLikePostUtil = async (
  userId: string | undefined,
  postId: string | undefined,
  post: Post
): Promise<Post | null> => {
  if (!userId || !postId || !post) return null;
  const postRef = ref(db, `posts/${postId}`);
  const likedBy = post.likedBy || [];
  const dislikedBy = post.dislikedBy || [];

  if (likedBy.includes(userId)) {
    const newLikedBy = likedBy.filter((uid) => uid !== userId);
    await update(postRef, { likedBy: newLikedBy, likes: newLikedBy.length });
    return { ...post, likedBy: newLikedBy, likes: newLikedBy.length };
  }

  const newLikedBy = [...likedBy, userId];
  const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);

  await update(postRef, {
    likedBy: newLikedBy,
    dislikedBy: newDislikedBy,
    likes: newLikedBy.length,
    dislikes: newDislikedBy.length,
  });
  return {
    ...post,
    likedBy: newLikedBy,
    dislikedBy: newDislikedBy,
    likes: newLikedBy.length,
    dislikes: newDislikedBy.length,
  };
};

export const handleDislikePostUtil = async (
  userId: string | undefined,
  postId: string | undefined,
  post: Post
): Promise<Post | null> => {
  if (!userId || !postId || !post) return null;
  const postRef = ref(db, `posts/${postId}`);
  const likedBy = post.likedBy || [];
  const dislikedBy = post.dislikedBy || [];

  if (dislikedBy.includes(userId)) {
    const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);
    await update(postRef, {
      dislikedBy: newDislikedBy,
      dislikes: newDislikedBy.length,
    });
    return {
      ...post,
      dislikedBy: newDislikedBy,
      dislikes: newDislikedBy.length,
    };
  }

  const newDislikedBy = [...dislikedBy, userId];
  const newLikedBy = likedBy.filter((uid) => uid !== userId);

  await update(postRef, {
    likedBy: newLikedBy,
    dislikedBy: newDislikedBy,
    dislikes: newDislikedBy.length,
    likes: newLikedBy.length,
  });
  return {
    ...post,
    likedBy: newLikedBy,
    dislikedBy: newDislikedBy,
    dislikes: newDislikedBy.length,
    likes: newLikedBy.length,
  };
};

export const handleLikeCommentUtil = async (
  userId: string | undefined,
  commentID: string | undefined,
  comment: Comment
): Promise<Comment | null> => {
  if (!userId || !commentID || !comment) return null;
  const commentRef = ref(db, `comments/${commentID}`);
  const likedBy = comment.likedBy || [];
  const dislikedBy = comment.dislikedBy || [];

  if (likedBy.includes(userId)) {
    const newLikedBy = likedBy.filter((uid) => uid !== userId);
    await update(commentRef, { likedBy: newLikedBy });
    return { ...comment, likedBy: newLikedBy };
  }

  const newLikedBy = [...likedBy, userId];
  const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);
  await update(commentRef, { likedBy: newLikedBy, dislikedBy: newDislikedBy });
  return { ...comment, likedBy: newLikedBy, dislikedBy: newDislikedBy };
};

export const handleDislikeCommentUtil = async (
  userId: string | undefined,
  commentID: string | undefined,
  comment: Comment
): Promise<Comment | null> => {
  if (!userId || !commentID || !comment) return null;
  const commentRef = ref(db, `comments/${commentID}`);
  const likedBy = comment.likedBy || [];
  const dislikedBy = comment.dislikedBy || [];

  if (dislikedBy.includes(userId)) {
    const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);
    await update(commentRef, { dislikedBy: newDislikedBy });
    return { ...comment, dislikedBy: newDislikedBy };
  }

  const newDislikedBy = [...dislikedBy, userId];
  const newLikedBy = likedBy.filter((uid) => uid !== userId);
  await update(commentRef, { likedBy: newLikedBy, dislikedBy: newDislikedBy });
  return { ...comment, likedBy: newLikedBy, dislikedBy: newDislikedBy };
};

/**
 * @function: Handlers for User.tsx
 */

export const handleLikeUserPost = (
  userId: string | undefined,
  post: Post,
  setUserPosts: React.Dispatch<React.SetStateAction<Post[]>>
) => {
  handleLikePostUtil(userId, post.id, post)
    .then((updatedPost) => {
      if (updatedPost) {
        setUserPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
        );
      }
    })
    .catch((error) => {
      console.error("Error liking post:", error);
    });
};

export const handleDislikeUserPost = (
  userId: string | undefined,
  post: Post,
  setUserPosts: React.Dispatch<React.SetStateAction<Post[]>>
) => {
  handleDislikePostUtil(userId, post.id, post)
    .then((updatedPost) => {
      if (updatedPost) {
        setUserPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
        );
      }
    })
    .catch((error) => {
      console.error("Error disliking post:", error);
    });
};

export const handleLikeUserComment = (
  userId: string | undefined,
  comment: Comment,
  setUserComments: React.Dispatch<React.SetStateAction<Comment[]>>
) => {
  handleLikeCommentUtil(userId, comment.commentId, comment)
    .then((updatedComment) => {
      if (updatedComment) {
        setUserComments((prevComments) =>
          prevComments.map((c) =>
            c.commentId === updatedComment.commentId ? updatedComment : c
          )
        );
      }
    })
    .catch((error) => {
      console.error("Error liking comment:", error);
    });
};

export const handleDislikeUserComment = (
  userId: string | undefined,
  comment: Comment,
  setUserComments: React.Dispatch<React.SetStateAction<Comment[]>>
) => {
  handleDislikeCommentUtil(userId, comment.commentId, comment)
    .then((updatedComment) => {
      if (updatedComment) {
        setUserComments((prevComments) =>
          prevComments.map((c) =>
            c.commentId === updatedComment.commentId ? updatedComment : c
          )
        );
      }
    })
    .catch((error) => {
      console.error("Error disliking comment:", error);
    });
};
