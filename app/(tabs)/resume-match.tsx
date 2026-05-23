import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { analyzeResumeMatch, type ResumeMatchAnalysis } from '@/services/ai';

const SCROLL_BOTTOM_PADDING = Platform.OS === 'ios' ? 32 : 24;

type ScoreTheme = {
  accent: string;
  accentSoft: string;
  track: string;
  label: string;
};

function getScoreTheme(score: number): ScoreTheme {
  if (score >= 75) {
    return {
      accent: '#16A34A',
      accentSoft: '#DCFCE7',
      track: '#BBF7D0',
      label: 'Strong fit',
    };
  }

  if (score >= 50) {
    return {
      accent: '#D97706',
      accentSoft: '#FEF3C7',
      track: '#FDE68A',
      label: 'Moderate fit',
    };
  }

  return {
    accent: '#DC2626',
    accentSoft: '#FEE2E2',
    track: '#FECACA',
    label: 'Needs work',
  };
}

function getScoreHint(score: number) {
  if (score >= 75) {
    return 'Your profile aligns well with this role.';
  }

  if (score >= 50) {
    return 'Solid foundation with a few gaps to close.';
  }

  return 'Focus on the missing skills below.';
}

function ScoreRing({ score, theme }: { score: number; theme: ScoreTheme }) {
  const ringSize = 132;
  const stroke = 10;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const activeQuarters = Math.ceil(progress * 4);

  const quarterColors = [
    activeQuarters >= 1 ? theme.accent : theme.track,
    activeQuarters >= 2 ? theme.accent : theme.track,
    activeQuarters >= 3 ? theme.accent : theme.track,
    activeQuarters >= 4 ? theme.accent : theme.track,
  ];

  return (
    <View style={[styles.scoreRingOuter, { width: ringSize, height: ringSize }]}>
      <View
        style={[
          styles.scoreRingTrack,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: stroke,
            borderColor: theme.track,
          },
        ]}
      />
      <View
        style={[
          styles.scoreRingProgress,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: stroke,
            borderTopColor: quarterColors[0],
            borderRightColor: quarterColors[1],
            borderBottomColor: quarterColors[2],
            borderLeftColor: quarterColors[3],
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      <View style={styles.scoreRingCenter}>
        <Text style={[styles.scoreRingValue, { color: theme.accent }]}>{score}</Text>
        <Text style={styles.scoreRingUnit}>/ 100</Text>
      </View>
    </View>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <View style={styles.sectionDivider}>
      <View style={styles.sectionDividerLine} />
      <Text style={styles.sectionDividerLabel}>{label}</Text>
      <View style={styles.sectionDividerLine} />
    </View>
  );
}

function ElevatedCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.elevatedCard, style]}>{children}</View>;
}

function SkeletonBlock({
  width,
  height,
  style,
  delay = 0,
}: {
  width: number | `${number}%`;
  height: number;
  style?: object;
  delay?: number;
}) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [delay, pulse]);

  return (
    <Animated.View
      style={[styles.skeletonBlock, { width, height, opacity: pulse }, style]}
    />
  );
}

function ResultsSkeleton() {
  return (
    <View style={styles.skeletonStack}>
      <ElevatedCard style={styles.skeletonHeroCard}>
        <SkeletonBlock width={120} height={12} style={styles.skeletonCenter} />
        <SkeletonBlock width={132} height={132} style={[styles.skeletonCenter, styles.skeletonCircle]} />
        <SkeletonBlock width={100} height={28} style={styles.skeletonCenter} />
        <SkeletonBlock width="80%" height={14} style={styles.skeletonCenter} />
        <SkeletonBlock width="100%" height={6} delay={120} />
      </ElevatedCard>

      <ElevatedCard style={styles.skeletonInsightCard}>
        <SkeletonBlock width={110} height={16} />
        <View style={styles.skeletonChipRow}>
          <SkeletonBlock width={88} height={34} delay={80} style={styles.skeletonChip} />
          <SkeletonBlock width={104} height={34} delay={160} style={styles.skeletonChip} />
          <SkeletonBlock width={76} height={34} delay={240} style={styles.skeletonChip} />
        </View>
      </ElevatedCard>

      <ElevatedCard style={styles.skeletonInsightCard}>
        <SkeletonBlock width={130} height={16} delay={60} />
        <View style={styles.skeletonChipRow}>
          <SkeletonBlock width={92} height={34} delay={140} style={styles.skeletonChip} />
          <SkeletonBlock width={118} height={34} delay={220} style={styles.skeletonChip} />
        </View>
      </ElevatedCard>

      <ElevatedCard style={styles.skeletonInsightCard}>
        <SkeletonBlock width={120} height={16} delay={100} />
        <SkeletonBlock width="100%" height={52} delay={180} />
        <SkeletonBlock width="100%" height={52} delay={260} />
      </ElevatedCard>
    </View>
  );
}

