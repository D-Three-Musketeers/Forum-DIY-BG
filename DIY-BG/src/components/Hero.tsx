import "bootstrap/dist/css/bootstrap.min.css";
import { FaSearch } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Hero = () => {

  const navigate = useNavigate();
  return (
    <header
      style={{ backgroundColor: "#12263a" }}
      className="text-white py-3 border-bottom border-secondary"
    >
      <div className="container-fluid d-flex align-items-center justify-content-between flex-wrap gap-3">
        {/* Left: Only Logo (Large) + Home Button */}
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ width: "100px", height: "100px" }}
        >
          <img
            src="/DIY-BG.png"
            alt="logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: "6px",
            }}
          />
        </div>
        <Link to="/" className="btn btn-outline-light btn-sm">Home</Link>

        {/* Middle: Welcome + Search Bar */}
        <div className="flex-grow-1 d-flex flex-column align-items-center">
          <h2 className="text-light mb-2 fw-semibold">
            Welcome to DIY-BG Forum
          </h2>

          <div
            className="d-flex align-items-center"
            style={{
              backgroundColor: "#eefcf0", // very light green
              borderRadius: "40px",
              padding: "6px 12px",
              width: "320px",
              border: "2px solid #8dd98d",
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              className="form-control border-0 bg-transparent shadow-none"
              style={{
                flex: 1,
                fontSize: "14px",
                color: "#12263a", // match Hero background
              }}
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
              onClick={() => console.log("Search clicked")}
            >
              <FaSearch size={14} color="white" />
            </button>
          </div>
        </div>

        {/* Right: Username + Buttons */}
        <div className="d-flex align-items-center gap-2">
          <span className="text-white small">Username</span>
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/signinpage')}>Log in</button>
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/loginpage')}>Sign up</button>
          <img
            src=""
            alt="profile"
            className="rounded-circle border"
            style={{ width: "36px", height: "36px", backgroundColor: "#ccc" }}
          />
        </div>

        {/* Full-width below on mobile: Create Post */}
        <div className="w-100 d-flex justify-content-end mt-2 mt-lg-0">
          <button className="btn btn-outline-info fw-semibold px-4">
            Create a post!
          </button>
        </div>
      </div>
    </header>
  );
};

export default Hero;
