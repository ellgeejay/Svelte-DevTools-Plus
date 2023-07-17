import React from 'react';
// import { BrowserRouter as Router, Route } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
import ReactDOM from 'react-dom';
const Style = require('./style.css');

const root = createRoot(document.getElementById('root'));

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
