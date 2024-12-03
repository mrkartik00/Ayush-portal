import { Header, SmallFooter } from '..';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function LayoutTwo() {
    const location = useLocation();

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    return (
        <div className="h-full w-full">
            <div className="fixed top-0 z-10 w-full">
                <Header />
            </div>

            <div className="pt-[110px] overflow-hidden">
                <div className="min-h-[calc(100vh-110px)]">
                    <Outlet />
                </div>

                <SmallFooter />
            </div>
        </div>
    );
}
