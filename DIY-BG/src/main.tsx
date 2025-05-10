import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";

// Our Web Pages
import App from "./App.tsx";
import About from "./components/About.tsx";
import Admin from "./components/Admin.tsx";
import User from "./components/User.tsx";
import SignUpPage from "./components/SignUp.tsx";
import NotFound from "./components/NotFound.tsx";
// BrowserRouter
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/about", element: <About /> },
  { path: "/admin", element: <Admin /> },
  { path: "/sign-up", element: <SignUpPage /> },
  { path: "/user", element: <User /> },
  { path: "*", element: <NotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
