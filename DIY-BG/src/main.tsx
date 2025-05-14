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
import LogInPage from "./components/LogIn.tsx";
import NotFound from "./components/NotFound.tsx";
import Post_CreateView from "./components/Post/Post_CreateView.tsx";
import Post_DetailView from "./components/Post/Post_DetailView.tsx";

// BrowserRouter
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppProvider } from "./state/App.context.tsx";

//Language setting / Езикови настройки
import "./config/i18n"; // Adjust path if needed

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/home", element: <App /> },
  { path: "/about", element: <About /> },
  { path: "/admin", element: <Admin /> },
  { path: "/signinpage", element: <SignUpPage /> },
  { path: "/loginpage", element: <LogInPage /> },
  { path: "/create-post", element: <Post_CreateView /> },
  { path: "/user/:uid", element: <User /> },
  { path: "/post/:id", element: <Post_DetailView /> },
  { path: "*", element: <NotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>
);
