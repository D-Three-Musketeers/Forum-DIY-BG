import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../config/firebase-config";
import { AppContext } from "../../state/App.context";
import Hero from "../../components/Hero";
import { push, ref as dbRef } from "firebase/database";

const Post_DetailView = () => {
  const { id } = useParams();
  const { user } = useContext(AppContext);
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
      author: user.displayName || user.email,
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
    };

    const commentRef = dbRef(db, `posts/${id}/comments`);
    await push(commentRef, comment);

    setNewComment("");
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

        <div className="mt-5">
          <h5>Comments Section</h5>
          {/* Add comment list + input UI here later */}
        </div>
      </div>
    </>
  );
};

export default Post_DetailView;
