import { useState, useContext, useEffect } from "react";
import { AppContext } from "../state/App.context";
import { useNavigate } from "react-router-dom";
import Hero from "./Hero";

const Admin = () => {
  const { user, userData } = useContext(AppContext);
  const navigate = useNavigate();
  /**
   * If the user-admin is not logged in!
   */
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

  /**
   * If the user is not an Admin
   */

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
                You don't have Amin rights!{" "}
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

  return <h2>Admin Dashboard Page</h2>;
};

export default Admin;
