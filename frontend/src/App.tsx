import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { ETFAnalysis } from './pages/ETFAnalysis';
import { MarketSentiment } from './pages/MarketSentiment';
import { SwitchingSignal } from './pages/SwitchingSignal';
import { Portfolio } from './pages/Portfolio';
import { Backtest } from './pages/Backtest';
import { NewsAnalysis } from './pages/NewsAnalysis';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/etf-analysis"
          element={
            <Layout>
              <ETFAnalysis />
            </Layout>
          }
        />
        <Route
          path="/market-sentiment"
          element={
            <Layout>
              <MarketSentiment />
            </Layout>
          }
        />
        <Route
          path="/switching-signal"
          element={
            <Layout>
              <SwitchingSignal />
            </Layout>
          }
        />
        <Route
          path="/portfolio"
          element={
            <Layout>
              <Portfolio />
            </Layout>
          }
        />
        <Route
          path="/backtest"
          element={
            <Layout>
              <Backtest />
            </Layout>
          }
        />
        <Route
          path="/news-analysis"
          element={
            <Layout>
              <NewsAnalysis />
            </Layout>
          }
        />
        <Route
          path="/alerts"
          element={
            <Layout>
              <Alerts />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <Settings />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

