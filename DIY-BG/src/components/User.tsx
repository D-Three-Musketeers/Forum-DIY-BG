import Hero from './Hero';
import { useContext, useState, useEffect, } from 'react';
import { AppContext } from '../state/App.context';
import { updateEmail, } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { useParams, useNavigate } from 'react-router';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth/web-extension';
import { update, ref, get, remove } from 'firebase/database';
import { db } from '../config/firebase-config';
import { Link } from 'react-router';
import { getUserData } from '../services/users.service';
import { getPostsByUID } from '../services/posts.service';
import { DIYCategories , type DIYCategory } from '../enums/diy-enums'

const User = () => {
  const { uid } = useParams();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const { user, userData, refreshUserData } = useContext(AppContext);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [reddirectedUser, setReddirectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoding] = useState(true);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const navigate = useNavigate()

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
    category:string;
    dislikes: number;
    likedBy?: string[]; // Array of user IDs who liked the post
    dislikedBy?: string[]; // Array of user IDs who disliked the post
  }


  useEffect(() => {
    const fetchUserComments = async () => {
      setCommentsLoading(true);
      try {
        const snapshot = await get(ref(db, 'comments'));
        if (snapshot.exists()) {
          const commentsObj = snapshot.val();
          const allComments = Object.values(commentsObj) as any[];
          const filtered = allComments.filter(comment => comment.userUID === uid);
          setUserComments(filtered);
        } else {
          setUserComments([]);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
        setUserComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    if (uid) {
      fetchUserComments();
    }
  }, [uid]);
  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      try {
        const currentUser = user?.uid === uid;
        setIsCurrentUser(currentUser);

        if (currentUser) {
          if (user && user.email) {
            setEmail(user.email);
          }
          setReddirectedUser(userData);
        } else {
          if (uid) {
            const rawData = await getUserData(uid);
            const userProfile = rawData ? (Object.values(rawData)[0] as UserProfile | null) : null;
            setReddirectedUser(userProfile);
            setEmail(userProfile?.email || '');
            console.log(reddirectedUser);
          }
        }
      } catch (error: any) {
        console.error(`Error fetching user data:`, error.message);
      } finally {
        setLoading(false);
        console.log(user);
        console.log(userData);
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
    if (uid) {
      const newUser = await getUserData(uid);
      setReddirectedUser(newUser);
    } else {
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

  if (loading) {
    return <div className="d-flex justify-content-center py-5">Loading...</div>
  }

  if (!reddirectedUser) {
    return <div className='d-flex justify-content-center py-5'>User not found</div>
  }


  return (
    <>
      <Hero />
      <div className="container py-5">
        <div className="row">
          {/* Column 1: User Info */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="text-center mb-0">User Info</h2>
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
                      width: "250px",
                      height: "250px",
                      objectFit: "cover",
                    }}
                  />
                  {isCurrentUser && (
                    <>
                      <div className="mt-3">
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
                                  setReddirectedUser((prev) => ({
                                    ...prev,
                                    photoBase64: typeof base64String === 'string' ? base64String : undefined,
                                  }));
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
                    </>
                  )}
                </div>

                <div className="mb-3"><strong>First Name:</strong> {reddirectedUser?.firstName || 'N/A'}</div>
                <div className="mb-3"><strong>Last Name:</strong> {reddirectedUser?.lastName || 'N/A'}</div>
                <div className="mb-3"><strong>Role:</strong> {reddirectedUser?.admin ? 'Admin' : 'User'}</div>

                <div className="mb-3">
                  <strong>Email:</strong>
                  {isCurrentUser ? (
                    editing ? (
                      <div className="input-group mt-2">
                        <input
                          type="email"
                          className="form-control"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleEmailChange}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="input-group mt-2">
                        <span className="form-control">{email}</span>
                        <button className="btn btn-warning" onClick={() => setEditing(true)}>Edit</button>
                      </div>
                    )
                  ) : (
                    <div className="mt-2">{reddirectedUser?.email || 'N/A'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Posts */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow h-100">
              <div className="card-body">
                <h2 className="text-center mb-4">
                  {isCurrentUser ? 'My Posts' : `${reddirectedUser.firstName}'s Posts`}
                </h2>
                {postsLoading ? (
                  <div className="d-flex justify-content-center py-3">
                    <div className="spinner-border text-primary" role="status" />
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center">
                    <p className="text-muted">No posts yet</p>
                    {isCurrentUser && (
                      <Link to="/create-post" className="btn btn-primary">Create Your First Post</Link>
                    )}
                  </div>
                ) : (
                  <div className="list-group">
                    {userPosts.map((post) => {
                      const hasLiked = post.likedBy?.includes(user?.uid || '');
                      const hasDisliked = post.dislikedBy?.includes(user?.uid || '');
                      return (
                        <div key={post.id} className="list-group-item mb-3 rounded shadow-sm">
                          <h5>{post.title}</h5>
                          <div className="badge bg-primary mb-2">{post.category}</div>
                          <p className="text-truncate">{post.content}</p>
                          <small className="text-muted">Posted on {new Date(post.timestamp).toLocaleString()}</small>
                          <div className="mt-2 d-flex align-items-center gap-3">
                            <span className={`d-flex align-items-center ${hasLiked ? 'text-success' : 'text-secondary'}`}>
                              <FaThumbsUp />
                              <span className="ms-1">{post.likes || 0}</span>
                            </span>
                            <span className={`d-flex align-items-center ${hasDisliked ? 'text-danger' : 'text-secondary'}`}>
                              <FaThumbsDown />
                              <span className="ms-1">{post.dislikes || 0}</span>
                            </span>
                            <Link to={`/post/${post.id}`} className="btn btn-sm btn-outline-primary ms-auto">📃View</Link>
                            {isCurrentUser && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => navigate(`/post/${post.id}?edit=true`)}
                                >
                                  🖋 Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => {
                                    if (window.confirm("Delete this post?")) {
                                      const postToDeleteId = post.id;
                                      // Optimistically update the UI immediately
                                      setUserPosts((prevPosts) =>
                                        prevPosts.filter((p) => p.id !== postToDeleteId)
                                      );
                                      // Initiate the Firebase deletion in the background
                                      remove(ref(db, `posts/${postToDeleteId}`))
                                        .then(() => {
                                          remove(ref(db, `users/${uid}/posts/${postToDeleteId}`));
                                          console.log(`Post with ID ${postToDeleteId} deletion initiated.`);
                                        })
                                        .catch((error) => {
                                          console.error("Error during deletion:", error);
                                          alert("Error deleting post. Please try again.");
                                          // Consider adding logic to revert the UI update on failure if critical
                                          // setUserPosts((prevPosts) => [...prevPosts, post]);
                                        });
                                    }
                                  }}
                                >🗑️ Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Comments */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow h-100">
              <div className="card-body">
                <h2 className="text-center mb-4">
                  {isCurrentUser ? 'My Comments' : `${reddirectedUser.firstName}'s Comments`}
                </h2>
                {commentsLoading ? (
                  <div className="d-flex justify-content-center py-3">
                    <div className="spinner-border text-primary" role="status" />
                  </div>
                ) : userComments.length === 0 ? (
                  <p className="text-muted text-center">No comments found</p>
                ) : (
                  <div className="list-group">
                    {userComments.map((comment) => {
                      const hasLiked = comment.likedBy?.includes(user?.uid);
                      const hasDisliked = comment.dislikedBy?.includes(user?.uid);
                      return (
                        <div key={comment.commentID} className="list-group-item mb-3 rounded shadow-sm">
                          <p className="mb-1">{comment.text}</p>
                          <small className="text-muted">{new Date(comment.timestamp).toLocaleString()}</small>
                          <div className="mt-2 d-flex align-items-center gap-3">
                            <span className={`d-flex align-items-center ${hasLiked ? 'text-success' : 'text-secondary'}`}>
                              <FaThumbsUp />
                              <span className="ms-1">{comment.likedBy?.length || 0}</span>
                            </span>
                            <span className={`d-flex align-items-center ${hasDisliked ? 'text-danger' : 'text-secondary'}`}>
                              <FaThumbsDown />
                              <span className="ms-1">{comment.dislikedBy?.length || 0}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
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