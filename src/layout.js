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
import Birth from './pages/birthReg';
import Marriage from './pages/marriageCert';
import Marriages from './pages/marriageReg';
import Death from './pages/deathCert';
import DeathReg from './pages/deathReg';
import Business from './pages/businessPermit';
import JobApplication from './pages/job';
import NewsForm from './pages/news';
import NewsDetails from './pages/newsDetails';

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
                        <Route path="/birthReg" component={Birth} />
                        <Route path="/marriageCert" component={Marriage} />
                        <Route path="/marriageReg" component={Marriages} />
                        <Route path="/deathCert" component={Death} />
                        <Route path="/deathReg" component={DeathReg} />
                        <Route path="/businessPermit" component={Business} />
                        <Route path="/job" component={JobApplication} />
                        <Route path="/news" component={NewsForm} />
                        <Route path="/news/:id" component={NewsDetails} />
                    </Switch>
                </MainContent>
            </div>
        </Router>
    );
};

export default Layout;
