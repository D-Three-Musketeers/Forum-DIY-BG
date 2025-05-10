import { auth } from '../config/firebase-config'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'

export const registerUser = (email:string, password:string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email:string, password:string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
    return signOut(auth);
};

export const authService = {
    registerUser,
    loginUser,
    logoutUser
};

export default authService