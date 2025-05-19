import { useState, useContext, useEffect } from "react";
import { AppContext } from "../state/App.context";
import { useNavigate } from "react-router-dom";
import Hero from "./Hero";
import { update, ref, get, remove } from "firebase/database";
import { db } from "../config/firebase-config";
import { getPostsByUID, getAllPosts } from "../services/posts.service";
import { getAllUsers } from "../services/users.service";

const Admin = () => {
  const { user, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState("");
  const [searchBy, setSearchBy] = useState("username");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  //Loading
  const [loading, setLoading] = useState(false);

  // for the search posts menu
  const [sortOption, setSortOption] = useState("newest");
  const [searchPostId, setSearchPostId] = useState("");
  const [sortedPosts, setSortedPosts] = useState<any[]>([]);

  // for the search by Title or Tag
  const [tt, setTT] = useState("");

  useEffect(() => {
    const fetchAllUsers = async () => {
      const users = await getAllUsers();
      setAllUsers(users);
    };

    fetchAllUsers();
  }, []);

  const handleSearch = async () => {
    const usersRef = ref(db, `users`);
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      alert("No users found");
      return;
    }

    const users = snapshot.val();
    const found = Object.entries(users).find(([handle, user]: any) => {
      if (searchBy === "username")
        return handle.toLowerCase() === searchText.toLowerCase();
      if (searchBy === "email") return user.email === searchText;
      if (searchBy === "displayName")
        return user.displayName?.toLowerCase() === searchText.toLowerCase();
      return false;
    });

    if (!found) {
      alert("User not found");
      setFoundUser(null);
      setUserPosts([]);
      setUserComments([]);
      return;
    }

    const [handle, user]: any = found;
    user.handle = handle;
    setFoundUser(user);

    const posts = await getPostsByUID(user.uid);
    setUserPosts(posts);

    const comments: any[] = [];
    posts.forEach((post) => {
      if (post.comments) {
        Object.entries(post.comments).forEach(([commentID, comment]: any) => {
          if (comment.userUID === user.uid) {
            comments.push({ ...comment, commentID, postID: post.id });
          }
        });
      }
    });
    setUserComments(comments);
  };

  const handleAdminToggle = async (val: boolean) => {
    if (!foundUser) return;
    await update(ref(db, `users/${foundUser.handle}`), { admin: val });
    alert(`User is now ${val ? "Admin" : "User"}`);
    setFoundUser((prev: any) => ({ ...prev, admin: val }));
    setAllUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.handle === foundUser.handle ? { ...user, admin: val } : user
      )
    );
  };

  const handleBlockToggle = async (isBanned: boolean) => {
    if (!foundUser) return;
    await update(ref(db, `users/${foundUser.handle}`), { isBanned });
    alert(isBanned ? "User Blocked" : "User Unblocked");
    setFoundUser((prev: any) => ({ ...prev, isBanned }));
    setAllUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.handle === foundUser.handle ? { ...user, isBanned } : user
      )
    );
  };

  const handleDeletePost = async (postId: string) => {
    try {
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

      // Now remove the post itself
      await remove(ref(db, `posts/${postId}`));

      // Update local state
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
      // First delete from the post's comments
      await remove(ref(db, `posts/${postId}/comments/${commentId}`));

      // Then delete from the global comments
      await remove(ref(db, `comments/${commentId}`));

      // Update local state by filtering out the deleted comment
      setUserComments((prevComments) =>
        prevComments.filter((comment) => comment.commentId !== commentId)
      );

      alert("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const handleUserSelect = async (userHandle: string) => {
    try {
      // Set loading states
      setUserPosts([]);
      setUserComments([]);

      // First update the search state
      setSearchText(userHandle);
      setSearchBy("username");

      // Find user
      const usersRef = ref(db, `users`);
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        alert("No users found");
        return;
      }

      const users = snapshot.val();
      const found = Object.entries(users).find(
        ([handle]) => handle.toLowerCase() === userHandle.toLowerCase()
      );

      if (!found) {
        alert("User not found");
        return;
      }

      const [handle, userData]: any = found;
      const userWithHandle = { ...userData, handle };
      setFoundUser(userWithHandle);

      // Get user's own posts (if any)
      const posts = await getPostsByUID(userData.uid);
      setUserPosts(posts);

      // NEW: Get ALL posts to create a postID → post mapping
      const allPosts = await getAllPosts();
      const postMap = new Map<string, any>();
      allPosts.forEach((post) => postMap.set(post.id, post));

      // Get ALL comments and filter by userUID
      const commentsRef = ref(db, "comments");
      const commentsSnapshot = await get(commentsRef);

      const allComments: any[] = [];
      if (commentsSnapshot.exists()) {
        Object.entries(commentsSnapshot.val()).forEach(
          ([commentId, comment]: any) => {
            if (comment.userUID === userData.uid) {
              // Find which post this comment belongs to by checking all posts' comments
              const parentPost = allPosts.find(
                (post) => post.comments && post.comments[commentId]
              );

              if (parentPost) {
                allComments.push({
                  ...comment,
                  commentId,
                  postID: parentPost.id,
                  postTitle: parentPost.title, // Adding post title for display
                });
              }
            }
          }
        );
      }

      setUserComments(allComments);
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert("Error loading user information");
    }
  };

  // Search Posts Menu logic here
  const handleSearchPosts = async () => {
    setLoading(true);
    try {
      const posts = await getAllPosts();
      let filteredPosts = [...posts];

      switch (sortOption) {
        case "newest":
          filteredPosts.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          break;
        case "oldest":
          filteredPosts.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          break;
        case "liked":
          filteredPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        case "disliked":
          filteredPosts.sort((a, b) => (b.dislikes || 0) - (a.dislikes || 0));
          break;
        case "commented":
          filteredPosts.sort(
            (a, b) =>
              Object.keys(b.comments || {}).length -
              Object.keys(a.comments || {}).length
          );
          break;
      }

      setSortedPosts(filteredPosts);
    } catch (error) {
      console.error("Error searching posts:", error);
      alert("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByTT = async () => {
    setLoading(true);
    try {
      const posts = await getAllPosts();
      const keyword = tt.trim().toLowerCase();

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
      console.error("Error searching posts:", error);
      alert("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="container border border-3 border-warning rounded shadow-lg p-4 bg-warning-subtle">
          <h1 className="text-center mb-5 fw-bold">🛠️ Admin Dashboard</h1>

          {/* User Management Section */}
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

            {/* Manage Users functionlaity  */}
            <div className="card-body">
              <div className="mb-4">
                {/* Flex wrapper for search + list */}
                <div className="d-flex flex-wrap justify-content-between gap-4 align-items-start">
                  {/* Search input + radio + button */}
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
                      placeholder="Enter username, email or display name..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />

                    {/* Radio buttons */}
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

                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="searchType"
                          id="searchByDisplayName"
                          value="displayName"
                          checked={searchBy === "displayName"}
                          onChange={(e) => setSearchBy(e.target.value)}
                        />
                        <label
                          className="form-check-label text-light"
                          htmlFor="searchByDisplayName"
                        >
                          Display Name
                        </label>
                      </div>
                    </div>

                    <button
                      className="btn btn-warning fw-bold px-4 mt-1"
                      onClick={handleSearch}
                    >
                      Search
                    </button>
                  </div>

                  {/* All Users List */}
                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid #ccc",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "5px",
                      padding: "0.5rem",
                      width: "200px",
                    }}
                  >
                    <h6 className="fw-bold text-secondary mb-2">All Users</h6>
                    {allUsers.length > 0 ? (
                      <ul className="list-unstyled mb-0">
                        {allUsers.map((user) => (
                          <li
                            key={user.handle}
                            className="text-secondary small"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleUserSelect(user.handle)}
                          >
                            {user.handle}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-secondary small">No users found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Detail Card (if selected) */}
              {foundUser && (
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

                    {/* Admin / Block Controls */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleAdminToggle(true)}
                      >
                        Make Admin
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleAdminToggle(false)}
                      >
                        Revoke Admin
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleBlockToggle(true)}
                      >
                        Block User
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleBlockToggle(false)}
                      >
                        Unblock User
                      </button>
                    </div>

                    <hr />

                    {/* Posts */}
                    <h6 className="mt-3">📝 Posts by this user</h6>
                    {userPosts.length > 0 ? (
                      <ul className="list-group mb-3">
                        {userPosts.map((post) => (
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
                    ) : (
                      <p className="text-muted">No posts</p>
                    )}

                    {/* Comments */}
                    <h6>💬 Comments by this user</h6>
                    {userComments.length > 0 ? (
                      <ul className="list-group">
                        {userComments.map((comment) => (
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
                    ) : (
                      <p className="text-muted">No comments</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post Management Section */}
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
              {/* Sorting + Search Filter Menu */}
              <div className="mb-4 d-flex flex-column flex-md-row align-items-md-end gap-3">
                {/* Sort Dropdown */}
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
                >
                  Sort
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
                >
                  Search
                </button>
              </div>
            </div>

            {loading && (
              <div className="text-center my-5">
                <div
                  className="spinner-border text-light"
                  role="status"
                  style={{ width: "3rem", height: "3rem" }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            {!loading && sortedPosts.length > 0 && (
              <div className="mt-4">
                <div className="card p-3 bg-light shadow">
                  <h6 className="mb-3 fw-bold">📃 All Posts</h6>
                  <ul className="list-group">
                    {sortedPosts.map((post) => (
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
                            Comments: {Object.keys(post.comments || {}).length}
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
                </div>
              </div>
            )}

            {!loading && sortedPosts.length === 0 && (
              <p className="text-center text-light mt-4">No posts found</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