function FadeInCard({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(14);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

export default function ResumeMatchScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const resultsOffsetRef = useRef(0);
  const shouldScrollToResultsRef = useRef(false);

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeMatchAnalysis | null>(null);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [resultsRevealKey, setResultsRevealKey] = useState(0);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      Alert.alert('Resume required', 'Paste or type your resume text to continue.');
      return;
    }

    if (!jobDescription.trim()) {
      Alert.alert('Job description required', 'Paste or type the job description to continue.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setSuggestionsExpanded(true);
    shouldScrollToResultsRef.current = true;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(resultsOffsetRef.current - 12, 0),
        animated: true,
      });
    });

    try {
      const result = await analyzeResumeMatch(resumeText, jobDescription);
      setAnalysis(result);
      setResultsRevealKey((value) => value + 1);
    } catch (error) {
      shouldScrollToResultsRef.current = false;
      const message =
        error instanceof Error ? error.message : 'Could not analyze your resume. Please try again.';
      Alert.alert('Analysis failed', message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeAnother = () => {
    setAnalysis(null);
    setSuggestionsExpanded(true);
    shouldScrollToResultsRef.current = false;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    if (!analysis || isAnalyzing || !shouldScrollToResultsRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(resultsOffsetRef.current - 12, 0),
        animated: true,
      });
      shouldScrollToResultsRef.current = false;
    }, 120);

    return () => {
      clearTimeout(timer);
    };
  }, [analysis, isAnalyzing, resultsRevealKey]);

  const isAnalyzeDisabled = isAnalyzing || !resumeText.trim() || !jobDescription.trim();
  const scoreTheme = analysis ? getScoreTheme(analysis.matchScore) : null;
  const showResults = Boolean(analysis && !isAnalyzing && scoreTheme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Resume Match</Text>
          <Text style={styles.subtitle}>AI-powered fit analysis for your next role</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: SCROLL_BOTTOM_PADDING },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <ElevatedCard style={styles.introCard}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>AI Coach</Text>
              </View>
              <Text style={styles.introTitle}>Compare your resume</Text>
              <Text style={styles.introSubtitle}>
                Paste your resume and job description, then run analysis.
              </Text>
            </ElevatedCard>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Resume</Text>
              <TextInput
                value={resumeText}
                onChangeText={setResumeText}
                placeholder="Paste your resume text here..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                editable={!isAnalyzing}
                style={[styles.input, styles.multilineInput]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Job Description</Text>
              <TextInput
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="Paste the job description here..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                editable={!isAnalyzing}
                style={[styles.input, styles.multilineInput]}
              />
            </View>
          </View>

          <View
            onLayout={(event) => {
              resultsOffsetRef.current = event.nativeEvent.layout.y;
            }}>
            {isAnalyzing ? (
              <View style={styles.resultsZone}>
                <SectionDivider label="Analyzing" />
                <View style={styles.loadingHeader}>
                  <ActivityIndicator color="#2563EB" />
                  <Text style={styles.loadingTitle}>Building your match report</Text>
                </View>
                <ResultsSkeleton />
              </View>
            ) : null}

            {showResults && analysis && scoreTheme ? (
              <View style={styles.resultsZone} key={`results-${resultsRevealKey}`}>
                <SectionDivider label="Match Report" />

                <FadeInCard index={0}>
                  <ElevatedCard style={styles.heroScoreCard}>
                    <View style={[styles.heroScoreGlow, { backgroundColor: scoreTheme.accentSoft }]} />
                    <Text style={styles.heroEyebrow}>Overall Match</Text>
                    <ScoreRing score={analysis.matchScore} theme={scoreTheme} />
                    <View style={styles.heroScoreMeta}>
                      <View style={[styles.fitPill, { backgroundColor: scoreTheme.accentSoft }]}>
                        <Text style={[styles.fitPillText, { color: scoreTheme.accent }]}>
                          {scoreTheme.label}
                        </Text>
                      </View>
                      <Text style={styles.heroHint}>{getScoreHint(analysis.matchScore)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${analysis.matchScore}%`,
                            backgroundColor: scoreTheme.accent,
                          },
                        ]}
                      />
                    </View>
                  </ElevatedCard>
                </FadeInCard>

                <FadeInCard index={1}>
                  <ElevatedCard style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightTitle}>Strengths</Text>
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{analysis.strengths.length}</Text>
                      </View>
                    </View>
                    <View style={styles.chipWrap}>
                      {analysis.strengths.map((strength, index) => (
                        <View key={`${strength}-${index}`} style={styles.strengthChip}>
                          <Text style={styles.strengthChipText}>{strength}</Text>
                        </View>
                      ))}
                    </View>
                  </ElevatedCard>
                </FadeInCard>

                <FadeInCard index={2}>
                  <ElevatedCard style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightTitle}>Missing Skills</Text>
                      <View style={[styles.countBadge, styles.countBadgeWarning]}>
                        <Text style={[styles.countBadgeText, styles.countBadgeTextWarning]}>
                          {analysis.missingSkills.length}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chipWrap}>
                      {analysis.missingSkills.map((skill, index) => (
                        <View key={`${skill}-${index}`} style={styles.gapChip}>
                          <Text style={styles.gapChipText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </ElevatedCard>
                </FadeInCard>

                <FadeInCard index={3}>
                  <ElevatedCard style={styles.insightCard}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSuggestionsExpanded((value) => !value)}
                      style={({ pressed }) => [
                        styles.collapsibleHeader,
                        pressed && styles.collapsibleHeaderPressed,
                      ]}>
                      <View style={styles.insightHeader}>
                        <Text style={styles.insightTitle}>Suggestions</Text>
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>
                            {analysis.improvementSuggestions.length}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.collapseHint}>
                        {suggestionsExpanded ? 'Hide' : 'Show'}
                      </Text>
                    </Pressable>

                    {suggestionsExpanded ? (
                      <View style={styles.suggestionStack}>
                        {analysis.improvementSuggestions.map((suggestion, index) => (
                          <View key={`${suggestion}-${index}`} style={styles.suggestionCard}>
                            <View style={styles.suggestionBadge}>
                              <Text style={styles.suggestionBadgeText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.suggestionCardText}>{suggestion}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </ElevatedCard>
                </FadeInCard>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {showResults ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Analyze another resume"
              onPress={handleAnalyzeAnother}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Analyze Another Resume</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Analyze resume match"
            disabled={isAnalyzeDisabled}
            onPress={handleAnalyze}
            style={({ pressed }) => [
              styles.analyzeButton,
              showResults && styles.analyzeButtonWithSecondary,
              isAnalyzeDisabled && styles.analyzeButtonDisabled,
              pressed && !isAnalyzeDisabled && styles.analyzeButtonPressed,
            ]}>
            {isAnalyzing ? (
              <View style={styles.analyzeButtonContent}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze Match</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: {
    elevation: 4,
  },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 4,
    backgroundColor: '#EEF2F7',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  title: {
    fontSize: 28,
    color: '#0F172A',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 0,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 16,
  },
  elevatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...cardShadow,
  },
  introCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  introTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  introSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    lineHeight: 22,
  },
  multilineInput: {
    minHeight: 140,
  },
  resultsZone: {
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  sectionDividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  skeletonStack: {
    gap: 16,
  },
  skeletonHeroCard: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 14,
    alignItems: 'center',
  },
  skeletonInsightCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  skeletonBlock: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
  },
  skeletonCenter: {
    alignSelf: 'center',
  },
  skeletonCircle: {
    borderRadius: 999,
  },
  skeletonChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonChip: {
    borderRadius: 12,
  },
  heroScoreCard: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  heroScoreGlow: {
    position: 'absolute',
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.55,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreRingOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRingTrack: {
    position: 'absolute',
  },
  scoreRingProgress: {
    position: 'absolute',
  },
  scoreRingCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRingValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreRingUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: -2,
  },
  heroScoreMeta: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  fitPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  fitPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  insightCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeWarning: {
    backgroundColor: '#FEF2F2',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  countBadgeTextWarning: {
    color: '#DC2626',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strengthChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  strengthChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#166534',
  },
  gapChip: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  gapChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#BE123C',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  collapsibleHeaderPressed: {
    opacity: 0.75,
  },
  collapseHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  suggestionStack: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  suggestionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  suggestionCardText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 10 : 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
    ...cardShadow,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonPressed: {
    backgroundColor: '#F8FAFC',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  analyzeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonWithSecondary: {
    marginTop: 0,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  analyzeButtonPressed: {
    backgroundColor: '#1D4ED8',
  },
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
