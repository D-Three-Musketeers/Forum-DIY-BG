import { useState, useEffect, useContext } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue, update, remove, get } from "firebase/database";
import { FaThumbsUp, FaThumbsDown, FaRegComment } from "react-icons/fa";
import { AppContext } from "../state/App.context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { DIYCategories, type DIYCategory } from "../enums/diy-enums";
import { checkIfBanned } from "../services/users.service";

const Home = () => {
  const { user, userData } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  
  const [posts, setPosts] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMethod, setSortMethod] = useState<string>("mostRecent");
  const [selectedCategory, setSelectedCategory] = useState<DIYCategory | "all">("all");
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

  // Reset to first page when search term or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleDeletePost = async (postId: string, post: any) => {
    if (await checkIfBanned(userData.uid)) return;
    if (user?.uid === post.userUID && window.confirm("Delete this post?")) {
      // Optimistically update the UI immediately
      setPosts((prevPosts) => {
        const newPosts = { ...prevPosts };
        delete newPosts[postId];
        return newPosts;
      });

      // Get post data to extract comments
      const postSnap = await get(ref(db, `posts/${postId}`));
      const postData = postSnap.exists() ? postSnap.val() : null;

      // If post has comments, delete each from the global comments path
      if (postData?.comments) {
        const commentIds = Object.keys(postData.comments);
        for (const commentId of commentIds) {
          await remove(ref(db, `comments/${commentId}`));
        }
      }

      // Initiate the Firebase deletion in the background
      remove(ref(db, `posts/${post.id}`))
        .then(() => {
          remove(ref(db, `users/${post.userUID}/posts/${postId}`));
          alert("Post deleted!");
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

  const handleButtonClick = (buttonValue: string) => {
    setSortMethod(buttonValue);
    setCurrentPage(1);
  };

  const sortPosts = (postsArray: [string, any][]) => {
    switch (sortMethod) {
      case "topTwelveLiked":
        return [...postsArray].sort((a, b) => (b[1].likes || 0) - (a[1].likes || 0));
      case "topTwelveDisliked":
        return [...postsArray].sort((a, b) => (b[1].dislikes || 0) - (a[1].dislikes || 0));
      case "topTwelveCommented":
        return [...postsArray].sort((a, b) => {
          const aComments = a[1].comments ? Object.keys(a[1].comments).length : 0;
          const bComments = b[1].comments ? Object.keys(b[1].comments).length : 0;
          return bComments - aComments;
        });
      case "mostRecent":
      default:
        return [...postsArray].sort((a, b) => 
          new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime()
        );
    }
  };

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error}</div>;

  // Filter posts by search term and category
  const filteredPosts = Object.entries(posts).filter(([_, post]) => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const postsArray = sortPosts(filteredPosts);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = postsArray.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(postsArray.length / postsPerPage);

  return (
    <div className="container mt-1">
      <h2 className="text-center text-white mb-4">Latest Posts</h2>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="alert alert-info text-center">
          Showing results for: <strong>{searchTerm}</strong>
          <button 
            className="btn-close ms-2" 
            onClick={() => navigate("/home")}
            aria-label="Clear search"
          />
        </div>
      )}

      {/* Sorting Controls */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn ${sortMethod === "mostRecent" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("mostRecent")}
            >
              Most Recent
            </button>
            <button
              className={`btn ${sortMethod === "topTwelveLiked" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("topTwelveLiked")}
            >
              Top Liked
            </button>
            <button
              className={`btn ${sortMethod === "topTwelveDisliked" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("topTwelveDisliked")}
            >
              Top Disliked
            </button>
            <button
              className={`btn ${sortMethod === "topTwelveCommented" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("topTwelveCommented")}
            >
              Most Commented
            </button>
          </div>
        </div>
        
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DIYCategory | "all")}
          >
            <option value="all">All Categories</option>
            {DIYCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded p-4 bg-light shadow-sm">
        <div className="row">
          {currentPosts.length > 0 ? (
            currentPosts.map(([postId, post]) => {
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
                    {/* Image Gallery Section */}
                    {postImages.length > 0 && (
                      <div
                        className="position-relative"
                        style={{ height: "200px", overflow: "hidden" }}
                      >
                        <img
                          src={postImages[0]}
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
            })
          ) : (
            <div className="col-12 text-center py-5">
              <h4>No posts found</h4>
              <p>
                {searchTerm
                  ? "Try a different search term or category"
                  : "There are currently no posts in this category"}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {postsArray.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default Home;