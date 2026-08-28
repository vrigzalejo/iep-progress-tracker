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

export const SESSION_OUTCOMES = ["PRESENT", "ABSENT", "REFUSED", "MAKEUP_SCHEDULED"] as const;
export type SessionOutcome = (typeof SESSION_OUTCOMES)[number];

export const SESSION_SETTINGS = ["CLASSROOM", "PULL_OUT", "GROUP", "TELEHEALTH", "HOME"] as const;
export type SessionSetting = (typeof SESSION_SETTINGS)[number];

export const CONDITION_TAGS = ["TYPICAL_SUPPORTS", "WITHOUT_EXTRA_SUPPORTS", "ONE_TO_ONE", "SMALL_GROUP"] as const;
export type ConditionTag = (typeof CONDITION_TAGS)[number];

export const PROMPT_LEVELS = ["INDEPENDENT", "GESTURE", "VERBAL", "MODEL", "PHYSICAL"] as const;
export type PromptLevel = (typeof PROMPT_LEVELS)[number];

export const TRIAL_RESULTS = ["INDEPENDENT", "PROMPTED", "INCORRECT"] as const;
export type TrialResult = (typeof TRIAL_RESULTS)[number];

export const PROGRESS_CODES = ["SUFFICIENT", "INSUFFICIENT", "GOAL_MET", "NOT_INTRODUCED"] as const;
export type ProgressCode = (typeof PROGRESS_CODES)[number];

export const MESSAGE_VISIBILITIES = ["FAMILY", "STAFF"] as const;
export type MessageVisibility = (typeof MESSAGE_VISIBILITIES)[number];

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
    "Recent consecutive sessions meet the written mastery rule. This is a data snapshot, not an IEP team decision.",
  ON_TRACK:
    "Recent scores are moving toward the written target and mastery rule. This is a data snapshot, not an evaluation.",
  NEEDS_ATTENTION:
    "Scores have slowed, declined, or a reporting date is close. Review with the IEP team before changing services.",
  NEEDS_DATA:
    "This goal does not have a recent present-session entry. Record session data so the team can see current performance.",
};

export const SESSION_OUTCOME_LABELS: Record<SessionOutcome, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  REFUSED: "Declined / refused",
  MAKEUP_SCHEDULED: "Makeup scheduled",
};

export const SESSION_SETTING_LABELS: Record<SessionSetting, string> = {
  CLASSROOM: "Classroom / push-in",
  PULL_OUT: "Pull-out",
  GROUP: "Small group",
  TELEHEALTH: "Telehealth",
  HOME: "Home",
};

export const CONDITION_TAG_LABELS: Record<ConditionTag, string> = {
  TYPICAL_SUPPORTS: "Typical supports",
  WITHOUT_EXTRA_SUPPORTS: "Without extra supports",
  ONE_TO_ONE: "1:1",
  SMALL_GROUP: "Small group",
};

export const PROMPT_LEVEL_LABELS: Record<PromptLevel, string> = {
  INDEPENDENT: "Independent",
  GESTURE: "Gesture",
  VERBAL: "Verbal",
  MODEL: "Model",
  PHYSICAL: "Physical",
};

export const TRIAL_RESULT_LABELS: Record<TrialResult, string> = {
  INDEPENDENT: "Independent",
  PROMPTED: "Prompted",
  INCORRECT: "Incorrect",
};

export const PROGRESS_CODE_LABELS: Record<ProgressCode, string> = {
  SUFFICIENT: "Making sufficient progress",
  INSUFFICIENT: "Not making sufficient progress",
  GOAL_MET: "Goal met this period",
  NOT_INTRODUCED: "Not yet introduced",
};

export const PROGRESS_CODE_HINTS: Record<ProgressCode, string> = {
  SUFFICIENT: "Staff selected this IEP progress code for the reporting period. It is not generated by the chart.",
  INSUFFICIENT: "Staff selected this IEP progress code for the reporting period. It is not generated by the chart.",
  GOAL_MET: "Staff selected this IEP progress code for the reporting period. It is not an automatic IEP amendment.",
  NOT_INTRODUCED: "Staff noted that this goal was not yet introduced during the reporting period.",
};

export const MESSAGE_VISIBILITY_LABELS: Record<MessageVisibility, string> = {
  FAMILY: "Family thread",
  STAFF: "Staff only",
};

export const PROMPT_RANK: Record<PromptLevel, number> = {
  INDEPENDENT: 0,
  GESTURE: 1,
  VERBAL: 2,
  MODEL: 3,
  PHYSICAL: 4,
};

export const TRIAL_MEASUREMENTS: MeasurementType[] = ["PERCENT_ACCURACY", "TRIALS"];
export const COUNT_MEASUREMENTS: MeasurementType[] = ["FREQUENCY"];

export const PRIVACY_NOTICE_VERSION = "2026-08";

export { APP_NAME, APP_SLUG, DEMO_PASSPHRASE, demoEmail } from "@/lib/brand";
