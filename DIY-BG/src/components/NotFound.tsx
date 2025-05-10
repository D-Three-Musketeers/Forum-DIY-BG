import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div>
      <h2>Page not found ❌</h2>
      <Link to={"/"}>
        <button>Go back Home</button>
      </Link>
    </div>
  );
};

export default NotFound;
