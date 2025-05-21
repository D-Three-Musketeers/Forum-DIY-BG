import { useState, useContext, useEffect, useCallback, useMemo } from "react";
import { AppContext } from "../state/App.context";
import { useNavigate } from "react-router-dom";
import Hero from "./Hero";
import { update, ref, get, remove } from "firebase/database";
import { db } from "../config/firebase-config";
import { getPostsByUID, getAllPosts } from "../services/posts.service";
import { getAllUsers } from "../services/users.service";

// Skeleton Loading Components
const PostSkeleton = () => (
  <div className="list-group-item">
    <div className="placeholder-glow">
      <div className="placeholder col-8 mb-2" style={{ height: "20px" }}></div>
      <div className="placeholder col-4 mb-2" style={{ height: "15px" }}></div>
      <div className="placeholder col-6" style={{ height: "15px" }}></div>
    </div>
  </div>
);

const CommentSkeleton = () => (
  <div className="list-group-item">
    <div className="placeholder-glow">
      <div className="placeholder col-6 mb-2" style={{ height: "18px" }}></div>
      <div className="placeholder col-12 mb-2" style={{ height: "50px" }}></div>
      <div className="placeholder col-3" style={{ height: "15px" }}></div>
    </div>
  </div>
);

const Admin = () => {
  const { user, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [searchBy, setSearchBy] = useState("username");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPostsCache, setAllPostsCache] = useState<any[]>([]);

  // Pagination states
  // --- User order and sorting logic ---
  const [userOrder, setUserOrder] = useState<"asc" | "desc">("asc");
  const [selectedUserHandle, setSelectedUserHandle] = useState<string>("");
  const cyrillicRegex = /^[\u0400-\u04FF]/i;
  const latinRegex = /^[A-Za-z]/;
  const numberRegex = /^[0-9]/;
  const sortedUsers = useMemo(() => {
    const users = [...allUsers];
    const cyrillic = users.filter((u) => cyrillicRegex.test(u.handle));
    const latin = users.filter(
      (u) => !cyrillicRegex.test(u.handle) && latinRegex.test(u.handle)
    );
    const numbers = users.filter((u) => numberRegex.test(u.handle));
    const others = users.filter(
      (u) =>
        !cyrillicRegex.test(u.handle) &&
        !latinRegex.test(u.handle) &&
        !numberRegex.test(u.handle)
    );
    const sortFn = (a: any, b: any) => {
      if (userOrder === "asc") return a.handle.localeCompare(b.handle, "bg");
      return b.handle.localeCompare(a.handle, "bg");
    };
    return [
      ...cyrillic.sort(sortFn),
      ...latin.sort(sortFn),
      ...numbers.sort(sortFn),
      ...others.sort(sortFn),
    ];
  }, [allUsers, userOrder]);
  const handleUserSelectDropdown = (handle: string) => {
    setSelectedUserHandle(handle);
    handleUserSelect(handle);
  };
  const [postsPerPage] = useState(5);
  const [currentPostsPage, setCurrentPostsPage] = useState(1);
  const [commentsPerPage] = useState(5);
  const [currentCommentsPage, setCurrentCommentsPage] = useState(1);
  const [sortedPerPage] = useState(5);
  const [currentSortedPage, setCurrentSortedPage] = useState(1);

  const [loadingStates, setLoadingStates] = useState({
    user: false,
    data: false,
    search: false,
  });

  const [sortOption, setSortOption] = useState("newest");
  const [sortedPosts, setSortedPosts] = useState<any[]>([]);
  const [tt, setTT] = useState("");

  // Pagination calculations
  const indexOfLastPost = currentPostsPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = userPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPostsPages = Math.ceil(userPosts.length / postsPerPage);

  const indexOfLastComment = currentCommentsPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = userComments.slice(
    indexOfFirstComment,
    indexOfLastComment
  );
  const totalCommentsPages = Math.ceil(userComments.length / commentsPerPage);

  const indexOfLastSorted = currentSortedPage * sortedPerPage;
  const indexOfFirstSorted = indexOfLastSorted - sortedPerPage;
  const currentSorted = sortedPosts.slice(
    indexOfFirstSorted,
    indexOfLastSorted
  );
  const totalSortedPages = Math.ceil(sortedPosts.length / sortedPerPage);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  useEffect(() => {
    const prefetchPosts = async () => {
      try {
        const posts = await getAllPosts();
        setAllPostsCache(posts);
      } catch (error) {
        console.error("Failed to prefetch posts:", error);
      }
    };

    prefetchPosts();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;

    setLoadingStates({ user: true, data: true, search: false });
    setFoundUser(null);
    setUserPosts([]);
    setUserComments([]);
    setCurrentPostsPage(1);
    setCurrentCommentsPage(1);

    try {
      const usersRef = ref(db, `users`);
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        alert("No users found");
        setLoadingStates({ user: false, data: false, search: false });
        return;
      }

      const users = snapshot.val();
      const found = Object.entries(users).find(([handle, user]: any) => {
        if (searchBy === "username")
          return handle.toLowerCase() === searchText.toLowerCase();
        if (searchBy === "email") return user.email === searchText;
        return false;
      });

      if (!found) {
        alert("User not found");
        setLoadingStates({ user: false, data: false, search: false });
        return;
      }

      const [handle, user]: any = found;
      const userWithHandle = { ...user, handle };
      setFoundUser(userWithHandle);
      setLoadingStates({ user: false, data: true, search: false });

      const [posts, allPosts] = await Promise.all([
        getPostsByUID(user.uid),
        allPostsCache.length > 0
          ? Promise.resolve(allPostsCache)
          : getAllPosts(),
      ]);

      if (allPostsCache.length === 0 && allPosts.length > 0) {
        setAllPostsCache(allPosts);
      }

      setUserPosts(posts);

      const commentsRef = ref(db, "comments");
      const commentsSnapshot = await get(commentsRef);

      const allComments: any[] = [];
      if (commentsSnapshot.exists()) {
        Object.entries(commentsSnapshot.val()).forEach(
          ([commentId, comment]: any) => {
            if (comment.userUID === user.uid) {
              const parentPost = allPosts.find(
                (post) => post.comments && post.comments[commentId]
              );
              allComments.push({
                ...comment,
                commentId,
                postID: parentPost ? parentPost.id : comment.postID || null,
                postTitle: parentPost ? parentPost.title : "Unknown post",
              });
            }
          }
        );
      }

      setUserComments(allComments);
    } catch (error) {
      console.error("Search error:", error);
      alert("Error occurred during search");
    } finally {
      setLoadingStates({ user: false, data: false, search: false });
    }
  }, [searchText, searchBy, allPostsCache]);

  const handleUserSelect = useCallback(
    async (userHandle: string) => {
      setSearchText(userHandle);
      setSearchBy("username");
      setFoundUser(null);
      setUserPosts([]);
      setUserComments([]);
      setCurrentPostsPage(1);
      setCurrentCommentsPage(1);
      setLoadingStates({ user: true, data: true, search: false });

      try {
        const usersRef = ref(db, `users`);
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
          alert("No users found");
          setLoadingStates({ user: false, data: false, search: false });
          return;
        }

        const users = snapshot.val();
        const found = Object.entries(users).find(
          ([handle]) => handle.toLowerCase() === userHandle.toLowerCase()
        );

        if (!found) {
          alert("User not found");
          setLoadingStates({ user: false, data: false, search: false });
          return;
        }

        const [handle, userData]: any = found;
        const userWithHandle = { ...userData, handle };
        setFoundUser(userWithHandle);
        setLoadingStates({ user: false, data: true, search: false });

        const [posts, allPosts] = await Promise.all([
          getPostsByUID(userData.uid),
          allPostsCache.length > 0
            ? Promise.resolve(allPostsCache)
            : getAllPosts(),
        ]);

        if (allPostsCache.length === 0 && allPosts.length > 0) {
          setAllPostsCache(allPosts);
        }

        setUserPosts(posts);

        const commentsRef = ref(db, "comments");
        const commentsSnapshot = await get(commentsRef);

        const allComments: any[] = [];
        if (commentsSnapshot.exists()) {
          Object.entries(commentsSnapshot.val()).forEach(
            ([commentId, comment]: any) => {
              if (comment.userUID === userData.uid) {
                const parentPost = allPosts.find(
                  (post) => post.comments && post.comments[commentId]
                );
                if (parentPost) {
                  allComments.push({
                    ...comment,
                    commentId,
                    postID: parentPost.id,
                    postTitle: parentPost.title,
                  });
                }
              }
            }
          );
        }

        setUserComments(allComments);
      } catch (error) {
        console.error("User select error:", error);
        alert("Error loading user information");
      } finally {
        setLoadingStates({ user: false, data: false, search: false });
      }
    },
    [allPostsCache]
  );

  const handleAdminToggle = async (val: boolean) => {
    if (!foundUser) return;
    try {
      await update(ref(db, `users/${foundUser.handle}`), { admin: val });
      alert(`User is now ${val ? "Admin" : "User"}`);
      setFoundUser((prev: any) => ({ ...prev, admin: val }));
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.handle === foundUser.handle ? { ...user, admin: val } : user
        )
      );
    } catch (error) {
      console.error("Error updating admin status:", error);
      alert("Failed to update admin status");
    }
  };

  const handleBlockToggle = async (isBanned: boolean) => {
    if (!foundUser) return;
    try {
      await update(ref(db, `users/${foundUser.handle}`), { isBanned });
      alert(isBanned ? "User Blocked" : "User Unblocked");
      setFoundUser((prev: any) => ({ ...prev, isBanned }));
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.handle === foundUser.handle ? { ...user, isBanned } : user
        )
      );
    } catch (error) {
      console.error("Error updating block status:", error);
      alert("Failed to update block status");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const postSnap = await get(ref(db, `posts/${postId}`));
      const postData = postSnap.exists() ? postSnap.val() : null;

      if (postData?.comments) {
        const commentIds = Object.keys(postData.comments);
        for (const commentId of commentIds) {
          await remove(ref(db, `comments/${commentId}`));
        }
      }

      await remove(ref(db, `posts/${postId}`));

      setUserPosts((prev) => prev.filter((post) => post.id !== postId));
      setUserComments((prev) =>
        prev.filter((comment) => comment.postID !== postId)
      );

      alert("Post and its comments deleted");
    } catch (error) {
      console.error("Error deleting post and comments:", error);
      alert("Error occurred while deleting post or its comments.");
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    try {
      await remove(ref(db, `posts/${postId}/comments/${commentId}`));
      await remove(ref(db, `comments/${commentId}`));

      setUserComments((prevComments) =>
        prevComments.filter((comment) => comment.commentId !== commentId)
      );

      alert("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const handleSearchPosts = useCallback(async () => {
    setLoadingStates({ user: false, data: false, search: true });
    setCurrentSortedPage(1);
    try {
      const posts =
        allPostsCache.length > 0 ? allPostsCache : await getAllPosts();

      if (allPostsCache.length === 0 && posts.length > 0) {
        setAllPostsCache(posts);
      }

      const filteredPosts = [...posts].sort((a, b) => {
        switch (sortOption) {
          case "newest":
            return (
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          case "oldest":
            return (
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          case "liked":
            return (b.likes || 0) - (a.likes || 0);
          case "disliked":
            return (b.dislikes || 0) - (a.dislikes || 0);
          case "commented":
            return (
              Object.keys(b.comments || {}).length -
              Object.keys(a.comments || {}).length
            );
          default:
            return 0;
        }
      });

      setSortedPosts(filteredPosts);
    } catch (error) {
      console.error("Post search error:", error);
      alert("Failed to fetch posts");
    } finally {
      setLoadingStates({ user: false, data: false, search: false });
    }
  }, [sortOption, allPostsCache]);

  const handleSearchByTT = useCallback(async () => {
    setLoadingStates({ user: false, data: false, search: true });
    setCurrentSortedPage(1);
    try {
      const posts =
        allPostsCache.length > 0 ? allPostsCache : await getAllPosts();
      const keyword = tt.trim().toLowerCase();

      if (allPostsCache.length === 0 && posts.length > 0) {
        setAllPostsCache(posts);
      }

      if (!keyword) {
        setSortedPosts([]);
        return;
      }

      const filteredPosts = posts.filter((post) => {
        const titleMatch = post.title?.toLowerCase().includes(keyword);
        const tagMatch = Array.isArray(post.tags)
          ? post.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
          : false;
        return titleMatch || tagMatch;
      });

      setSortedPosts(filteredPosts);
    } catch (error) {
      console.error("TT search error:", error);
      alert("Failed to fetch posts");
    } finally {
      setLoadingStates({ user: false, data: false, search: false });
    }
  }, [tt, allPostsCache]);

  if (!user) {
    return (
      <>
        <Hero />
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
          <div
            className="card p-4 shadow"
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#f8f9fa",
              textAlign: "center",
              marginBottom: "500px",
            }}
          >
            <div className="card-body">
              <p style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
                To enter the Admin Dashboard, you must{" "}
                <span
                  className="clickable-link"
                  onClick={() => navigate("/loginpage")}
                >
                  log into your account!
                </span>
              </p>
              <p style={{ fontSize: "1rem" }}>
                You don't have an account yet?{" "}
                <span
                  className="clickable-link"
                  onClick={() => navigate("/signinpage")}
                >
                  Register here!
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (userData.admin === false) {
    return (
      <>
        <Hero />
        <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
          <div
            className="card p-4 shadow"
            style={{
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#f8f9fa",
              textAlign: "center",
              marginBottom: "500px",
            }}
          >
            <div className="card-body">
              <p style={{ fontSize: "1.1rem", marginBottom: "4px" }}>
                You don't have Admin rights!{" "}
                <span
                  className="clickable-link"
                  onClick={() => navigate("/home")}
                >
                  go back to Home page
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Hero />
      <div
        style={{
          backgroundColor: "#272424",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <div
          className={
            "container border border-3 border-warning rounded shadow-lg p-4 admin-main-bg"
          }
        >
          <h1 className="text-center mb-5 fw-bold">🛠️ Admin Dashboard</h1>

          <div
            className="card shadow mb-5"
            style={{ backgroundColor: "#2F42AF", color: "white" }}
          >
            <div
              className="card-header border-warning border-3 border-bottom"
              style={{ backgroundColor: "#33589C" }}
            >
              <h4 className="fw-bold mb-0">👤 Manage Users</h4>
            </div>

            <div className="card-body">
              <div className="mb-4">
                <div className="d-flex flex-wrap justify-content-between gap-4 align-items-start">
                  <div style={{ flex: "1", minWidth: "300px" }}>
                    <label
                      htmlFor="searchInput"
                      className="form-label fw-bold text-light"
                    >
                      Search Users:
                    </label>
                    <input
                      type="text"
                      id="searchInput"
                      className="form-control mb-3"
                      placeholder="Enter username or email..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />

                    <div className="mb-3">
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="searchType"
                          id="searchByUsername"
                          value="username"
                          checked={searchBy === "username"}
                          onChange={(e) => setSearchBy(e.target.value)}
                        />
                        <label
                          className="form-check-label text-light"
                          htmlFor="searchByUsername"
                        >
                          Username
                        </label>
                      </div>

                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="searchType"
                          id="searchByEmail"
                          value="email"
                          checked={searchBy === "email"}
                          onChange={(e) => setSearchBy(e.target.value)}
                        />
                        <label
                          className="form-check-label text-light"
                          htmlFor="searchByEmail"
                        >
                          Email
                        </label>
                      </div>
                    </div>

                    <button
                      className="btn btn-warning fw-bold px-4 mt-1"
                      onClick={handleSearch}
                      disabled={loadingStates.user}
                    >
                      {loadingStates.user ? "Searching..." : "Search"}
                    </button>
                  </div>
                  <div style={{ width: "220px" }}>
                    <h6 className="fw-bold mb-2" style={{ color: "#fff" }}>
                      All Users
                    </h6>
                    <div className="mb-2 d-flex gap-2 align-items-center">
                      <input
                        type="radio"
                        id="orderAsc"
                        name="userOrder"
                        checked={userOrder === "asc"}
                        onChange={() => setUserOrder("asc")}
                        style={{ accentColor: "#fff" }}
                      />
                      <label
                        htmlFor="orderAsc"
                        className="me-2"
                        style={{
                          color: "#fff",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        A-Z
                      </label>
                      <input
                        type="radio"
                        id="orderDesc"
                        name="userOrder"
                        checked={userOrder === "desc"}
                        onChange={() => setUserOrder("desc")}
                        style={{ accentColor: "#fff" }}
                      />
                      <label
                        htmlFor="orderDesc"
                        style={{
                          color: "#fff",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Z-A
                      </label>
                    </div>
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #2F42AF 60%, #3A5EDB 100%)",
                        borderRadius: "6px",
                        border: "1.5px solid #25408F",
                        padding: "0.5rem 0.75rem",
                        boxShadow: "0 2px 8px rgba(47,66,175,0.08)",
                        minHeight: "40px",
                        color: "#fff",
                      }}
                    >
                      <select
                        className="form-select admin-user-dropdown"
                        style={{
                          background: "#25408F",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          fontWeight: 500,
                          fontSize: "1rem",
                          cursor: "pointer",
                          boxShadow: "0 1px 4px rgba(47,66,175,0.10)",
                          transition: "background 0.2s, color 0.2s",
                        }}
                        size={8}
                        onChange={(e) =>
                          handleUserSelectDropdown(e.target.value)
                        }
                        value={selectedUserHandle || ""}
                      >
                        <option disabled value="">
                          -- Select User --
                        </option>
                        {sortedUsers.length > 0 ? (
                          sortedUsers.map((user: any) => (
                            <option
                              key={user.handle}
                              value={user.handle}
                              className="admin-user-option"
                              style={{
                                background:
                                  selectedUserHandle === user.handle
                                    ? "#3A5EDB"
                                    : "#25408F",
                                color: "#fff",
                                cursor: "pointer",
                              }}
                            >
                              {user.handle}
                            </option>
                          ))
                        ) : (
                          <option disabled>No users found.</option>
                        )}
                      </select>
                      {/* Custom styles for dropdown hover */}
                      <style>{`
        .admin-user-dropdown option.admin-user-option:hover, .admin-user-dropdown option.admin-user-option:focus {
          background: #1a2a6c !important;
          color: #fff !important;
        }
        .admin-user-dropdown option.admin-user-option[selected] {
          background: #3A5EDB !important;
          color: #fff !important;
        }
      `}</style>
                    </div>
                  </div>
                </div>
              </div>

              {loadingStates.user && (
                <div className="mt-4 text-center">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                  >
                    <span className="visually-hidden">Loading user...</span>
                  </div>
                  <div className="mt-2">Loading user...</div>
                </div>
              )}

              {foundUser && !loadingStates.user && (
                <div className="mt-4">
                  <div className="card p-3 bg-light shadow">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        src={
                          foundUser.photoBase64 || "/default-avatar-diy.webp"
                        }
                        alt="Profile"
                        className="rounded-circle me-3"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <h5 className="mb-1">{foundUser.handle || "N/A"}</h5>
                        <p className="mb-1">
                          <strong>Email:</strong> {foundUser.email}
                        </p>
                        <p className="mb-1">
                          <strong>Role:</strong>{" "}
                          {foundUser.admin ? "Admin" : "User"} |{" "}
                          <strong>Status:</strong>{" "}
                          {foundUser.isBanned ? "❌ Banned" : "✅ Active"}
                        </p>
                      </div>
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleAdminToggle(true)}
                        disabled={foundUser.admin}
                      >
                        Make Admin
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAdminToggle(false)}
                        disabled={!foundUser.admin}
                      >
                        Revoke Admin
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleBlockToggle(true)}
                        disabled={foundUser.isBanned}
                      >
                        Block User
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleBlockToggle(false)}
                        disabled={!foundUser.isBanned}
                      >
                        Unblock User
                      </button>
                    </div>

                    <hr />

                    <h6 className="mt-3">
                      📝 Posts by this user ({userPosts.length})
                    </h6>
                    {loadingStates.data ? (
                      <ul className="list-group mb-3">
                        {[...Array(3)].map((_, i) => (
                          <PostSkeleton key={`post-skeleton-${i}`} />
                        ))}
                      </ul>
                    ) : userPosts.length > 0 ? (
                      <>
                        <ul className="list-group mb-3">
                          {currentPosts.map((post) => (
                            <li
                              key={post.id}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <strong>{post.title}</strong>
                                <div className="small text-muted">
                                  {new Date(post.timestamp).toLocaleString()}
                                </div>
                                <hr />
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  Delete Post ❌
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {totalPostsPages > 1 && (
                          <div className="d-flex justify-content-between mt-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                setCurrentPostsPage((prev) =>
                                  Math.max(prev - 1, 1)
                                )
                              }
                              disabled={currentPostsPage === 1}
                            >
                              Previous
                            </button>
                            <span>
                              Page {currentPostsPage} of {totalPostsPages}
                            </span>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                setCurrentPostsPage((prev) =>
                                  Math.min(prev + 1, totalPostsPages)
                                )
                              }
                              disabled={currentPostsPage === totalPostsPages}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">No posts</p>
                    )}

                    <h6>💬 Comments by this user ({userComments.length})</h6>
                    {loadingStates.data ? (
                      <ul className="list-group">
                        {[...Array(3)].map((_, i) => (
                          <CommentSkeleton key={`comment-skeleton-${i}`} />
                        ))}
                      </ul>
                    ) : userComments.length > 0 ? (
                      <>
                        <ul className="list-group">
                          {currentComments.map((comment) => (
                            <li
                              key={comment.commentId}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <div className="fw-bold">
                                  On post: {comment.postTitle || "Unknown post"}
                                </div>
                                <div>{comment.text}</div>
                                <small className="text-muted">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </small>
                              </div>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                  handleDeleteComment(
                                    comment.commentId,
                                    comment.postID
                                  )
                                }
                              >
                                Delete Comment
                              </button>
                            </li>
                          ))}
                        </ul>
                        {totalCommentsPages > 1 && (
                          <div className="d-flex justify-content-between mt-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                setCurrentCommentsPage((prev) =>
                                  Math.max(prev - 1, 1)
                                )
                              }
                              disabled={currentCommentsPage === 1}
                            >
                              Previous
                            </button>
                            <span>
                              Page {currentCommentsPage} of {totalCommentsPages}
                            </span>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                setCurrentCommentsPage((prev) =>
                                  Math.min(prev + 1, totalCommentsPages)
                                )
                              }
                              disabled={
                                currentCommentsPage === totalCommentsPages
                              }
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">No comments</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="card shadow mb-5"
            style={{ backgroundColor: "#2F42AF", color: "white" }}
          >
            <div
              className="card-header border-warning border-3 border-bottom"
              style={{ backgroundColor: "#33589C" }}
            >
              <h4 className="fw-bold mb-0">📝 Manage Posts</h4>
            </div>

            <div className="card-body">
              <div className="mb-4 d-flex flex-column flex-md-row align-items-md-end gap-3">
                <div className="flex-grow-1">
                  <label
                    htmlFor="sortPosts"
                    className="form-label fw-bold text-white"
                  >
                    📊 List Posts by:
                  </label>
                  <select
                    id="sortPosts"
                    className="form-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="newest">🆕 Newest</option>
                    <option value="oldest">🕰️ Oldest</option>
                    <option value="liked">👍 Top Liked</option>
                    <option value="disliked">👎 Most Disliked</option>
                    <option value="commented">💬 Most Commented</option>
                  </select>
                </div>

                <button
                  onClick={handleSearchPosts}
                  className="btn btn-warning fw-bold mt-2"
                  disabled={loadingStates.search}
                >
                  {loadingStates.search ? "Sorting..." : "Sort"}
                </button>

                <div className="flex-grow-1">
                  <label
                    htmlFor="searchByTT"
                    className="form-label fw-bold text-white"
                  >
                    🔎 Search Post by Title or Tag:
                  </label>
                  <input
                    type="text"
                    id="searchByTT"
                    className="form-control"
                    placeholder="Enter post Title or tag..."
                    value={tt}
                    onChange={(e) => setTT(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-warning fw-bold mt-2"
                  onClick={handleSearchByTT}
                  disabled={loadingStates.search}
                >
                  {loadingStates.search ? "Searching..." : "Search"}
                </button>
              </div>

              {loadingStates.search && (
                <div className="mt-4">
                  <div className="card p-3 bg-light shadow">
                    <h6 className="mb-3 fw-bold">📃 All Posts</h6>
                    <ul className="list-group">
                      {[...Array(5)].map((_, i) => (
                        <PostSkeleton key={`search-post-skeleton-${i}`} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!loadingStates.search && sortedPosts.length > 0 && (
                <div className="mt-4">
                  <div className="card p-3 bg-light shadow">
                    <h6 className="mb-3 fw-bold">
                      📃 All Posts ({sortedPosts.length})
                    </h6>
                    <ul className="list-group">
                      {currentSorted.map((post) => (
                        <li
                          key={post.id}
                          className="list-group-item d-flex justify-content-between align-items-start"
                        >
                          <div>
                            <strong>{post.title}</strong>
                            <div className="small text-muted">
                              ID: {post.id} |{" "}
                              {new Date(post.timestamp).toLocaleString()}
                              <br />
                              Likes: {post.likes} | Dislikes: {post.dislikes} |
                              Comments:{" "}
                              {Object.keys(post.comments || {}).length}
                            </div>
                          </div>
                          <button
                            className="btn btn-outline-danger btn-sm ms-2"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete ❌
                          </button>
                        </li>
                      ))}
                    </ul>
                    {totalSortedPages > 1 && (
                      <div className="d-flex justify-content-between mt-3">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            setCurrentSortedPage((prev) =>
                              Math.max(prev - 1, 1)
                            )
                          }
                          disabled={currentSortedPage === 1}
                        >
                          Previous
                        </button>
                        <span>
                          Page {currentSortedPage} of {totalSortedPages}
                        </span>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            setCurrentSortedPage((prev) =>
                              Math.min(prev + 1, totalSortedPages)
                            )
                          }
                          disabled={currentSortedPage === totalSortedPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loadingStates.search && sortedPosts.length === 0 && (
                <p className="text-center text-light mt-4">No posts found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
