import React, { ChangeEventHandler, useState } from 'react';

interface props {
  options: string[]
  select: string;
  onSelect: ChangeEventHandler<HTMLSelectElement>
}
const Dropdown = ({ options, select, onSelect }: props) => {
  return (
    <div>
      <select value={select} onChange={onSelect}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
