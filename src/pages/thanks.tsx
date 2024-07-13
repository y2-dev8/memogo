import { Button } from 'antd';
import Head from 'next/head';
import Link from 'next/link';

export default function Settings() {
    return (
        <div className="container mx-auto">
            <Head>
                <title>Thanks a million</title>
            </Head>
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col justify-center text-center">
                    <img src="https://opendoodles.s3-us-west-1.amazonaws.com/meditating.svg" className="h-60 mb-5" />
                    <p className="text-lg font-semibold">今までありがとうございました</p>
                    <p className="text-lg font-semibold">またのご利用をお待ちしております</p>
                    <Button type="primary" className="mt-5">
                        <Link href="/register">
                            新規登録
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};