import { useState, useEffect } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue, update } from "firebase/database";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { Link } from "react-router";

const Home = () => {
  const [posts, setPosts] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const postsRef = ref(db, "posts");

    const unsubscribe = onValue(
      postsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPosts(snapshot.val());
          setLoading(false);
        } else {
          setPosts({});
          setLoading(false);
          setError("No posts found!");
        }
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts!");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLike = (postId: string, currentLikes: number = 0) => {
    const postRef = ref(db, `posts/${postId}`);
    update(postRef, {
      likes: currentLikes + 1,
    });
  };

  const handleDislike = (postId: string, currentDislikes: number = 0) => {
    const postRef = ref(db, `posts/${postId}`);
    update(postRef, {
      dislikes: currentDislikes + 1,
    });
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error}</div>;

  const postsArray = Object.entries(posts).reverse();

  return (
    <div className="container mt-5">
      <h2 className="text-center text-white mb-4">Latest Posts</h2>

      {postsArray.length > 0 ? (
        <div className="row">
          {postsArray.map(([postId, post]) => (
            <div key={postId} className="col-12 col-sm-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{post.title}</h5>
                  <p className="card-text">
                    {post.content.substring(0, 200)}...
                  </p>
                  <p className="card-subtitle text-muted small">
                    by: <Link to={`user/${post.userUID}`}>{post.userHandle}</Link> on{" "}
                    {new Date(post.timestamp).toLocaleString()}
                  </p>

                  <div
                    className="d-flex align-items-center bg-light px-3 py-1 rounded-pill gap-2 shadow-sm"
                    style={{ fontSize: "0.9rem", fontWeight: 500 }}
                  >
                    {/* Like button */}
                    <button
                      onClick={() => handleLike(postId, post.likes ?? 0)}
                      className="btn p-0 border-0 bg-transparent"
                    >
                      <span className="text-success">
                        <FaThumbsUp />
                      </span>
                    </button>

                    {/* Score */}
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

                    {/* Dislike button */}
                    <button
                      onClick={() => handleDislike(postId, post.dislikes ?? 0)}
                      className="btn p-0 border-0 bg-transparent"
                    >
                      <span className="text-danger">
                        <FaThumbsDown />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-light">No posts available yet!</p>
      )}
    </div>
  );
};

export default Home;
