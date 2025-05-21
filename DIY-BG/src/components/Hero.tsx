import "bootstrap/dist/css/bootstrap.min.css";
import { FaSearch } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AppContext } from "../state/App.context";
import { logoutUser } from "../services/auth.service";
import { checkIfBanned } from "../services/users.service";
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "react-i18next";

const Hero = () => {
  const navigate = useNavigate();
  const { user, userData } = useContext(AppContext);
  const { setAppState } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDark, setIsDark] = useState(() =>
    document.body.classList.contains("dark-theme")
  );

  useEffect(() => {
    const handler = () =>
      setIsDark(document.body.classList.contains("dark-theme"));
    window.addEventListener("theme-toggle", handler);
    // Also update on mount in case theme changed elsewhere
    handler();
    return () => window.removeEventListener("theme-toggle", handler);
  }, []);

  const { t } = useTranslation();

  const logout = () => {
    logoutUser()
      .then(() => {
        setAppState({
          user: null,
          userData: null,
        });
        navigate("/home");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate("/home");
    }
    setSearchTerm("");
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (user === undefined) {
    return (
      <header
        className="text-white py-3 border-bottom border-secondary"
        style={{ backgroundColor: "#12263a" }}
      >
        <div className="container text-center">
          <h2>{t("hero.loadingUser")}</h2>
        </div>
      </header>
    );
  }

  return (
    <header
      style={{ backgroundColor: "#12263a" }}
      className="text-white py-3 border-bottom border-secondary"
    >
      <div className="container-fluid d-flex align-items-center justify-content-between flex-wrap gap-3">
        {/* Left: Logo + Navigation */}
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: "100px", height: "100px" }}>
            <img
              src="/DIY-BG.png"
              onClick={() => navigate("/home")}
              alt="logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "6px",
              }}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/home"
              className="btn btn-outline-light fw-semibold px-2 nav-link-hover"
            >
              🏘 {t("hero.home")}
            </Link>
            <Link
              to="/about"
              className="btn btn-outline-light fw-semibold px-2 nav-link-hover"
            >
              ℹ {t("hero.about")}
            </Link>
          </div>
        </div>

        {/* Middle: Welcome + Search Bar */}
        <div className="flex-grow-1 d-flex flex-column align-items-center">
          <h2 className="text-light mb-2 fw-semibold">
            ✎ {t("hero.welcome")} ✂
          </h2>
          <div
            className="d-flex align-items-center hero-search-bar"
            style={{
              backgroundColor: isDark ? "#23272b" : "#eefcf0",
              borderRadius: "40px",
              padding: "6px 12px",
              width: "320px",
              border: "2px solid #8dd98d",
            }}
          >
            <input
              type="text"
              placeholder={t("hero.searchPlaceholder")}
              className="form-control border-0 bg-transparent shadow-none"
              style={{
                flex: 1,
                fontSize: "14px",
                backgroundColor: isDark ? "#23272b" : "transparent",
                color: isDark ? "#fff" : "#12263a",
                border: "none",
                boxShadow: "none",
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <span
              className="px-2 text-muted"
              style={{ borderLeft: "1px solid #ccebd0", height: "20px" }}
            ></span>
            <button
              className="btn p-1 ms-2 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: "#8dd98d",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                border: "none",
              }}
              onClick={handleSearch}
            >
              <FaSearch size={14} color="white" />
            </button>
          </div>
        </div>

        {/* Right: Theme Toggle, Language, User Info */}
        <div className="d-flex align-items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            className="btn btn-light btn-sm border shadow-sm d-flex align-items-center justify-content-center theme-toggle-btn"
            style={{
              minWidth: 36,
              minHeight: 36,
              borderRadius: 20,
              padding: 0,
            }}
            onClick={() => {
              const currentlyDark =
                document.body.classList.contains("dark-theme");
              document.body.classList.toggle("dark-theme");
              localStorage.setItem("theme", !currentlyDark ? "dark" : "light");
              // Update state immediately for icon
              setIsDark(!currentlyDark);
              window.dispatchEvent(new Event("theme-toggle"));
            }}
            aria-label="Toggle light/dark mode"
          >
            <span className="d-block" style={{ fontSize: 18 }}>
              {isDark ? "🌙" : "☀️"}
            </span>
          </button>
          <LanguageToggle />
          {user ? (
            <>
              <span className="text-white small">
                {userData?.handle || "User"}
              </span>
              <div
                onClick={() => navigate(`/user/${user.uid}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={userData?.photoBase64 || "/default-avatar-diy.webp"}
                  alt="profile"
                  className="rounded-circle border"
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "cover",
                  }}
                  onError={(e) =>
                    (e.currentTarget.src = "/default-avatar-diy.webp")
                  }
                />
              </div>
              <button onClick={logout}>{t("hero.logout")}</button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => navigate("/loginpage")}
              >
                {t("hero.login")}
              </button>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => navigate("/signinpage")}
              >
                {t("hero.signup")}
              </button>
            </>
          )}
        </div>

        {/* Create Post Button */}
        <div className="w-100 d-flex justify-content-end mt-2 mt-lg-0">
          <button
            className="btn btn-outline-info fw-semibold px-2.5"
            onClick={async () => {
              if (await checkIfBanned(userData.uid)) return;
              navigate("/create-post");
            }}
          >
            📝 {t("hero.createPost")}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
