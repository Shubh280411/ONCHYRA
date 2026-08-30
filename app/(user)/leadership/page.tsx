'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { detectApiUrl, formatUSD } from '@/lib/utils';
import { RANKS } from '@/types';
import Loading from '@/components/ui/Loading';

const SG = "'Space Grotesk',sans-serif";
const INTER = "'Inter',sans-serif";

interface ProgressData {
  currentRank: string;
  totalDirects: number;
  teamBiz: number;
  dailyReward: number;
  nextRank: string | null;
  nextRankDirects: number;
  nextRankTeamBiz: number;
  progressDirects: number;
  progressTeamBiz: number;
}

export default function LeadershipPage() {
  const { uid } = useAuth();
  const { ToastComponent } = useToast();
  const apiUrl = detectApiUrl();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/leadership/progress/${uid}`);
      if (res.ok) {
        const data = await res.json();
        const nextRankObj = data.nextRank;
        setProgress({
          currentRank: data.currentRank || 'Unranked',
          totalDirects: data.directCount || 0,
          teamBiz: data.totalTeamVolume || 0,
          dailyReward: 0,
          nextRank: nextRankObj ? nextRankObj.name : null,
          nextRankDirects: nextRankObj ? nextRankObj.reqDirect : 0,
          nextRankTeamBiz: nextRankObj ? nextRankObj.reqTeam : 0,
          progressDirects: data.directCount || 0,
          progressTeamBiz: data.totalTeamVolume || 0,
        });
      }
    } catch {}
    setLoading(false);
  }, [apiUrl, uid]);

  useEffect(() => {
    if (!uid) return;
    loadData();
  }, [uid, loadData]);

  const currentRankIndex = useMemo(() => {
    if (!progress) return -1;
    return RANKS.findIndex(r => r.name === progress.currentRank);
  }, [progress]);

  if (loading) return <Loading text="Loading leadership..." />;

  const currentRank = progress ? RANKS.find(r => r.name === progress.currentRank) : null;
  const directsPct = progress && progress.nextRankDirects > 0
    ? Math.min(100, (progress.progressDirects / progress.nextRankDirects) * 100)
    : 0;
  const teamBizPct = progress && progress.nextRankTeamBiz > 0
    ? Math.min(100, (progress.progressTeamBiz / progress.nextRankTeamBiz) * 100)
    : 0;

  return (
    <div style={{ paddingBottom: 50 }}>
      {ToastComponent}

      {/* Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          fontFamily: SG,
          fontWeight: 800,
          fontSize: 22,
          background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Leadership
        </div>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: -12, marginBottom: 20 }}>
        Your rank progression
      </div>

      {/* Current Rank Card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '24px 20px',
        marginBottom: 20,
        backdropFilter: 'blur(20px)',
      }}>
        {/* Rank name */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 4 }}>
              Current Rank
            </div>
            <div style={{ fontFamily: SG, fontSize: 26, fontWeight: 900, color: '#fbbf24' }}>
              {progress?.currentRank || 'Unranked'}
            </div>
          </div>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(251,191,36,0.12)',
            border: '2px solid rgba(251,191,36,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '12px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 }}>
              Directs
            </div>
            <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>
              {progress?.totalDirects || 0}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '12px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 4 }}>
              Team Biz
            </div>
            <div style={{ fontFamily: SG, fontSize: 20, fontWeight: 800, color: '#22c55e' }}>
              {formatUSD(progress?.teamBiz || 0)}
            </div>
          </div>
        </div>

        {/* Daily Reward */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.15)',
          borderRadius: 12,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
              <path d="M12 2c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Daily Reward</span>
          </div>
          <span style={{ fontFamily: SG, fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>
            {formatUSD(currentRank?.dailyReward || 0)}/day
          </span>
        </div>

        {/* Progress to next rank */}
        {progress?.nextRank ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' as const }}>
                Progress to {progress.nextRank}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                {Math.round(Math.max(directsPct, teamBizPct))}%
              </div>
            </div>

            {/* Directs progress */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Directs</span>
                <span style={{ fontSize: 10, color: '#60a5fa' }}>
                  {progress.progressDirects}/{progress.nextRankDirects}
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <div style={{
                  width: `${directsPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#60a5fa,#a78bfa)',
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* Team Biz progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Team Biz</span>
                <span style={{ fontSize: 10, color: '#22c55e' }}>
                  {formatUSD(progress.progressTeamBiz)}/{formatUSD(progress.nextRankTeamBiz)}
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <div style={{
                  width: `${teamBizPct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg,#22c55e,#16a34a)',
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '12px 0',
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
          }}>
            Maximum rank achieved
          </div>
        )}
      </div>

      {/* All Rank Tiers */}
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' as const, marginBottom: 12 }}>
        Rank Tiers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {RANKS.map((rank, i) => {
          const isCurrent = rank.name === progress?.currentRank;
          const isAchieved = currentRankIndex >= 0 && i <= currentRankIndex;
          const isNext = rank.name === progress?.nextRank;

          return (
            <div
              key={rank.name}
              style={{
                background: isCurrent
                  ? 'rgba(251,191,36,0.08)'
                  : 'rgba(255,255,255,0.04)',
                border: isCurrent
                  ? '1px solid rgba(251,191,36,0.25)'
                  : isNext
                    ? '1px solid rgba(96,165,250,0.2)'
                    : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: '0.2s',
              }}
            >
              {/* Rank icon */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isCurrent
                  ? 'rgba(251,191,36,0.15)'
                  : isAchieved
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(255,255,255,0.04)',
                border: isCurrent
                  ? '1px solid rgba(251,191,36,0.35)'
                  : isAchieved
                    ? '1px solid rgba(34,197,94,0.2)'
                    : '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isCurrent ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ) : isAchieved ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>

              {/* Rank info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{
                    fontFamily: SG,
                    fontSize: 13,
                    fontWeight: 700,
                    color: isCurrent ? '#fbbf24' : isAchieved ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                  }}>
                    {rank.name}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.15)',
                      padding: '2px 7px',
                      borderRadius: 6,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase' as const,
                    }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 3,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  <span>{rank.minDirects} directs</span>
                  <span>{formatUSD(rank.minTeamBiz)} biz</span>
                  <span style={{ color: 'rgba(251,191,36,0.6)' }}>{formatUSD(rank.dailyReward)}/day</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
