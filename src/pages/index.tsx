import Layout from "@/components/Layout";
import {
  AlertIcon,
  Link,
  Heading,
  Text,
  OrderedList,
  ListItem,
  Divider,
  Image,
  AlertDescription,
} from "@chakra-ui/react";
import { Timeline, Collapse, CollapseProps } from "antd"

const items: CollapseProps['items'] = [
  {
    key: '1',
    label: 'This is panel header 1',
    children: <p>aaa</p>,
  },
  {
    key: '2',
    label: 'This is panel header 2',
    children: <p>aaa</p>,
  },
  {
    key: '3',
    label: 'This is panel header 3',
    children: <p>aaa</p>,
  },
];

export default function Home() {
  return (
    <>
      <div className="container mx-auto my-10">
        <Layout>
          <Timeline
            mode="left"
            items={[
              {
                label: '07-10',
                children: 'UIデザインを大幅にアップデート',
              },
              {
                label: '07-XX',
                children: 'メッセージ機能を追加',
                color: 'green',
              },
              {
                label: '2024-06-XX',
                children: 'サービスの一般運用開始',
              },
            ]}
          />
          <Collapse items={items} defaultActiveKey={['1']} />
          <Heading as="h1" size="2xl" mb={6}>MemoGo</Heading>

          <Divider className="my-5" />

          <Heading as="h2" size="xl" mt={8} mb={4}>Welcome to MemoGo</Heading>
          <Text mb={4}>
            MemoGo is your go-to platform for all your blogging needs. Whether you are an individual looking to share your thoughts or a business wanting to connect with your audience, MemoGo has the tools you need.
          </Text>

          <Heading as="h3" size="lg" mt={8} mb={4}>Features</Heading>
          <OrderedList spacing={3} mb={4}>
            <ListItem>
              <Text fontWeight="bold">User-Friendly Editor:</Text> Our intuitive editor makes it easy to create and publish blog posts.
            </ListItem>
            <ListItem>
              <Text fontWeight="bold">Community Engagement:</Text> Connect with other bloggers and readers through comments and social sharing.
            </ListItem>
            <ListItem>
              <Text fontWeight="bold">Responsive Design:</Text> Your blog will look great on any device, from desktops to smartphones.
            </ListItem>
          </OrderedList>

          <Heading as="h3" size="lg" mt={8} mb={4}>Getting Started</Heading>
          <Text mb={4}>
            To get started, simply <Link href="/register" color="teal.500">create an account</Link> and start blogging! If you already have an account, <Link href="/login" color="teal.500">log in here</Link>.
          </Text>

          <Divider className="my-5" />

          <Heading as="h3" size="lg" mt={8} mb={4}>Support</Heading>
          <Text mb={4}>
            If you have any questions or need help, visit our <Link href="/support" color="teal.500">support page</Link>.
          </Text>

          {/* <Image src="/boy.png" className="rounded-md mt-5" /> */}
        </Layout>
      </div>
    </>
  );
}