import Hero from "./Hero";
import defaultImagePath from "../../public/default-avatar-diy.webp";
import { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "../state/App.context";
import { updateEmail } from "firebase/auth";
import { auth } from "../config/firebase-config";
import { useParams, useNavigate } from "react-router";
import { FaThumbsUp, FaThumbsDown, FaRegComment } from "react-icons/fa";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth/web-extension";
import { update, ref, get, remove } from "firebase/database";
import { db } from "../config/firebase-config";
import { Link } from "react-router";
import { getUserData, checkIfBanned } from "../services/users.service";
import { deletePostCompletely } from "../services/posts.service";
// import { DIYCategories, type DIYCategory } from '../enums/diy-enums'
import {
  handleDislikeUserComment,
  handleLikeUserComment,
  handleLikeUserPost,
  handleDislikeUserPost,
  type Post,
} from "../utils/likeDislike.utils";
import { imageToBase64 } from "../utils/imageToBase64";
import TagDisplay from "./Post/TagDisplay";
// Language
import { useTranslation } from "react-i18next";

const User = () => {
  const { t } = useTranslation();
  const [defaultImage, setDefaultImage] = useState<string>("");
  const [postsSortMethod, setPostsSortMethod] = useState<string>("mostRecent");
  const [isPostsSorting, setIsPostsSorting] = useState(false);
  const { uid } = useParams();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const { user, userData, refreshUserData } = useContext(AppContext);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [reddirectedUser, setReddirectedUser] = useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoding] = useState(true);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [postsPerPage] = useState(3);
  const [currentPostsPage, setCurrentPostsPage] = useState(1);
  const [commentsPerPage] = useState(5);
  const [currentCommentsPage, setCurrentCommentsPage] = useState(1);
  const navigate = useNavigate();

  interface UserProfile {
    photoBase64?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    admin?: boolean;
  }

  const fetchUserComments = async () => {
    setCommentsLoading(true);
    try {
      const commentsSnapshot = await get(ref(db, "comments"));
      if (commentsSnapshot.exists()) {
        const commentsObj = commentsSnapshot.val();
        const userCommentsWithKeys = Object.entries(commentsObj)
          .filter(([, comment]: [string, any]) => comment?.userUID === uid)
          .map(([commentId, comment]: [string, any]) => ({
            commentId, // Use consistent naming
            ...comment,
            likedBy: comment.likedBy || [],
            dislikedBy: comment.dislikedBy || [],
            likes: comment.likedBy?.length || 0,
            dislikes: comment.dislikedBy?.length || 0,
          }));

        setUserComments(userCommentsWithKeys);
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

  useEffect(() => {
    if (uid) {
      fetchUserComments();
    }
  }, [uid]);

  useEffect(() => {
    const convertDefaultImage = async () => {
      try {
        const base64 = await imageToBase64(defaultImagePath);
        setDefaultImage(base64);
      } catch (error) {
        console.error("Failed to convert default image:", error);
        // Fallback to path if conversion fails
        setDefaultImage(defaultImagePath);
      }
    };

    convertDefaultImage();
  }, []);
  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
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
            const userProfile = rawData
              ? (Object.values(rawData)[0] as UserProfile | null)
              : null;
            setReddirectedUser(userProfile);
            setEmail(userProfile?.email || "");
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
    };
    checkUser();
  }, [uid, user]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!uid) return;

      setPostsLoding(true);
      try {
        const postsSnapshot = await get(ref(db, "posts"));
        const commentsSnapshot = await get(ref(db, "comments"));

        if (postsSnapshot.exists()) {
          const postsObj = postsSnapshot.val();
          const commentsObj = commentsSnapshot.exists()
            ? commentsSnapshot.val()
            : {};

          const userPosts = Object.entries(postsObj)
            .filter(
              ([_, post]: [string, any]) => (post as any)?.userUID === uid
            )
            .map(([postId, post]) => {
              const p = post as any;
              // Count comments for this post
              const commentCount = Object.values(commentsObj).filter(
                (comment: any) => comment.postID === postId
              ).length;

              return {
                id: postId,
                ...p,
                likedBy: p.likedBy || [],
                dislikedBy: p.dislikedBy || [],
                likes: p.likedBy?.length || 0,
                dislikes: p.dislikedBy?.length || 0,
                commentCount, // Add comment count to each post
              };
            });

          setUserPosts(userPosts);
        } else {
          setUserPosts([]);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setPostsLoding(false);
      }
    };

    fetchUserPosts();
  }, [uid]);

  // const handleNotCurrentUser = async () => {
  //   if (uid) {
  //     const newUser = await getUserData(uid);
  //     setReddirectedUser(newUser);
  //   } else {
  //     console.error(`UID is undefined`);
  //   }
  // }

  const handleEmailChange = async () => {
    if (auth.currentUser && user?.email) {
      try {
        const password = prompt("Enter your current password:");
        if (!password) return;

        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);

        // Now that user is re-authenticated, try to update email
        await updateEmail(auth.currentUser, email);
        await update(ref(db, `users/${userData.handle}`), {
          email: email,
        });

        alert("Email updated. Please verify your new email address.");
        refreshUserData();
      } catch (error: any) {
        console.error("Error updating email:", error.message);
        alert(error.message);
      }
    }
  };

  const handleEditComment = (commentId: string, postId: string) => {
    navigate(`/post/${postId}?commentId=${commentId}&editComment=true`);
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (window.confirm(t("user.confirmDeleteComment"))) {
      try {
        await remove(ref(db, `posts/${postId}/comments/${commentId}`));
        await remove(ref(db, `comments/${commentId}`));
        setUserComments((prevComments) =>
          prevComments.filter((comment) => comment.commentId !== commentId)
        );
        alert(t("user.commentDeleted"));
      } catch (error: any) {
        console.error("Error deleting comment:", error.message);
        alert(t("user.deleteCommentError") + error.message);
      }
    }
  };

  const PostSkeleton = () => (
    <div className="list-group-item mb-3 rounded shadow-sm placeholder-glow">
      <div className="placeholder col-8 mb-2" style={{ height: "24px" }}></div>
      <div className="badge bg-secondary placeholder col-3 mb-2"></div>
      <div className="placeholder col-12 mb-1"></div>
      <div className="placeholder col-10 mb-3"></div>
      <div className="d-flex gap-2">
        <div className="placeholder col-2" style={{ height: "24px" }}></div>
        <div className="placeholder col-2" style={{ height: "24px" }}></div>
        <div
          className="placeholder col-2 ms-auto"
          style={{ height: "24px" }}
        ></div>
      </div>
    </div>
  );

  const sortedUserPosts = useMemo(() => {
    setIsPostsSorting(true);
    const postsToSort = [...userPosts];

    switch (postsSortMethod) {
      case "topLiked":
        postsToSort.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case "topDisliked":
        postsToSort.sort((a, b) => (b.dislikes || 0) - (a.dislikes || 0));
        break;
      case "mostCommented":
        postsToSort.sort(
          (a, b) => (b.commentCount || 0) - (a.commentCount || 0)
        );
        break;
      case "mostRecent":
      default:
        postsToSort.sort(
          (a, b) =>
            new Date(b.timestamp || 0).getTime() -
            new Date(a.timestamp || 0).getTime()
        );
    }

    setTimeout(() => setIsPostsSorting(false), 300);
    return postsToSort;
  }, [userPosts, postsSortMethod]);

  const indexOfLastPost = currentPostsPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedUserPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPostsPages = Math.ceil(sortedUserPosts.length / postsPerPage);

  const indexOfLastComment = currentCommentsPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = userComments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );
  const totalCommentsPages = Math.ceil(userComments.length / commentsPerPage);

  // if (!user || user.uid !== uid) return <p>Unauthorized or user not found</p>;

  if (loading) {
    return <div className="d-flex justify-content-center py-5">Loading...</div>;
  }

  if (!reddirectedUser) {
    return (
      <div className="d-flex justify-content-center py-5">User not found</div>
    );
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
                <h2 className="text-center mb-0">{t("user.infoTitle")}</h2>
                {!isCurrentUser && (
                  <Link to="/" className="btn btn-sm btn-outline-secondary">
                    {t("user.back")}
                  </Link>
                )}
              </div>

              <div className="text-center mb-4">
                <img
                  src={reddirectedUser?.photoBase64 || defaultImage}
                  alt="Profile"
                  className="rounded-circle shadow-sm border"
                  style={{
                    width: "250px",
                    height: "250px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/default-avatar-diy.webp";
                    e.currentTarget.onerror = null;
                  }}
                />
                {isCurrentUser && (
                  <div className="mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        document.getElementById("avatarInput")?.click()
                      }
                    >
                      {t("user.changePicture")}
                    </button>
                    <input
                      id="avatarInput"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && user) {
                          try {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const base64String = reader.result;
                              await update(
                                ref(db, `users/${userData.handle}`),
                                { photoBase64: base64String }
                              );
                              setReddirectedUser((prev) => ({
                                ...prev,
                                photoBase64:
                                  typeof base64String === "string"
                                    ? base64String
                                    : undefined,
                              }));
                              await refreshUserData();
                              alert(t("user.pictureUpdated"));
                            };
                            reader.readAsDataURL(file);
                          } catch (err: any) {
                            console.error("Upload failed:", err);
                            alert(t("user.uploadError") + err.message);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <strong>{t("user.firstName")}:</strong>{" "}
                {reddirectedUser?.firstName || "N/A"}
              </div>
              <div className="mb-3">
                <strong>{t("user.lastName")}:</strong>{" "}
                {reddirectedUser?.lastName || "N/A"}
              </div>
              <div className="mb-3">
                <strong>{t("user.role")}:</strong>{" "}
                {reddirectedUser?.admin ? t("user.admin") : t("user.user")}
              </div>

              <div className="mb-3">
                <strong>{t("user.email")}:</strong>
                {isCurrentUser ? (
                  editing ? (
                    <div className="input-group mt-2">
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleEmailChange}
                      >
                        {t("user.save")}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setEditing(false)}
                      >
                        {t("user.cancel")}
                      </button>
                    </div>
                  ) : (
                    <div className="input-group mt-2">
                      <span className="form-control">{email}</span>
                      <button
                        className="btn btn-warning"
                        onClick={() => setEditing(true)}
                      >
                        {t("user.edit")}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="mt-2">
                    {reddirectedUser?.email || "N/A"}
                  </div>
                )}
              </div>

              {isCurrentUser && userData?.admin && (
                <div className="text-center mt-3">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => navigate("/admin")}
                  >
                    🛠️ Go to Admin Panel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Posts */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow h-100">
            <div className="card-body">
              <h2 className="text-center mb-4">
                {isCurrentUser
                  ? t("user.myPosts")
                  : t("user.posts", {
                    name: reddirectedUser?.firstName || "User",
                  })}
              </h2>

              <div className="d-flex justify-content-center mb-3">
                <div className="btn-group" role="group">
                  <button
                    className={`btn btn-sm ${postsSortMethod === "mostRecent"
                        ? "btn-primary"
                        : "btn-outline-primary"
                      }`}
                    onClick={() => setPostsSortMethod("mostRecent")}
                  >
                    {t("home.mostRecent")}
                  </button>
                  <button
                    className={`btn btn-sm ${postsSortMethod === "topLiked"
                        ? "btn-primary"
                        : "btn-outline-primary"
                      }`}
                    onClick={() => setPostsSortMethod("topLiked")}
                  >
                    {t("home.topLiked")}
                  </button>
                  <button
                    className={`btn btn-sm ${postsSortMethod === "topDisliked"
                        ? "btn-primary"
                        : "btn-outline-primary"
                      }`}
                    onClick={() => setPostsSortMethod("topDisliked")}
                  >
                    {t("home.topDisliked")}
                  </button>
                  <button
                    className={`btn btn-sm ${postsSortMethod === "mostCommented"
                        ? "btn-primary"
                        : "btn-outline-primary"
                      }`}
                    onClick={() => setPostsSortMethod("mostCommented")}
                  >
                    {t("home.mostCommented")}
                  </button>
                </div>
              </div>

              {isPostsSorting && (
                <div className="text-center mb-2">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  >
                    <span className="visually-hidden">Sorting...</span>
                  </div>
                </div>
              )}

              {postsLoading ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : currentPosts.length === 0 ? (
                <div className="text-center">
                  <p className="text-muted">{t("user.noPosts")}</p>
                  {isCurrentUser && (
                    <Link to="/create-post" className="btn btn-primary">
                      {t("user.createFirstPost")}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="list-group">
                  {currentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="list-group-item mb-3 rounded shadow-sm"
                    >
                      <h5>{post.title}</h5>
                      <div className="badge bg-primary mb-2">
                        {t(`home.categories.${post.category}`)}
                      </div>
                      {Array.isArray(post.tags) && post.tags.length > 0 && <TagDisplay tags={post.tags} maxTags={3} />}
                      <p className="text-truncate">{post.content}</p>
                      <div className="d-flex align-items-center gap-2 text-muted">
                        <small>
                          {t("user.postedOn")} {new Date(post.timestamp).toLocaleString()}
                        </small>
                        <div className="d-flex align-items-center gap-1">
                          <FaRegComment />
                          <span>{post.commentCount || 0}</span>
                        </div>
                      </div>
                      <div className="mt-2 d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <button
                            onClick={() =>
                              handleLikeUserPost(
                                user?.uid,
                                post,
                                setUserPosts
                              )
                            }
                            className={`btn p-0 border-0 bg-transparent ${post.likedBy?.includes(user?.uid ?? "")
                                ? "text-success"
                                : "text-secondary"
                              }`}
                            disabled={!user}
                            title={!user ? t("user.loginToLike") : ""}
                          >
                            <FaThumbsUp />{" "}
                            <span className="ms-1">{post.likes || 0}</span>
                          </button>
                          <button
                            onClick={() =>
                              handleDislikeUserPost(
                                user?.uid,
                                post,
                                setUserPosts
                              )
                            }
                            className={`btn p-0 border-0 bg-transparent ${post.dislikedBy?.includes(user?.uid ?? "")
                                ? "text-danger"
                                : "text-secondary"
                              }`}
                            disabled={!user}
                            title={!user ? t("user.loginToDislike") : ""}
                          >
                            <FaThumbsDown />{" "}
                            <span className="ms-1">{post.dislikes || 0}</span>
                          </button>
                        </div>
                        <Link
                          to={`/post/${post.id}`}
                          className="btn btn-sm btn-outline-primary ms-auto"
                        >
                          {t("user.view")}
                        </Link>
                        {isCurrentUser && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(`/post/${post.id}?edit=true`)
                              }
                            >
                              🖋 {t("user.edit")}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={async () => {
                                try {
                                  const isBanned = await checkIfBanned(
                                    userData.uid
                                  );
                                  if (isBanned) {
                                    alert(t("user.banned"));
                                    return;
                                  }
                                  await deletePostCompletely(post.id);
                                  setUserPosts((prev) =>
                                    prev.filter((p) => p.id !== post.id)
                                  );
                                  await fetchUserComments();
                                } catch (error) {
                                  alert(t("user.deleteError"));
                                }
                              }}
                            >
                              🗑️ {t("user.delete")}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPostsPages > 1 && (
                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      setCurrentPostsPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPostsPage === 1}
                  >
                    {t("user.prev")}
                  </button>
                  <span>
                    {t("user.page")} {currentPostsPage} {t("user.of")}{" "}
                    {totalPostsPages}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      setCurrentPostsPage((prev) =>
                        Math.min(prev + 1, totalPostsPages)
                      )
                    }
                    disabled={currentPostsPage === totalPostsPages}
                  >
                    {t("user.next")}
                  </button>
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
                {isCurrentUser
                  ? t("user.myComments")
                  : t("user.comments", {
                    name: reddirectedUser?.firstName || "User",
                  })}
              </h2>
              {commentsLoading ? (
                <div className="d-flex justify-content-center py-3">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  />
                </div>
              ) : currentComments.length === 0 ? (
                <p className="text-muted text-center">
                  {t("user.noComments")}
                </p>
              ) : (
                <div className="list-group">
                  {currentComments.map((comment) => (
                    <div
                      key={comment.commentId}
                      className="list-group-item mb-3 rounded shadow-sm"
                    >
                      <p className="mb-1">{comment.text}</p>
                      <small className="text-muted">
                        {new Date(comment.timestamp).toLocaleString()}
                      </small>
                      <div className="mt-2 d-flex align-items-center gap-3">
                        <button
                          onClick={() =>
                            handleLikeUserComment(
                              user?.uid,
                              comment,
                              setUserComments
                            )
                          }
                          className={`btn btn-sm p-0 border-0 bg-transparent ${comment.likedBy?.includes(user?.uid)
                              ? "text-success"
                              : "text-secondary"
                            }`}
                          disabled={!user}
                          title={!user ? t("user.loginToLike") : ""}
                        >
                          <FaThumbsUp />{" "}
                          <span className="ms-1">
                            {comment.likedBy?.length || 0}
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            handleDislikeUserComment(
                              user?.uid,
                              comment,
                              setUserComments
                            )
                          }
                          className={`btn btn-sm p-0 border-0 bg-transparent ${comment.dislikedBy?.includes(user?.uid)
                              ? "text-danger"
                              : "text-secondary"
                            }`}
                          disabled={!user}
                          title={!user ? t("user.loginToDislike") : ""}
                        >
                          <FaThumbsDown />{" "}
                          <span className="ms-1">
                            {comment.dislikedBy?.length || 0}
                          </span>
                        </button>
                        {isCurrentUser && (
                          <div className="d-flex align-items-center gap-2 ms-auto">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                handleEditComment(
                                  comment.commentId,
                                  comment.postID
                                )
                              }
                            >
                              🖋️ {t("user.edit")}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                handleDeleteComment(
                                  comment.commentId,
                                  comment.postID
                                )
                              }
                            >
                              🗑️ {t("user.delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalCommentsPages > 1 && (
                <div className="d-flex justify-content-between mt-3">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      setCurrentCommentsPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentCommentsPage === 1}
                  >
                    {t("user.prev")}
                  </button>
                  <span>
                    {t("user.page")} {currentCommentsPage} {t("user.of")}{" "}
                    {totalCommentsPages}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      setCurrentCommentsPage((prev) =>
                        Math.min(prev + 1, totalCommentsPages)
                      )
                    }
                    disabled={currentCommentsPage === totalCommentsPages}
                  >
                    {t("user.next")}
                  </button>
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
