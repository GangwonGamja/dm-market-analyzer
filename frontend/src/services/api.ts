import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

// 에러 핸들링 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 404, 500 등 모든 에러를 처리
    if (error.response) {
      // 서버 응답이 있는 경우
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.error || '알 수 없는 오류가 발생했습니다.';
      
      console.error(`API 오류 [${status}]:`, message);
      
      // 에러를 그대로 throw하여 컴포넌트에서 처리할 수 있도록 함
      return Promise.reject({
        ...error,
        message,
        status,
      });
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('네트워크 오류: 서버에 연결할 수 없습니다.');
      return Promise.reject({
        ...error,
        message: '서버에 연결할 수 없습니다. 네트워크를 확인하세요.',
        status: 0,
      });
    } else {
      // 요청 설정 중 오류
      console.error('요청 오류:', error.message);
      return Promise.reject({
        ...error,
        message: error.message || '요청 중 오류가 발생했습니다.',
        status: 0,
      });
    }
  }
);

// ETF 관련 API
export const etfApi = {
  getPrice: (symbol: string) => api.get(`/etf/${symbol}/price`),
  getHistory: (symbol: string, years: number = 3) => 
    api.get(`/etf/${symbol}/history?years=${years}`),
  getMA: (symbol: string, days: number = 200) => 
    api.get(`/etf/${symbol}/ma?days=${days}`),
  getRSI: (symbol: string) => api.get(`/etf/${symbol}/rsi`),
  getVolatility: (symbol: string, period: number = 30) => 
    api.get(`/etf/${symbol}/volatility?period=${period}`),
  getMDD: (symbol: string) => api.get(`/etf/${symbol}/mdd`),
  // updateData와 updateAll은 더 이상 필요 없지만 하위 호환성을 위해 유지
  updateData: (symbol: string) => api.post(`/etf/${symbol}/update`).catch(() => null),
  updateAll: () => api.post(`/etf/update`).catch(() => null),
};

// 시장 관련 API
export const marketApi = {
  getFgi: () => api.get('/market/fgi'),
  // 하위 호환성을 위해 유지 (내부적으로 getFgi로 리다이렉트)
  getFearGreed: () => api.get('/market/fgi'),
  getFgiHistory: (days: number = 365) => api.get(`/market/fgi/history?days=${days}`),
  getFgiStatistics: () => api.get('/market/fgi/statistics'),
  getAggregateSentiment: () => api.get('/market/sentiment/aggregate'),
};

// 시그널 관련 API
export const signalApi = {
  generateSignal: (currentETF: string) => 
    api.post('/signal/generate', { current_etf: currentETF }).catch(() => null),
  getMarketStatus: () => api.get('/signal/market-status').catch(() => null),
  // 확장된 스위칭 시그널
  getSwitchingSignalGtoV: (price: number, ma200: number, rsi: number, fgi: number, symbol: string) =>
    api.post('/signal/g-v', { price, ma200, rsi, fgi, symbol }).catch(() => null),
  getSwitchingSignalVtoG: (price: number, ma200: number, rsi: number, fgi: number, symbol: string) =>
    api.post('/signal/v-g', { price, ma200, rsi, fgi, symbol }).catch(() => null),
};

// 백테스트 관련 API
export const backtestApi = {
  runBacktest: (request: {
    symbol: string;
    start_date: string;
    end_date: string;
    initial_investment: number;
    strategy: 'signal' | 'buy_and_hold' | 'ma_cross';
  }) => api.post('/backtest/run', request),
};

// 포트폴리오 관련 API
export const portfolioApi = {
  getAllocation: () => api.get('/portfolio/allocation'),
  getRecommendation: () => api.get('/portfolio/recommendation'),
};

// 분석 관련 API
export const analysisApi = {
  getAnalysis: (symbol: string) => api.get(`/analysis/${symbol}`),
  getEnhancedAnalysis: (symbol: string) => api.get(`/analysis/${symbol}/enhanced`),
  getRecommendation: (symbol: string) => api.get(`/analysis/${symbol}/recommendation`),
  getAdvancedIndicators: (symbol: string) => api.get(`/analysis/${symbol}/advanced-indicators`),
  getFundamental: (symbol: string) => api.get(`/analysis/${symbol}/fundamental`),
  getPatterns: (symbol: string) => api.get(`/analysis/${symbol}/patterns`),
  compareTickers: (symbols: string[], period: string = '1Y') => 
    api.get(`/analysis/compare?symbols=${symbols.join(',')}&period=${period}`),
};

// 시장 데이터 관련 API
export const marketDataApi = {
  getData: (symbol: string) => api.get(`/market-data/${symbol}`).catch(() => null),
  getHistory: (symbol: string, days: number = 365) => 
    api.get(`/market-data/${symbol}/history?days=${days}`).catch(() => null),
  updateAll: () => api.post('/market-data/update').catch(() => null),
};

// 기술 지표 API
export const indicatorApi = {
  getMACD: (symbol: string) => api.get(`/etf/${symbol}/macd`),
  getStochastic: (symbol: string) => api.get(`/etf/${symbol}/stochastic`),
  getVolatility: (symbol: string, period: number = 30) => 
    api.get(`/etf/${symbol}/volatility?period=${period}`),
  getMDD: (symbol: string) => api.get(`/etf/${symbol}/mdd`),
  getCorrelation: () => api.get('/etf/correlation'),
  // 확장된 지표
  getGoldenDeathCross: (symbol: string) => 
    api.get(`/etf/${symbol}/cross`).catch(() => null),
  getDivergence: (symbol: string) => 
    api.get(`/etf/${symbol}/divergence`).catch(() => null),
  getRiskScore: (symbol: string) => 
    api.get(`/etf/${symbol}/risk-score`).catch(() => null),
};

// 뉴스 관련 API
export const newsApi = {
  getAll: (symbol: string = 'VIG', limit: number = 20) => 
    api.get(`/news?symbol=${symbol}&limit=${limit}`),
};

export default api;
