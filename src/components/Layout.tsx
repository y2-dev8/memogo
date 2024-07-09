import { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode;
    flex?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, flex }) => {
    return (
        <div className={`mx-auto max-w-[90%] md:max-w-[60%] ${flex ? 'flex' : ''}`}>
            {children}
        </div>
    );
};

export default Layout;