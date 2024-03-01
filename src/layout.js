// Layout.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Sidebar from './components/sidebar';
import MainContent from './components/MainContent';
import Login from './pages/login';
import About from './pages/about';
import Dashboard from './pages/dashboard';
import Transactions from './pages/transactions';
import Appointments from './pages/appointments';
import News from './pages/news';
import Birth from './pages/birthReg';
import Marriage from './pages/marriageCert';
import Death from './pages/deathCert';
import JobApplication from './pages/job';
import FAQ from './pages/faq';
import Helps from './pages/helps';
import Privacy from './pages/privacy-policy';
import Forgot from './pages/forgot-password';
import History from './pages/history';
import Account from './pages/accounts';


const Layout = () => {
    
    return (
        <Router>
            <div className="app">
                <MainContent>
                    <Switch>
                        <Route path="/login" component={Login} />
                        <Route path="/about" component={About} />
                        <Route path="/home" component={Dashboard} />
                        <Route path="/transactions" component={Transactions} />
                        <Route path="/appointments" component={Appointments} />
                        <Route path="/news" component={News} />
                        <Route path="/birthReg" component={Birth} />
                        <Route path="/marriageCert" component={Marriage} />
                        <Route path="/deathCert" component={Death} />
                        <Route path="/job" component={JobApplication} />
                        <Route path="/faq" component={FAQ} />
                        <Route path="/helps" component={Helps} />
                        <Route path="/history" component={History} />
                        <Route path="/privacy-policy" component={Privacy} />
                        <Route path="/forgot-password" component={Forgot} />
                        <Route path="/account-settings" component={Account} />
                    </Switch>
                </MainContent>
            </div>
        </Router>
    );
};

export default Layout;
