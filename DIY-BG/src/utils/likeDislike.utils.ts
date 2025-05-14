import { db } from '../config/firebase-config';
import { ref, update } from 'firebase/database';

interface Likeable {
    likedBy?: string[];
    dislikedBy?: string[];
}

interface Post extends Likeable {
    id?: string; // ID is potentially undefined when creating a new post
    likes?: number;
    dislikes?: number;
    // ... other post properties
}

interface Comment extends Likeable {
    commentID?: string; // Assuming this is the ID property
    // ... other comment properties
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

export const handleLikeCommentUtil = async (userId: string | undefined, commentId: string | undefined, comment: Comment, updateCallback: (updatedComment: Comment) => void) => {
    if (!userId || !commentId || !comment) return;
    // Assuming comments are directly under the 'comments' node, adjust path if needed
    const commentRef = ref(db, `comments/${commentId}`);
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

export const handleDislikeCommentUtil = async (userId: string | undefined, commentId: string | undefined, comment: Comment, updateCallback: (updatedComment: Comment) => void) => {
    if (!userId || !commentId || !comment) return;
    // Assuming comments are directly under the 'comments' node, adjust path if needed
    const commentRef = ref(db, `comments/${commentId}`);
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