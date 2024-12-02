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
    ConnectedStartupsPage,
    // TargettedStartupsPage,
    OwnerConnectPage,
    ServerErrorPage,
    // RegisterYourStartupPage,
} from './pages';

import EmailVerification from './components/EmailVerifiaction/EmailVerification.jsx';

import { LayoutOne, LayoutTwo, LayoutThree, InvestorType } from './components';

import {
    ProfileDropdownContextProvider,
    VariantContextProvider,
    UserContextProvider,
} from './contexts';
// import ConnectedStartups from './pages/ConnectedStartups.jsx';
// import InvestorType from './InvestorConnect/InvestorType.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DocumentsCheck from './pages/DocumentsCheck.jsx';

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<App />}>
            <Route path="" element={<LayoutOne />}>
                <Route path="" element={<HomePage />} />
                <Route path="about-us" element={<AboutUsPage />} />
                <Route path="contact-us" element={<ContactUsPage />} />
                <Route path="faqs" element={<FAQpage />} />
                {/* <Route
                    path="user/RegisterYourStartup"
                    element={<RegisterYourStartups />}
                />*/}
            </Route>
            <Route path="" element={<LayoutTwo />}>
                <Route path="register" element={<RegisterPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route
                    path="user/verify/:userId/:uniqueString"
                    element={<EmailVerification />}
                />
                {/* <Route path="InvestorType" element={<InvestorType />} /> */}
            </Route>
            <Route path="" element={<LayoutThree />}>
                {/* <Route
                    path="connected-startups/:userId"
                    element={<ConnectedStartups />}
                /> */}
            </Route>
            <Route path="AdminDashboard" element={<AdminDashboard />} />
            <Route path="/startup/:id/documents" element={<DocumentsCheck />} />
            <Route path="/server-error" element={<ServerErrorPage />} />
        </Route>
    )
);

createRoot(document.getElementById('root')).render(
    // <StrictMode>
    <UserContextProvider>
        <ProfileDropdownContextProvider>
            <VariantContextProvider>
                <RouterProvider router={router} />
            </VariantContextProvider>
        </ProfileDropdownContextProvider>
    </UserContextProvider>
    // </StrictMode>
);
