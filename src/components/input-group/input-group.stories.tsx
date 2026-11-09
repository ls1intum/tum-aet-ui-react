import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { InputGroup, InputGroupAddon } from './input-group';

function FormLayout(Story: Parameters<Decorator>[0]) {
  return (
    <div
      style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', width: 'min(20rem, calc(100vw - 2rem))' }}
    >
      <Story />
    </div>
  );
}

const labelStyle = { fontWeight: 600 } as const;

const meta = {
  title: 'Forms/Input Group',
  component: InputGroup,
  subcomponents: { InputGroupAddon },
  parameters: {
    docs: {
      description: {
        component:
          'Joins an `Input` (or `InputNumber`) with `InputGroupAddon`s at its start and end into one control. ' +
          'The addon borders follow the hover and focus state of the field next to them.',
      },
    },
  },
  decorators: [FormLayout],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <label htmlFor="budget" style={labelStyle}>
        Budget
      </label>
      <InputGroup>
        <InputGroupAddon>€</InputGroupAddon>
        <Input id="budget" inputMode="decimal" placeholder="0" />
        <InputGroupAddon>EUR</InputGroupAddon>
      </InputGroup>
    </>
  ),
};

export const LeadingAddonOnly: Story = {
  render: () => (
    <>
      <label htmlFor="host" style={labelStyle}>
        Host
      </label>
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <Input id="host" placeholder="example.org" />
      </InputGroup>
    </>
  ),
};

export const TrailingAddonOnly: Story = {
  render: () => (
    <>
      <label htmlFor="weight" style={labelStyle}>
        Weight
      </label>
      <InputGroup>
        <Input id="weight" inputMode="decimal" placeholder="0" />
        <InputGroupAddon>kg</InputGroupAddon>
      </InputGroup>
    </>
  ),
};

export const WithInputNumber: Story = {
  render: function CapacityInputGroup() {
    const [capacity, setCapacity] = useState<number | null>(null);
    return (
      <>
        <label htmlFor="grouped-capacity" style={labelStyle}>
          Capacity
        </label>
        <InputGroup>
          <InputGroupAddon>#</InputGroupAddon>
          <InputNumber
            id="grouped-capacity"
            value={capacity}
            onValueChange={setCapacity}
            aria-describedby="capacity-help"
            showButtons
            min={0}
            max={5000}
            locale="en-US"
          />
          <InputGroupAddon>places</InputGroupAddon>
        </InputGroup>
        <small id="capacity-help">Maximum tutorial group size</small>
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl" style={{ display: 'grid', gap: 8 }}>
      <label htmlFor="budget-rtl" style={labelStyle}>
        Budget
      </label>
      <InputGroup>
        <InputGroupAddon>€</InputGroupAddon>
        <Input id="budget-rtl" inputMode="decimal" placeholder="0" />
        <InputGroupAddon>EUR</InputGroupAddon>
      </InputGroup>
    </div>
  ),
};
