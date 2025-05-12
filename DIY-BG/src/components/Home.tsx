import { useState, useEffect } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue } from "firebase/database";

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

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Converts object to array to show first (using reverse), later
  //tova moje go promenim
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
                    by User: {post.userHandle} on{" "}
                    {new Date(post.timestamp).toLocaleString()}
                  </p>
                  {/* Add a View More button or link here if needed */}
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
