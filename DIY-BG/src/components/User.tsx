import Hero from './Hero';
import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../state/App.context';
import { updateEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase-config';
import { useParams } from 'react-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth/web-extension';
import { update, ref, get, child } from 'firebase/database';
import { getAllPosts } from '../services/posts.service';

// Interfaces
interface CommentData {
  id: string;
  postId: string;
  text: string;
  timestamp: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  uid: string;
  timestamp: string;
}

const User = () => {
  const { uid } = useParams();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const { user, userData, refreshUserData } = useContext(AppContext);
  const [userComments, setUserComments] = useState<CommentData[]>([]);
  const [userPosts, setUserPosts] = useState<PostData[]>([]);

  useEffect(() => {
    if (user?.uid === uid) {
      if (user && user.email) {
        setEmail(user.email);
      }

      if (uid) {
        fetchUserComments(uid);
        fetchUserPosts(uid);
      }
    }
  }, [uid, user]);

  const fetchUserComments = async (uid: string) => {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "posts"));

    const comments: CommentData[] = [];

    if (snapshot.exists()) {
      const posts = snapshot.val();

      for (const postId in posts) {
        const post = posts[postId];
        const postComments = post.comments || {};

        for (const commentId in postComments) {
          const comment = postComments[commentId];
          if (comment.uid === uid) {
            comments.push({
              id: commentId,
              postId,
              text: comment.text,
              timestamp: comment.timestamp,
            });
          }
        }
      }
    }

    setUserComments(comments);
  };

  const fetchUserPosts = async (uid: string) => {
  const posts =await getAllPosts()

      

    if (user) {
      setUserPosts(
        posts
          .filter(post => post.userUID === uid)
          .map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            uid: post.userUID,
            timestamp: post.timestamp,
          }))
      );
    }
  };

  const handleEmailChange = async () => {
    if (auth.currentUser && user?.email) {
      try {
        const password = prompt('Enter your current password:');
        if (!password) return;

        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);

        await updateEmail(auth.currentUser, email);
        await update(ref(db, `users/${userData.handle}`), {
          email: email,
        });

        alert('Email updated. Please verify your new email address.');
      } catch (error: any) {
        console.error('Error updating email:', error.message);
        alert(error.message);
      }
    }
  };

  if (!user || user.uid !== uid) return <p>Unauthorized or user not found</p>;

  return (
    <div className="container-fluid p-0">
      <Hero />
      <div className="row justify-content-center pt-3 pb-5">
        {/* User Info Column */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="text-center mb-4">User Information</h2>
              <div className="text-center mb-4">
                <img
                  src={userData?.photoBase64 || "default-avatar-diy.webp"}
                  alt="Profile"
                  className="rounded-circle shadow-sm border"
                  style={{
                    width: "180px",
                    height: "180px",
                    objectFit: "cover",
                    marginBottom: "0.5rem",
                  }}
                />
                <div className="mt-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      document.getElementById('avatarInput')?.click()
                    }
                  >
                    Change Picture
                  </button>
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && user) {
                        try {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64String = reader.result;
                            await update(ref(db, `users/${userData.handle}`), {
                              photoBase64: base64String,
                            });
                            await refreshUserData();
                            alert('Profile picture updated!');
                          };
                          reader.readAsDataURL(file);
                        } catch (err: any) {
                          console.error('Upload failed:', err);
                          alert('Error uploading image: ' + err.message);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mb-3"><strong>First Name:</strong> {userData?.firstName}</div>
              <div className="mb-3"><strong>Last Name:</strong> {userData?.lastName}</div>
              <div className="mb-3"><strong>Role:</strong> {userData?.admin ? "Admin" : "User"}</div>

              <div className="mb-4">
                <strong>Email:</strong>
                <div className="input-group mt-2">
                  {editing ? (
                    <>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <div className="input-group-append">
                        <button className="btn btn-primary" onClick={handleEmailChange}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="form-control">{user.email}</span>
                      <button className="btn btn-warning mt-2" onClick={() => setEditing(true)}>Edit</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Column */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body overflow-auto">
              <h4 className="text-center mb-4">User Posts</h4>
              {userPosts?.length > 0 ? (
                userPosts.map((post) => (
                  <div key={post.id} className="mb-3 p-3 border rounded bg-light">
                    <h5>{post.title}</h5>
                    <p>{post.content}</p>
                    <small className="text-muted">
                      {new Date(post.timestamp).toLocaleString()}
                    </small>
                  </div>
                ))
              ) : (
                <p>No posts available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Comments Column */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body overflow-auto">
              <h4 className="text-center mb-4">User Comments</h4>
              {userComments?.length > 0 ? (
                userComments.map((comment) => (
                  <div key={comment.id} className="mb-3 p-3 border rounded bg-light">
                    <p>{comment.text}</p>
                    <small className="text-muted">
                      On Post ID: {comment.postId}<br />
                      {new Date(comment.timestamp).toLocaleString()}
                    </small>
                  </div>
                ))
              ) : (
                <p>No comments available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default User;
