import Hero from "./components/Hero";
// import { LogInPage } from "./components/LogIn";
// import { SignUpPage } from "./components/SignUp";
import { LogInPage } from "./components/LogIn";
import { SignUpPage } from "./components/SignUp";
import Home from "./components/Home";

// import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() {
  return (
    <>
      <Hero />
      {/* <BrowserRouter>
        <Hero></Hero>
        <Routes>
          <Route path="/signinpage" element={<SignUpPage />} />
          <Route path="/loginpage" element={<LogInPage />} />
        </Routes>
      </BrowserRouter> */}
      <BrowserRouter>
        <Hero></Hero>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signinpage" element={<SignUpPage />} />
          <Route path="/loginpage" element={<LogInPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
