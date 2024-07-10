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
            <Head><title>403 Error</title></Head>
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
            />
        </div>
    );
};

export default Error;