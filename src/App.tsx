import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar";

import Home from "./pages/home";
import Plugins from "./pages/plugins";
import PluginDetails from "./pages/plugin-details";
import Submit from "./pages/submit";

// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/plugins" element={<Plugins />}></Route>
          <Route path="/submit" element={<Submit />}></Route>
          <Route path="/plugins/:owner/:name" element={<PluginDetails />}></Route>
        </Routes>
      </main>
    </div>
  )
}

export default App
