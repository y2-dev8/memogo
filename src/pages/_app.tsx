import "@/styles/globals.css"
import type { AppProps } from "next/app"
import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import Head from "next/head"
import 'github-markdown-css/github-markdown.css'
import '@/styles/md.css'
import Header from "@/components/Header"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Head>
        <title>ash.</title>
        <link rel="icon" href="/memogo.png" />
        <link rel="apple-touch-icon" href="/memogo.png" />
      </Head>
      <Header />
      <div className="flex w-full">
        <Component {...pageProps} />
      </div>
    </ChakraProvider>
  )
}