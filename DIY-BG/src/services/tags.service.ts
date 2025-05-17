import { get, ref,  update, } from "firebase/database";
import { db } from "../config/firebase-config";

/**
 * Adds tags to a post and creates new tags in the database if they don't exist
 */
export const addTagsToPost = async (postId: string, tags: string[]) => {
  // Normalize tags to lowercase and remove duplicates
  const normalizedTags = [...new Set(tags.map(tag => tag.toLowerCase()))];

  // Get the post first to verify it exists
  const postSnapshot = await get(ref(db, `posts/${postId}`));
  if (!postSnapshot.exists()) {
    throw new Error("Post does not exist");
  }

  // Update the post with new tags (merge with existing)
  const currentTags = postSnapshot.val().tags || [];
  const updatedTags = [...new Set([...currentTags, ...normalizedTags])];
  
  await update(ref(db, `posts/${postId}`), {
    tags: updatedTags
  });

  // Add each tag to the global tags collection if it doesn't exist
  const tagUpdates: Record<string, any> = {};
  normalizedTags.forEach(tag => {
    tagUpdates[`tags/${tag}/posts/${postId}`] = true;
    tagUpdates[`posts/${postId}/tagDetails/${tag}`] = true;
  });

  await update(ref(db), tagUpdates);
};

/**
 * Removes tags from a post
 */
export const removeTagsFromPost = async (postId: string, tags: string[]) => {
  const normalizedTags = tags.map(tag => tag.toLowerCase());

  // Remove tags from the post
  const postSnapshot = await get(ref(db, `posts/${postId}`));
  if (!postSnapshot.exists()) {
    throw new Error("Post does not exist");
  }

  const currentTags = postSnapshot.val().tags || [];
  const updatedTags = currentTags.filter((tag: string) => !normalizedTags.includes(tag));

  await update(ref(db, `posts/${postId}`), {
    tags: updatedTags
  });

  // Remove post references from tags
  const tagUpdates: Record<string, any> = {};
  normalizedTags.forEach(tag => {
    tagUpdates[`tags/${tag}/posts/${postId}`] = null;
    tagUpdates[`posts/${postId}/tagDetails/${tag}`] = null;
  });

  await update(ref(db), tagUpdates);
};

/**
 * Gets all posts with a specific tag
 */
export const getPostsByTag = async (tag: string) => {
  const normalizedTag = tag.toLowerCase();
  const snapshot = await get(ref(db, `tags/${normalizedTag}/posts`));
  
  if (!snapshot.exists()) {
    return [];
  }

  const postIds = Object.keys(snapshot.val());
  const posts = await Promise.all(postIds.map(id => getPostById(id)));
  return posts.filter(post => post !== null);
};

/**
 * Gets all available tags
 */
export const getAllTags = async () => {
  const snapshot = await get(ref(db, 'tags'));
  if (!snapshot.exists()) {
    return [];
  }
  return Object.keys(snapshot.val());
};

/**
 * Gets tags for a specific post
 */
export const getTagsForPost = async (postId: string) => {
  const snapshot = await get(ref(db, `posts/${postId}/tags`));
  if (!snapshot.exists()) {
    return [];
  }
  return snapshot.val() || [];
};

/**
 * Searches posts by tag (partial match)
 */
export const searchPostsByTag = async (searchTerm: string) => {
  const allTags = await getAllTags();
  const searchTermLower = searchTerm.toLowerCase();
  
  const matchingTags = allTags.filter(tag => 
    tag.includes(searchTermLower)
  );

  const postsPromises = matchingTags.map(tag => getPostsByTag(tag));
  const postsArrays = await Promise.all(postsPromises);
  
  // Flatten and remove duplicates
  const uniquePosts = new Map();
  postsArrays.flat().forEach(post => {
    if (post && !uniquePosts.has(post.id)) {
      uniquePosts.set(post.id, post);
    }
  });

  return Array.from(uniquePosts.values());
};

// Helper function (you might already have this in posts.service.ts)
const getPostById = async (id: string) => {
  const snapshot = await get(ref(db, `posts/${id}`));
  return snapshot.exists() ? { id, ...snapshot.val() } : null;
};