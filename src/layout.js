// Layout.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Sidebar from './components/sidebar';
import MainContent from './components/MainContent';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import Transactions from './pages/transactions';
import Appointments from './pages/appointments';
import News from './pages/news';
import Users from './pages/users';

const Layout = () => {
    return (
        <Router>
            <div className="app">
                <Sidebar />
                <MainContent>
                    <Switch>
                        <Route path="/login" component={Login} />
                        <Route path="/signup" component={Signup} />
                        <Route path="/dashboard" component={Dashboard} />
                        <Route path="/transactions" component={Transactions} />
                        <Route path="/appointments" component={Appointments} />
                        <Route path="/news" component={News} />
                        <Route path="/users" component={Users} />
                    </Switch>
                </MainContent>
            </div>
        </Router>
    );
};

export default Layout;
