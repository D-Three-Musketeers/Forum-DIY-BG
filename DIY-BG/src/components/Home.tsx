import { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue, update } from "firebase/database";
import { FaThumbsUp, FaThumbsDown, FaRegComment } from "react-icons/fa";
import { AppContext } from "../state/App.context";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

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

    update(postRef, { likes, dislikes, likedBy, dislikedBy });
  };

  const handleDislike = (postId: string, post: any) => {
    if (!user) return;

    const postRef = ref(db, `posts/${postId}`);
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

    update(postRef, { likes, dislikes, likedBy, dislikedBy });
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error}</div>;

  const postsArray = Object.entries(posts).reverse();
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = postsArray.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(postsArray.length / postsPerPage);

  return (
    <div className="container mt-5">
      <h2 className="text-center text-white mb-4">Latest Posts</h2>

      <div className="border rounded p-4 bg-light shadow-sm">
        <div className="row">
          {currentPosts.map(([postId, post]) => (
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

                  <div className="d-flex align-items-center justify-content-between mt-3">
                    <div className="d-flex align-items-center gap-3">
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

                    <div
                      className="d-flex align-items-center gap-2 clickable"
                      onClick={() => navigate(`/post/${postId}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="text-dark">
                        <FaRegComment />
                      </span>
                      <span className="text-dark small">
                        {post.comments ? Object.keys(post.comments).length : 0}
                      </span>
                    </div>
                  </div>

                  <div className="text-end mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/post/${postId}`)}
                    >
                      View More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4">
          <button
            className="btn btn-outline-primary"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <span className="fw-bold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-outline-primary"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
