import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '../context/ToastContext';
import { getRatings, RatingsSummary, submitRating } from '../services/ratings';
import StarRating from './StarRating';

// Section « Notes des utilisateurs » d'une fiche produit :
// moyenne + nombre d'avis, la note de l'utilisateur (modifiable), avis récents.
export default function ProductRatings({ barcode }: { barcode?: string }) {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<RatingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!barcode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getRatings(barcode);
      setSummary(data);
      setMyRating(data.my_rating || 0);
      setComment(data.my_comment || '');
    } catch {
      // silencieux : la section reste vide en cas d'erreur réseau
    } finally {
      setLoading(false);
    }
  }, [barcode]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!barcode) return;
    if (myRating < 1) {
      showToast('Choisissez une note (1 à 5 étoiles)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = await submitRating(barcode, myRating, comment);
      setSummary(data);
      showToast('Merci pour votre note !', 'success');
    } catch (e: any) {
      showToast(e?.response?.data?.detail || "Erreur lors de l'envoi", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const count = summary?.count ?? 0;
  const alreadyRated = !!summary?.my_rating;

  return (
    <View className="mx-4 mt-5 mb-8">
      <Text className="text-base font-bold text-gray-900 mb-3">Notes des utilisateurs</Text>

      {/* Moyenne */}
      <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm">
        <View className="items-center mr-5">
          <Text className="text-4xl font-extrabold text-gray-900">
            {summary?.average != null ? summary.average.toFixed(1) : '—'}
          </Text>
          <Text className="text-xs text-gray-400">/ 5</Text>
        </View>
        <View className="flex-1">
          <StarRating value={summary?.average ?? 0} size={22} />
          <Text className="text-sm text-gray-500 mt-1">
            {count > 0 ? `${count} avis` : 'Aucune note pour le moment'}
          </Text>
        </View>
      </View>

      {/* Votre note */}
      <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {alreadyRated ? 'Votre note' : 'Notez ce produit'}
        </Text>
        <StarRating value={myRating} onChange={setMyRating} size={34} />
        <TextInput
          className="border border-gray-200 rounded-xl p-3 mt-3 text-gray-900"
          placeholder="Votre avis (optionnel)"
          placeholderTextColor="#9CA3AF"
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <TouchableOpacity
          disabled={submitting}
          onPress={submit}
          className="bg-emerald-500 py-3 rounded-xl items-center mt-3 active:bg-emerald-600"
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">
              {alreadyRated ? 'Mettre à jour ma note' : 'Envoyer ma note'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Avis récents */}
      {summary && summary.ratings.length > 0 && (
        <View className="mt-4">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Avis récents</Text>
          {summary.ratings.map((r, i) => (
            <View key={i} className="bg-white rounded-2xl p-3 mb-2 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-gray-800" numberOfLines={1}>
                  {r.username || 'Utilisateur'}
                </Text>
                <StarRating value={r.rating} size={14} />
              </View>
              {r.comment ? <Text className="text-sm text-gray-600 mt-1">{r.comment}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {loading ? <ActivityIndicator color="#22C55E" style={{ marginTop: 12 }} /> : null}
    </View>
  );
}
