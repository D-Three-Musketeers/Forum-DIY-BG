import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../../config/firebase-config";
import { AppContext } from "../../state/App.context";
import Hero from "../../components/Hero";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { createComment, deletePostCompletely } from "../../services/posts.service";
import { checkIfBanned } from "../../services/users.service";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TagDisplay from "./TagDisplay";
import TagInput from "./TagInput";
import { updatePostTags } from "../../services/tags.service";

// interface Post {
//   id: string;
//   title: string;
//   content: string;
//   userUID: string;
//   userHandle: string;
//   timestamp: string;
//   category: string;
//   likes: number;
//   dislikes: number;
//   likedBy?: string[];
//   dislikedBy?: string[];
//   comments?: Record<string, any>;
//   images?: string[];
//   tags?: string[];
// }

const Post_DetailView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useContext(AppContext);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [searchParams] = useSearchParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editedTags, setEditedTags] = useState<string[]>([])


  useEffect(() => {
    const postRef = ref(db, `posts/${id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPost(data);

        const commentsArray = data.comments
          ? Object.entries(data.comments).map(([commentId, comment]: any) => ({
            id: commentId,
            ...comment,
          }))
          : [];

        setComments(commentsArray);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (post?.tags) {
      setEditedTags(post.tags);
    }
  }, [post?.tags]);

  useEffect(() => {
    const editMode = searchParams.get("edit");

    if (editMode === "true" && user?.uid === post?.userUID) {
      setIsEditingPost(true);
      setEditedTitle(post.title);
      setEditedContent(post.content);
    } else {
      setIsEditingPost(false);
    }
  }, [searchParams, user?.uid, post?.userUID])

  const handleAddComment = async () => {
    if (await checkIfBanned(userData.uid)) return;
    if (!newComment.trim() || !user) return;
    if (!userData.handle || !id) return;

    await createComment(
      id,
      userData.handle,
      newComment,
      new Date().toISOString(),
      user.uid,
      post.id
    );

    setNewComment("");
  };

  const handleSaveEditedComment = async () => {
    if (await checkIfBanned(userData.uid)) return;
    if (!id || !editingCommentId || !editedCommentText.trim()) return;
    const commentRef = ref(db, `posts/${id}/comments/${editingCommentId}`);
    await update(commentRef, { text: editedCommentText });
    setEditingCommentId(null);
    setEditedCommentText("");
  };

  const handleLikePost = async () => {
    if (await checkIfBanned(userData.uid)) return;
    if (!user || !post || !id) return;
    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];
    const postRef = ref(db, `posts/${id}`);

    if (likedBy.includes(user.uid)) {
      const newLikedBy = likedBy.filter((uid: string) => uid !== user.uid);
      await update(postRef, {
        likedBy: newLikedBy,
        likes: newLikedBy.length,
      });
      return;
    }

    const newLikedBy = [...likedBy, user.uid];
    const newDislikedBy = dislikedBy.filter((uid: string) => uid !== user.uid);

    await update(postRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
      likes: newLikedBy.length,
      dislikes: newDislikedBy.length,
    });
  };

  const handleDislikePost = async () => {
    if (await checkIfBanned(userData.uid)) return;
    if (!user || !post || !id) return;
    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];
    const postRef = ref(db, `posts/${id}`);

    if (dislikedBy.includes(user.uid)) {
      const newDislikedBy = dislikedBy.filter(
        (uid: string) => uid !== user.uid
      );
      await update(postRef, {
        dislikedBy: newDislikedBy,
        dislikes: newDislikedBy.length,
      });
      return;
    }

    const newDislikedBy = [...dislikedBy, user.uid];
    const newLikedBy = likedBy.filter((uid: string) => uid !== user.uid);

    await update(postRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
      dislikes: newDislikedBy.length,
      likes: newLikedBy.length,
    });
  };

  const handleLikeComment = async (commentId: string, comment: any) => {
    if (await checkIfBanned(userData.uid)) return;
    if (!user || !id) return;
    const likedBy = comment.likedBy || [];
    const dislikedBy = comment.dislikedBy || [];
    const commentRef = ref(db, `posts/${id}/comments/${commentId}`);

    if (likedBy.includes(user.uid)) {
      const newLikedBy = likedBy.filter((uid: string) => uid !== user.uid);
      await update(commentRef, { likedBy: newLikedBy });
      return;
    }

    const newLikedBy = [...likedBy, user.uid];
    const newDislikedBy = dislikedBy.filter((uid: string) => uid !== user.uid);
    await update(commentRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
    });
  };

  const handleDislikeComment = async (commentId: string, comment: any) => {
    if (await checkIfBanned(userData.uid)) return;
    if (!user || !id) return;
    const likedBy = comment.likedBy || [];
    const dislikedBy = comment.dislikedBy || [];
    const commentRef = ref(db, `posts/${id}/comments/${commentId}`);

    if (dislikedBy.includes(user.uid)) {
      const newDislikedBy = dislikedBy.filter(
        (uid: string) => uid !== user.uid
      );
      await update(commentRef, { dislikedBy: newDislikedBy });
      return;
    }

    const newDislikedBy = [...dislikedBy, user.uid];
    const newLikedBy = likedBy.filter((uid: string) => uid !== user.uid);
    await update(commentRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (post?.images?.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + (post?.images?.length || 1)) % (post?.images?.length || 1)
    );
  };

  if (loading) return <div>{t("detail.loading")}</div>;
  if (!post) return <div>{t("detail.notFound")}</div>;

  const likes = post.likes || 0;
  const dislikes = post.dislikes || 0;
  const hasLiked = post.likedBy?.includes(user?.uid);
  const hasDisliked = post.dislikedBy?.includes(user?.uid);
  const images = post.images || [];
  const showImageNavigation = images.length > 1;
  const postTags = post.tags || [];

  return (
    <>
      <Hero />
      <div className="container mt-4">
        <div className="card shadow p-4">
          {isEditingPost ? (
            <>
              <input
                className="form-control mb-2"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
              <textarea
                className="form-control mb-2"
                rows={5}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <div className="mb-3">
                <label className="form-label"></label>
                <TagInput
                  initialTags={editedTags}
                  onTagsChange={setEditedTags}
                  disabled={!userData?.admin && user?.uid !== post?.userUID}
                />
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!id || await checkIfBanned(userData.uid)) return;
                    await update(ref(db, `posts/${id}`), {
                      title: editedTitle,
                      content: editedContent,
                      tags: editedTags,
                    });

                    await updatePostTags(id, editedTags);

                    setIsEditingPost(false);
                  }}
                >
                  {t("detail.save")}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsEditingPost(false)}
                >
                  {t("detail.cancel")}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>{post.title}</h2>
              <hr />
              {postTags.length > 0 && <TagDisplay tags={postTags} />}
              <p style={{ whiteSpace: "pre-line" }}>{post.content}</p>
              <hr />

              {/* Image Gallery */}
              {images.length > 0 && (
                <div className="mt-4">
                  <div className="text-center">
                    <div
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{
                        maxHeight: "60vh",
                        overflow: "hidden",
                        borderRadius: "8px",
                        padding: "1rem",
                      }}
                    >
                      <img
                        src={images[currentImageIndex]}
                        alt={`Post image ${currentImageIndex + 1}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "60vh",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {showImageNavigation && (
                      <div className="mt-3 d-flex justify-content-center align-items-center gap-3">
                        <button
                          onClick={prevImage}
                          className="btn btn-sm btn-outline-primary"
                        >
                          {t("detail.prev")}
                        </button>

                        <span className="mx-2">
                          {currentImageIndex + 1} / {images.length}
                        </span>

                        <button
                          onClick={nextImage}
                          className="btn btn-sm btn-outline-primary"
                        >
                          {t("detail.next")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-muted small mt-3">
                {t("detail.by")} <Link to={`/user/${post.userUID}`}>
                  {post.userHandle}
                </Link>{" "} {t("detail.on")}{" "}
                {new Date(post.timestamp).toLocaleString()}
              </p>

              {user?.uid === post.userUID && (
                <div className="mb-3 d-flex gap-2">
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setIsEditingPost(true);
                      setEditedTitle(post.title);
                      setEditedContent(post.content);
                    }}
                  >
                    {t("detail.editPost")}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (await checkIfBanned(userData.uid)) return;
                      if (window.confirm(t("detail.confirmDeletePost"))) {
                        await deletePostCompletely(post.id)
                        navigate("/home");
                      }
                    }}
                  >
                    {t("detail.deletePost")}
                  </button>
                </div>
              )}
            </>
          )}

          <div className="d-flex align-items-center gap-3 mt-3">
            <button
              onClick={handleLikePost}
              className={`btn p-0 border-0 bg-transparent ${hasLiked ? "text-success" : "text-secondary"
                }`}
            >
              <FaThumbsUp /> <span className="ms-1">{likes}</span>
            </button>
            <button
              onClick={handleDislikePost}
              className={`btn p-0 border-0 bg-transparent ${hasDisliked ? "text-danger" : "text-secondary"
                }`}
            >
              <FaThumbsDown /> <span className="ms-1">{dislikes}</span>
            </button>
          </div>
        </div>

        {/* Comment section */}
        <div className="mt-5">
          <h5 className="mb-3">{t("detail.commentsTitle")}</h5>
          <div className="border rounded p-3 bg-white shadow-sm">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const likes = comment.likedBy?.length || 0;
                const dislikes = comment.dislikedBy?.length || 0;
                const hasLiked = comment.likedBy?.includes(user?.uid);
                const hasDisliked = comment.dislikedBy?.includes(user?.uid);
                console.log(comment);

                return (
                  <div key={comment.id} className="border-bottom pb-2 mb-2">
                    {editingCommentId === comment.id ? (
                      <>
                        <textarea
                          className="form-control mb-1"
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                        />
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleSaveEditedComment}
                          >
                            {t("detail.save")}
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingCommentId(null)}
                          >
                            {t("detail.cancel")}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mb-1">{comment.text}</p>
                        <small className="text-muted">
                          {t("detail.by")} <Link to={`/user/${comment.userUID}`}>
                            {comment.author}
                          </Link>{" "} {t("detail.on")}{" "}
                          {new Date(comment.timestamp).toLocaleString()}
                        </small>
                        {comment.userUID === user?.uid && (
                          <div className="mt-1 d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditedCommentText(comment.text);
                              }}
                            >
                              {t("detail.edit")}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    t("detail.confirmDeleteComment")
                                  )
                                ) {
                                  remove(
                                    ref(
                                      db,
                                      `posts/${id}/comments/${comment.id}`
                                    )
                                  );
                                }
                              }}
                            >
                              {t("detail.delete")}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <button
                        onClick={() => handleLikeComment(comment.id, comment)}
                        className={`btn btn-sm p-0 border-0 bg-transparent ${hasLiked ? "text-success" : "text-secondary"
                          }`}
                      >
                        <FaThumbsUp /> <span className="ms-1">{likes}</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDislikeComment(comment.id, comment)
                        }
                        className={`btn btn-sm p-0 border-0 bg-transparent ${hasDisliked ? "text-danger" : "text-secondary"
                          }`}
                      >
                        <FaThumbsDown />{" "}
                        <span className="ms-1">{dislikes}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted">{t("detail.noComments")}</p>
            )}

            {user ? (
              <div className="mt-4">
                <textarea
                  className="form-control mb-2"
                  rows={3}
                  placeholder={t("detail.commentPlaceholder")}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleAddComment}>
                  {t("detail.submitComment")}
                </button>
              </div>
            ) : (
              <p className="text-muted">{t("detail.loginToComment")}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Post_DetailView;
