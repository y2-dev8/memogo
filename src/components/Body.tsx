import { ReactNode } from 'react'
import { HappyProvider } from '@ant-design/happy-work-theme'

interface BodyProps {
    children: ReactNode;
}

const Body = ({ children }: BodyProps) => {
    return (
        <HappyProvider>
            <div className="container mx-auto my-0">
                <div className="mx-auto max-w-[90%] md:max-w-[60%]">
                    {children}
                </div>
            </div>
        </HappyProvider>
    );
};

export default Body;