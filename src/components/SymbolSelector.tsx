"use client";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Tab,
  Tabs,
} from "@mui/material";
import { useMemo } from "react";
import { type AssetType, useMasters } from "@/hooks/useMasters";

interface Props {
  assetType: AssetType;
  symbol: string;
  onChangeAssetType: (assetType: AssetType) => void;
  onChangeSymbol: (symbol: string) => void;
}

const SymbolSelector = ({ assetType, symbol, onChangeAssetType, onChangeSymbol }: Props) => {
  const { masters, loading } = useMasters();

  const filtered = useMemo(
    () => masters.filter((m) => m.assetType === assetType),
    [masters, assetType],
  );

  const handleTabChange = (_event: React.SyntheticEvent, value: AssetType) => {
    onChangeAssetType(value);
    const first = masters.find((m) => m.assetType === value);
    if (first) onChangeSymbol(first.symbol);
  };

  const handleSelect = (event: SelectChangeEvent<string>) => {
    onChangeSymbol(event.target.value);
  };

  return (
    <div>
      <Tabs value={assetType} onChange={handleTabChange}>
        <Tab label="FX" value="FX" />
        <Tab label="株" value="STOCK" />
      </Tabs>
      <FormControl fullWidth size="small" sx={{ mt: 1 }} disabled={loading}>
        <InputLabel id="symbol-select-label">銘柄</InputLabel>
        <Select labelId="symbol-select-label" label="銘柄" value={symbol} onChange={handleSelect}>
          {filtered.map((m) => (
            <MenuItem key={m.symbol} value={m.symbol}>
              {m.displayName} ({m.symbol})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default SymbolSelector;
