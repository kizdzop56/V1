export function formatStudentName(
  user: { username: string; name?: string | null },
  viewerRole?: string | null,
): string {
  const isTeacherOrAdmin = viewerRole === "teacher" || viewerRole === "admin";
  if (isTeacherOrAdmin && user.name && user.name.trim() && user.name !== user.username) {
    return `${user.username} (${user.name})`;
  }
  return user.username;
}
