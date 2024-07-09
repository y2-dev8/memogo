import "@/styles/globals.css"
import type { AppProps } from "next/app"
import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import Head from "next/head"
import MobileNav from "@/components/MobileNav"
import SideBar from "@/components/SideBar"
import 'github-markdown-css/github-markdown.css'
import '@/styles/md.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Head>
        <title>MemoGo</title>
        <link rel="icon" href="/memogo.png" />
        <link rel="apple-touch-icon" href="/memogo.png" />
      </Head>
      <div className="flex w-full pt-[60px] md:pt-0">
        <SideBar />
        <MobileNav />
        <Component {...pageProps} />
      </div>
    </ChakraProvider>
  )
}