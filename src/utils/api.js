import slugify from './slugify.js';

const API_URL = "https://opensheet.elk.sh/1gHshryM9mQFVYC2AeSj6bhcKW8_g69EBbMPI0F8s53Y/1";

export function cleanUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  const mdMatch = trimmed.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
  if (mdMatch) return mdMatch[1];
  const urlMatch = trimmed.match(/https?:\/\/[^\s\)]+/);
  if (urlMatch) return urlMatch[0];
  return trimmed;
}

export function getMatchSlug(match) {
  if (!match) return '';
  const id = match.MatchID || '';
  const team1 = match.Team1 || 'match';
  const team2 = match.Team2 || '';

  if (team2 && team2.trim() !== '') {
    return slugify(`${team1}-vs-${team2}-${id}`);
  }
  return slugify(`${team1}-${id}`);
}

export async function fetchMatches() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => {
      const matchId = (item.MatchID || `m-${index + 1}`).trim();
      const team1 = (item.Team1 || 'Team A').trim();
      const team2 = (item.Team2 || '').trim();
      const sport = (item.Sport || 'Soccer').trim();
      const league = (item.League || 'General').trim();
      const leagueLogo = cleanUrl(item.LeagueLogo) || '';
      const team1Logo = cleanUrl(item.Team1Logo) || '';
      const team2Logo = cleanUrl(item.Team2Logo) || '';
      const matchThumb = cleanUrl(item.MatchThumb) || '';
      const iframeUrl = cleanUrl(item.IframeURL) || '';
      const date = (item.Date || 'Today').trim();
      const time = (item.Time || 'TBD').trim();
      const tvGuide = (item.TVGuide || '').trim();

      const channels = tvGuide ? tvGuide.split(',').map(c => c.trim()).filter(Boolean) : [];

      const slug = getMatchSlug({ MatchID: matchId, Team1: team1, Team2: team2 });
      const leagueSlug = slugify(league || 'sports');
      const teamsSlug = slugify(team2 ? `${team1}-vs-${team2}` : team1);
      const url = `/${leagueSlug}/${teamsSlug}/${matchId}`;

      return {
        id: matchId,
        sport,
        league,
        leagueLogo,
        leagueSlug,
        team1,
        team1Logo,
        team2,
        team2Logo,
        teamsSlug,
        date,
        time,
        tvGuide,
        channels,
        matchThumb,
        iframeUrl,
        slug,
        url
      };
    });
  } catch (err) {
    console.error("Error fetching match data:", err);
    return [];
  }
}

export async function fetchMatchById(id) {
  const matches = await fetchMatches();
  return matches.find(m => String(m.id).toLowerCase() === String(id).toLowerCase()) || null;
}