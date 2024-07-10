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
            <Head><title>500 Error</title></Head>
            <Result
                status="500"
                title="500"
                subTitle="Sorry, something went wrong."
            />
        </div>
    );
};

export default Error;