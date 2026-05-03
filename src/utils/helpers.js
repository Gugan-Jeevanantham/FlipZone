import { CATS } from '../data';

export function buildCards(gridSize, cat) {
  const count = (gridSize * gridSize) / 2;
  const pool = [...CATS[cat]].sort(() => Math.random() - .5).slice(0, count);
  return [...pool, ...pool]
    .sort(() => Math.random() - .5)
    .map((emoji, i) => ({ id:i, emoji, flipped:false, matched:false, shk:false }));
}

export function getResult(timeLeft, totalTime, matchedCount, totalPairs, gender) {
  const pr = gender === 'male' ? 'bro' : 'sis';
  const ratio = matchedCount / totalPairs;
  const tr = timeLeft / totalTime;
  const win = matchedCount === totalPairs;
  if (!win) {
    if (ratio >= 0.8) return { ico:'😤', msg:'SO CLOSE!',             sub:`Almost had it ${pr}! One more round — you've got this!` };
    if (ratio >= 0.5) return { ico:'😓', msg:'HALFWAY THERE',         sub:`Not bad ${pr}, timer got you. Level up your speed!` };
    if (ratio >= 0.25)return { ico:'💀', msg:'BETTER LUCK NEXT TIME', sub:`The clock is your enemy ${pr}. Train harder!` };
    return           { ico:'🪦', msg:'ABSOLUTELY WRECKED',            sub:`You barely started ${pr} 💀 Rise from the ashes!` };
  }
  if (tr >= 0.6)  return { ico:'🏆', msg:'LEGENDARY!',       sub:`Different level ${pr}! Speed, precision, dominance — GOAT status!` };
  if (tr >= 0.35) return { ico:'🥇', msg:'VERY GOOD!',        sub:`Outstanding ${pr}! Fast hands, sharp mind. Hall of fame!` };
  if (tr >= 0.15) return { ico:'🥈', msg:'GOOD JOB!',         sub:`Solid win ${pr}! Push harder next round for legendary!` };
  return           { ico:'🥉', msg:'MISSION COMPLETE',        sub:`Barely made it ${pr}! More practice for perfection!` };
}