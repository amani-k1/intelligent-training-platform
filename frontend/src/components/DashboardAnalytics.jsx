import React, { useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardAnalytics = () => {
    const [question, setQuestion] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('http://127.0.0.1:8007/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });
            const data = await response.json();
            if (data.success) {
                setResult(data);
            } else {
                setError(data.error || 'Erreur lors de l’analyse');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const renderChart = () => {
        if (!result?.data || result.data.length === 0) return null;

        const chartData = result.data;
        const chartType = result.chart_type;
        const keys = Object.keys(chartData[0]);
        const xKey = keys[0];
        const yKey = keys[1] || keys[0];

        if (chartType === 'bar') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0f2f1" />
                        <XAxis dataKey={xKey} stroke="#5a7d86" />
                        <YAxis stroke="#5a7d86" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #48c1d0' }} />
                        <Legend />
                        <Bar dataKey={yKey} fill="#0a8fa0" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        } else if (chartType === 'pie') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey={yKey}
                            nameKey={xKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #48c1d0' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        } else if (chartType === 'line') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0f2f1" />
                        <XAxis dataKey={xKey} stroke="#5a7d86" />
                        <YAxis stroke="#5a7d86" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #48c1d0' }} />
                        <Legend />
                        <Line type="monotone" dataKey={yKey} stroke="#0a8fa0" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }
        return null;
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">📊 Analytics IA</h1>
            <p className="text-gray-600 mb-6">Posez une question analytique en français</p>

            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ex: Affiche le nombre d'inscriptions par niveau"
                        className="flex-1 p-3 border border-[#48c1d0]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-inner transition"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-[#076d7a] transition-all duration-300 shadow-lg font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Génération...' : 'Analyser'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    ❌ {error}
                </div>
            )}

            {result && (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 mb-2">📊 Requête SQL générée</p>
                        <code className="text-xs bg-gray-800 text-green-400 p-3 rounded-lg block overflow-x-auto font-mono">
                            {result.sql}
                        </code>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md">
                        <h3 className="font-semibold text-lg text-[#1a2e35] mb-4">📈 Représentation Graphique</h3>
                        {renderChart()}
                    </div>

                    <div className="bg-[#f4f9fa] p-5 rounded-2xl border-l-4 border-primary shadow-sm flex gap-3 items-start">
                        <div className="text-xl">🧠</div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Insight IA</p>
                            <p className="text-gray-800 text-sm leading-relaxed">{result.insight}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardAnalytics;