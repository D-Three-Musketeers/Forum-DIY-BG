import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="app-page-content d-flex flex-column align-items-center justify-content-center min-vh-100">
      <h2>Page not found ❌</h2>
      <Link to={"/"}>
        <button className="btn btn-primary mt-3">Go back Home</button>
      </Link>
    </div>
  );
};

export default NotFound;
