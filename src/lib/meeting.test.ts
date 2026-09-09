import { describe, expect, it } from "vitest";
import { meetingOnParam, uniqueAttendeeNames, utcMeetingOn } from "./meeting";

describe("meeting helpers", () => {
  it("normalizes a calendar date to UTC midnight", () => {
    const date = utcMeetingOn("2026-09-04");
    expect(meetingOnParam(date)).toBe("2026-09-04");
    expect(date.getUTCHours()).toBe(0);
  });

  it("dedupes attendee names without changing display spelling", () => {
    expect(uniqueAttendeeNames(["Maricel Santos", "maricel santos", " Diana "])).toEqual([
      "Maricel Santos",
      "Diana",
    ]);
  });
});
