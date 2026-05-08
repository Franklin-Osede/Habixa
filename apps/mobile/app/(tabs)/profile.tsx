import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand } from '@/constants/theme';
import api from '@/src/services/api.client';
import { setLocale, SUPPORTED_LOCALES, SupportedLocale } from '@/i18n';

type AdherenceResponse = {
  windowDays: number;
  windowStartDate: string;
  windowEndDate: string;
  streakDays: number;
  totals: { completed: number; skipped: number; scheduled: number };
  consistency: {
    overallPct: number;
    workoutPct: number;
    nutritionPct: number;
    habitsPct: number;
  };
};

type IdentityMeResponse = {
  id: string;
  email: string;
  level: number;
  xp: number;
  currentStreak: number;
  currentDayIndex: number;
  gems: number;
};

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  es: 'Español',
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [tapCount, setTapCount] = useState(0);
  const [adherence, setAdherence] = useState<AdherenceResponse | null>(null);
  const [loadingAdherence, setLoadingAdherence] = useState(true);
  const [me, setMe] = useState<IdentityMeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAdherence = async () => {
      try {
        const res = await api.get<AdherenceResponse>('/me/adherence?range=week');
        if (!cancelled) setAdherence(res.data);
      } catch (err) {
        console.error('Failed to load adherence', err);
      } finally {
        if (!cancelled) setLoadingAdherence(false);
      }
    };
    const fetchMe = async () => {
      try {
        const res = await api.get<IdentityMeResponse>('/identity/me');
        if (!cancelled) setMe(res.data);
      } catch (err) {
        console.error('Failed to load identity', err);
      }
    };
    void fetchAdherence();
    void fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = me?.email ? me.email.split('@')[0] : '—';
  const subline = me
    ? `${t('profile.level', { level: me.level })} · ${me.xp.toLocaleString()} XP`
    : '';

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (newCount === 5) {
      Alert.alert('⚡️ God Mode Activated', 'Entering Developer Console...', [
        { text: 'OK', onPress: () => router.push('/admin') },
      ]);
      setTapCount(0);
    }
  };

  const onPickLanguage = () => {
    Alert.alert(t('profile.language'), t('profile.languageHelper'), [
      ...SUPPORTED_LOCALES.map((code) => ({
        text:
          (i18n.language === code ? '✓ ' : '') + LOCALE_LABELS[code],
        onPress: () => {
          void setLocale(code);
        },
      })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        accessibilityLabel={t('common.back')}
      >
        <IconSymbol size={20} name="chevron.left" color={Brand.textPrimary} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <IconSymbol size={40} name="person.fill" color={Brand.accent} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {subline ? <Text style={styles.subline}>{subline}</Text> : null}
      </View>

      <View style={styles.statRow}>
        <StatCard
          value={
            loadingAdherence
              ? null
              : (adherence?.streakDays ?? 0).toString()
          }
          label={t('profile.streakDays')}
        />
        <StatCard
          value={
            loadingAdherence
              ? null
              : `${adherence?.consistency.overallPct ?? 0}%`
          }
          label={t('profile.consistency')}
        />
      </View>

      {!loadingAdherence && adherence ? (
        <View style={styles.categoryRow}>
          <CategoryStat
            label={t('profile.workout')}
            pct={adherence.consistency.workoutPct}
          />
          <CategoryStat
            label={t('profile.nutrition')}
            pct={adherence.consistency.nutritionPct}
          />
          <CategoryStat
            label={t('profile.habits')}
            pct={adherence.consistency.habitsPct}
          />
        </View>
      ) : null}

      <MenuItem
        icon="globe"
        title={t('profile.language')}
        helper={LOCALE_LABELS[i18n.language as SupportedLocale] ?? i18n.language}
        onPress={onPickLanguage}
      />
      <MenuItem icon="gear" title={t('profile.settings')} />
      <MenuItem icon="bell" title={t('profile.notifications')} />
      <MenuItem icon="star" title={t('profile.subscription')} isPro />

      <View style={styles.devSection}>
        <TouchableOpacity
          style={styles.devBtn}
          onPress={() => router.push('/admin')}
        >
          <Text style={styles.devBtnText}>⚡️ ENTER GOD MODE ⚡️</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={1} onPress={handleVersionTap}>
          <Text style={styles.versionText}>
            {t('profile.version', { version: '1.0.0 (Build 42)' })}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string | null;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      {value === null ? (
        <ActivityIndicator color={Brand.accent} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CategoryStat({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={styles.categoryCell}>
      <Text style={styles.categoryValue}>{pct}%</Text>
      <Text style={styles.categoryLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  helper,
  isPro = false,
  onPress,
}: {
  icon: string;
  title: string;
  helper?: string;
  isPro?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <IconSymbol size={20} name={icon as any} color={Brand.textPrimary} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {helper ? <Text style={styles.menuHelper}>{helper}</Text> : null}
      </View>
      {isPro ? (
        <View style={styles.proPill}>
          <Text style={styles.proText}>PRO</Text>
        </View>
      ) : (
        <IconSymbol size={16} name="chevron.right" color={Brand.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bgDark },
  scroll: { padding: 24, paddingTop: 72, paddingBottom: 120 },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Brand.surface,
    borderWidth: 2,
    borderColor: Brand.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    color: Brand.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  subline: { color: Brand.textMuted, fontSize: 13, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Brand.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    color: Brand.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: Brand.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  categoryCell: { alignItems: 'center' },
  categoryValue: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryLabel: { color: Brand.textMuted, fontSize: 12, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuTitle: {
    color: Brand.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  menuHelper: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  proPill: {
    backgroundColor: '#facc15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proText: { color: Brand.bgDark, fontSize: 11, fontWeight: 'bold' },
  devSection: { marginTop: 32, alignItems: 'center', gap: 12 },
  devBtn: {
    backgroundColor: 'rgba(255,68,68,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
  },
  devBtnText: { color: '#ffb4b4', fontSize: 12, fontWeight: 'bold' },
  versionText: { color: Brand.textDim, fontSize: 11 },
});
