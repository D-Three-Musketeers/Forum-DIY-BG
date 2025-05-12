import Hero from './Hero';
import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../state/App.context';
import { updateEmail,  } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { useParams } from 'react-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth/web-extension';
import { update, ref } from 'firebase/database';
import { db } from '../config/firebase-config';
import { Link } from 'react-router';
import { getUserData } from '../services/users.service';
import { getPostsByUID } from '../services/posts.service';

const User = () => {
  const { uid } = useParams();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const { user, userData ,refreshUserData} = useContext(AppContext);
  const [isCurrentUser , setIsCurrentUser] = useState(false);
  const [reddirectedUser, setReddirectedUser] = useState<UserProfile | null>(null);
  const[loading , setLoading] = useState(true);
  const[userPosts , setUserPosts] = useState<Post[]>([]);
  const[postsLoading , setPostsLoding] = useState(true);

  interface UserProfile {
    photoBase64?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    admin?: boolean;
  }

  interface Post {
    id: string;
    title: string;
    content: string;
    timestamp: string;
    likes: number;
    dislikes: number;
  }

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      try {
        const currentUser = user?.uid === uid;
        setIsCurrentUser(currentUser);

        if(currentUser){
          if(user && user.email) {
            setEmail(user.email);
          }
          setReddirectedUser(userData);
        }else{
          if(uid){
            const rawData = await getUserData(uid);
            const userProfile = rawData ? (Object.values(rawData)[0] as UserProfile | null) : null;
            setReddirectedUser(userProfile);
            setEmail(userProfile?.email || '');
            console.log(reddirectedUser);
          }
        }
      }catch(error:any){
        console.error(`Error fetching user data:` , error.message);
      }finally {
        setLoading(false);
      }
    }
    checkUser();
  }, [uid, user]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (uid) {
        setPostsLoding(true);
        try {
          const posts = await getPostsByUID(uid);
          setUserPosts(posts);
        } catch (error) {
          console.error('Error fetching user posts:', error);
        } finally {
          setPostsLoding(false);
        }
      }
    };

    fetchUserPosts();
  }, [uid]);


  const handleNotCurrentUser = async () => {
    if(uid) {
      const newUser = await getUserData(uid);
      setReddirectedUser(newUser);
    }else {
      console.error(`UID is undefined`);
    }
  }

  const handleEmailChange = async () => {
    if (auth.currentUser && user?.email) {
      try {
        const password = prompt('Enter your current password:');
        if (!password) return;

        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);

        // Now that user is re-authenticated, try to update email
        await updateEmail(auth.currentUser, email);
        await update(ref(db, `users/${userData.handle}`), {
          email: email,
        });

        alert('Email updated. Please verify your new email address.');
        refreshUserData();
      } catch (error: any) {
        console.error('Error updating email:', error.message);
        alert(error.message);
      }
    }
  };

  // if (!user || user.uid !== uid) return <p>Unauthorized or user not found</p>;

  if(loading) {
    return<div className="d-flex justify-content-center py-5">Loading...</div>
  }

  if(!reddirectedUser){
    return <div className='d-flex justify-content-center py-5'>User not found</div>
  }


 return (
    <>
      <Hero />
      <div className="container py-5">
        <div className="row justify-content-center">
          {/* User Information Card */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="text-center mb-0">User Information</h2>
                  {!isCurrentUser && (
                    <Link to="/" className="btn btn-sm btn-outline-secondary">
                      Back
                    </Link>
                  )}
                </div>

                <div className="text-center mb-4">
                  <img
                    src={reddirectedUser?.photoBase64 || "default-avatar-diy.webp"}
                    alt="Profile"
                    className="rounded-circle shadow-sm border"
                    style={{
                      width: "180px",
                      height: "180px",
                      objectFit: "cover",
                      marginBottom: "0.5rem",
                    }}
                  />
                  {isCurrentUser && (
                    <div className="mt-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => document.getElementById('avatarInput')?.click()}
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
                  )}
                </div>

                <div className="mb-3">
                  <strong>First Name:</strong> {reddirectedUser?.firstName || 'N/A'}
                </div>
                <div className="mb-3">
                  <strong>Last Name:</strong> {reddirectedUser?.lastName || 'N/A'}
                </div>
                <div className="mb-3">
                  <strong>Role:</strong> {reddirectedUser?.admin ? 'Admin' : 'User'}
                </div>

                <div className="mb-4">
                  <strong>Email:</strong>
                  {isCurrentUser ? (
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
                            <button
                              className="btn btn-primary"
                              onClick={handleEmailChange}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setEditing(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="form-control">{user?.email || 'N/A'}</span>
                          <button
                            className="btn btn-warning mt-2"
                            onClick={() => setEditing(true)}
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span>{reddirectedUser?.email || 'N/A'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Posts Card */}
          <div className="col-lg-8">
            <div className="card shadow">
              <div className="card-body">
                <h2 className="text-center mb-4">
                  {isCurrentUser ? 'My Posts' : `${reddirectedUser.firstName}'s Posts`}
                </h2>
                
                {postsLoading ? (
                  <div className="d-flex justify-content-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading posts...</span>
                    </div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-newspaper display-5 text-muted mb-3"></i>
                    <p className="text-muted">No posts yet</p>
                    {isCurrentUser && (
                      <Link to="/create-post" className="btn btn-primary">
                        Create Your First Post
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="list-group">
                    {userPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="list-group-item mb-3 rounded shadow-sm"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="w-75">
                            <h5>{post.title}</h5>
                            <p className="mb-1 text-truncate">{post.content}</p>
                            <small className="text-muted">
                              Posted on {new Date(post.timestamp).toLocaleString()}
                            </small>
                          </div>
                          <div className="d-flex flex-column align-items-end">
                            <span className="badge bg-success rounded-pill mb-1">
                              <i className="bi bi-hand-thumbs-up"></i> {post.likes}
                            </span>
                            <span className="badge bg-danger rounded-pill">
                              <i className="bi bi-hand-thumbs-down"></i> {post.dislikes}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Link 
                            to={`/post/${post.id}`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            View Post
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default User;
