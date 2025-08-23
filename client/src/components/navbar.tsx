import { NavLink } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (
    <header className="navbar">
      <NavLink to="/" className="logo" aria-label="Home">
        <img
          src="https://raw.githubusercontent.com/SerenityJS/serenity/develop/public/serenityjs-banner.png"
          alt="SerenityJS"
          className="logo-img"
        />
      </NavLink>

      <nav>
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/plugins" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
              Plugins
            </NavLink>
          </li>
          <li>
            <NavLink to="/submit" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
              Submit Plugin
            </NavLink>
          </li>
          <li>
            <NavLink to="/login" className={({ isActive }) => isActive ? "navlink active" : "navlink"}>
              Login
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
