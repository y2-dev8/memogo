import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderWidth: {
        'border': '1px', // 例: 'border-border'クラスを定義する
      },
      backgroundColor: {
        'background': '#f0f0f0', // 例: カスタム背景色クラスを定義
      },
      textColor: {
        'foreground': '#333333', // 例: カスタムテキスト色を定義
      },
    },
  },
  plugins: [],
};
export default config;
