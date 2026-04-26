import type { Meta, StoryObj } from "@storybook/react";
import ChartPage from "../../../app/chart/page";

const meta = {
  title: "ChartPage",
  component: ChartPage,
} satisfies Meta<typeof ChartPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
