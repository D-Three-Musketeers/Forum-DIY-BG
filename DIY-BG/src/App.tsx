import Hero from "./components/Hero";
import Home from "./components/Home";

function App() {
  // Exclude Admin from dark theme, so just render as usual
  return (
    <div className="app-page-content">
      <Hero />
      <Home />
    </div>
  );
}

export default App;
