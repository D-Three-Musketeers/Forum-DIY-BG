import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { db } from "../config/firebase-config";
import { ref, onValue, update, get } from "firebase/database";
import { FaThumbsUp, FaThumbsDown, FaRegComment } from "react-icons/fa";
import { AppContext } from "../state/App.context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { DIYCategories, type DIYCategory } from "../enums/diy-enums";
import { checkIfBanned } from "../services/users.service";
import { deletePostCompletely } from "../services/posts.service";
import { useTranslation } from "react-i18next";
import TagDisplay from "./Post/TagDisplay";

interface Post {
  id?: string;
  title: string;
  content: string;
  userUID: string;
  userHandle: string;
  timestamp: string;
  category: DIYCategory;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
  comments?: Record<string, any>;
  images?: string[];
  tags?: string[];
}

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  loadingStats: boolean;
}

const PostSkeleton = () => {
  return (
    <div className="col-12 col-sm-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="bg-secondary" style={{ height: "200px", opacity: 0.2 }}></div>
        <div className="card-body">
          <div className="placeholder-glow">
            <h5 className="card-title placeholder col-8"></h5>
          </div>
          <div className="badge bg-secondary mb-2 placeholder col-4"></div>
          <div className="d-flex gap-1 mb-2">
            <span className="badge bg-secondary placeholder col-2"></span>
            <span className="badge bg-secondary placeholder col-2"></span>
            <span className="badge bg-secondary placeholder col-2"></span>
          </div>
          <div className="placeholder-glow">
            <p className="card-text placeholder col-12 mb-1"></p>
            <p className="card-text placeholder col-12 mb-1"></p>
            <p className="card-text placeholder col-8 mb-1"></p>
          </div>
          <div className="placeholder-glow mt-3">
            <p className="card-subtitle placeholder col-12"></p>
          </div>
          <div className="d-flex align-items-center justify-content-between mt-3">
            <div className="d-flex align-items-center gap-3">
              <button className="btn p-0 border-0 bg-transparent text-secondary placeholder">
                <FaThumbsUp />
                <span className="ms-1"></span>
              </button>
              <button className="btn p-0 border-0 bg-transparent text-secondary placeholder">
                <FaThumbsDown />
                <span className="ms-1"></span>
              </button>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary">
                <FaRegComment />
              </span>
              <span className="text-secondary small"></span>
            </div>
          </div>
          <div className="text-end d-flex mt-3 justify-content-between align-items-center">
            <button className="btn btn-sm btn-outline-secondary disabled placeholder col-4"></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { user, userData } = useContext(AppContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";

  const [posts, setPosts] = useState<Record<string, Post>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortMethod, setSortMethod] = useState<string>("mostRecent");
  const [selectedCategory, setSelectedCategory] = useState<DIYCategory | "all">("all");
  const [isSorting, setIsSorting] = useState(false);
  const postsPerPage = 12;
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    loadingStats: true
  });

  // Fetch all posts once when component mounts
  useEffect(() => {
    setLoading(true);
    const postsRef = ref(db, "posts");
    const unsubscribe = onValue(
      postsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPosts(snapshot.val());
        } else {
          setPosts({});
          setError("No posts found!");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts!");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      const usersRef = ref(db, "users");
      onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          setStats(prev => ({
            ...prev,
            totalUsers: Object.keys(snapshot.val()).length,
            loadingStats: false
          }));
        }
      }, { onlyOnce: true });

      const commentsRef = ref(db, "comments");
      onValue(commentsRef, (snapshot) => {
        if (snapshot.exists()) {
          setStats(prev => ({
            ...prev, 
            totalComments: Object.keys(snapshot.val()).length
          }));
        }
      }, { onlyOnce: true });
    };
    fetchStats();
  }, []);

  // Update post count
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalPosts: Object.keys(posts).length
    }));
  }, [posts]);

  // Reset page on search/category change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    get(ref(db, "posts")).then((snapshot) => {
      if (snapshot.exists()) {
        setPosts(snapshot.val());
      }
      setLoading(false);
    });
  }, []);

  const handleLike = useCallback(async (postId: string, post: Post) => {
    if (!user || await checkIfBanned(userData?.uid)) return;
    const postRef = ref(db, `posts/${postId}`);
    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];

    if (likedBy.includes(user.uid)) {
      const newLikedBy = likedBy.filter(uid => uid !== user.uid);
      await update(postRef, {
        likedBy: newLikedBy,
        likes: (post.likes || 0) - 1,
      });
      return;
    }

    const newDislikedBy = dislikedBy.filter(uid => uid !== user.uid);
    const newLikedBy = [...likedBy, user.uid];
    await update(postRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
      likes: (post.likes || 0) + 1,
      dislikes: newDislikedBy.length,
    });
  }, [user, userData?.uid]);

  const handleDislike = useCallback(async (postId: string, post: Post) => {
    if (!user || await checkIfBanned(userData?.uid)) return;
    const postRef = ref(db, `posts/${postId}`);
    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];

    if (dislikedBy.includes(user.uid)) {
      const newDislikedBy = dislikedBy.filter(uid => uid !== user.uid);
      await update(postRef, {
        dislikedBy: newDislikedBy,
        dislikes: (post.dislikes || 0) - 1,
      });
      return;
    }

    const newLikedBy = likedBy.filter(uid => uid !== user.uid);
    const newDislikedBy = [...dislikedBy, user.uid];
    await update(postRef, {
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
      dislikes: (post.dislikes || 0) + 1,
      likes: newLikedBy.length,
    });
  }, [user, userData?.uid]);

  const handleButtonClick = useCallback((buttonValue: string) => {
    setSortMethod(buttonValue);
    setCurrentPage(1);
    setIsSorting(true);
    setTimeout(() => setIsSorting(false), 300);
  }, []);

  const filteredAndSortedPosts = useMemo(() => {
    const filteredPosts = Object.entries(posts).filter(([_, post]) => {
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
      const matchesSearch = searchTerm === "" ||
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      return matchesCategory && matchesSearch;
    });

    switch (sortMethod) {
      case "topLiked":
        return [...filteredPosts].sort((a, b) => (b[1].likes || 0) - (a[1].likes || 0));
      case "topDisliked":
        return [...filteredPosts].sort((a, b) => (b[1].dislikes || 0) - (a[1].dislikes || 0));
      case "mostCommented":
        return [...filteredPosts].sort((a, b) => {
          const aComments = a[1].comments ? Object.keys(a[1].comments).length : 0;
          const bComments = b[1].comments ? Object.keys(b[1].comments).length : 0;
          return bComments - aComments;
        });
      case "mostRecent":
      default:
        return [...filteredPosts].sort((a, b) =>
          new Date(b[1].timestamp || 0).getTime() - new Date(a[1].timestamp || 0).getTime()
        );
    }
  }, [posts, searchTerm, selectedCategory, sortMethod]);

  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredAndSortedPosts.slice(indexOfFirstPost, indexOfLastPost);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row align-items-center mb-4">
          <div className="col-md-8">
            <h2 className="text-white mb-0">{t("home.latestPosts")}</h2>
          </div>
          <div className="col-md-4">
            <div className="d-flex justify-content-end gap-2">
              {["users", "posts", "comments"].map((stat) => (
                <div key={stat} className={`card bg-${stat === "users" ? "primary" : stat === "posts" ? "success" : "info"} text-white text-center py-1 px-2`}>
                  <small className="card-title">{t(`home.total${stat.charAt(0).toUpperCase() + stat.slice(1)}`)}</small>
                  <h6 className="card-text mb-0">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </h6>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="row mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <div className="d-flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map(i => <button key={i} className="btn btn-outline-primary placeholder col-2"></button>)}
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-select placeholder"></div>
          </div>
        </div>
        <div className="border rounded p-4 bg-light shadow-sm">
          <div className="row">
            {[...Array(6)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="container mt-5 alert alert-danger">Error: {error}</div>;

  return (
    <div className="container mt-1">
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <h2 className="text-white mb-0">{t("home.latestPosts")}</h2>
        </div>
        <div className="col-md-4">
          <div className="d-flex justify-content-end gap-2">
            {["users", "posts", "comments"].map((stat) => (
              <div key={stat} className={`card bg-${stat === "users" ? "primary" : stat === "posts" ? "success" : "info"} text-white text-center py-1 px-2`}>
                <small className="card-title">{t(`home.total${stat.charAt(0).toUpperCase() + stat.slice(1)}`)}</small>
                <h6 className="card-text mb-0">
                  {stats.loadingStats ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    stat === "users" ? stats.totalUsers : 
                    stat === "posts" ? stats.totalPosts : 
                    stats.totalComments
                  )}
                </h6>
              </div>
            ))}
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh posts"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <span>⟳</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {searchTerm && (
        <div className="alert alert-info text-center">
          {t("home.showingResults")}: <strong>{searchTerm}</strong>
          <button
            className="btn-close ms-2"
            onClick={() => navigate("/home")}
            aria-label={t("home.clearSearch")}
          />
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="d-flex gap-2 flex-wrap">
            <button
              className={`btn ${sortMethod === "mostRecent" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("mostRecent")}
            >
              {t("home.mostRecent")}
            </button>
            <button
              className={`btn ${sortMethod === "topLiked" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("topLiked")}
            >
              {t("home.topLiked")}
            </button>
            <button
              className={`btn ${sortMethod === "topDisliked" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("topDisliked")}
            >
              {t("home.topDisliked")}
            </button>
            <button
              className={`btn ${sortMethod === "mostCommented" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => handleButtonClick("mostCommented")}
            >
              {t("home.mostCommented")}
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DIYCategory | "all")}
          >
            <option value="all">{t("home.allCategories")}</option>
            {DIYCategories.map(cat => (
              <option key={cat} value={cat}>
                {t(`home.categories.${cat}`, cat)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded p-4 bg-light shadow-sm">
        {isSorting && (
          <div className="text-center mb-3">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Sorting...</span>
            </div>
          </div>
        )}
        <div className="row">
          {currentPosts.length > 0 ? (
            currentPosts.map(([postId, post]) => {
              const likes = post.likes || 0;
              const dislikes = post.dislikes || 0;
              const hasLiked = post.likedBy?.includes(user?.uid ?? "");
              const hasDisliked = post.dislikedBy?.includes(user?.uid ?? "");
              const isOwnPost = user?.uid === post.userUID;
              const commentsCount = post.comments ? Object.keys(post.comments).length : 0;

              return (
                <div key={postId} className="col-12 col-sm-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    {post.images?.[0] && (
                      <div className="position-relative" style={{ height: "200px", overflow: "hidden" }}>
                        <img
                          src={post.images[0]}
                          alt="Post"
                          className="card-img-top h-100 object-fit-cover"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/post/${postId}`)}
                          loading="lazy"
                        />
                        {post.images.length > 1 && (
                          <span className="position-absolute bottom-0 end-0 bg-primary text-white px-2 py-1 rounded-top-start">
                            +{post.images.length - 1} {t("home.more")}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{post.title}</h5>
                      <div className="badge bg-primary mb-2">
                        {t(`home.categories.${post.category}`)}
                      </div>
                      {Array.isArray(post.tags) && post.tags.length > 0 && <TagDisplay tags={post.tags} maxTags={3} />}
                      <p className="card-text">{post.content?.substring(0, 200)}...</p>
                      <p className="card-subtitle text-muted small">
                        {t("home.byUser")} <Link to={`/user/${post.userUID}`}>{post.userHandle}</Link> {t("home.on")} {new Date(post.timestamp).toLocaleString()}
                      </p>
                      <div className="d-flex align-items-center justify-content-between mt-3">
                        <div className="d-flex align-items-center gap-3">
                          <button
                            onClick={() => handleLike(postId, post)}
                            className={`btn p-0 border-0 bg-transparent ${hasLiked ? "text-success" : "text-secondary"}`}
                            disabled={!user}
                            title={!user ? t("home.loginToLike") : ""}
                          >
                            <FaThumbsUp />
                            <span className="ms-1">{likes}</span>
                          </button>
                          <button
                            onClick={() => handleDislike(postId, post)}
                            className={`btn p-0 border-0 bg-transparent ${hasDisliked ? "text-danger" : "text-secondary"}`}
                            disabled={!user}
                            title={!user ? t("home.loginToDislike") : ""}
                          >
                            <FaThumbsDown />
                            <span className="ms-1">{dislikes}</span>
                          </button>
                        </div>
                        <div className="d-flex align-items-center gap-2 clickable" onClick={() => navigate(`/post/${postId}`)} style={{ cursor: "pointer" }}>
                          <span className="text-dark"><FaRegComment /></span>
                          <span className="text-dark small">{commentsCount}</span>
                        </div>
                      </div>
                      <div className="text-end d-flex mt-3 justify-content-between align-items-center">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/post/${postId}`)}>
                          📃 {t("home.viewMore")}
                        </button>
                        {isOwnPost && (
                          <button
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={async () => {
                              if (await checkIfBanned(userData?.uid || '')) {
                                alert(t("home.banned"));
                                return;
                              }
                              try {
                                await deletePostCompletely(postId);
                                setPosts(prev => { const newPosts = {...prev}; delete newPosts[postId]; return newPosts; });
                              } catch (error) {
                                alert(t("home.deleteError"));
                              }
                            }}
                          >
                            🗑️ {t("home.delete")}
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
              <h4>{t("home.noPosts")}</h4>
              <p>{searchTerm ? t("home.tryOther") : t("home.noCategoryPosts")}</p>
            </div>
          )}
        </div>

        {filteredAndSortedPosts.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <button
              className="btn btn-outline-primary"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              {t("home.prev")}
            </button>
            <span className="fw-bold">
              {t("home.page")} {currentPage} {t("home.of")} {totalPages}
            </span>
            <button
              className="btn btn-outline-primary"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              {t("home.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;