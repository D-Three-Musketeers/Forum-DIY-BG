import { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue, update, remove } from "firebase/database";
import { FaThumbsUp, FaThumbsDown, FaRegComment } from "react-icons/fa";
import { AppContext } from "../state/App.context";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { DIYCategories, type DIYCategory } from "../enums/diy-enums";
import { checkIfBanned } from "../services/users.service";

const Home = () => {
  const { user, userData } = useContext(AppContext);
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

  const handleDeletePost = async (postId: string, post: any) => {
    if (await checkIfBanned(userData.uid)) return;
    if (user?.uid === post.userUID && window.confirm("Delete this post?")) {
      // Optimistically update the UI immediately
      setPosts((prevPosts) => {
        const newPosts = { ...prevPosts };
        delete newPosts[postId];
        return newPosts;
      });
      // Initiate the Firebase deletion in the background
      remove(ref(db, `posts/${post.id}`))
        .then(() => {
          remove(ref(db, `users/${post.userUID}/posts/${postId}`));
          console.log(`Post with ID ${post.id} deletion initiated from Home.`);
        })
        .catch((error) => {
          console.error("Error during deletion from Home:", error);
          alert("Error deleting post. Please try again.");
        });
    }
  };

  const handleLike = async (postId: string, post: any) => {
    if (!user) return;
    if (await checkIfBanned(userData.uid)) return;

    const postRef = ref(db, `posts/${postId}`);
    const likedBy: string[] = post.likedBy || [];
    const dislikedBy: string[] = post.dislikedBy || [];

    // If already liked, remove like (toggle)
    if (likedBy.includes(user.uid)) {
      const newLikedBy = likedBy.filter((uid) => uid !== user.uid);
      await update(postRef, {
        likedBy: newLikedBy,
        likes: post.likes - 1,
      });
      return;
    }

    // If disliked, remove from disliked and add to liked
    const newDislikedBy = dislikedBy.filter((uid) => uid !== user.uid);
    const newLikedBy = [...likedBy, user.uid];

    await update(postRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
      likes: post.likes + 1,
      dislikes: newDislikedBy.length,
    });
  };

  const handleDislike = async (postId: string, post: any) => {
    if (!user) return;
    if (await checkIfBanned(userData.uid)) return;

    const postRef = ref(db, `posts/${postId}`);
    const likedBy: string[] = post.likedBy || [];
    const dislikedBy: string[] = post.dislikedBy || [];

    // If already disliked, remove dislike (toggle)
    if (dislikedBy.includes(user.uid)) {
      const newDislikedBy = dislikedBy.filter((uid) => uid !== user.uid);
      await update(postRef, {
        dislikedBy: newDislikedBy,
        dislikes: post.dislikes - 1,
      });
      return;
    }

    // If liked, remove from liked and add to disliked
    const newLikedBy = likedBy.filter((uid) => uid !== user.uid);
    const newDislikedBy = [...dislikedBy, user.uid];

    await update(postRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
      dislikes: post.dislikes + 1,
      likes: newLikedBy.length,
    });
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
          {currentPosts.map(([postId, post]) => {
            const likes = post.likes || 0;
            const dislikes = post.dislikes || 0;
            const hasLiked = post.likedBy?.includes(user?.uid);
            const hasDisliked = post.dislikedBy?.includes(user?.uid);
            const isOwnPost = user?.uid === post.userUID;
            const postCategory = post.category;
            const postImages = post.images || [];

            return (
              <div key={postId} className="col-12 col-sm-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  {/* Image Gallery Section - Added Here */}
                  {postImages.length > 0 && (
                    <div
                      className="position-relative"
                      style={{ height: "200px", overflow: "hidden" }}
                    >
                      <img
                        src={postImages[0]} // Show first image as featured
                        alt="Post"
                        className="card-img-top h-100 object-fit-cover"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/post/${postId}`)}
                      />
                      {postImages.length > 1 && (
                        <span className="position-absolute bottom-0 end-0 bg-primary text-white px-2 py-1 rounded-top-start">
                          +{postImages.length - 1} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="card-body">
                    <h5 className="card-title">{post.title}</h5>
                    <div className="badge bg-primary mb-2">{postCategory}</div>
                    <p className="card-text">
                      {post.content.substring(0, 200)}...
                    </p>
                    <p className="card-subtitle text-muted small">
                      by User:{" "}
                      <Link to={`/user/${post.userUID}`}>
                        {post.userHandle}
                      </Link>{" "}
                      on {new Date(post.timestamp).toLocaleString()}
                    </p>

                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <div className="d-flex align-items-center gap-3">
                        <button
                          onClick={() => handleLike(postId, post)}
                          className={`btn p-0 border-0 bg-transparent ${
                            hasLiked ? "text-success" : "text-secondary"
                          }`}
                          disabled={!user}
                          title={!user ? "Login to like" : ""}
                        >
                          <FaThumbsUp />
                          <span className="ms-1">{likes}</span>
                        </button>

                        <button
                          onClick={() => handleDislike(postId, post)}
                          className={`btn p-0 border-0 bg-transparent ${
                            hasDisliked ? "text-danger" : "text-secondary"
                          }`}
                          disabled={!user}
                          title={!user ? "Login to dislike" : ""}
                        >
                          <FaThumbsDown />
                          <span className="ms-1">{dislikes}</span>
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
                          {post.comments
                            ? Object.keys(post.comments).length
                            : 0}
                        </span>
                      </div>
                    </div>
                    <div className="text-end d-flex mt-3 justify-content-between align-items-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/post/${postId}`)}
                      >
                        📃View More
                      </button>
                      {isOwnPost && (
                        <button
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={() => handleDeletePost(postId, post)}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
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
