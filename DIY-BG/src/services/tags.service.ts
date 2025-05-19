import { get, ref, update, increment } from "firebase/database";
import { db } from "../config/firebase-config";

/**
 * Updates global tags collection when post tags change
 */
const updateTagReferences = async (
  postId: string,
  addedTags: string[],
  removedTags: string[]
) => {
  if (!postId) throw new Error('Post ID is required');
  
  const updates: Record<string, any> = {};

  // Process added tags
  addedTags.forEach((tag) => {
    if (!tag) return;
    updates[`tags/${tag}/posts/${postId}`] = true;
    updates[`tags/${tag}/count`] = increment(1);
  });

  // Process removed tags
  removedTags.forEach((tag) => {
    if (!tag) return;
    updates[`tags/${tag}/posts/${postId}`] = null;
    updates[`tags/${tag}/count`] = increment(-1);
  });

  try {
    await update(ref(db), updates);
  } catch (error) {
    console.error('Failed to update tag references:', error);
    throw new Error('Failed to update tag references');
  }
};

/**
 * Manages post tags and maintains global tag collection
 */
export const updatePostTags = async (postId: string, newTags: string[]) => {
  if (!postId) throw new Error('Post ID is required');
  if (!Array.isArray(newTags)) throw new Error('Tags must be an array');

  // Normalize and deduplicate tags
  const normalizedNewTags = [...new Set(newTags
    .filter(tag => tag.length > 1)
  )];

  try {
    // Get current tags
    const postSnapshot = await get(ref(db, `posts/${postId}/tags`));
    const currentTags: string[] = postSnapshot.exists() ? postSnapshot.val() || [] : [];

    // Calculate changes
    const tagsToAdd = normalizedNewTags.filter(t => !currentTags.includes(t));
    const tagsToRemove = currentTags.filter(t => !normalizedNewTags.includes(t));

    // Update post's tags
    await update(ref(db, `posts/${postId}`), {
      tags: normalizedNewTags
    });

    // Update global tag references if needed
    if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
      await updateTagReferences(postId, tagsToAdd, tagsToRemove);
    }
  } catch (error) {
    console.error('Failed to update post tags:', error);
    throw new Error('Failed to update post tags');
  }
};

/**
 * Gets all posts with a specific tag
 */
export const getPostsByTag = async (tag: string) => {
  if (!tag) return [];
  
  const normalizedTag = (tag);
  if (!normalizedTag) return [];

  try {
    const snapshot = await get(ref(db, `tags/${normalizedTag}/posts`));
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