import {get , set , ref ,query , equalTo , orderByChild } from 'firebase/database'
import {db } from '../config/firebase-config'

export const getUserByHandle = async (handle:string) => {
    const snapshot = await get(ref(db , `users/${handle}`));
    if(snapshot.exists()) {
        return snapshot.val();
    }else {
        return null;
    }
}

export const makeHandle = (firstName:string , lastName:string) => {
    const handle = `${firstName} ${lastName}`;
    return handle;
}

export const createUserHandle = async (handle:string , uid:string , email:string) => {
    const user={
        handle,
        uid,
        email,
        createdOn:new Date().toLocaleDateString(),
        admin:false,
    }

    await set(ref(db, `users/${handle}`),user);
}

export const getUserData = async (uid:string) => {
    const snapshot = await get(query(ref(db,'users'),orderByChild('uid'),equalTo(uid)));

    return snapshot.val();
} 