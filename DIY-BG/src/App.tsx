import Hero from "./components/Hero";
import { LogInPage } from './components/logIn'
import { SignUpPage } from "./components/signUp";

import {BrowserRouter,Routes,Route } from "react-router-dom";
function App() {
  return (
    <>
    <BrowserRouter>
    <Hero></Hero>
    <Routes>
      <Route path="/signinpage" element={<SignUpPage/>}/>
      <Route path="/loginpage" element={<LogInPage/>}/>
    </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
