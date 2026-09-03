import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEMO_PASSPHRASE, PRIVACY_NOTICE_VERSION } from "@/lib/constants";
import { isDemoMode } from "@/lib/runtime";
import {
  DEMO_ELEMENTARY_SCHOOL,
  DEMO_MIDDLE_SCHOOL,
  DEMO_ORG_NAME,
  DEMO_USER_DISPLAY_NAMES,
  applyDemoTextReplacements,
  canonicalDemoLocalPart,
  demoEmail,
} from "@/lib/brand";

function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

async function backfillDemoPracticeData() {
  const periodCount = await prisma.reportingPeriodWindow.count();
  if (periodCount > 0) return;

  const org = await prisma.organization.findFirst();
  if (!org) return;

  const educator = await prisma.user.findFirst({
    where: { OR: [{ email: demoEmail("maricel.santos") }, { email: { startsWith: "maricel.santos@" } }] },
  });
  const speech = await prisma.user.findFirst({
    where: { OR: [{ email: demoEmail("patricia.cruz") }, { email: { startsWith: "patricia.cruz@" } }] },
  });
  const ot = await prisma.user.findFirst({
    where: { OR: [{ email: demoEmail("lorenzo.bautista") }, { email: { startsWith: "lorenzo.bautista@" } }] },
  });
  const parentJaime = await prisma.user.findFirst({
    where: { OR: [{ email: demoEmail("diana.santos") }, { email: { startsWith: "diana.santos@" } }] },
  });
  if (!educator || !speech || !ot || !parentJaime) return;

  const q4 = await prisma.reportingPeriodWindow.create({
    data: {
      organizationId: org.id,
      label: "Quarter 4 2025–26",
      startsAt: daysAgo(140),
      endsAt: daysAgo(50),
    },
  });
  const q1 = await prisma.reportingPeriodWindow.create({
    data: {
      organizationId: org.id,
      label: "Quarter 1 2026–27",
      startsAt: daysAgo(10),
      endsAt: daysFromNow(50),
    },
  });

  const jordan = await prisma.student.findFirst({ where: { preferredName: "Jaime Santos" } });
  const sam = await prisma.student.findFirst({ where: { preferredName: "Samuel Villanueva" } });
  const avery = await prisma.student.findFirst({ where: { preferredName: "Andrea Tan" } });
  const riley = await prisma.student.findFirst({ where: { preferredName: "Rafael Bautista" } });

  if (jordan) {
    await prisma.student.update({
      where: { id: jordan.id },
      data: {
        iepAnnualReviewAt: daysFromNow(18),
        iepTriennialAt: daysFromNow(200),
        presentLevels:
          "Jaime reads grade-level informational text at 62 WCPM and asks for help with a prompt during small-group work.",
      },
    });
    await prisma.studentProvider.updateMany({
      where: { studentId: jordan.id, serviceArea: "SPEECH_LANGUAGE" },
      data: { minutesPerWeek: 60, sessionsPerWeek: 2 },
    });
    await prisma.studentProvider.updateMany({
      where: { studentId: jordan.id, serviceArea: "ACADEMIC" },
      data: { minutesPerWeek: 150, sessionsPerWeek: 5 },
    });
  }

  if (sam) {
    await prisma.student.update({
      where: { id: sam.id },
      data: {
        iepAnnualReviewAt: daysFromNow(8),
        iepTriennialAt: daysFromNow(90),
        presentLevels: "Samuel writes 2 of 5 first-name letters with a consistent starting point.",
      },
    });
    await prisma.studentProvider.updateMany({
      where: { studentId: sam.id, serviceArea: "OCCUPATIONAL_THERAPY" },
      data: { minutesPerWeek: 30, sessionsPerWeek: 1 },
    });
    await prisma.studentProvider.updateMany({
      where: { studentId: sam.id, serviceArea: "ADAPTIVE" },
      data: { minutesPerWeek: 60, sessionsPerWeek: 5 },
    });
  }

  if (avery) {
    await prisma.student.update({
      where: { id: avery.id },
      data: { iepAnnualReviewAt: daysFromNow(55) },
    });
    await prisma.studentProvider.updateMany({
      where: { studentId: avery.id, serviceArea: "SPEECH_LANGUAGE" },
      data: { minutesPerWeek: 45, sessionsPerWeek: 1 },
    });
  }

  if (riley) {
    await prisma.student.update({
      where: { id: riley.id },
      data: { iepAnnualReviewAt: daysFromNow(-2) },
    });
    await prisma.studentProvider.updateMany({
      where: { studentId: riley.id, serviceArea: "ACADEMIC" },
      data: { minutesPerWeek: 120, sessionsPerWeek: 5 },
    });
  }

  const caseyExisting = await prisma.student.findFirst({ where: { preferredName: "Carla Santos" } });
  if (!caseyExisting) {
    const casey = await prisma.student.create({
      data: {
        preferredName: "Carla Santos",
        grade: "K",
        school: DEMO_ELEMENTARY_SCHOOL,
        caseManagerId: educator.id,
        organizationId: org.id,
        iepAnnualReviewAt: daysFromNow(40),
        presentLevels: "Carla follows one-step classroom directions with a gesture prompt.",
        providers: {
          create: [{ userId: educator.id, serviceArea: "ADAPTIVE", minutesPerWeek: 60, sessionsPerWeek: 5 }],
        },
        guardians: {
          create: [
            {
              name: DEMO_USER_DISPLAY_NAMES["diana.santos"],
              relationship: "Parent",
              email: demoEmail("diana.santos"),
              phone: "555-0142",
              userId: parentJaime.id,
            },
          ],
        },
      },
    });
    const caseyGoal = await prisma.iepGoal.create({
      data: {
        studentId: casey.id,
        officialWording:
          "Given a one-step classroom direction, Carla will begin the action within 10 seconds in 4 of 5 opportunities across 3 consecutive school days.",
        plainLanguageSummary: "Carla is practicing starting a classroom job after one direction.",
        baseline: "Began within 10 seconds in 2 of 5 opportunities with a gesture.",
        measurableTarget: "4 of 5 opportunities across 3 consecutive days.",
        targetValue: 80,
        unit: "% of opportunities",
        reportingPeriod: "WEEKLY",
        nextReportDue: daysFromNow(9),
        serviceArea: "ADAPTIVE",
        measurementMethod: "PERCENT_ACCURACY",
        status: "ACTIVE",
        startDate: daysAgo(20),
        sharedWithGuardians: true,
        consecutiveSessionsNeeded: 3,
        maxPromptForMastery: "GESTURE",
        createdById: educator.id,
      },
    });
    await prisma.progressEntry.create({
      data: {
        goalId: caseyGoal.id,
        recordedAt: daysAgo(3),
        score: 60,
        measurementType: "PERCENT_ACCURACY",
        notes: "Started the job after one direction in 3 of 5 chances.",
        authorId: educator.id,
        sessionOutcome: "PRESENT",
        setting: "CLASSROOM",
        minutesDelivered: 15,
        conditionTag: "TYPICAL_SUPPORTS",
        trials: {
          create: [
            { result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 0 },
            { result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 1 },
            { result: "PROMPTED", promptLevel: "GESTURE", sortOrder: 2 },
            { result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 3 },
            { result: "INCORRECT", promptLevel: "INDEPENDENT", sortOrder: 4 },
          ],
        },
      },
    });
    await prisma.goalPeriodStatement.create({
      data: {
        goalId: caseyGoal.id,
        periodId: q1.id,
        progressCode: "SUFFICIENT",
        narrative:
          "Carla is beginning more classroom jobs after one direction, especially with a small gesture.",
        authorId: educator.id,
      },
    });
    await prisma.message.create({
      data: {
        studentId: casey.id,
        fromUserId: educator.id,
        visibility: "FAMILY",
        body: "Carla started the morning job after one direction three times today.",
        createdAt: daysAgo(1),
      },
    });
  }

  const goals = await prisma.iepGoal.findMany({ include: { student: true, entries: true } });
  for (const goal of goals) {
    const consecutive =
      goal.serviceArea === "ACADEMIC" || goal.measurementMethod === "RATE" ? 3 : 2;
    await prisma.iepGoal.update({
      where: { id: goal.id },
      data: {
        consecutiveSessionsNeeded: consecutive,
        maxPromptForMastery: goal.serviceArea === "OCCUPATIONAL_THERAPY" ? "GESTURE" : "INDEPENDENT",
      },
    });
    if (goal.plainLanguageSummary.includes("reading grade-level")) {
      const existingObjective = await prisma.goalObjective.count({ where: { goalId: goal.id } });
      if (existingObjective === 0) {
        await prisma.goalObjective.create({
          data: {
            goalId: goal.id,
            officialWording: "Jaime will read 75 WCPM with 96% accuracy on 3 consecutive weekly probes.",
            plainLanguageSummary: "First benchmark: reach 75 words correct per minute.",
            targetValue: 75,
            unit: "WCPM",
          },
        });
      }
      await prisma.goalPeriodStatement.create({
        data: {
          goalId: goal.id,
          periodId: q1.id,
          progressCode: "SUFFICIENT",
          narrative:
            "This quarter Jaime is reading 84 WCPM on informational probes. The annual target is 90 WCPM across three consecutive probes.",
          authorId: educator.id,
        },
      });
      await prisma.goalPeriodStatement.create({
        data: {
          goalId: goal.id,
          periodId: q4.id,
          progressCode: "SUFFICIENT",
          narrative: "Jaime moved from 62 to the mid-70s WCPM last quarter. Accuracy stayed high.",
          authorId: educator.id,
        },
      });
    }
    if (goal.plainLanguageSummary.includes("asking for a repeat")) {
      await prisma.goalPeriodStatement.create({
        data: {
          goalId: goal.id,
          periodId: q1.id,
          progressCode: "SUFFICIENT",
          narrative:
            "Jaime used a practiced request independently in 4 of 5 book-club chances. Please keep practicing the phrase at home before homework.",
          authorId: speech.id,
        },
      });
      const latest = [...goal.entries].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
      if (latest) {
        await prisma.progressEntry.update({
          where: { id: latest.id },
          data: {
            minutesDelivered: 30,
            homeCarryover: "Practice the same phrase at home before homework: “Can you say that again?”",
            setting: "CLASSROOM",
          },
        });
        const trialCount = await prisma.progressTrial.count({ where: { entryId: latest.id } });
        if (trialCount === 0) {
          await prisma.progressTrial.createMany({
            data: [
              { entryId: latest.id, result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 0 },
              { entryId: latest.id, result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 1 },
              { entryId: latest.id, result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 2 },
              { entryId: latest.id, result: "INDEPENDENT", promptLevel: "INDEPENDENT", sortOrder: 3 },
              { entryId: latest.id, result: "PROMPTED", promptLevel: "GESTURE", sortOrder: 4 },
            ],
          });
        }
      }
    }
    if (goal.plainLanguageSummary.includes("first name")) {
      await prisma.goalPeriodStatement.create({
        data: {
          goalId: goal.id,
          periodId: q1.id,
          progressCode: "INSUFFICIENT",
          narrative:
            "Samuel’s name writing is more consistent with the highlighted strip, but size still drops when the model is removed.",
          authorId: ot.id,
        },
      });
      for (const entry of goal.entries) {
        await prisma.progressEntry.update({
          where: { id: entry.id },
          data: { minutesDelivered: 30, setting: "PULL_OUT" },
        });
      }
    }
    if (goal.student.preferredName === "Jaime Santos" && goal.measurementMethod === "RATE") {
      const latest = [...goal.entries].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
      if (latest) {
        await prisma.progressEntry.update({
          where: { id: latest.id },
          data: {
            minutesDelivered: 30,
            homeCarryover: "Read a short nonfiction paragraph aloud once this weekend, then retell one fact.",
          },
        });
      }
    }
  }

  if (jordan) {
    await prisma.message.create({
      data: {
        studentId: jordan.id,
        fromUserId: speech.id,
        visibility: "STAFF",
        body: "For the annual review packet: keep the cue card in the data, but note it was faded after the first opportunity this week.",
        createdAt: daysAgo(2),
      },
    });
  }

  if (avery) {
    const averyGoal = await prisma.iepGoal.findFirst({ where: { studentId: avery.id } });
    if (averyGoal) {
      await prisma.progressEntry.create({
        data: {
          goalId: averyGoal.id,
          recordedAt: daysAgo(9),
          score: 0,
          measurementType: "PERCENT_ACCURACY",
          notes: "Andrea was absent; makeup scheduled for next week.",
          authorId: speech.id,
          sessionOutcome: "ABSENT",
          setting: "CLASSROOM",
          minutesDelivered: 0,
        },
      });
    }
  }
}

