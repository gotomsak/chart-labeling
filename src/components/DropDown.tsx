import React, { useState } from 'react';

interface props {
  options: string[]
  onSelect: (value: string) => null
}
const Dropdown = ({ options, onSelect }: props) => {
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const handleSelect = (event:any) => {
    const selectedValue = event.target.value;
    setSelectedOption(selectedValue);
    onSelect(selectedValue);
  };

  return (
    <div>
      <select value={selectedOption} onChange={handleSelect}>
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
