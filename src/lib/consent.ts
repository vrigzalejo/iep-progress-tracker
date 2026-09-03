export type ConsentLike = {
  guardianName: string;
  noticeVersion: string;
  withdrawnAt?: Date | string | null;
};

export function hasCurrentConsent(
  consents: ConsentLike[],
  noticeVersion: string,
  guardianName: string,
) {
  return consents.some(
    (consent) =>
      consent.guardianName === guardianName &&
      consent.noticeVersion === noticeVersion &&
      !consent.withdrawnAt,
  );
}
