import { db } from '../config/firebase-config';
import { ref, update } from 'firebase/database';

export interface Likeable {
    likedBy?: string[];
    dislikedBy?: string[];
}

export interface Post extends Likeable {
    id: string;  //id can be a id?
    title: string;
    content: string;
    timestamp: string;
    userUID: string;
    userHandle: string;
    likes?: number;
    dislikes?: number;
    category: string;
    // potentially other properties like images, etc.
}

export interface Comment extends Likeable {
    commentID?: string;
    text: string;
    author: string;
    timestamp: string;
    userUID: string;
    likedBy?: string[];
    dislikedBy?: string[];
}

export const handleLikePostUtil = async (userId: string | undefined, postId: string | undefined, post: Post, updateCallback: (updatedPost: Post) => void) => {
    if (!userId || !postId || !post) return;
    const postRef = ref(db, `posts/${postId}`);
    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];

    if (likedBy.includes(userId)) {
        const newLikedBy = likedBy.filter((uid) => uid !== userId);
        await update(postRef, { likedBy: newLikedBy, likes: newLikedBy.length });
        updateCallback({ ...post, likedBy: newLikedBy, likes: newLikedBy.length });
        return;
    }

    const newLikedBy = [...likedBy, userId];
    const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);

    await update(postRef, { likedBy: newLikedBy, dislikedBy: newDislikedBy, likes: newLikedBy.length, dislikes: newDislikedBy.length });
    updateCallback({ ...post, likedBy: newLikedBy, dislikedBy: newDislikedBy, likes: newLikedBy.length, dislikes: newDislikedBy.length });
};

export const handleDislikePostUtil = async (userId: string | undefined, postId: string | undefined, post: Post, updateCallback: (updatedPost: Post) => void) => {
    if (!userId || !postId || !post) return;
    const postRef = ref(db, `posts/${postId}`);
    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];

    if (dislikedBy.includes(userId)) {
        const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);
        await update(postRef, { dislikedBy: newDislikedBy, dislikes: newDislikedBy.length });
        updateCallback({ ...post, dislikedBy: newDislikedBy, dislikes: newDislikedBy.length });
        return;
    }

    const newDislikedBy = [...dislikedBy, userId];
    const newLikedBy = likedBy.filter((uid) => uid !== userId);

    await update(postRef, { likedBy: newLikedBy, dislikedBy: newDislikedBy, dislikes: newDislikedBy.length, likes: newLikedBy.length });
    updateCallback({ ...post, likedBy: newLikedBy, dislikedBy: newDislikedBy, dislikes: newDislikedBy.length, likes: newLikedBy.length });
};

export const handleLikeCommentUtil = async (userId: string | undefined, commentID: string | undefined, comment: Comment, updateCallback: (updatedComment: Comment) => void) => {
    if (!userId || !commentID || !comment) return;
    const commentRef = ref(db, `comments/${commentID}`);
    const likedBy = comment.likedBy || [];
    const dislikedBy = comment.dislikedBy || [];

    if (likedBy.includes(userId)) {
        const newLikedBy = likedBy.filter((uid) => uid !== userId);
        await update(commentRef, { likedBy: newLikedBy });
        updateCallback({ ...comment, likedBy: newLikedBy });
        return;
    }

    const newLikedBy = [...likedBy, userId];
    const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);
    await update(commentRef, { likedBy: newLikedBy, dislikedBy: newDislikedBy });
    updateCallback({ ...comment, likedBy: newLikedBy, dislikedBy: newDislikedBy });
};

export const handleDislikeCommentUtil = async (userId: string | undefined, commentID: string | undefined, comment: Comment, updateCallback: (updatedComment: Comment) => void) => {
    if (!userId || !commentID || !comment) return;
    const commentRef = ref(db, `comments/${commentID}`);
    const likedBy = comment.likedBy || [];
    const dislikedBy = comment.dislikedBy || [];

    if (dislikedBy.includes(userId)) {
        const newDislikedBy = dislikedBy.filter((uid) => uid !== userId);
        await update(commentRef, { dislikedBy: newDislikedBy });
        updateCallback({ ...comment, dislikedBy: newDislikedBy });
        return;
    }

    const newDislikedBy = [...dislikedBy, userId];
    const newLikedBy = likedBy.filter((uid) => uid !== userId);
    await update(commentRef, { likedBy: newLikedBy, dislikedBy: newDislikedBy });
    updateCallback({ ...comment, likedBy: newLikedBy, dislikedBy: newDislikedBy });
};