import React from 'react';
import './App.css';
import { Authenticate } from './components/Authenticate';
import CombinedLogger from "./components/CombinedLogger";


function App() {
  return (
    <div>
    <Authenticate />
    <CombinedLogger />
    </div>
  );
}

export default App;
