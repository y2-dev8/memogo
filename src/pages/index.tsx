import Layout from "@/components/Layout";
import { Image } from "@chakra-ui/react";
import { Timeline, Button, Divider, Avatar, Tooltip, Input } from "antd";
import React, { ReactNode, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const { TextArea } = Input;

interface SectionProps {
  children: ReactNode;
}

const Section: React.FC<SectionProps> = ({ children }) => (
  <div className="flex flex-col items-center justify-center border p-5 rounded-xl h-[300px] md:w-1/3">
    {children}
  </div>
);

interface HeadingProps {
  children: ReactNode;
}

const Heading: React.FC<HeadingProps> = ({ children }) => (
  <div className="h-1/3 flex flex-col items-center justify-center mb-5">
    {children}
  </div>
);

export default function Home() {
  const [text, setText] = useState("### *Hello*");

  return (
    <div className="container mx-auto my-10">
      <Layout>
        <div>
          <div className="flex flex-col lg:flex-row items-center justify-center mb-10">
            <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/ice-cream.svg" className="h-80" />
            <div className="flex flex-col items-center">
              <Image src="/logo.png" className="w-40" />
              <p className="text-xl text-gray-500 mt-5">短期会話で長期記憶に刻む</p>
              <Button type="primary" className="mt-5">
                <Link href="register">新規登録</Link>
              </Button>
            </div>
          </div>
          <Divider />
          <div className="flex flex-col justify-center">
            <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/plant.svg" className="h-40 mb-5" />
            <div className="flex flex-col md:flex-row justify-center space-y-5 md:space-y-0 md:space-x-5">
              <Section>
                <Heading>
                  <p className="font-bold text-xl mb-1.5">使いやすいUI</p>
                  <p className="text-sm text-gray-500">ストレスフリー</p>
                </Heading>
                <div className="w-full h-2/3">
                  <Timeline
                    items={[
                      { children: '2024-06-XX サービスを公開する。' },
                      { color: 'green', children: '新しいメッセージ機能を追加する。' },
                      { children: '2024-07-10 UIを一新する。' },
                    ]}
                  />
                </div>
              </Section>
              <Section>
                <Heading>
                  <Link className="font-bold text-xl mb-1.5 hover:text-blue-500 transition-all" href="/editor">マークダウン</Link>
                  <p className="text-sm text-gray-500">長期的に記憶</p>
                </Heading>
                <div className="w-full h-2/3">
                  <TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="mb-2.5"
                    autoSize={{ maxRows: 3 }}
                  />
                  <div className="markdown-body markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                  </div>
                </div>
              </Section>
              <Section>
                <Heading>
                  <Link className="font-bold text-xl mb-1.5 hover:text-blue-500 transition-all" href="/message">メッセージ</Link>
                  <p className="text-sm text-gray-500">ストレスフリーな会話</p>
                </Heading>
                <div className="w-full h-2/3">
                  <div className="flex">
                    <Avatar className="bg-orange-500 mr-1.5" size="small">山田</Avatar>
                    <div>
                      <div className="w-fit px-[12.5px] py-2.5 rounded-md bg-gray-50">クリー</div>
                      <div className="flex mt-0.5 text-xs opacity-50">09:45</div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="ml-auto">
                      <div className="flex w-fit px-[12.5px] py-2.5 rounded-md bg-blue-100">
                        ピーナッツ<p className="block md:hidden">ピーナッツ</p>
                      </div>
                      <div className="flex mt-0.5 text-xs opacity-50">15:20</div>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}