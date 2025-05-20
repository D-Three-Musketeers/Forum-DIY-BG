import { get, ref, update, increment } from "firebase/database";
import { db } from "../config/firebase-config";

// /**
//  * Updates global tags collection when post tags change
//  */
// const updateTagReferences = async (
//   postId: string,
//   addedTags: string[],
//   removedTags: string[]
// ) => {
//   console.log(">>> updateTagReferences CALLED", { postId, addedTags, removedTags });

//   const updates: Record<string, any> = {};

//   addedTags.forEach((tag) => {
//     if (!tag) return;
//     updates[`tags/${tag}/posts/${postId}`] = true;
//     updates[`tags/${tag}/count`] = increment(1);

//   });



//   // Remove post reference from removed tags, but DO NOT decrement count or delete tag
//   removedTags.forEach((tag) => {
//     if (!tag) return;
//     updates[`tags/${tag}/posts/${postId}`] = null;
//     // Do NOT decrement count
//   });

//   try {
//     await update(ref(db), updates);
//   } catch (error) {
//     console.error("Failed to update tag references:", error);
//     throw new Error("Failed to update tag references");
//   }
// };


export const updatePostTags = async (postId: string, newTags: string[]) => {
  if (!postId) throw new Error("Post ID is required");

  try {
    // Get current tags from the post
    const snapshot = await get(ref(db, `posts/${postId}/tags`));
    const currentTagsRaw = snapshot.exists() ? snapshot.val() : [];
    const currentTags: string[] = Array.isArray(currentTagsRaw)
      ? currentTagsRaw
      : Object.values(currentTagsRaw || {});

    // Update tags field in the post itself
    await update(ref(db, `posts/${postId}`), {
      tags: newTags,
    });

    const updates: Record<string, any> = {};

    // Remove postId from tags that are being removed
    for (const tag of currentTags) {
      if (!newTags.includes(tag)) {
        updates[`tags/${tag}/posts/${postId}`] = null;
        updates[`tags/${tag}/count`] = increment(-1);
      }
    }

    // Add postId to new tags
    for (const tag of newTags) {
      if (!currentTags.includes(tag)) {
        updates[`tags/${tag}/posts/${postId}`] = true;
        updates[`tags/${tag}/count`] = increment(1);
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log("🔥 Applying tag updates:", updates); // Optional: for debugging
      await update(ref(db), updates);
    }
  } catch (error) {
    console.error("🔥 Failed to update post tags:", error);
    throw new Error("Failed to update post tags");
  }
};

/**
 * Gets all posts with a specific tag
 */
export const getPostsByTag = async (tag: string) => {
  if (!tag) return [];

  // const normalizedTag = (tag);
  // if (!normalizedTag) return [];

  try {
    const snapshot = await get(ref(db, `tags/${tag}/posts/`));
    if (!snapshot.exists()) return [];

    const postIds = Object.keys(snapshot.val());
    return (await Promise.all(postIds.map(id => getPostById(id)))).filter(Boolean);
  } catch (error) {
    console.error('Failed to get posts by tag:', error);
    return [];
  }
};

/**
 * Gets popular tags (with count)
 */
export const getPopularTags = async (limit = 10) => {
  try {
    const snapshot = await get(ref(db, 'tags'));
    if (!snapshot.exists()) return [];

    return Object.entries(snapshot.val())
      .map(([tag, data]: [string, any]) => ({
        tag,
        count: data?.count || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get popular tags:', error);
    return [];
  }
};

// Helper function
const getPostById = async (id: string) => {
  if (!id) return null;

  try {
    const snapshot = await get(ref(db, `posts/${id}`));
    return snapshot.exists() ? { id, ...snapshot.val() } : null;
  } catch (error) {
    console.error(`Failed to get post ${id}:`, error);
    return null;
  }
};