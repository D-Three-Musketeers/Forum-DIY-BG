import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { ref, onValue, push, update } from "firebase/database";
import { db } from "../../config/firebase-config";
import { AppContext } from "../../state/App.context";
import Hero from "../../components/Hero";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";

const Post_DetailView = () => {
  const { id } = useParams();
  const { user, userData } = useContext(AppContext);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

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

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    const comment = {
      uid: user.uid,
      author: userData?.handle || user.handle || user.email,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    };

    const commentRef = ref(db, `posts/${id}/comments`);
    await push(commentRef, comment);
    setNewComment("");
  };

  const handleLikePost = () => {
    if (!user || !post || !id) return;

    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];
    let likes = post.likes ?? 0;
    let dislikes = post.dislikes ?? 0;

    if (likedBy.includes(user.uid)) return;
    likes++;
    likedBy.push(user.uid);

    if (dislikedBy.includes(user.uid)) {
      dislikes--;
      const index = dislikedBy.indexOf(user.uid);
      if (index > -1) dislikedBy.splice(index, 1);
    }

    update(ref(db, `posts/${id}`), { likes, dislikes, likedBy, dislikedBy });
  };

  const handleDislikePost = () => {
    if (!user || !post || !id) return;

    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];
    let likes = post.likes ?? 0;
    let dislikes = post.dislikes ?? 0;

    if (dislikedBy.includes(user.uid)) return;
    dislikes++;
    dislikedBy.push(user.uid);

    if (likedBy.includes(user.uid)) {
      likes--;
      const index = likedBy.indexOf(user.uid);
      if (index > -1) likedBy.splice(index, 1);
    }

    update(ref(db, `posts/${id}`), { likes, dislikes, likedBy, dislikedBy });
  };

  const handleLikeComment = (commentId: string, comment: any) => {
    if (!user || !id) return;

    const likedBy = comment.likedBy || [];
    const dislikedBy = comment.dislikedBy || [];
    let likes = comment.likes ?? 0;
    let dislikes = comment.dislikes ?? 0;

    if (likedBy.includes(user.uid)) return;
    likes++;
    likedBy.push(user.uid);

    if (dislikedBy.includes(user.uid)) {
      dislikes--;
      const index = dislikedBy.indexOf(user.uid);
      if (index > -1) dislikedBy.splice(index, 1);
    }

    update(ref(db, `posts/${id}/comments/${commentId}`), {
      likes,
      dislikes,
      likedBy,
      dislikedBy,
    });
  };

  const handleDislikeComment = (commentId: string, comment: any) => {
    if (!user || !id) return;

    const likedBy = comment.likedBy || [];
    const dislikedBy = comment.dislikedBy || [];
    let likes = comment.likes ?? 0;
    let dislikes = comment.dislikes ?? 0;

    if (dislikedBy.includes(user.uid)) return;
    dislikes++;
    dislikedBy.push(user.uid);

    if (likedBy.includes(user.uid)) {
      likes--;
      const index = likedBy.indexOf(user.uid);
      if (index > -1) likedBy.splice(index, 1);
    }

    update(ref(db, `posts/${id}/comments/${commentId}`), {
      likes,
      dislikes,
      likedBy,
      dislikedBy,
    });
  };

  if (loading) return <div>Loading post...</div>;
  if (!post) return <div>Post not found.</div>;

  return (
    <>
      <Hero />
      <div className="container mt-4">
        <div className="card shadow p-4">
          <h2>{post.title}</h2>
          <p className="text-muted small">
            by {post.userHandle} on {new Date(post.timestamp).toLocaleString()}
          </p>
          <div className="d-flex align-items-center gap-3 mt-3">
            <button
              onClick={handleLikePost}
              className="btn p-0 border-0 bg-transparent"
            >
              <span className="text-success">
                <FaThumbsUp />
              </span>
            </button>
            <span
              style={{
                color:
                  (post.likes ?? 0) - (post.dislikes ?? 0) < 0
                    ? "red"
                    : "#12263a",
              }}
            >
              {(post.likes ?? 0) - (post.dislikes ?? 0)}
            </span>
            <button
              onClick={handleDislikePost}
              className="btn p-0 border-0 bg-transparent"
            >
              <span className="text-danger">
                <FaThumbsDown />
              </span>
            </button>
          </div>
          <hr />
          <p>{post.content}</p>
        </div>

        <div className="mt-5">
          <h5 className="mb-3">💬 Comments Section</h5>
          <div className="border rounded p-3 bg-white shadow-sm">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="border-bottom pb-2 mb-2">
                  <p className="mb-1">{comment.text}</p>
                  <small className="text-muted">
                    by {comment.author} on{" "}
                    {new Date(comment.timestamp).toLocaleString()}
                  </small>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <button
                      onClick={() => handleLikeComment(comment.id, comment)}
                      className="btn btn-sm p-0 border-0 bg-transparent"
                    >
                      <span className="text-success">
                        <FaThumbsUp />
                      </span>
                    </button>
                    <span className="small">
                      {(comment.likes ?? 0) - (comment.dislikes ?? 0)}
                    </span>
                    <button
                      onClick={() => handleDislikeComment(comment.id, comment)}
                      className="btn btn-sm p-0 border-0 bg-transparent"
                    >
                      <span className="text-danger">
                        <FaThumbsDown />
                      </span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">No comments yet.</p>
            )}

            {user ? (
              <div className="mt-4">
                <textarea
                  className="form-control mb-2"
                  rows={3}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleAddComment}>
                  Submit Comment
                </button>
              </div>
            ) : (
              <p className="text-muted">Log in to post a comment.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Post_DetailView;
