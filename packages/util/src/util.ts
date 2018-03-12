export const filterAndJoinArray: <T>(arr: T[], joinChar?: string) => string = <T>(arr: T[], joinChar= '\n') => arr
  .filter(Boolean)
  .join(joinChar);
