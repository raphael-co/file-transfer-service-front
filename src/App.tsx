import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Page/Home';
import Files from './Page/Files';
import FileUid from './Page/Files/Uid';
import logo from './FILEEXPRESSLOGO.png';
import "./App.css";
const App: React.FC = () => {
  return (
    <Router>
      <header className={'header'}>
        <Link to="/">   <img src={logo} alt="Logo" className={"logo"} /></Link>
        <nav className={'nav'}>
          <ul className={"ul"}>
            <li className={"li"}>
              <Link to="/" className={"link"}>Home</Link>
            </li>
            <li className={"li"}>
              <Link to="/file" className={"link"}>Files</Link>
            </li>
          </ul>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/file" element={<Files />} />
        <Route path="/file/:uid" element={<FileUid />} />
      </Routes>
    </Router>
  );
};

export default App;