async function migrateDemoBrand() {
  const users = await prisma.user.findMany();
  const passwordHash = await hash(DEMO_PASSPHRASE, 12);
  for (const user of users) {
    const nextLocal = canonicalDemoLocalPart(user.email.split("@")[0]);
    if (!nextLocal) continue;
    const nextEmail = demoEmail(nextLocal);
    const nextName = DEMO_USER_DISPLAY_NAMES[nextLocal];
    if (user.email === nextEmail && user.name === nextName) continue;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: nextEmail,
        name: nextName,
        ...(user.email === nextEmail ? {} : { passwordHash }),
      },
    });
  }

  const guardians = await prisma.guardianContact.findMany();
  for (const guardian of guardians) {
    const nextLocal = canonicalDemoLocalPart(guardian.email.split("@")[0]);
    if (!nextLocal) continue;
    const nextEmail = demoEmail(nextLocal);
    const nextName = DEMO_USER_DISPLAY_NAMES[nextLocal];
    if (guardian.email === nextEmail && guardian.name === nextName) continue;
    await prisma.guardianContact.update({
      where: { id: guardian.id },
      data: { email: nextEmail, name: nextName },
    });
  }

  const demoOrg = await prisma.organization.findFirst({
    where: { name: { in: ["Maple Ridge Demonstration School", DEMO_ORG_NAME] } },
  });
  if (!demoOrg) return;

  await prisma.organization.updateMany({
    where: { name: "Maple Ridge Demonstration School" },
    data: { name: DEMO_ORG_NAME },
  });
  await prisma.student.updateMany({
    where: { school: "Maple Ridge Elementary" },
    data: { school: DEMO_ELEMENTARY_SCHOOL },
  });
  await prisma.student.updateMany({
    where: { school: "Cedar Grove Middle School" },
    data: { school: DEMO_MIDDLE_SCHOOL },
  });

  const studentNames: [string, string][] = [
    ["Jordan Hale", "Jaime Santos"],
    ["Casey Hale", "Carla Santos"],
    ["Sam Rivera", "Samuel Villanueva"],
    ["Avery Chen", "Andrea Tan"],
    ["Riley Brooks", "Rafael Bautista"],
  ];
  for (const [from, to] of studentNames) {
    await prisma.student.updateMany({ where: { preferredName: from }, data: { preferredName: to } });
  }

  const consents = await prisma.consentRecord.findMany();
  for (const consent of consents) {
    const next = applyDemoTextReplacements(consent.guardianName);
    if (next !== consent.guardianName) {
      await prisma.consentRecord.update({
        where: { id: consent.id },
        data: { guardianName: next },
      });
    }
  }

  const students = await prisma.student.findMany();
  for (const student of students) {
    const presentLevels = applyDemoTextReplacements(student.presentLevels ?? "");
    if (presentLevels !== (student.presentLevels ?? "")) {
      await prisma.student.update({
        where: { id: student.id },
        data: { presentLevels },
      });
    }
  }

  const goals = await prisma.iepGoal.findMany();
  for (const goal of goals) {
    const data = {
      officialWording: applyDemoTextReplacements(goal.officialWording),
      plainLanguageSummary: applyDemoTextReplacements(goal.plainLanguageSummary),
      baseline: applyDemoTextReplacements(goal.baseline),
      measurableTarget: applyDemoTextReplacements(goal.measurableTarget),
      presentLevelsSnapshot: goal.presentLevelsSnapshot
        ? applyDemoTextReplacements(goal.presentLevelsSnapshot)
        : goal.presentLevelsSnapshot,
    };
    if (
      data.officialWording !== goal.officialWording ||
      data.plainLanguageSummary !== goal.plainLanguageSummary ||
      data.baseline !== goal.baseline ||
      data.measurableTarget !== goal.measurableTarget ||
      data.presentLevelsSnapshot !== goal.presentLevelsSnapshot
    ) {
      await prisma.iepGoal.update({ where: { id: goal.id }, data });
    }
  }

  const objectives = await prisma.goalObjective.findMany();
  for (const objective of objectives) {
    const officialWording = applyDemoTextReplacements(objective.officialWording);
    const plainLanguageSummary = applyDemoTextReplacements(objective.plainLanguageSummary);
    if (
      officialWording !== objective.officialWording ||
      plainLanguageSummary !== objective.plainLanguageSummary
    ) {
      await prisma.goalObjective.update({
        where: { id: objective.id },
        data: { officialWording, plainLanguageSummary },
      });
    }
  }

  const entries = await prisma.progressEntry.findMany();
  for (const entry of entries) {
    const notes = applyDemoTextReplacements(entry.notes ?? "");
    if (notes !== (entry.notes ?? "")) {
      await prisma.progressEntry.update({ where: { id: entry.id }, data: { notes } });
    }
  }

  const statements = await prisma.goalPeriodStatement.findMany();
  for (const statement of statements) {
    const narrative = applyDemoTextReplacements(statement.narrative);
    if (narrative !== statement.narrative) {
      await prisma.goalPeriodStatement.update({
        where: { id: statement.id },
        data: { narrative },
      });
    }
  }

  const messages = await prisma.message.findMany();
  for (const message of messages) {
    const body = applyDemoTextReplacements(message.body);
    if (body !== message.body) {
      await prisma.message.update({ where: { id: message.id }, data: { body } });
    }
  }
}

