"use client";

import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { INTERVALS_BY_ASSET } from "@/hooks/useMasters";

interface PreviewCounts {
  buy: number;
  sell: number;
  takeProfit: number;
  none: number;
}

interface PreviewResponse {
  symbol: string;
  interval: string;
  candleCount: number;
  counts: PreviewCounts;
  markers: { time: number; label: number }[];
}

interface Props {
  symbol: string;
  assetType: "FX" | "STOCK";
  labelingId?: string;
  onApplied?: () => void;
}

const AutoLabelingPanel = ({ symbol, assetType, labelingId, onApplied }: Props) => {
  const intervals = INTERVALS_BY_ASSET[assetType];
  const [interval, setInterval] = useState<string>(intervals[0]);
  const [shortPeriod, setShortPeriod] = useState(5);
  const [longPeriod, setLongPeriod] = useState(20);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [takeProfitPct, setTakeProfitPct] = useState(assetType === "STOCK" ? 0.02 : 0.005);
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = {
    shortPeriod,
    longPeriod,
    rsiPeriod,
    takeProfitPct,
  };

  const runPreview = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await axios.post<PreviewResponse>("/api/labeling/auto/preview", {
        symbol,
        interval,
        config,
      });
      setPreview(res.data);
    } catch (err) {
      setError(`${err}`);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!labelingId) {
      setError("ラベリングを先に選択してください");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await axios.post("/api/labeling/auto", {
        labelingId: Number(labelingId),
        symbol,
        interval,
        config,
        overwrite,
      });
      onApplied?.();
    } catch (err) {
      setError(`${err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">自動ラベリング (rule-based)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        SMA({shortPeriod}/{longPeriod}) クロス + RSI({rsiPeriod}) で買い/売り、利確 ±
        {(takeProfitPct * 100).toFixed(2)}%
      </Typography>

      <Stack spacing={1.5}>
        <FormControl size="small" fullWidth>
          <InputLabel id="auto-interval">時間足</InputLabel>
          <Select
            labelId="auto-interval"
            label="時間足"
            value={interval}
            onChange={(e: SelectChangeEvent) => setInterval(e.target.value)}
          >
            {intervals.map((iv) => (
              <MenuItem key={iv} value={iv}>
                {iv}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            type="number"
            label="短期SMA"
            value={shortPeriod}
            onChange={(e) => setShortPeriod(Number(e.target.value))}
          />
          <TextField
            size="small"
            type="number"
            label="長期SMA"
            value={longPeriod}
            onChange={(e) => setLongPeriod(Number(e.target.value))}
          />
          <TextField
            size="small"
            type="number"
            label="RSI期間"
            value={rsiPeriod}
            onChange={(e) => setRsiPeriod(Number(e.target.value))}
          />
        </Stack>

        <TextField
          size="small"
          type="number"
          label="利確 % (0.005 = 0.5%)"
          inputProps={{ step: 0.001 }}
          value={takeProfitPct}
          onChange={(e) => setTakeProfitPct(Number(e.target.value))}
        />

        <FormControlLabel
          control={
            <Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
          }
          label="既存ラベルを上書き（デフォルトはマージ）"
        />

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={runPreview} disabled={busy}>
            プレビュー
          </Button>
          <Button variant="contained" onClick={apply} disabled={busy || !labelingId}>
            ラベルに反映
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Collapse in={!!preview}>
          {preview && (
            <Alert severity="info">
              {preview.candleCount} 本中: 買い {preview.counts.buy} / 売り {preview.counts.sell} /
              利確 {preview.counts.takeProfit}
            </Alert>
          )}
        </Collapse>
      </Stack>
    </Paper>
  );
};

export default AutoLabelingPanel;
