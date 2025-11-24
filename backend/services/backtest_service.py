import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from services.etf_service import ETFService
from services.indicator_service import IndicatorService
from services.signal_service import SignalService
from services.portfolio_service import PortfolioService
from typing import Dict, List
from models.schemas import BacktestResult


class BacktestService:
    @staticmethod
    def run_backtest(db: Session, period_years: int, initial_investment: float = 10000) -> Dict:
        """백테스트 실행"""
        try:
            # 데이터 가져오기
            vig_prices = ETFService.get_price_history(db, "VIG", days=period_years * 365 + 100)
            qld_prices = ETFService.get_price_history(db, "QLD", days=period_years * 365 + 100)
            
            if not vig_prices or len(vig_prices) < 200:
                return {"error": f"VIG 데이터가 부족합니다. 현재 {len(vig_prices) if vig_prices else 0}개 데이터만 있습니다. (최소 200일 필요)\n먼저 ETF 데이터를 업데이트해주세요."}
            
            if not qld_prices or len(qld_prices) < 200:
                return {"error": f"QLD 데이터가 부족합니다. 현재 {len(qld_prices) if qld_prices else 0}개 데이터만 있습니다. (최소 200일 필요)\n먼저 ETF 데이터를 업데이트해주세요."}
            
            # DataFrame 생성 (ETFPriceResponse 객체에서 속성 추출)
            vig_data = []
            for p in vig_prices:
                try:
                    date_val = p.date if hasattr(p, 'date') else p.get('date', None) if isinstance(p, dict) else None
                    close_val = float(p.close if hasattr(p, 'close') else p.get('close', 0) if isinstance(p, dict) else 0)
                    if date_val and close_val > 0:
                        vig_data.append({"date": date_val, "close": close_val})
                except:
                    continue
            
            qld_data = []
            for p in qld_prices:
                try:
                    date_val = p.date if hasattr(p, 'date') else p.get('date', None) if isinstance(p, dict) else None
                    close_val = float(p.close if hasattr(p, 'close') else p.get('close', 0) if isinstance(p, dict) else 0)
                    if date_val and close_val > 0:
                        qld_data.append({"date": date_val, "close": close_val})
                except:
                    continue
            
            if not vig_data or not qld_data:
                return {"error": "ETF 데이터가 없습니다. 먼저 ETF 데이터를 업데이트해주세요."}
            
            vig_df = pd.DataFrame(vig_data)
            qld_df = pd.DataFrame(qld_data)
            
            # 날짜를 datetime으로 변환
            vig_df['date'] = pd.to_datetime(vig_df['date'])
            qld_df['date'] = pd.to_datetime(qld_df['date'])
            
            # 날짜 기준 병합 (inner join - 양쪽 모두 있는 날짜만)
            df = pd.merge(vig_df, qld_df, on="date", suffixes=("_vig", "_qld"), how="inner")
            df = df.sort_values("date").reset_index(drop=True)
            
            if len(df) < 200:
                return {"error": f"충분한 데이터가 없습니다. 현재 {len(df)}일치 데이터만 있습니다. (최소 200일 필요)"}
            
            # Strategy A: VIG 단순 보유 (스칼라 값으로 변환)
            first_close_vig = float(df.iloc[0]["close_vig"])
            strategy_a_shares = initial_investment / first_close_vig
            strategy_a_values = (df["close_vig"] * strategy_a_shares).tolist()  # 리스트로 변환
            strategy_a_final = float(strategy_a_values[-1])
            strategy_a_return = ((strategy_a_final - initial_investment) / initial_investment) * 100
            
            # Strategy B: VIG↔QLD 스위칭
            current_etf = "VIG"
            shares = initial_investment / df.iloc[0]["close_vig"]
            strategy_b_values = []
            
            for i in range(200, len(df)):
                # 현재 가격
                if current_etf == "VIG":
                    current_price = df.iloc[i]["close_vig"]
                else:
                    current_price = df.iloc[i]["close_qld"]
                
                # 지표 계산 (과거 200일 데이터 사용)
                window_data = df.iloc[i-199:i+1]
                vig_prices_window = window_data["close_vig"].tolist()
                qld_prices_window = window_data["close_qld"].tolist()
                
                vig_rsi = IndicatorService.calculate_rsi(vig_prices_window)[-1]
                qld_rsi = IndicatorService.calculate_rsi(qld_prices_window)[-1]
                vig_ma200 = np.mean(vig_prices_window)
                qld_ma200 = np.mean(qld_prices_window)
                
                vig_price = df.iloc[i]["close_vig"]
                qld_price = df.iloc[i]["close_qld"]
                
                # 스위칭 로직 (간단화된 버전)
                if current_etf == "VIG":
                    # QLD로 전환 조건
                    if qld_rsi > 55 and qld_price > qld_ma200 and vig_rsi < 55:
                        shares = shares * vig_price / qld_price
                        current_etf = "QLD"
                else:
                    # VIG로 전환 조건
                    if vig_rsi > 55 and vig_price > vig_ma200 and qld_rsi < 55:
                        shares = shares * qld_price / vig_price
                        current_etf = "VIG"
                
                # 현재 포트폴리오 가치
                if current_etf == "VIG":
                    value = shares * vig_price
                else:
                    value = shares * qld_price
                
                strategy_b_values.append(value)
            
            strategy_b_final = strategy_b_values[-1]
            strategy_b_return = ((strategy_b_final - initial_investment) / initial_investment) * 100
            
            # Strategy C: AI 추천 비중 자동조절
            vig_shares = (initial_investment * 0.5) / df.iloc[0]["close_vig"]
            qld_shares = (initial_investment * 0.5) / df.iloc[0]["close_qld"]
            strategy_c_values = []
            
            for i in range(200, len(df)):
                # AI 비중 계산 (간단화된 버전)
                window_data = df.iloc[i-199:i+1]
                vig_prices_window = window_data["close_vig"].tolist()
                qld_prices_window = window_data["close_qld"].tolist()
                
                vig_rsi = IndicatorService.calculate_rsi(vig_prices_window)[-1]
                qld_rsi = IndicatorService.calculate_rsi(qld_prices_window)[-1]
                vig_ma200 = np.mean(vig_prices_window)
                qld_ma200 = np.mean(qld_prices_window)
                
                vig_price = df.iloc[i]["close_vig"]
                qld_price = df.iloc[i]["close_qld"]
                
                # AI 비중 계산 (규칙 기반)
                vig_score = 50.0
                qld_score = 50.0
                
                # RSI 기반
                if vig_rsi < 30:
                    vig_score += 20
                elif vig_rsi > 70:
                    vig_score -= 20
                
                if qld_rsi < 30:
                    qld_score += 20
                elif qld_rsi > 70:
                    qld_score -= 20
                
                # MA 기반
                if vig_price > vig_ma200:
                    vig_score += 15
                else:
                    vig_score -= 15
                
                if qld_price > qld_ma200:
                    qld_score += 15
                else:
                    qld_score -= 15
                
                # 정규화
                total_score = vig_score + qld_score
                if total_score > 0:
                    vig_allocation = vig_score / total_score
                    qld_allocation = qld_score / total_score
                else:
                    vig_allocation = 0.5
                    qld_allocation = 0.5
                
                # 비중 재조정 (월 1회 또는 큰 변화 시)
                if i % 20 == 0:  # 약 한 달마다
                    current_value = vig_shares * vig_price + qld_shares * qld_price
                    vig_shares = (current_value * vig_allocation) / vig_price
                    qld_shares = (current_value * qld_allocation) / qld_price
                
                # 현재 포트폴리오 가치
                value = vig_shares * vig_price + qld_shares * qld_price
                strategy_c_values.append(value)
            
            strategy_c_final = strategy_c_values[-1]
            strategy_c_return = ((strategy_c_final - initial_investment) / initial_investment) * 100
            
            # MDD 계산 (리스트를 Series로 변환)
            strategy_a_series = pd.Series([initial_investment] + strategy_a_values)
            strategy_b_series = pd.Series([initial_investment] + strategy_b_values)
            strategy_c_series = pd.Series([initial_investment] + strategy_c_values)
            
            strategy_a_mdd = BacktestService.calculate_mdd(strategy_a_series)
            strategy_b_mdd = BacktestService.calculate_mdd(strategy_b_series)
            strategy_c_mdd = BacktestService.calculate_mdd(strategy_c_series)
            
            # CAGR 계산
            years = period_years
            strategy_a_cagr = ((strategy_a_final / initial_investment) ** (1/years) - 1) * 100
            strategy_b_cagr = ((strategy_b_final / initial_investment) ** (1/years) - 1) * 100
            strategy_c_cagr = ((strategy_c_final / initial_investment) ** (1/years) - 1) * 100
            
            # 승률 계산 (간단화) - 안전한 접근 (리스트 기반)
            strategy_a_wins = 0
            for i in range(1, len(strategy_a_values)):
                try:
                    if float(strategy_a_values[i]) > float(strategy_a_values[i-1]):
                        strategy_a_wins += 1
                except:
                    continue
                    
            strategy_b_wins = sum(1 for i in range(1, len(strategy_b_values)) 
                                 if i < len(strategy_b_values) and 
                                 float(strategy_b_values[i]) > float(strategy_b_values[i-1]))
            strategy_c_wins = sum(1 for i in range(1, len(strategy_c_values)) 
                                 if i < len(strategy_c_values) and 
                                 float(strategy_c_values[i]) > float(strategy_c_values[i-1]))
            
            strategy_a_win_rate = (strategy_a_wins / (len(strategy_a_values) - 1)) * 100 if len(strategy_a_values) > 1 else 0
            strategy_b_win_rate = (strategy_b_wins / (len(strategy_b_values) - 1)) * 100 if len(strategy_b_values) > 1 else 0
            strategy_c_win_rate = (strategy_c_wins / (len(strategy_c_values) - 1)) * 100 if len(strategy_c_values) > 1 else 0
            
            # 변동성 계산 (안전한 변환 - 리스트 기반)
            try:
                strategy_a_vol = IndicatorService.calculate_volatility(strategy_a_values, 30) if len(strategy_a_values) > 30 else 0.0
            except Exception as e:
                print(f"[WARNING] Strategy A 변동성 계산 오류: {e}")
                strategy_a_vol = 0.0
                
            try:
                strategy_b_vol = IndicatorService.calculate_volatility(strategy_b_values, 30) if len(strategy_b_values) > 30 else 0.0
            except Exception as e:
                print(f"[WARNING] Strategy B 변동성 계산 오류: {e}")
                strategy_b_vol = 0.0
                
            try:
                strategy_c_vol = IndicatorService.calculate_volatility(strategy_c_values, 30) if len(strategy_c_values) > 30 else 0.0
            except Exception as e:
                print(f"[WARNING] Strategy C 변동성 계산 오류: {e}")
                strategy_c_vol = 0.0
            
            # 차트 데이터 생성 (안전한 인덱스 처리)
            chart_dates = df["date"].iloc[200:].tolist()
            chart_data = []
            
            for i, date in enumerate(chart_dates):
                # 날짜 형식 변환 (datetime이면 isoformat, 문자열이면 그대로)
                if isinstance(date, datetime):
                    date_str = date.isoformat()
                elif hasattr(date, 'isoformat'):
                    date_str = date.isoformat()
                else:
                    date_str = str(date)
                
                # 안전한 인덱스 접근 (리스트 기반)
                strategy_a_idx = i + 200
                if strategy_a_idx < len(strategy_a_values):
                    strategy_a_val = float(strategy_a_values[strategy_a_idx])
                else:
                    strategy_a_val = float(strategy_a_values[-1]) if strategy_a_values else float(initial_investment)
                
                strategy_b_val = float(strategy_b_values[i]) if i < len(strategy_b_values) else (float(strategy_b_values[-1]) if strategy_b_values else float(initial_investment))
                strategy_c_val = float(strategy_c_values[i]) if i < len(strategy_c_values) else (float(strategy_c_values[-1]) if strategy_c_values else float(initial_investment))
                
                chart_data.append({
                    "date": date_str,
                    "strategy_a": float(strategy_a_val),
                    "strategy_b": float(strategy_b_val),
                    "strategy_c": float(strategy_c_val)
                })
            
            return {
            "strategy_a": {
                "final_value": float(strategy_a_final),
                "return": float(strategy_a_return),
                "cagr": float(strategy_a_cagr),
                "mdd": float(strategy_a_mdd),
                "win_rate": float(strategy_a_win_rate),
                "volatility": float(strategy_a_vol)
            },
            "strategy_b": {
                "final_value": float(strategy_b_final),
                "return": float(strategy_b_return),
                "cagr": float(strategy_b_cagr),
                "mdd": float(strategy_b_mdd),
                "win_rate": float(strategy_b_win_rate),
                "volatility": float(strategy_b_vol)
            },
            "strategy_c": {
                "final_value": float(strategy_c_final),
                "return": float(strategy_c_return),
                "cagr": float(strategy_c_cagr),
                "mdd": float(strategy_c_mdd),
                "win_rate": float(strategy_c_win_rate),
                "volatility": float(strategy_c_vol)
            },
            "comparison": {
                "outperformance_b": float(strategy_b_return - strategy_a_return),
                "outperformance_c": float(strategy_c_return - strategy_a_return),
                "cagr_diff_b": float(strategy_b_cagr - strategy_a_cagr),
                "cagr_diff_c": float(strategy_c_cagr - strategy_a_cagr),
                "mdd_diff_b": float(strategy_b_mdd - strategy_a_mdd),
                "mdd_diff_c": float(strategy_c_mdd - strategy_a_mdd)
            },
            "chart_data": chart_data
            }
        except Exception as e:
            import traceback
            error_msg = f"백테스트 실행 오류: {str(e)}"
            print(error_msg)
            traceback.print_exc()
            return {"error": error_msg}
    
    @staticmethod
    def calculate_mdd(values: pd.Series) -> float:
        """Maximum Drawdown 계산"""
        peak = values.expanding().max()
        drawdown = (values - peak) / peak * 100
        return abs(drawdown.min())

