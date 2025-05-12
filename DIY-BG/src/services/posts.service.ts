import {get , set , ref ,query , equalTo , orderByChild ,push , update} from 'firebase/database'
import {db } from '../config/firebase-config'

export const createPost = async (
    title: string,
    content: any,
    userUID: string,
    userHandle: string,
    timestamp: string
) => {
    const result = await push(ref(db , 'posts'));
    const id = result.key;

    const post = {id ,title, content, userUID, userHandle, timestamp}
    await set(ref(db , `posts/${id}`) , post)
}

export const getPostByID  = async (id:any) => {
    const snapshot = await get(ref(db , `posts/${id}`))
    if(snapshot.exists()) {
        return snapshot.val();
    }else {
        return null;
    }
}