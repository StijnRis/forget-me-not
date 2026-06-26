const TEAM_STORY_VIEW_PATH = /^\/teams\/[^/]+\/view(\/|$)/;

export function isTeamStoryViewPath(pathname: string) {
  return TEAM_STORY_VIEW_PATH.test(pathname);
}

export function teamStoryViewPath(teamId: number, storyId: number) {
  return `/teams/${teamId}/view/${storyId}`;
}

export function teamStoryViewBasePath(teamId: number) {
  return `/teams/${teamId}/view`;
}