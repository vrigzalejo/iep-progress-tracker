export const ROLES = ["ADMINISTRATOR", "EDUCATOR", "PROVIDER", "PARENT"] as const;
export type Role = (typeof ROLES)[number];

export const SERVICE_AREAS = [
  "ACADEMIC",
  "SPEECH_LANGUAGE",
  "OCCUPATIONAL_THERAPY",
  "PHYSICAL_THERAPY",
  "BEHAVIOR_SOCIAL",
  "ADAPTIVE",
] as const;
export type ServiceArea = (typeof SERVICE_AREAS)[number];

export const MEASUREMENT_TYPES = [
  "PERCENT_ACCURACY",
  "FREQUENCY",
  "DURATION_MINUTES",
  "RUBRIC",
  "TRIALS",
  "RATE",
] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export const REPORTING_PERIODS = ["WEEKLY", "MONTHLY", "QUARTERLY"] as const;
export type ReportingPeriod = (typeof REPORTING_PERIODS)[number];

export const GOAL_STATUSES = ["DRAFT", "ACTIVE", "GOAL_MET", "DISCONTINUED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const DATA_SIGNALS = [
  "GOAL_MET",
  "ON_TRACK",
  "NEEDS_ATTENTION",
  "NEEDS_DATA",
] as const;
export type DataSignal = (typeof DATA_SIGNALS)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRATOR: "Administrator",
  EDUCATOR: "Educator",
  PROVIDER: "Related-service provider",
  PARENT: "Parent / guardian",
};

export const SERVICE_AREA_LABELS: Record<ServiceArea, string> = {
  ACADEMIC: "Academic",
  SPEECH_LANGUAGE: "Speech and language",
  OCCUPATIONAL_THERAPY: "Occupational therapy",
  PHYSICAL_THERAPY: "Physical therapy",
  BEHAVIOR_SOCIAL: "Social and self-advocacy",
  ADAPTIVE: "Adaptive skills",
};

export const MEASUREMENT_LABELS: Record<MeasurementType, string> = {
  PERCENT_ACCURACY: "Percent accuracy",
  FREQUENCY: "Frequency (count)",
  DURATION_MINUTES: "Duration (minutes)",
  RUBRIC: "Rubric score",
  TRIALS: "Independent trials",
  RATE: "Rate (per minute)",
};

export const PERIOD_LABELS: Record<ReportingPeriod, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  GOAL_MET: "Goal met",
  DISCONTINUED: "Discontinued",
};

export const SIGNAL_LABELS: Record<DataSignal, string> = {
  GOAL_MET: "Goal met",
  ON_TRACK: "On track",
  NEEDS_ATTENTION: "Needs attention",
  NEEDS_DATA: "Needs recent data",
};

export const SIGNAL_HINTS: Record<DataSignal, string> = {
  GOAL_MET:
    "The most recent recorded scores meet or exceed the written target. This is a data snapshot, not an IEP team decision.",
  ON_TRACK:
    "Recent scores are moving toward the written target. This is a data snapshot, not an evaluation.",
  NEEDS_ATTENTION:
    "Scores have slowed, declined, or a reporting date is close. Review with the IEP team before changing services.",
  NEEDS_DATA:
    "This goal does not have a recent progress entry. Record session data so the team can see current performance.",
};

export const PRIVACY_NOTICE_VERSION = "2026-08";

export const DEMO_PASSPHRASE = "ProgressPath!Demo26";
