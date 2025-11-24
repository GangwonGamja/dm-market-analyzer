/**
 * 분석 API 응답 타입 정의
 */

export interface AnalysisResponse {
  ticker: string;
  ma: {
    20: MAData[];
    50: MAData[];
    200: MAData[];
  };
  cross: {
    ma50_ma200: "golden" | "death" | "none";
    ma20_ma60: "golden" | "death" | "none";
  };
  trend: {
    short: "up" | "down" | "neutral";
    long: "up" | "down" | "neutral";
    strength_short: number;
    strength_long: number;
  };
  rsi: {
    value: number;
    zone: "overbought" | "oversold" | "neutral";
  };
  macd: {
    signal: "golden" | "death" | "neutral";
  };
  volatility: {
    atr: number;
    risk_score: number;
  };
  candles: string[];
  patterns: string[];
  summary: string[];
}

export interface MAData {
  date: string;
  price: number;
  ma20?: number;
  ma50?: number;
  ma200?: number;
}

