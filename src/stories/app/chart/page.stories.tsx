import  ChartPage from '../../../app/chart/page'; // ページコンポーネントのパスを指定
import { Meta, StoryFn } from '@storybook/react';
// props の型を定義する
type ChartPageProps = {
  someProp?: string;  // 例: ChartPage に渡す prop
};

const meta = {
  title: 'ChartPage',
  component: ChartPage,
} satisfies Meta<typeof ChartPage>;

export default meta;

