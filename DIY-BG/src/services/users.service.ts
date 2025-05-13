import { get, set, ref, query, equalTo, orderByChild } from "firebase/database";
import { db } from "../config/firebase-config";

export const getUserByHandle = async (handle: string) => {
  const snapshot = await get(ref(db, `users/${handle}`));
  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

export const makeHandle = (firstName: string, lastName: string) => {
  const handle = `${firstName} ${lastName}`;
  return handle;
};

export const createUserHandle = async (
  handle: string,
  uid: string,
  email: string,
  firstName: string,
  lastName: string,
  photoBase64: string
) => {
  const user = {
    handle,
    uid,
    email,
    createdOn: new Date().toLocaleDateString(),
    admin: false,
    firstName,
    lastName,
    photoBase64,
    isBanned: false,
  };

  await set(ref(db, `users/${handle}`), user);
};

export const getUserData = async (uid: string) => {
  // Query to find the user with a matching UID
  const snapshot = await get(
    query(ref(db, "users"), orderByChild("uid"), equalTo(uid))
  );

  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

/**
 * Checks if the user is banned by their UID.
 * Returns true if banned, false otherwise.
 */
type UserRecord = {
  uid: string;
  isBanned?: boolean;
  [key: string]: any;
};

export const checkIfBanned = async (uid: string): Promise<boolean> => {
  try {
    const snapshot = await get(ref(db, "users"));
    if (!snapshot.exists()) return false;

    const users = snapshot.val();
    const userEntry = Object.values(users).find(
      (user: any) => (user as UserRecord).uid === uid
    ) as UserRecord;

    if (userEntry?.isBanned === true) {
      alert(
        "🚫 You are banned by the admins! You can't post, comment or like/unlike! 🚫"
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking ban status:", error);
    return false;
  }
};
