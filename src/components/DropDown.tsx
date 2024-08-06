import React, { ChangeEventHandler } from 'react';

export interface FromOption {
  key: string;
  value: string;
}

interface Props {
  options: FromOption[];
  select: string;
  onSelect: ChangeEventHandler<HTMLSelectElement>;
}

const Dropdown = ({ options, select, onSelect }: Props) => {
  return (
    <div>
      <select value={select} onChange={onSelect}>
        {options.map((option) => (
          <option key={option.key} value={option.value}>
            {option.key}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;