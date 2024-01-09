import React from 'react';
import { BrowserRouter as Router, Routes, Route, Switch } from 'react-router-dom';

import Signup from './pages/signup';
import Login from './pages/login';
import Dashboard from "./pages/dashboard";

function App() {
  <Login/>
  return (
    <Router>
      <Switch>
        <Route exact path="/signup" component={Signup} />
        <Route exact path="/login" component={Login} />
      </Switch>
    </Router>
  );
}

export default App;
