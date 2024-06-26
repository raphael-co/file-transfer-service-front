import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Page/Home';
import Files from './Page/Files';

const About: React.FC = () => {
  return <h2>About Page</h2>;
};

const Contact: React.FC = () => {
  return <h2>Contact Page</h2>;
};

const App: React.FC = () => {
  return (
    <Router>
      {/* <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
        </ul>
      </nav> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </Router>
  );
};

export default App;
