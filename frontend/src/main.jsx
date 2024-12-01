// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import {
    Route,
    createBrowserRouter,
    createRoutesFromElements,
    RouterProvider,
} from 'react-router-dom';

import {
    AboutUsPage,
    ContactUsPage,
    FAQpage,
    HomePage,
    RegisterPage,
    LoginPage,
} from './pages';

import EmailVerification from './components/EmailVerifiaction/EmailVerification.jsx';
import RegisterYourStartups from './pages/RegisterYourStartups.jsx';

import { LayoutOne, LayoutTwo, LayoutThree } from './components';

import { VariantContextProvider, UserContextProvider } from './contexts';
import ConnectedStartups from './pages/ConnectedStartups.jsx';
import InvestorType from './Investor Connect/InvestorType.jsx';

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<App />}>
            <Route path="" element={<LayoutOne />}>
                <Route path="" element={<HomePage />} />
                <Route path="about-us" element={<AboutUsPage />} />
                <Route path="contact-us" element={<ContactUsPage />} />
                <Route path="faqs" element={<FAQpage />} />
                <Route
                    path="user/RegisterYourStartup"
                    element={<RegisterYourStartups />}
                />
            </Route>
            <Route path="" element={<LayoutTwo />}>
                <Route path="register" element={<RegisterPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route
                    path="user/verify/:userId/:uniqueString"
                    element={<EmailVerification />}
                />
                <Route path="InvestorType" element={<InvestorType />} />
            </Route>
            <Route path="" element={<LayoutThree />}>
                <Route
                    path="connected-startups/:userId"
                    element={<ConnectedStartups />}
                />
            </Route>
        </Route>
    )
);

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <UserContextProvider>
        <VariantContextProvider>
            <RouterProvider router={router} />
        </VariantContextProvider>
    </UserContextProvider>
    // </StrictMode>
);
