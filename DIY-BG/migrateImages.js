// migrateImages.js

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import fetch from "node-fetch"; // npm install node-fetch@2
import fs from "fs";
import path from "path";

// Initialize Firebase Admin SDK
import dotenv from "dotenv";
dotenv.config();

initializeApp({
  credential: applicationDefault(),
  databaseURL: process.env.VITE_FIREBASE_URL,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
});

const db = getDatabase();
const bucket = getStorage().bucket();

async function uploadBase64Image(base64, destPath) {
  // base64: data:image/png;base64,xxxx
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 string");
  const buffer = Buffer.from(matches[2], "base64");
  const file = bucket.file(destPath);
  await file.save(buffer, { contentType: matches[1] });
  await file.makePublic(); // or use getSignedUrl if you want private
  return file.publicUrl();
}

async function migrate() {
  const postsRef = db.ref("posts");
  const snapshot = await postsRef.once("value");
  const posts = snapshot.val();
  if (!posts) {
    console.log("No posts found.");
    return;
  }

  for (const [postId, post] of Object.entries(posts)) {
    if (!post.images || !Array.isArray(post.images)) continue;
    let updated = false;
    const newImages = [];
    for (let i = 0; i < post.images.length; i++) {
      const img = post.images[i];
      if (typeof img === "string" && img.startsWith("data:image/")) {
        // It's a base64 image, upload it
        const destPath = `post_images/migrated_${postId}_${i}_${Date.now()}.webp`;
        try {
          const url = await uploadBase64Image(img, destPath);
          newImages.push(url);
          updated = true;
          console.log(`Migrated image for post ${postId} [${i}]`);
        } catch (err) {
          console.error(
            `Failed to migrate image for post ${postId} [${i}]:`,
            err
          );
          newImages.push(img); // fallback, don't lose data
        }
      } else {
        // Already a URL
        newImages.push(img);
      }
    }
    if (updated) {
      await postsRef.child(postId).update({ images: newImages });
      console.log(`Updated post ${postId} with new image URLs.`);
    }
  }
  console.log("Migration complete.");
}

migrate().catch(console.error);
