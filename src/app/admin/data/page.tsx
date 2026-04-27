"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { type AssetType, INTERVALS_BY_ASSET, useMasters } from "@/hooks/useMasters";

interface IntervalStatus {
  interval: string;
  count: number;
  latestTime: number | null;
  fetchedAt: string | null;
}

interface SymbolStatus {
  symbol: string;
  displayName: string;
  assetType: AssetType;
  market: string;
  intervals: IntervalStatus[];
}

const AdminDataPage = () => {
  const { masters, loading: mastersLoading } = useMasters();
  const [status, setStatus] = useState<SymbolStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);

  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [selectedInterval, setSelectedInterval] = useState<string>("1d");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const refreshStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await axios.get<SymbolStatus[]>("/api/data/status");
      setStatus(res.data);
    } catch (err) {
      setMessage({ kind: "error", text: `状態取得失敗: ${err}` });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (!selectedSymbol && masters.length > 0) {
      setSelectedSymbol(masters[0].symbol);
    }
  }, [masters, selectedSymbol]);

  const fetchSingle = async () => {
    if (!selectedSymbol || !selectedInterval) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await axios.post("/api/data/fetch", {
        symbol: selectedSymbol,
        interval: selectedInterval,
        from: from || undefined,
        to: to || undefined,
      });
      setMessage({
        kind: "info",
        text: `${selectedSymbol} ${selectedInterval}: inserted=${res.data.inserted}, updated=${res.data.updated}, total=${res.data.total}`,
      });
      await refreshStatus();
    } catch (err) {
      setMessage({ kind: "error", text: `${err}` });
    } finally {
      setBusy(false);
    }
  };

  const fetchBatch = async (assetType?: AssetType) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await axios.post("/api/data/fetch/batch", {
        ...(assetType ? { assetType } : {}),
        from: from || undefined,
        to: to || undefined,
      });
      const total = res.data.results.reduce(
        (sum: number, r: { total: number }) => sum + r.total,
        0,
      );
      const errs = res.data.errors.length;
      setMessage({
        kind: errs > 0 ? "error" : "info",
        text: `Batch ${assetType ?? "ALL"}: ${res.data.results.length} 件処理 (total ${total} 本) / errors ${errs}`,
      });
      await refreshStatus();
    } catch (err) {
      setMessage({ kind: "error", text: `${err}` });
    } finally {
      setBusy(false);
    }
  };

  const intervalsForSymbol = (() => {
    const m = masters.find((x) => x.symbol === selectedSymbol);
    return m ? INTERVALS_BY_ASSET[m.assetType] : ["1d"];
  })();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        データ管理
      </Typography>

      {message && (
        <Alert severity={message.kind === "error" ? "error" : "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          単一銘柄の取得
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }} disabled={mastersLoading}>
            <InputLabel id="admin-symbol">銘柄</InputLabel>
            <Select
              labelId="admin-symbol"
              label="銘柄"
              value={selectedSymbol}
              onChange={(e: SelectChangeEvent) => setSelectedSymbol(e.target.value)}
            >
              {masters.map((m) => (
                <MenuItem key={m.symbol} value={m.symbol}>
                  {m.displayName} ({m.symbol})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="admin-interval">時間足</InputLabel>
            <Select
              labelId="admin-interval"
              label="時間足"
              value={selectedInterval}
              onChange={(e: SelectChangeEvent) => setSelectedInterval(e.target.value)}
            >
              {intervalsForSymbol.map((iv) => (
                <MenuItem key={iv} value={iv}>
                  {iv}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="from (YYYY-MM-DD)"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <TextField
            label="to (YYYY-MM-DD)"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Button variant="contained" onClick={fetchSingle} disabled={busy || !selectedSymbol}>
            取得
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          一括取得
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => fetchBatch("FX")} disabled={busy}>
            FX 全銘柄
          </Button>
          <Button variant="outlined" onClick={() => fetchBatch("STOCK")} disabled={busy}>
            株 全銘柄
          </Button>
          <Button variant="contained" onClick={() => fetchBatch()} disabled={busy}>
            全件
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">取得状況</Typography>
          <Button onClick={refreshStatus} disabled={statusLoading}>
            更新
          </Button>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>銘柄</TableCell>
              <TableCell>種別</TableCell>
              <TableCell>市場</TableCell>
              <TableCell>時間足ごとの件数 / 最終時刻</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {status.map((s) => (
              <TableRow key={s.symbol}>
                <TableCell>
                  {s.displayName}
                  <br />
                  <small>{s.symbol}</small>
                </TableCell>
                <TableCell>{s.assetType}</TableCell>
                <TableCell>{s.market}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {s.intervals.length === 0 && (
                      <Chip size="small" label="未取得" color="default" />
                    )}
                    {s.intervals.map((iv) => (
                      <Chip
                        key={iv.interval}
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={`${iv.interval}: ${iv.count} 本 / ${
                          iv.latestTime
                            ? new Date(iv.latestTime * 1000).toISOString().slice(0, 16)
                            : "-"
                        }`}
                      />
                    ))}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default AdminDataPage;
