"""
고급 기술지표 계산 서비스 (CCI, ADX, OBV, 볼린저밴드, VWAP)
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from services.yahoo_service import YahooService
from core.cache import cache


class AdvancedIndicatorsService:
    """고급 기술지표 서비스"""
    
    @staticmethod
    def _get_cache_key(prefix: str, symbol: str, *args) -> str:
        """캐시 키 생성"""
        symbol = symbol.upper()
        key_parts = [prefix, symbol]
        if args:
            key_parts.extend(str(arg) for arg in args)
        return ":".join(key_parts)
    
    @staticmethod
    def get_cci(symbol: str, period: int = 20, period_years: int = 1) -> List[Dict]:
        """CCI (Commodity Channel Index) 계산
        
        Returns:
            List[Dict]: [{"date": str, "cci": float}]
        """
        symbol = symbol.upper()
        cache_key = AdvancedIndicatorsService._get_cache_key("cci", symbol, period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = YahooService.get_history(symbol, period_years)
            if df is None or df.empty or len(df) < period:
                return []
            
            df = df.copy()
            # Typical Price
            df["tp"] = (df["high"] + df["low"] + df["close"]) / 3
            # SMA of TP
            df["sma_tp"] = df["tp"].rolling(window=period).mean()
            # Mean Deviation
            df["md"] = df["tp"].rolling(window=period).apply(
                lambda x: np.mean(np.abs(x - x.mean()))
            )
            # CCI
            df["cci"] = (df["tp"] - df["sma_tp"]) / (0.015 * df["md"])
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("cci")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "cci": float(row["cci"])
                    })
            
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} CCI 계산 실패: {e}")
            return []
    
    @staticmethod
    def get_adx(symbol: str, period: int = 14, period_years: int = 1) -> List[Dict]:
        """ADX (Average Directional Index) 계산
        
        Returns:
            List[Dict]: [{"date": str, "adx": float, "di_plus": float, "di_minus": float}]
        """
        symbol = symbol.upper()
        cache_key = AdvancedIndicatorsService._get_cache_key("adx", symbol, period, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = YahooService.get_history(symbol, period_years)
            if df is None or df.empty or len(df) < period * 2:
                return []
            
            df = df.copy()
            # True Range
            df["prev_close"] = df["close"].shift(1)
            df["tr1"] = df["high"] - df["low"]
            df["tr2"] = abs(df["high"] - df["prev_close"])
            df["tr3"] = abs(df["low"] - df["prev_close"])
            df["tr"] = df[["tr1", "tr2", "tr3"]].max(axis=1)
            
            # Directional Movement
            df["dm_plus"] = np.where(
                (df["high"] - df["high"].shift(1)) > (df["low"].shift(1) - df["low"]),
                np.maximum(df["high"] - df["high"].shift(1), 0),
                0
            )
            df["dm_minus"] = np.where(
                (df["low"].shift(1) - df["low"]) > (df["high"] - df["high"].shift(1)),
                np.maximum(df["low"].shift(1) - df["low"], 0),
                0
            )
            
            # Smoothed TR, DM+
            atr = df["tr"].rolling(window=period).mean()
            df["atr"] = atr
            df["di_plus"] = 100 * (df["dm_plus"].rolling(window=period).mean() / df["atr"])
            df["di_minus"] = 100 * (df["dm_minus"].rolling(window=period).mean() / df["atr"])
            
            # DX and ADX
            df["dx"] = 100 * abs(df["di_plus"] - df["di_minus"]) / (df["di_plus"] + df["di_minus"])
            df["adx"] = df["dx"].rolling(window=period).mean()
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("adx")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "adx": float(row["adx"]),
                        "di_plus": float(row["di_plus"]) if pd.notna(row.get("di_plus")) else 0.0,
                        "di_minus": float(row["di_minus"]) if pd.notna(row.get("di_minus")) else 0.0,
                    })
            
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} ADX 계산 실패: {e}")
            return []
    
    @staticmethod
    def get_obv(symbol: str, period_years: int = 1) -> List[Dict]:
        """OBV (On-Balance Volume) 계산
        
        Returns:
            List[Dict]: [{"date": str, "obv": float}]
        """
        symbol = symbol.upper()
        cache_key = AdvancedIndicatorsService._get_cache_key("obv", symbol, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = YahooService.get_history(symbol, period_years)
            if df is None or df.empty:
                return []
            
            df = df.copy()
            df["volume"] = df["volume"].fillna(0)
            df["prev_close"] = df["close"].shift(1)
            
            # OBV 계산
            df["obv"] = 0.0
            for i in range(1, len(df)):
                if df.iloc[i]["close"] > df.iloc[i-1]["close"]:
                    df.iloc[i, df.columns.get_loc("obv")] = df.iloc[i-1]["obv"] + df.iloc[i]["volume"]
                elif df.iloc[i]["close"] < df.iloc[i-1]["close"]:
                    df.iloc[i, df.columns.get_loc("obv")] = df.iloc[i-1]["obv"] - df.iloc[i]["volume"]
                else:
                    df.iloc[i, df.columns.get_loc("obv")] = df.iloc[i-1]["obv"]
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("obv")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "obv": float(row["obv"])
                    })
            
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} OBV 계산 실패: {e}")
            return []
    
    @staticmethod
    def get_bollinger_bands(symbol: str, period: int = 20, std_dev: int = 2, period_years: int = 1) -> List[Dict]:
        """볼린저밴드 계산
        
        Returns:
            List[Dict]: [{"date": str, "upper": float, "middle": float, "lower": float, "width": float}]
        """
        symbol = symbol.upper()
        cache_key = AdvancedIndicatorsService._get_cache_key("bb", symbol, period, std_dev, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = YahooService.get_history(symbol, period_years)
            if df is None or df.empty or len(df) < period:
                return []
            
            df = df.copy()
            # Middle Band (SMA)
            df["middle"] = df["close"].rolling(window=period).mean()
            # Standard Deviation
            df["std"] = df["close"].rolling(window=period).std()
            # Upper and Lower Bands
            df["upper"] = df["middle"] + (df["std"] * std_dev)
            df["lower"] = df["middle"] - (df["std"] * std_dev)
            # Band Width
            df["width"] = (df["upper"] - df["lower"]) / df["middle"] * 100
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("middle")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "upper": float(row["upper"]) if pd.notna(row.get("upper")) else None,
                        "middle": float(row["middle"]),
                        "lower": float(row["lower"]) if pd.notna(row.get("lower")) else None,
                        "width": float(row["width"]) if pd.notna(row.get("width")) else None,
                    })
            
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} 볼린저밴드 계산 실패: {e}")
            return []
    
    @staticmethod
    def get_vwap(symbol: str, period_years: int = 1) -> List[Dict]:
        """VWAP (Volume Weighted Average Price) 계산
        
        Returns:
            List[Dict]: [{"date": str, "vwap": float}]
        """
        symbol = symbol.upper()
        cache_key = AdvancedIndicatorsService._get_cache_key("vwap", symbol, period_years)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        
        try:
            df = YahooService.get_history(symbol, period_years)
            if df is None or df.empty:
                return []
            
            df = df.copy()
            df["volume"] = df["volume"].fillna(0)
            # Typical Price
            df["tp"] = (df["high"] + df["low"] + df["close"]) / 3
            # VWAP = (TP * Volume)의 누적합 / Volume의 누적합
            df["pv"] = df["tp"] * df["volume"]
            df["cum_pv"] = df["pv"].cumsum()
            df["cum_volume"] = df["volume"].cumsum()
            df["vwap"] = df["cum_pv"] / df["cum_volume"]
            
            result = []
            for _, row in df.iterrows():
                if pd.notna(row.get("vwap")):
                    date_str = row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], 'strftime') else str(row["date"])
                    result.append({
                        "date": date_str,
                        "vwap": float(row["vwap"])
                    })
            
            cache.set(cache_key, result, 15 * 60)
            return result
            
        except Exception as e:
            print(f"[ERROR] {symbol} VWAP 계산 실패: {e}")
            return []

