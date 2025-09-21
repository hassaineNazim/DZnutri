import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchHistoryStats } from '../services/saveHistorique';

type StatsData = {
  total_scans: number;
  average_score: number;
  distribution: {
    excellent: number;
    bon: number;
    mediocre: number;
    mauvais: number;
  };
};

const getScoreColor = (score?: number): string => {
  if (score === undefined) return '#6B7280'; // Gris
  if (score >= 75) return '#22C55E'; // Vert
  if (score >= 50) return '#84CC16'; // Vert-citron
  if (score >= 25) return '#F97316'; // Orange
  return '#EF4444'; // Rouge
};

const getScoreDescription = (score?: number): string => {
  if (score === undefined) return 'N/A';
  if (score >= 75) return 'Excellente';
  if (score >= 50) return 'Bonne';
  if (score >= 25) return 'Médiocre';
  return 'Mauvaise';
};

// Composant pour afficher une barre de progression
const StatBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => (
  <View style={styles.barContainer}>
    <Text style={styles.barLabel}>{label}</Text>
    <View style={styles.barBackground}>
      <View style={[styles.barFill, { width: `${total > 0 ? (count / total) * 100 : 0}%`, backgroundColor: color }]} />
    </View>
    <Text style={styles.barCount}>{count}</Text>
  </View>
);

export default function AnalysePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        setLoading(true);
        const data = await fetchHistoryStats();
        setStats(data);
        setLoading(false);
      };
      loadStats();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!stats || stats.total_scans === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Scannez des produits pour voir vos statistiques.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Votre Analyse</Text>
      
      {/* Carte du score moyen */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Qualité moyenne de vos produits</Text>
        <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(stats.average_score) }]}>
          <Text style={styles.scoreText}>{stats.average_score}</Text>
        </View>
        <Text style={[styles.scoreDescription, { color: getScoreColor(stats.average_score) }]}>
          {getScoreDescription(stats.average_score)}
        </Text>
      </View>

      {/* Carte de la distribution des produits */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Répartition de vos {stats.total_scans} scans</Text>
        <StatBar label="Excellent" count={stats.distribution.excellent} total={stats.total_scans} color="#22C55E" />
        <StatBar label="Bon" count={stats.distribution.bon} total={stats.total_scans} color="#84CC16" />
        <StatBar label="Médiocre" count={stats.distribution.mediocre} total={stats.total_scans} color="#F97316" />
        <StatBar label="Mauvais" count={stats.distribution.mauvais} total={stats.total_scans} color="#EF4444" />
      </View>
    </ScrollView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Fond gris clair
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  scoreText: {
    fontSize: 52,
    color: 'white',
    fontWeight: 'bold',
  },
  scoreDescription: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  barLabel: {
    width: 80,
    fontSize: 14,
    color: '#6B7280',
  },
  barBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  barCount: {
    width: 30,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  }
});