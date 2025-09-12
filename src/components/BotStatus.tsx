import React from "react";
import {
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";

interface BotStatusProps {
  status?: string;
  metrics?: {
    hourlyTarget: number;
    dailyTarget: number;
    currentHourly: number;
    currentDaily: number;
    totalTrades: number;
    successRate: number;
    activePairs: string[];
  };
}

const BotStatus: React.FC<BotStatusProps> = ({ status = "stopped", metrics }) => {
  // Valores padrão para evitar crashes
  const safeMetrics = {
    hourlyTarget: 1,
    dailyTarget: 1,
    currentHourly: 0,
    currentDaily: 0,
    totalTrades: 0,
    successRate: 0,
    activePairs: [] as string[],
    ...metrics,
  };

  const hourlyProgress =
    (safeMetrics.currentHourly / safeMetrics.hourlyTarget) * 100;
  const dailyProgress =
    (safeMetrics.currentDaily / safeMetrics.dailyTarget) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-purple-500/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Activity className="w-6 h-6 text-purple-400" />
          <span>Status do Bot</span>
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Última atualização</p>
            <p className="text-white font-medium">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Meta Horária */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Meta Horária</span>
            </span>
            <span className="text-white font-medium">
              {safeMetrics.currentHourly}% / {safeMetrics.hourlyTarget}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                hourlyProgress >= 100 ? "bg-green-500" : "bg-purple-500"
              }`}
              style={{ width: `${Math.min(hourlyProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Meta Diária */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Meta Diária</span>
            </span>
            <span className="text-white font-medium">
              {safeMetrics.currentDaily}% / {safeMetrics.dailyTarget}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                dailyProgress >= 100 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(dailyProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {safeMetrics.totalTrades}
          </div>
          <div className="text-sm text-gray-400">Total Trades</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {safeMetrics.successRate}%
          </div>
          <div className="text-sm text-gray-400">Taxa Sucesso</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {safeMetrics.activePairs.length}
          </div>
          <div className="text-sm text-gray-400">Pares Ativos</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div
            className={`text-2xl font-bold ${
              status === "running" ? "text-green-400" : "text-red-400"
            }`}
          >
            {status === "running" ? "ON" : "OFF"}
          </div>
          <div className="text-sm text-gray-400">Status</div>
        </div>
      </div>

      {/* Active Pairs */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-white mb-3">Pares Ativos</h3>
        <div className="flex flex-wrap gap-2">
          {safeMetrics.activePairs.length > 0 ? (
            safeMetrics.activePairs.map((pair) => (
              <div
                key={pair}
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-3 py-2 flex items-center space-x-2"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white font-medium">{pair}</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            ))
          ) : (
            <span className="text-gray-400">Nenhum par ativo</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotStatus;
