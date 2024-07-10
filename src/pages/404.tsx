import Head from 'next/head';
import { Result, Spin } from "antd";
import React, { useState, useEffect } from 'react';

const Error = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="w-full min-h-screen flex justify-center items-center h-screen"><Spin size="large" /></div>;
    }

    return (
        <div className="w-screen flex items-center justify-center">
            <Head><title>404 Error</title></Head>
            <Result
                status="404"
                title="404"
                subTitle="Sorry, the page you visited does not exist."
            />
        </div>
    );
};

export default Error;