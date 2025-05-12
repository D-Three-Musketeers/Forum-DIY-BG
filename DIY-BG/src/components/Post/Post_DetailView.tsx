import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../../config/firebase-config";
import { AppContext } from "../../state/App.context";
import Hero from "../../components/Hero";

const Post_DetailView = () => {
  const { id } = useParams();
  const { user } = useContext(AppContext);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postRef = ref(db, `posts/${id}`);
    const unsubscribe = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        setPost(snapshot.val());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

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

        {/* Comment Section Placeholder */}
        <div className="mt-5">
          <h5>Comments Section</h5>
          {/* Add comment list + input UI here later */}
        </div>
      </div>
    </>
  );
};

export default Post_DetailView;
