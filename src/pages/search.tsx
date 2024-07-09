import { useState, useEffect } from 'react';
import { db } from '@/firebase/firebaseConfig';
import { collection, query, getDocs, orderBy, doc, getDoc, startAfter, limit } from 'firebase/firestore';
import Link from 'next/link';
import { Box, VStack, HStack, Avatar, Heading, Text, Button, Spinner, Input, InputGroup, InputRightElement, Image, Flex, Card, CardHeader, CardBody } from '@chakra-ui/react';
import Layout from '@/components/Layout';
import Head from 'next/head';
import Fuse from 'fuse.js';

interface Memo {
    id: string;
    userId: string;
    title: string;
    description: string;
    content: string;
    createdAt: any;
    photoURL: string;
    displayName: string;
    userID: string; // ユーザーIDを追加
}

const extractImageUrlFromMarkdown = (markdown: string) => {
    const regex = /!\[.*?\]\((.*?)\)/;
    const match = regex.exec(markdown);
    return match ? match[1] : null;
};

const Search = () => {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadedMemoIds, setLoadedMemoIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [fuse, setFuse] = useState<Fuse<Memo> | null>(null);
    const [displayedMemos, setDisplayedMemos] = useState<Memo[]>([]);

    const fetchMemos = async (initial = false) => {
        setLoading(true);
        let q = query(collection(db, 'memos'), orderBy('createdAt', 'desc'), limit(10));
        if (lastVisible && !initial) {
            q = query(collection(db, 'memos'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(10));
        }
        const querySnapshot = await getDocs(q);
        const memosData: Memo[] = [];
        const newLoadedMemoIds = new Set(loadedMemoIds);

        for (const memoDoc of querySnapshot.docs) {
            const memoId = memoDoc.id;
            if (!newLoadedMemoIds.has(memoId)) {
                newLoadedMemoIds.add(memoId);
                const memoData = memoDoc.data();
                if (memoData && memoData.userId) {
                    const userDocRef = doc(db, 'users', memoData.userId);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        memosData.push({
                            id: memoId,
                            ...memoData,
                            photoURL: userData.photoURL || '/default-avatar.png',
                            displayName: userData.displayName || 'Anonymous',
                            userID: userData.userID // ユーザーIDを取得
                        } as Memo);
                    }
                }
            }
        }

        if (initial) {
            setMemos(memosData);
            setFuse(new Fuse(memosData, {
                keys: ['title', 'description'],
                includeScore: true,
                threshold: 0.3,
            }));
        } else {
            setMemos((prevMemos) => {
                const newMemos = [...prevMemos, ...memosData];
                setFuse(new Fuse(newMemos, {
                    keys: ['title', 'description'],
                    includeScore: true,
                    threshold: 0.3,
                }));
                return newMemos;
            });
        }
        setLoadedMemoIds(newLoadedMemoIds);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setLoading(false);
    };

    useEffect(() => {
        fetchMemos(true);
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setDisplayedMemos([]);
        } else if (fuse) {
            const results = fuse.search(searchQuery);
            setDisplayedMemos(results.map(result => result.item));
        }
    }, [searchQuery, fuse]);

    const truncateDescription = (description: string) => {
        return description.length > 100 ? description.substring(0, 100) + '...' : description;
    };

    return (
        <div className="container mx-auto my-10">
            <Head>
                <title>Search</title>
            </Head>
            <Layout>
                <VStack spacing={5} align="stretch">
                    <InputGroup size="md" className='mb-5'>
                        <Input
                            type="text"
                            placeholder="Search memos"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <InputRightElement width="4.5rem">
                            <Button h="1.75rem" size="sm" onClick={() => setSearchQuery('')}>
                                Clear
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                    {displayedMemos.length === 0 && !loading && searchQuery && <Text>No memos found</Text>}
                    {displayedMemos.map((memo) => {
                        const imageUrl = extractImageUrlFromMarkdown(memo.content);
                        return (
                            <Box key={memo.id} borderWidth='1px' borderRadius='lg' overflow='hidden' className="shadow-sm w-full">
                                <Card>
                                    <CardHeader>
                                        <Flex>
                                            <Flex flex='1' gap='4' alignItems='center' flexWrap='wrap'>
                                                <Link href={`/${memo.userID}`} passHref>
                                                    <Avatar name={memo.displayName} src={memo.photoURL} />
                                                </Link>
                                                <Box>
                                                    <Link href={`/${memo.userID}`} passHref>
                                                        <Heading size='sm'>{memo.displayName}</Heading>
                                                    </Link>
                                                    <Text className="text-gray-500 text-sm mt-1">{memo.createdAt?.toDate().toLocaleString()}</Text>
                                                </Box>
                                            </Flex>
                                        </Flex>
                                    </CardHeader>
                                    <CardBody className="mb-5">
                                        <Link href={`/memo?id=${memo.id}`} passHref>
                                            <Heading size='md' className='mb-3'>{memo.title}</Heading>
                                        </Link>
                                        <Text>{truncateDescription(memo.description)}</Text>
                                        {imageUrl && <Image objectFit='cover' src={imageUrl} alt='Memo image' className='mt-5' />}
                                    </CardBody>
                                </Card>
                            </Box>
                        );
                    })}
                </VStack>
                <div className='w-full flex items-center justify-center'>
                    {loading ? (
                        <Button isDisabled={loading} className="mt-5">
                            <Spinner size="sm" className='mr-2' />Loading...
                        </Button>
                    ) : (
                        <Button onClick={() => fetchMemos(false)} isDisabled={loading || !searchQuery} className="mt-5">
                            Load more...
                        </Button>
                    )}
                </div>
            </Layout>
        </div>
    );
};

export default Search;