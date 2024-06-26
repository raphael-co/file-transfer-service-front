import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Page/Home';
import Files from './Page/Files';
import FileUid from './Page/Files/Uid';

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
        <Route path="/file/:uid" element={<FileUid />} />
      </Routes>
    </Router>
  );
};

export default App;
