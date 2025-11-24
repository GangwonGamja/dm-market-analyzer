"""
백테스트 라우터
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.yahoo_service import YahooService
from services.indicator_service import IndicatorService
# SignalService는 signal.py에서 직접 사용하지 않음
from datetime import datetime, timedelta
import traceback

router = APIRouter(prefix="/backtest", tags=["backtest"])


class BacktestRequest(BaseModel):
    symbol: str = "VIG"
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    initial_investment: float = 10000.0
    strategy: str = "signal"  # "signal", "buy_and_hold", "ma_cross"


@router.post("/run")
def run_backtest(request: BacktestRequest) -> Dict:
    """백테스트 실행
    
    Args:
        request: 백테스트 요청 파라미터
    
    Returns:
        Dict: 백테스트 결과
    """
    try:
        symbol = request.symbol.upper()
        
        # 히스토리 데이터 가져오기
        history = YahooService.get_history_list(symbol, years=3)
        if not history:
            raise HTTPException(status_code=404, detail=f"{symbol} 데이터를 찾을 수 없습니다.")
        
        # 날짜 필터링
        start = datetime.strptime(request.start_date, "%Y-%m-%d")
        end = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        filtered_history = [
            h for h in history
            if start <= datetime.strptime(h["date"], "%Y-%m-%d") <= end
        ]
        
        if not filtered_history:
            raise HTTPException(status_code=400, detail="선택한 기간에 데이터가 없습니다.")
        
        # 전략별 백테스트 실행
        if request.strategy == "signal":
            result = _run_signal_backtest(
                symbol, filtered_history, request.initial_investment
            )
        elif request.strategy == "buy_and_hold":
            result = _run_buy_and_hold_backtest(
                symbol, filtered_history, request.initial_investment
            )
        elif request.strategy == "ma_cross":
            result = _run_ma_cross_backtest(
                symbol, filtered_history, request.initial_investment
            )
        else:
            raise HTTPException(status_code=400, detail="지원하지 않는 전략입니다.")
        
        result["symbol"] = symbol
        result["start_date"] = request.start_date
        result["end_date"] = request.end_date
        result["initial_investment"] = request.initial_investment
        result["strategy"] = request.strategy
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] 백테스트 실행 오류: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"백테스트 실행 중 오류: {str(e)}")


def _run_signal_backtest(symbol: str, history: List[Dict], initial_investment: float) -> Dict:
    """시그널 기반 백테스트"""
    balance = initial_investment
    shares = 0.0
    position = "cash"  # "cash" or "stock"
    
    trades = []
    equity_curve = []
    max_equity = initial_investment
    max_drawdown = 0.0
    
    for i in range(20, len(history)):  # 최소 20일 데이터 필요
        current_data = history[i]
        current_price = current_data["close"]
        current_date = current_data["date"]
        
        # 과거 데이터로 시그널 계산
        past_data = history[max(0, i-20):i]
        if len(past_data) < 20:
            continue
        
        # 간단한 시그널 계산 (실제로는 IndicatorService 사용)
        try:
            # MA200 계산
            ma200_prices = [d["close"] for d in past_data[-200:] if len(past_data) >= 200]
            if len(ma200_prices) >= 200:
                ma200 = sum(ma200_prices) / len(ma200_prices)
            else:
                ma200 = current_price
            
            # RSI 계산 (간단 버전)
            price_changes = []
            for j in range(1, min(15, len(past_data))):
                change = past_data[j]["close"] - past_data[j-1]["close"]
                price_changes.append(change)
            
            if len(price_changes) >= 14:
                gains = [c for c in price_changes if c > 0]
                losses = [-c for c in price_changes if c < 0]
                avg_gain = sum(gains) / 14 if gains else 0
                avg_loss = sum(losses) / 14 if losses else 0
                rs = avg_gain / avg_loss if avg_loss > 0 else 100
                rsi = 100 - (100 / (1 + rs))
            else:
                rsi = 50
            
            # 시그널 결정
            signal = "hold"
            if current_price < ma200 * 0.95 and rsi < 30:
                signal = "buy"
            elif current_price > ma200 * 1.05 and rsi > 70:
                signal = "sell"
            
            # 매매 실행
            if signal == "buy" and position == "cash":
                shares = balance / current_price
                balance = 0
                position = "stock"
                trades.append({
                    "date": current_date,
                    "action": "buy",
                    "price": current_price,
                    "shares": shares
                })
            elif signal == "sell" and position == "stock":
                balance = shares * current_price
                trades.append({
                    "date": current_date,
                    "action": "sell",
                    "price": current_price,
                    "shares": shares
                })
                shares = 0
                position = "cash"
            
            # 현재 자산 가치 계산
            if position == "stock":
                equity = shares * current_price
            else:
                equity = balance
            
            equity_curve.append({
                "date": current_date,
                "equity": equity,
                "price": current_price
            })
            
            # MDD 계산
            if equity > max_equity:
                max_equity = equity
            drawdown = (max_equity - equity) / max_equity * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
                
        except Exception as e:
            print(f"[WARNING] 백테스트 계산 오류 (날짜: {current_date}): {e}")
            continue
    
    # 최종 자산 계산
    final_price = history[-1]["close"]
    if position == "stock":
        final_equity = shares * final_price
    else:
        final_equity = balance
    
    total_return = final_equity - initial_investment
    total_return_pct = (total_return / initial_investment) * 100
    
    # CAGR 계산
    days = (datetime.strptime(history[-1]["date"], "%Y-%m-%d") - 
            datetime.strptime(history[0]["date"], "%Y-%m-%d")).days
    years = days / 365.25
    if years > 0:
        cagr = ((final_equity / initial_investment) ** (1 / years) - 1) * 100
    else:
        cagr = 0
    
    # 승률 계산
    winning_trades = 0
    losing_trades = 0
    for i in range(1, len(trades)):
        if trades[i]["action"] == "sell":
            prev_trade = trades[i-1]
            if prev_trade["action"] == "buy":
                profit = (trades[i]["price"] - prev_trade["price"]) / prev_trade["price"] * 100
                if profit > 0:
                    winning_trades += 1
                else:
                    losing_trades += 1
    
    win_rate = (winning_trades / (winning_trades + losing_trades) * 100) if (winning_trades + losing_trades) > 0 else 0
    
    return {
        "success": True,
        "final_equity": round(final_equity, 2),
        "total_return": round(total_return, 2),
        "total_return_pct": round(total_return_pct, 2),
        "cagr": round(cagr, 2),
        "max_drawdown": round(max_drawdown, 2),
        "win_rate": round(win_rate, 2),
        "total_trades": len(trades),
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
        "equity_curve": equity_curve[-252:] if len(equity_curve) > 252 else equity_curve,  # 최근 1년
        "trades": trades[-50:] if len(trades) > 50 else trades  # 최근 50개 거래
    }


def _run_buy_and_hold_backtest(symbol: str, history: List[Dict], initial_investment: float) -> Dict:
    """Buy and Hold 전략 백테스트"""
    if not history:
        return {
            "success": False,
            "error": "데이터 없음"
        }
    
    start_price = history[0]["close"]
    end_price = history[-1]["close"]
    
    shares = initial_investment / start_price
    final_equity = shares * end_price
    
    total_return = final_equity - initial_investment
    total_return_pct = (total_return / initial_investment) * 100
    
    # CAGR
    days = (datetime.strptime(history[-1]["date"], "%Y-%m-%d") - 
            datetime.strptime(history[0]["date"], "%Y-%m-%d")).days
    years = days / 365.25
    if years > 0:
        cagr = ((final_equity / initial_investment) ** (1 / years) - 1) * 100
    else:
        cagr = 0
    
    # MDD 계산
    max_price = start_price
    max_drawdown = 0.0
    equity_curve = []
    
    for h in history:
        price = h["close"]
        equity = shares * price
        equity_curve.append({
            "date": h["date"],
            "equity": equity,
            "price": price
        })
        
        if price > max_price:
            max_price = price
        drawdown = (max_price - price) / max_price * 100
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    return {
        "success": True,
        "final_equity": round(final_equity, 2),
        "total_return": round(total_return, 2),
        "total_return_pct": round(total_return_pct, 2),
        "cagr": round(cagr, 2),
        "max_drawdown": round(max_drawdown, 2),
        "win_rate": 100.0,  # Buy and Hold는 항상 승리
        "total_trades": 1,
        "winning_trades": 1,
        "losing_trades": 0,
        "equity_curve": equity_curve[-252:] if len(equity_curve) > 252 else equity_curve,
        "trades": []
    }


def _run_ma_cross_backtest(symbol: str, history: List[Dict], initial_investment: float) -> Dict:
    """MA 크로스 전략 백테스트"""
    balance = initial_investment
    shares = 0.0
    position = "cash"
    
    trades = []
    equity_curve = []
    max_equity = initial_investment
    max_drawdown = 0.0
    
    for i in range(200, len(history)):  # MA200 계산을 위해 최소 200일 필요
        current_data = history[i]
        current_price = current_data["close"]
        current_date = current_data["date"]
        
        # MA20, MA200 계산
        ma20_prices = [h["close"] for h in history[i-20:i]]
        ma200_prices = [h["close"] for h in history[i-200:i]]
        
        ma20 = sum(ma20_prices) / len(ma20_prices)
        ma200 = sum(ma200_prices) / len(ma200_prices)
        
        # 이전 값
        if i > 200:
            prev_ma20_prices = [h["close"] for h in history[i-21:i-1]]
            prev_ma20 = sum(prev_ma20_prices) / len(prev_ma20_prices)
            
            # 골든 크로스 (MA20이 MA200을 상향 돌파)
            if prev_ma20 <= ma200 and ma20 > ma200 and position == "cash":
                shares = balance / current_price
                balance = 0
                position = "stock"
                trades.append({
                    "date": current_date,
                    "action": "buy",
                    "price": current_price,
                    "shares": shares
                })
            
            # 데드 크로스 (MA20이 MA200을 하향 돌파)
            elif prev_ma20 >= ma200 and ma20 < ma200 and position == "stock":
                balance = shares * current_price
                trades.append({
                    "date": current_date,
                    "action": "sell",
                    "price": current_price,
                    "shares": shares
                })
                shares = 0
                position = "cash"
        
        # 현재 자산 가치
        if position == "stock":
            equity = shares * current_price
        else:
            equity = balance
        
        equity_curve.append({
            "date": current_date,
            "equity": equity,
            "price": current_price
        })
        
        # MDD 계산
        if equity > max_equity:
            max_equity = equity
        drawdown = (max_equity - equity) / max_equity * 100
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    # 최종 자산
    final_price = history[-1]["close"]
    if position == "stock":
        final_equity = shares * final_price
    else:
        final_equity = balance
    
    total_return = final_equity - initial_investment
    total_return_pct = (total_return / initial_investment) * 100
    
    # CAGR
    days = (datetime.strptime(history[-1]["date"], "%Y-%m-%d") - 
            datetime.strptime(history[0]["date"], "%Y-%m-%d")).days
    years = days / 365.25
    if years > 0:
        cagr = ((final_equity / initial_investment) ** (1 / years) - 1) * 100
    else:
        cagr = 0
    
    # 승률
    winning_trades = 0
    losing_trades = 0
    for i in range(1, len(trades)):
        if trades[i]["action"] == "sell":
            prev_trade = trades[i-1]
            if prev_trade["action"] == "buy":
                profit = (trades[i]["price"] - prev_trade["price"]) / prev_trade["price"] * 100
                if profit > 0:
                    winning_trades += 1
                else:
                    losing_trades += 1
    
    win_rate = (winning_trades / (winning_trades + losing_trades) * 100) if (winning_trades + losing_trades) > 0 else 0
    
    return {
        "success": True,
        "final_equity": round(final_equity, 2),
        "total_return": round(total_return, 2),
        "total_return_pct": round(total_return_pct, 2),
        "cagr": round(cagr, 2),
        "max_drawdown": round(max_drawdown, 2),
        "win_rate": round(win_rate, 2),
        "total_trades": len(trades),
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
        "equity_curve": equity_curve[-252:] if len(equity_curve) > 252 else equity_curve,
        "trades": trades[-50:] if len(trades) > 50 else trades
    }