export async function seedDemoData() {
  if (!isDemoMode()) {
    return { seeded: false, skipped: true as const };
  }
  await migrateDemoBrand();
  const existing = await prisma.user.count();
  if (existing > 0) {
    await backfillDemoPracticeData();
    return { seeded: false };
  }

  const passwordHash = await hash(DEMO_PASSPHRASE, 12);

  const org = await prisma.organization.create({
    data: {
      name: DEMO_ORG_NAME,
      retentionDays: 2555,
      noticeVersion: PRIVACY_NOTICE_VERSION,
    },
  });

  await prisma.user.create({
    data: {
      email: demoEmail("crisanto.reyes"),
      name: DEMO_USER_DISPLAY_NAMES["crisanto.reyes"],
      title: "Director of Special Education",
      role: "ADMINISTRATOR",
      passwordHash,
      organizationId: org.id,
    },
  });

  const educator = await prisma.user.create({
    data: {
      email: demoEmail("maricel.santos"),
      name: DEMO_USER_DISPLAY_NAMES["maricel.santos"],
      title: "Special education teacher",
      role: "EDUCATOR",
      passwordHash,
      organizationId: org.id,
    },
  });

  const speech = await prisma.user.create({
    data: {
      email: demoEmail("patricia.cruz"),
      name: DEMO_USER_DISPLAY_NAMES["patricia.cruz"],
      title: "Speech-language pathologist",
      role: "PROVIDER",
      passwordHash,
      organizationId: org.id,
    },
  });

  const ot = await prisma.user.create({
    data: {
      email: demoEmail("lorenzo.bautista"),
      name: DEMO_USER_DISPLAY_NAMES["lorenzo.bautista"],
      title: "Occupational therapist",
      role: "PROVIDER",
      passwordHash,
      organizationId: org.id,
    },
  });

  const parentJaime = await prisma.user.create({
    data: {
      email: demoEmail("diana.santos"),
      name: DEMO_USER_DISPLAY_NAMES["diana.santos"],
      title: "Parent / guardian",
      role: "PARENT",
      passwordHash,
      organizationId: org.id,
    },
  });

  const parentSam = await prisma.user.create({
    data: {
      email: demoEmail("andres.villanueva"),
      name: DEMO_USER_DISPLAY_NAMES["andres.villanueva"],
      title: "Parent / guardian",
      role: "PARENT",
      passwordHash,
      organizationId: org.id,
    },
  });

  const q4 = await prisma.reportingPeriodWindow.create({
    data: {
      organizationId: org.id,
      label: "Quarter 4 2025–26",
      startsAt: daysAgo(140),
      endsAt: daysAgo(50),
    },
  });

  const q1 = await prisma.reportingPeriodWindow.create({
    data: {
      organizationId: org.id,
      label: "Quarter 1 2026–27",
      startsAt: daysAgo(10),
      endsAt: daysFromNow(50),
    },
  });

  const jordan = await prisma.student.create({
    data: {
      preferredName: "Jaime Santos",
      grade: "4",
      school: DEMO_ELEMENTARY_SCHOOL,
      caseManagerId: educator.id,
      organizationId: org.id,
      iepAnnualReviewAt: daysFromNow(18),
      iepTriennialAt: daysFromNow(200),
      presentLevels:
        "Jaime reads grade-level informational text at 62 WCPM and asks for help with a prompt during small-group work. Strengths include vocabulary and rereading to keep meaning.",
      providers: {
        create: [
          { userId: speech.id, serviceArea: "SPEECH_LANGUAGE", minutesPerWeek: 60, sessionsPerWeek: 2 },
          { userId: educator.id, serviceArea: "ACADEMIC", minutesPerWeek: 150, sessionsPerWeek: 5 },
        ],
      },
      guardians: {
        create: [
          {
            name: DEMO_USER_DISPLAY_NAMES["diana.santos"],
            relationship: "Parent",
            email: demoEmail("diana.santos"),
            phone: "555-0142",
            userId: parentJaime.id,
          },
        ],
      },
      consents: {
        create: {
          guardianName: DEMO_USER_DISPLAY_NAMES["diana.santos"],
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(40),
        },
      },
    },
  });

  const casey = await prisma.student.create({
    data: {
      preferredName: "Carla Santos",
      grade: "K",
      school: DEMO_ELEMENTARY_SCHOOL,
      caseManagerId: educator.id,
      organizationId: org.id,
      iepAnnualReviewAt: daysFromNow(40),
      presentLevels:
        "Carla follows one-step classroom directions with a gesture prompt and is beginning to use a visual schedule at arrival.",
      providers: {
        create: [{ userId: educator.id, serviceArea: "ADAPTIVE", minutesPerWeek: 60, sessionsPerWeek: 5 }],
      },
      guardians: {
        create: [
          {
            name: DEMO_USER_DISPLAY_NAMES["diana.santos"],
            relationship: "Parent",
            email: demoEmail("diana.santos"),
            phone: "555-0142",
            userId: parentJaime.id,
          },
        ],
      },
      consents: {
        create: {
          guardianName: DEMO_USER_DISPLAY_NAMES["diana.santos"],
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(40),
        },
      },
    },
  });

  const sam = await prisma.student.create({
    data: {
      preferredName: "Samuel Villanueva",
      grade: "2",
      school: DEMO_ELEMENTARY_SCHOOL,
      caseManagerId: educator.id,
      organizationId: org.id,
      iepAnnualReviewAt: daysFromNow(8),
      iepTriennialAt: daysFromNow(90),
      presentLevels:
        "Samuel writes 2 of 5 first-name letters with a consistent starting point and uses a visual schedule for classroom transitions.",
      providers: {
        create: [
          { userId: ot.id, serviceArea: "OCCUPATIONAL_THERAPY", minutesPerWeek: 30, sessionsPerWeek: 1 },
          { userId: educator.id, serviceArea: "ADAPTIVE", minutesPerWeek: 60, sessionsPerWeek: 5 },
        ],
      },
      guardians: {
        create: [
          {
            name: DEMO_USER_DISPLAY_NAMES["andres.villanueva"],
            relationship: "Parent",
            email: demoEmail("andres.villanueva"),
            phone: "555-0188",
            userId: parentSam.id,
          },
        ],
      },
      consents: {
        create: {
          guardianName: DEMO_USER_DISPLAY_NAMES["andres.villanueva"],
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(28),
        },
      },
    },
  });

  const avery = await prisma.student.create({
    data: {
      preferredName: "Andrea Tan",
      grade: "6",
      school: DEMO_MIDDLE_SCHOOL,
      caseManagerId: educator.id,
      organizationId: org.id,
      iepAnnualReviewAt: daysFromNow(55),
      presentLevels:
        "Andrea contributes an on-topic comment in about 1 of 4 language samples and benefits from a sentence starter.",
      providers: {
        create: [{ userId: speech.id, serviceArea: "SPEECH_LANGUAGE", minutesPerWeek: 45, sessionsPerWeek: 1 }],
      },
      guardians: {
        create: [
          {
            name: DEMO_USER_DISPLAY_NAMES["mikaela.tan"],
            relationship: "Parent",
            email: demoEmail("mikaela.tan"),
            phone: "555-0160",
          },
        ],
      },
      consents: {
        create: {
          guardianName: DEMO_USER_DISPLAY_NAMES["mikaela.tan"],
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(60),
        },
      },
    },
  });

  const riley = await prisma.student.create({
    data: {
      preferredName: "Rafael Bautista",
      grade: "3",
      school: DEMO_ELEMENTARY_SCHOOL,
      caseManagerId: educator.id,
      organizationId: org.id,
      iepAnnualReviewAt: daysFromNow(-2),
      presentLevels: "Rafael solves two-step word problems at 40% accuracy with a graphic organizer.",
      providers: {
        create: [{ userId: educator.id, serviceArea: "ACADEMIC", minutesPerWeek: 120, sessionsPerWeek: 5 }],
      },
      guardians: {
        create: [
          {
            name: DEMO_USER_DISPLAY_NAMES["teresa.bautista"],
            relationship: "Guardian",
            email: demoEmail("teresa.bautista"),
          },
        ],
      },
    },
  });

  const jordanReading = await prisma.iepGoal.create({
    data: {
      studentId: jordan.id,
      officialWording:
        "Given a grade-level informational passage, Jaime will read 90 words correct per minute with at least 98% accuracy on 3 consecutive weekly probes.",
      plainLanguageSummary:
        "Jaime is practicing reading grade-level passages smoothly and accurately so that meaning stays clear.",
      baseline: "62 words correct per minute with 94% accuracy (September probe).",
      measurableTarget: "90 words correct per minute with 98% accuracy.",
      targetValue: 90,
      unit: "WCPM",
      reportingPeriod: "WEEKLY",
      nextReportDue: daysFromNow(6),
      serviceArea: "ACADEMIC",
      measurementMethod: "RATE",
      status: "ACTIVE",
      startDate: daysAgo(70),
      sharedWithGuardians: true,
      consecutiveSessionsNeeded: 3,
      maxPromptForMastery: "INDEPENDENT",
      presentLevelsSnapshot: "62 WCPM on an informational cold probe in September.",
      createdById: educator.id,
    },
  });

  await prisma.goalObjective.create({
    data: {
      goalId: jordanReading.id,
      officialWording: "Jaime will read 75 WCPM with 96% accuracy on 3 consecutive weekly probes.",
      plainLanguageSummary: "First benchmark: reach 75 words correct per minute.",
      targetValue: 75,
      unit: "WCPM",
      sortOrder: 0,
    },
  });

  const jordanAdvocacy = await prisma.iepGoal.create({
    data: {
      studentId: jordan.id,
      officialWording:
        "During small-group instruction, Jaime will use a practiced phrase to request clarification or a break in 4 of 5 observed opportunities across two consecutive weeks, independently.",
      plainLanguageSummary:
        "Jaime is practicing asking for a repeat, a slower pace, or a short break during group work.",
      baseline: "Independent request in 1 of 5 opportunities.",
      measurableTarget: "Independent request in 4 of 5 opportunities.",
      targetValue: 80,
      unit: "% of opportunities",
      reportingPeriod: "MONTHLY",
      nextReportDue: daysFromNow(12),
      serviceArea: "SPEECH_LANGUAGE",
      measurementMethod: "PERCENT_ACCURACY",
      status: "ACTIVE",
      startDate: daysAgo(55),
      sharedWithGuardians: true,
      consecutiveSessionsNeeded: 2,
      maxPromptForMastery: "INDEPENDENT",
      createdById: educator.id,
    },
  });

  const samHandwriting = await prisma.iepGoal.create({
    data: {
      studentId: sam.id,
      officialWording:
        "Given lined paper and a visual model, Samuel will write 4 of 5 first-name letters with correct start point and size in 3 consecutive occupational therapy sessions.",
      plainLanguageSummary:
        "Samuel is practicing writing the letters in their first name with a comfortable grip and clear starting points.",
      baseline: "2 of 5 letters with consistent size.",
      measurableTarget: "4 of 5 letters with correct start point and size.",
      targetValue: 80,
      unit: "% of letters",
      reportingPeriod: "MONTHLY",
      nextReportDue: daysFromNow(3),
      serviceArea: "OCCUPATIONAL_THERAPY",
      measurementMethod: "PERCENT_ACCURACY",
      status: "ACTIVE",
      startDate: daysAgo(48),
      sharedWithGuardians: true,
      consecutiveSessionsNeeded: 3,
      maxPromptForMastery: "GESTURE",
      createdById: educator.id,
    },
  });

  const samTransitions = await prisma.iepGoal.create({
    data: {
      studentId: sam.id,
      officialWording:
        "Given a two-step visual schedule, Samuel will complete classroom transitions within 2 minutes of the cue on 4 of 5 consecutive school days.",
      plainLanguageSummary:
        "Samuel is using a picture schedule to move from one classroom activity to the next with less wait time.",
      baseline: "Average of 5 minutes from cue to start.",
      measurableTarget: "Transition complete within 2 minutes on 4 of 5 days.",
      targetValue: 80,
      unit: "% of days",
      reportingPeriod: "WEEKLY",
      nextReportDue: daysFromNow(18),
      serviceArea: "ADAPTIVE",
      measurementMethod: "PERCENT_ACCURACY",
      status: "ACTIVE",
      startDate: daysAgo(40),
      sharedWithGuardians: true,
      consecutiveSessionsNeeded: 2,
      maxPromptForMastery: "GESTURE",
      createdById: educator.id,
    },
  });

  const averyDiscussion = await prisma.iepGoal.create({
    data: {
      studentId: avery.id,
      officialWording:
        "In a structured classroom discussion, Andrea will contribute an on-topic comment or question using a complete sentence in 3 of 4 weekly language samples.",
      plainLanguageSummary:
        "Andrea is practicing joining class conversations with a full sentence that stays on the topic.",
      baseline: "On-topic contribution in 1 of 4 samples.",
      measurableTarget: "On-topic contribution in 3 of 4 weekly samples.",
      targetValue: 75,
      unit: "% of samples",
      reportingPeriod: "QUARTERLY",
      nextReportDue: daysFromNow(21),
      serviceArea: "SPEECH_LANGUAGE",
      measurementMethod: "PERCENT_ACCURACY",
      status: "ACTIVE",
      startDate: daysAgo(80),
      sharedWithGuardians: true,
      consecutiveSessionsNeeded: 2,
      maxPromptForMastery: "VERBAL",
      createdById: speech.id,
    },
  });

  const rileyMath = await prisma.iepGoal.create({
    data: {
      studentId: riley.id,
      officialWording:
        "Given a two-step word problem and a graphic organizer, Rafael will identify the operation and compute the correct answer with 80% accuracy on 3 consecutive weekly probes.",
      plainLanguageSummary:
        "Rafael is practicing two-step math stories with a graphic organizer to choose the operation and show the solution.",
      baseline: "40% accuracy on two-step word problems.",
      measurableTarget: "80% accuracy on 3 consecutive weekly probes.",
      targetValue: 80,
      unit: "% accuracy",
      reportingPeriod: "WEEKLY",
      nextReportDue: daysFromNow(-2),
      serviceArea: "ACADEMIC",
      measurementMethod: "PERCENT_ACCURACY",
      status: "ACTIVE",
      startDate: daysAgo(35),
      sharedWithGuardians: false,
      consecutiveSessionsNeeded: 3,
      maxPromptForMastery: "INDEPENDENT",
      createdById: educator.id,
    },
  });

  const caseyDirections = await prisma.iepGoal.create({
    data: {
      studentId: casey.id,
      officialWording:
        "Given a one-step classroom direction, Carla will begin the action within 10 seconds in 4 of 5 opportunities across 3 consecutive school days.",
      plainLanguageSummary: "Carla is practicing starting a classroom job after one direction.",
      baseline: "Began within 10 seconds in 2 of 5 opportunities with a gesture.",
      measurableTarget: "4 of 5 opportunities across 3 consecutive days.",
      targetValue: 80,
      unit: "% of opportunities",
      reportingPeriod: "WEEKLY",
      nextReportDue: daysFromNow(9),
      serviceArea: "ADAPTIVE",
      measurementMethod: "PERCENT_ACCURACY",
      status: "ACTIVE",
      startDate: daysAgo(20),
      sharedWithGuardians: true,
      consecutiveSessionsNeeded: 3,
      maxPromptForMastery: "GESTURE",
      createdById: educator.id,
    },
  });

  type TrialSeed = { result: "INDEPENDENT" | "PROMPTED" | "INCORRECT"; promptLevel?: string };

  const entry = async (input: {
    goalId: string;
    days: number;
    score: number;
    authorId: string;
    notes: string;
    measurementType?: string;
    evidenceLabel?: string;
    sessionOutcome?: string;
    setting?: string;
    minutesDelivered?: number;
    homeCarryover?: string;
    accommodations?: string;
    conditionTag?: string;
    trials?: TrialSeed[];
  }) =>
    prisma.progressEntry.create({
      data: {
        goalId: input.goalId,
        recordedAt: daysAgo(input.days),
        score: input.score,
        measurementType: input.measurementType ?? "PERCENT_ACCURACY",
        notes: input.notes,
        evidenceLabel: input.evidenceLabel,
        authorId: input.authorId,
        sessionOutcome: input.sessionOutcome ?? "PRESENT",
        setting: input.setting ?? "CLASSROOM",
        minutesDelivered: input.minutesDelivered,
        homeCarryover: input.homeCarryover,
        accommodations: input.accommodations,
        conditionTag: input.conditionTag ?? "TYPICAL_SUPPORTS",
        trials: input.trials
          ? {
              create: input.trials.map((trial, index) => ({
                result: trial.result,
                promptLevel: trial.promptLevel ?? (trial.result === "INDEPENDENT" ? "INDEPENDENT" : "VERBAL"),
                sortOrder: index,
              })),
            }
          : undefined,
      },
    });

  await entry({
    goalId: jordanReading.id,
    days: 63,
    score: 62,
    authorId: educator.id,
    notes: "Cold probe on an informational passage about river habitats.",
    measurementType: "RATE",
    minutesDelivered: 30,
  });
  await entry({
    goalId: jordanReading.id,
    days: 49,
    score: 68,
    authorId: educator.id,
    notes: "Practiced phrasing with partner reading. Accuracy remained high.",
    measurementType: "RATE",
    minutesDelivered: 30,
  });
  await entry({
    goalId: jordanReading.id,
    days: 35,
    score: 74,
    authorId: educator.id,
    notes: "Used a whisper-phone for self-monitoring. Jaime named two new vocabulary words after reading.",
    measurementType: "RATE",
    minutesDelivered: 30,
    accommodations: "Whisper-phone",
  });
  await entry({
    goalId: jordanReading.id,
    days: 21,
    score: 79,
    authorId: educator.id,
    notes: "Sustained a smooth pace through a 90-word passage.",
    measurementType: "RATE",
    minutesDelivered: 30,
  });
  await entry({
    goalId: jordanReading.id,
    days: 7,
    score: 84,
    authorId: educator.id,
    notes: "Weekly probe: 84 WCPM, 99% accuracy. Jaime reread one sentence independently to keep meaning.",
    measurementType: "RATE",
    evidenceLabel: "Fluency probe 8/21 (on file)",
    minutesDelivered: 30,
    homeCarryover: "Read a short nonfiction paragraph aloud once this weekend, then retell one fact.",
  });

  await entry({
    goalId: jordanAdvocacy.id,
    days: 42,
    score: 20,
    authorId: speech.id,
    notes: "Modeled a break request during centers. Jaime used the phrase with a prompt.",
    minutesDelivered: 30,
    setting: "PULL_OUT",
    trials: [
      { result: "PROMPTED", promptLevel: "MODEL" },
      { result: "INCORRECT" },
      { result: "PROMPTED", promptLevel: "VERBAL" },
      { result: "INCORRECT" },
      { result: "INCORRECT" },
    ],
  });
  await entry({
    goalId: jordanAdvocacy.id,
    days: 28,
    score: 40,
    authorId: speech.id,
    notes: "Visual cue card faded after the first opportunity.",
    minutesDelivered: 30,
    setting: "PULL_OUT",
    trials: [
      { result: "INDEPENDENT" },
      { result: "PROMPTED", promptLevel: "GESTURE" },
      { result: "INCORRECT" },
      { result: "PROMPTED", promptLevel: "VERBAL" },
      { result: "INCORRECT" },
    ],
  });
  await entry({
    goalId: jordanAdvocacy.id,
    days: 14,
    score: 60,
    authorId: speech.id,
    notes: "Jaime asked for a repeat during science without a prompt in 3 of 5 chances.",
    minutesDelivered: 30,
    setting: "CLASSROOM",
    trials: [
      { result: "INDEPENDENT" },
      { result: "INDEPENDENT" },
      { result: "INDEPENDENT" },
      { result: "PROMPTED", promptLevel: "GESTURE" },
      { result: "INCORRECT" },
    ],
  });
  await entry({
    goalId: jordanAdvocacy.id,
    days: 4,
    score: 80,
    authorId: speech.id,
    notes: "Independent requests in 4 of 5 opportunities during book clubs.",
    evidenceLabel: "Session note 8/24",
    minutesDelivered: 30,
    setting: "CLASSROOM",
    homeCarryover: "Practice the same phrase at home before homework: “Can you say that again?”",
    trials: [
      { result: "INDEPENDENT" },
      { result: "INDEPENDENT" },
      { result: "INDEPENDENT" },
      { result: "INDEPENDENT" },
      { result: "PROMPTED", promptLevel: "GESTURE" },
    ],
  });

  await entry({
    goalId: samHandwriting.id,
    days: 40,
    score: 40,
    authorId: ot.id,
    notes: "Practiced start-point dots for S and R with a short pencil.",
    minutesDelivered: 30,
    setting: "PULL_OUT",
  });
  await entry({
    goalId: samHandwriting.id,
    days: 26,
    score: 50,
    authorId: ot.id,
    notes: "Used a highlighted writing strip. Name letters improved in size.",
    minutesDelivered: 30,
    setting: "PULL_OUT",
    accommodations: "Highlighted writing strip",
  });
  await entry({
    goalId: samHandwriting.id,
    days: 19,
    score: 48,
    authorId: ot.id,
    notes: "Inconsistent starting points when the visual model was removed early.",
    minutesDelivered: 30,
    setting: "PULL_OUT",
    conditionTag: "WITHOUT_EXTRA_SUPPORTS",
  });
  await entry({
    goalId: samHandwriting.id,
    days: 12,
    score: 55,
    authorId: ot.id,
    notes: "Fatigue after 6 minutes. Ended with a preferred fine-motor warm-up.",
    minutesDelivered: 30,
    setting: "PULL_OUT",
  });

  await entry({
    goalId: samTransitions.id,
    days: 30,
    score: 40,
    authorId: educator.id,
    notes: "Visual schedule introduced at morning arrival.",
    minutesDelivered: 10,
    accommodations: "Two-step visual schedule",
  });
  await entry({
    goalId: samTransitions.id,
    days: 16,
    score: 60,
    authorId: educator.id,
    notes: "Transitioned to specials within 2 minutes on 3 of 5 days.",
    minutesDelivered: 10,
  });
  await entry({
    goalId: samTransitions.id,
    days: 5,
    score: 80,
    authorId: educator.id,
    notes: "Met the 2-minute target on 4 of 5 days this week.",
    minutesDelivered: 10,
    homeCarryover: "Use the same two pictures for the after-school backpack routine.",
  });

  await entry({
    goalId: averyDiscussion.id,
    days: 70,
    score: 25,
    authorId: speech.id,
    notes: "Used a sentence starter card during social studies.",
    minutesDelivered: 45,
    setting: "CLASSROOM",
  });
  await entry({
    goalId: averyDiscussion.id,
    days: 50,
    score: 40,
    authorId: speech.id,
    notes: "Contributed one on-topic question after a peer model.",
    minutesDelivered: 45,
  });
  await entry({
    goalId: averyDiscussion.id,
    days: 28,
    score: 50,
    authorId: speech.id,
    notes: "Two complete sentences in a four-student discussion.",
    minutesDelivered: 45,
    setting: "GROUP",
    conditionTag: "SMALL_GROUP",
  });
  await entry({
    goalId: averyDiscussion.id,
    days: 9,
    score: 0,
    authorId: speech.id,
    notes: "Andrea was absent; makeup scheduled for next week.",
    sessionOutcome: "ABSENT",
    minutesDelivered: 0,
  });
  await entry({
    goalId: averyDiscussion.id,
    days: 2,
    score: 75,
    authorId: speech.id,
    notes: "Makeup session completed. Met the sample target with a comment and a follow-up question.",
    minutesDelivered: 45,
    sessionOutcome: "PRESENT",
    setting: "PULL_OUT",
  });

  await entry({
    goalId: caseyDirections.id,
    days: 12,
    score: 40,
    authorId: educator.id,
    notes: "Arrival jobs with a gesture prompt.",
    minutesDelivered: 15,
    trials: [
      { result: "PROMPTED", promptLevel: "GESTURE" },
      { result: "INCORRECT" },
      { result: "PROMPTED", promptLevel: "GESTURE" },
      { result: "INDEPENDENT" },
      { result: "INCORRECT" },
    ],
  });
  await entry({
    goalId: caseyDirections.id,
    days: 3,
    score: 60,
    authorId: educator.id,
    notes: "Started the job after one direction in 3 of 5 chances.",
    minutesDelivered: 15,
    trials: [
      { result: "INDEPENDENT" },
      { result: "INDEPENDENT" },
      { result: "PROMPTED", promptLevel: "GESTURE" },
      { result: "INDEPENDENT" },
      { result: "INCORRECT" },
    ],
  });

  await prisma.goalPeriodStatement.createMany({
    data: [
      {
        goalId: jordanReading.id,
        periodId: q4.id,
        progressCode: "SUFFICIENT",
        narrative:
          "Jaime moved from 62 to the mid-70s WCPM last quarter. Accuracy stayed high. We will keep weekly probes and partner reading.",
        authorId: educator.id,
      },
      {
        goalId: jordanReading.id,
        periodId: q1.id,
        progressCode: "SUFFICIENT",
        narrative:
          "This quarter Jaime is reading 84 WCPM on informational probes. The annual target is 90 WCPM across three consecutive probes. Next we will keep the whisper-phone available, then fade it.",
        authorId: educator.id,
      },
      {
        goalId: jordanAdvocacy.id,
        periodId: q1.id,
        progressCode: "SUFFICIENT",
        narrative:
          "Jaime used a practiced request independently in 4 of 5 book-club chances. We are fading the cue card. Please keep practicing the phrase at home before homework.",
        authorId: speech.id,
      },
      {
        goalId: samHandwriting.id,
        periodId: q1.id,
        progressCode: "INSUFFICIENT",
        narrative:
          "Samuel’s name writing is more consistent with the highlighted strip, but size still drops when the model is removed. We have not yet seen three consecutive sessions at the target.",
        authorId: ot.id,
      },
      {
        goalId: caseyDirections.id,
        periodId: q1.id,
        progressCode: "SUFFICIENT",
        narrative:
          "Carla is beginning more classroom jobs after one direction, especially with a small gesture. We will keep the visual schedule at arrival.",
        authorId: educator.id,
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        studentId: jordan.id,
        fromUserId: educator.id,
        visibility: "FAMILY",
        body: "Jaime used a break request independently during book clubs today. We will keep the cue card nearby next week, then fade it.",
        createdAt: daysAgo(4),
      },
      {
        studentId: jordan.id,
        fromUserId: parentJaime.id,
        visibility: "FAMILY",
        body: "Thank you for the update. Jaime practiced the same phrase at home before homework.",
        createdAt: daysAgo(3),
      },
      {
        studentId: jordan.id,
        fromUserId: speech.id,
        visibility: "STAFF",
        body: "For the annual review packet: keep the cue card in the data, but note it was faded after the first opportunity this week.",
        createdAt: daysAgo(2),
      },
      {
        studentId: casey.id,
        fromUserId: educator.id,
        visibility: "FAMILY",
        body: "Carla started the morning job after one direction three times today. A small point to the picture still helps on the first try.",
        createdAt: daysAgo(1),
      },
      {
        studentId: sam.id,
        fromUserId: ot.id,
        visibility: "FAMILY",
        body: "Samuel’s name writing is more consistent with the highlighted strip. We will try a shorter pencil next session.",
        createdAt: daysAgo(2),
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: educator.id,
      action: "seed.demo",
      resourceType: "organization",
      resourceId: org.id,
      details: "Loaded fictional demonstration records. Not real student data.",
    },
  });

  void rileyMath;
  void q4;

  return { seeded: true };
}
