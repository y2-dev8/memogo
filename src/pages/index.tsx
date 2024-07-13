import Layout from "@/components/Layout";
import { Image } from "@chakra-ui/react";
import { Timeline, Button, Divider, Avatar, Tooltip, Input } from "antd";
import { FaUserFriends, FaMarkdown, FaComments } from "react-icons/fa";
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
  const [text, setText] = useState("### Hello");

  return (
    <div className="container mx-auto">
      <Layout>
          <div className="flex flex-col lg:flex-row lg:h-screen items-center justify-center">
            <Image src="https://opendoodles.s3-us-west-1.amazonaws.com/ice-cream.svg" className="h-80" />
            <div className="flex flex-col items-center">
              <Image src="/logo.png" className="w-40" />
              <p className="text-xl text-gray-500 mt-5">短期会話で長期記憶に刻む</p>
              <Button type="primary" className="mt-5">
                <Link href="register">新規登録</Link>
              </Button>
            </div>
          </div>
      </Layout>
    </div>
  );
}