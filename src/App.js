import React from 'react';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import Login from './pages/login';

function App() {
  return (
    <Router>
      <Route exact path="/">
        <Redirect to="/login" component={Login} />
      </Route>
    </Router>
  );
}

export default App;
