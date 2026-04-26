import ChartPage from '../../../app/chart/page';
import { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'ChartPage',
  component: ChartPage,
} satisfies Meta<typeof ChartPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

