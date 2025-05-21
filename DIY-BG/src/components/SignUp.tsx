import { useState, useContext } from "react";
import { registerUser } from "../services/auth.service";
import {
  // getUserByHandle,
  makeHandle,
  createUserHandle,
  getUserData,
} from "../services/users.service";
import Hero from "./Hero";
import { useNavigate } from "react-router";
import { AppContext } from "../state/App.context";

const SignUpPage = () => {
  const [user, setUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const navigate = useNavigate();
  const { setAppState } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidName = (name: string) => {
    return name.trim().length >= 3 && name.trim().length <= 32 ? true : false;
  };

  const register = async () => {
    if (!user.email || !user.password || !user.firstName || !user.lastName) {
      return alert("Please enter all fields!");
    }
    if (!isValidName(user.firstName) || !isValidName(user.lastName)) {
      return alert("First and last name must be between 3 and 32 symbols!");
    }
    setLoading(true);
    setError("");
    try {
      const userCredential = await registerUser(user.email, user.password);
      const uid = userCredential.user.uid;

      const handle = makeHandle(user.firstName, user.lastName);

      await createUserHandle(
        handle,
        uid,
        user.email,
        user.firstName,
        user.lastName,
        "default-avatar-diy.webp"
      );
      const rawData = await getUserData(uid);
      const userData = rawData ? Object.values(rawData)[0] : null;
      setAppState({
        user: userCredential.user,
        userData: userData,
      });
      navigate("/home");
    } catch (error: any) {
      console.error(error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser =
    (prop: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setUser({
        ...user,
        [prop]: e.target.value,
      });
    };

  return (
    <div className="app-page-content">
      <Hero />
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div
          className="card p-4 shadow"
          style={{
            width: "100%",
            maxWidth: "500px",
            backgroundColor: "#f8f9fa", // Slightly darker white
          }}
        >
          <div className="card-body">
            <h2 className="card-title text-center mb-4">Register</h2>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Enter email..."
                value={user.email}
                onChange={updateUser("email")}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter password..."
                value={user.password}
                onChange={updateUser("password")}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                className="form-control"
                placeholder="Enter first name..."
                value={user.firstName}
                onChange={updateUser("firstName")}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                className="form-control"
                placeholder="Enter last name..."
                value={user.lastName}
                onChange={updateUser("lastName")}
              />
            </div>

            <button
              className="btn btn-primary w-100 py-2"
              onClick={register}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
