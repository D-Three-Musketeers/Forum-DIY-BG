import { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue, update } from "firebase/database";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AppContext } from "../state/App.context";
import { Link } from "react-router";

const Home = () => {
  const { user } = useContext(AppContext);
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

  const handleLike = (postId: string, post: any) => {
    if (!user) return;

    const postRef = ref(db, `posts/${postId}`);
    const updates: any = {
      likes: post.likes ?? 0,
      dislikes: post.dislikes ?? 0,
      likedBy: post.likedBy || [],
      dislikedBy: post.dislikedBy || [],
    };

    if (updates.likedBy.includes(user.uid)) return;
    updates.likes++;
    updates.likedBy.push(user.uid);

    if (updates.dislikedBy.includes(user.uid)) {
      updates.dislikes--;
      updates.dislikedBy = updates.dislikedBy.filter(
        (uid: string) => uid !== user.uid
      );
    }

    update(postRef, updates);
  };

  const handleDislike = (postId: string, post: any) => {
    if (!user) return;

    const postRef = ref(db, `posts/${postId}`);
    const updates: any = {
      likes: post.likes ?? 0,
      dislikes: post.dislikes ?? 0,
      likedBy: post.likedBy || [],
      dislikedBy: post.dislikedBy || [],
    };

    if (updates.dislikedBy.includes(user.uid)) return;
    updates.dislikes++;
    updates.dislikedBy.push(user.uid);

    if (updates.likedBy.includes(user.uid)) {
      updates.likes--;
      updates.likedBy = updates.likedBy.filter(
        (uid: string) => uid !== user.uid
      );
    }

    update(postRef, updates);
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
                    by:{" "}
                    <Link to={`user/${post.userUID}`}>{post.userHandle}</Link>{" "}
                    on {new Date(post.timestamp).toLocaleString()}
                  </p>

                  <div
                    className="d-flex align-items-center bg-light px-3 py-1 rounded-pill gap-2 shadow-sm"
                    style={{ fontSize: "0.9rem", fontWeight: 500 }}
                  >
                    <button
                      onClick={() => handleLike(postId, post)}
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
                      onClick={() => handleDislike(postId, post)}
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
