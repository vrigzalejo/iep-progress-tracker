import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEMO_PASSPHRASE, PRIVACY_NOTICE_VERSION } from "@/lib/constants";

function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

function daysAgo(days: number) {
  return daysFromNow(-days);
}

export async function seedDemoData() {
  const existing = await prisma.user.count();
  if (existing > 0) return { seeded: false };

  const passwordHash = await hash(DEMO_PASSPHRASE, 12);

  const org = await prisma.organization.create({
    data: {
      name: "Maple Ridge Demonstration School",
      retentionDays: 2555,
      noticeVersion: PRIVACY_NOTICE_VERSION,
    },
  });

  await prisma.user.create({
    data: {
      email: "chris.okonkwo@demo.progresspath.school",
      name: "Chris Okonkwo",
      title: "Director of Special Education",
      role: "ADMINISTRATOR",
      passwordHash,
      organizationId: org.id,
    },
  });

  const educator = await prisma.user.create({
    data: {
      email: "maya.ellis@demo.progresspath.school",
      name: "Maya Ellis",
      title: "Special education teacher",
      role: "EDUCATOR",
      passwordHash,
      organizationId: org.id,
    },
  });

  const speech = await prisma.user.create({
    data: {
      email: "priya.shah@demo.progresspath.school",
      name: "Priya Shah",
      title: "Speech-language pathologist",
      role: "PROVIDER",
      passwordHash,
      organizationId: org.id,
    },
  });

  const ot = await prisma.user.create({
    data: {
      email: "luis.navarro@demo.progresspath.school",
      name: "Luis Navarro",
      title: "Occupational therapist",
      role: "PROVIDER",
      passwordHash,
      organizationId: org.id,
    },
  });

  const parentJordan = await prisma.user.create({
    data: {
      email: "dana.hale@demo.progresspath.school",
      name: "Dana Hale",
      title: "Parent / guardian",
      role: "PARENT",
      passwordHash,
      organizationId: org.id,
    },
  });

  const parentSam = await prisma.user.create({
    data: {
      email: "alex.rivera@demo.progresspath.school",
      name: "Alex Rivera",
      title: "Parent / guardian",
      role: "PARENT",
      passwordHash,
      organizationId: org.id,
    },
  });

  const jordan = await prisma.student.create({
    data: {
      preferredName: "Jordan Hale",
      grade: "4",
      school: "Maple Ridge Elementary",
      caseManagerId: educator.id,
      organizationId: org.id,
      providers: {
        create: [
          { userId: speech.id, serviceArea: "SPEECH_LANGUAGE" },
          { userId: educator.id, serviceArea: "ACADEMIC" },
        ],
      },
      guardians: {
        create: [
          {
            name: "Dana Hale",
            relationship: "Parent",
            email: "dana.hale@demo.progresspath.school",
            phone: "555-0142",
            userId: parentJordan.id,
          },
        ],
      },
      consents: {
        create: {
          guardianName: "Dana Hale",
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(40),
        },
      },
    },
  });

  const sam = await prisma.student.create({
    data: {
      preferredName: "Sam Rivera",
      grade: "2",
      school: "Maple Ridge Elementary",
      caseManagerId: educator.id,
      organizationId: org.id,
      providers: {
        create: [
          { userId: ot.id, serviceArea: "OCCUPATIONAL_THERAPY" },
          { userId: educator.id, serviceArea: "ADAPTIVE" },
        ],
      },
      guardians: {
        create: [
          {
            name: "Alex Rivera",
            relationship: "Parent",
            email: "alex.rivera@demo.progresspath.school",
            phone: "555-0188",
            userId: parentSam.id,
          },
        ],
      },
      consents: {
        create: {
          guardianName: "Alex Rivera",
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(28),
        },
      },
    },
  });

  const avery = await prisma.student.create({
    data: {
      preferredName: "Avery Chen",
      grade: "6",
      school: "Cedar Grove Middle School",
      caseManagerId: educator.id,
      organizationId: org.id,
      providers: {
        create: [{ userId: speech.id, serviceArea: "SPEECH_LANGUAGE" }],
      },
      guardians: {
        create: [
          {
            name: "Morgan Chen",
            relationship: "Parent",
            email: "morgan.chen@demo.progresspath.school",
            phone: "555-0160",
          },
        ],
      },
      consents: {
        create: {
          guardianName: "Morgan Chen",
          noticeVersion: PRIVACY_NOTICE_VERSION,
          grantedAt: daysAgo(60),
        },
      },
    },
  });

  const riley = await prisma.student.create({
    data: {
      preferredName: "Riley Brooks",
      grade: "3",
      school: "Maple Ridge Elementary",
      caseManagerId: educator.id,
      organizationId: org.id,
      providers: {
        create: [{ userId: educator.id, serviceArea: "ACADEMIC" }],
      },
      guardians: {
        create: [
          {
            name: "Taylor Brooks",
            relationship: "Guardian",
            email: "taylor.brooks@demo.progresspath.school",
          },
        ],
      },
    },
  });

  const jordanReading = await prisma.iepGoal.create({
    data: {
      studentId: jordan.id,
      officialWording:
        "Given a grade-level informational passage, Jordan will read 90 words correct per minute with at least 98% accuracy on 3 of 4 consecutive weekly probes.",
      plainLanguageSummary:
        "Jordan is practicing reading grade-level passages smoothly and accurately so that meaning stays clear.",
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
      createdById: educator.id,
    },
  });

  const jordanAdvocacy = await prisma.iepGoal.create({
    data: {
      studentId: jordan.id,
      officialWording:
        "During small-group instruction, Jordan will use a practiced phrase to request clarification or a break in 4 of 5 observed opportunities across two consecutive weeks.",
      plainLanguageSummary:
        "Jordan is practicing asking for a repeat, a slower pace, or a short break during group work.",
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
      createdById: educator.id,
    },
  });

  const samHandwriting = await prisma.iepGoal.create({
    data: {
      studentId: sam.id,
      officialWording:
        "Given lined paper and a visual model, Sam will write 4 of 5 first-name letters with correct start point and size in 3 consecutive occupational therapy sessions.",
      plainLanguageSummary:
        "Sam is practicing writing the letters in their first name with a comfortable grip and clear starting points.",
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
      createdById: educator.id,
    },
  });

  const samTransitions = await prisma.iepGoal.create({
    data: {
      studentId: sam.id,
      officialWording:
        "Given a two-step visual schedule, Sam will complete classroom transitions within 2 minutes of the cue on 4 of 5 consecutive school days.",
      plainLanguageSummary:
        "Sam is using a picture schedule to move from one classroom activity to the next with less wait time.",
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
      createdById: educator.id,
    },
  });

  const averyDiscussion = await prisma.iepGoal.create({
    data: {
      studentId: avery.id,
      officialWording:
        "In a structured classroom discussion, Avery will contribute an on-topic comment or question using a complete sentence in 3 of 4 weekly language samples.",
      plainLanguageSummary:
        "Avery is practicing joining class conversations with a full sentence that stays on the topic.",
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
      createdById: speech.id,
    },
  });

  const rileyMath = await prisma.iepGoal.create({
    data: {
      studentId: riley.id,
      officialWording:
        "Given a two-step word problem and a graphic organizer, Riley will identify the operation and compute the correct answer with 80% accuracy on 3 consecutive weekly probes.",
      plainLanguageSummary:
        "Riley is practicing two-step math stories with a graphic organizer to choose the operation and show the solution.",
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
      createdById: educator.id,
    },
  });

  const entry = async (
    goalId: string,
    days: number,
    score: number,
    authorId: string,
    notes: string,
    evidenceLabel?: string,
  ) =>
    prisma.progressEntry.create({
      data: {
        goalId,
        recordedAt: daysAgo(days),
        score,
        measurementType:
          goalId === jordanReading.id
            ? "RATE"
            : "PERCENT_ACCURACY",
        notes,
        evidenceLabel,
        authorId,
      },
    });

  await entry(jordanReading.id, 63, 62, educator.id, "Cold probe on an informational passage about river habitats.");
  await entry(jordanReading.id, 49, 68, educator.id, "Practiced phrasing with partner reading. Accuracy remained high.");
  await entry(jordanReading.id, 35, 74, educator.id, "Used a whisper-phone for self-monitoring. Jordan named two new vocabulary words after reading.");
  await entry(jordanReading.id, 21, 79, educator.id, "Sustained a smooth pace through a 90-word passage.");
  await entry(
    jordanReading.id,
    7,
    84,
    educator.id,
    "Weekly probe: 84 WCPM, 99% accuracy. Jordan reread one sentence independently to keep meaning.",
    "Fluency probe 8/21 (on file)",
  );

  await entry(jordanAdvocacy.id, 42, 20, speech.id, "Modeled a break request during centers. Jordan used the phrase with a prompt.");
  await entry(jordanAdvocacy.id, 28, 40, speech.id, "Visual cue card faded after the first opportunity.");
  await entry(jordanAdvocacy.id, 14, 60, speech.id, "Jordan asked for a repeat during science without a prompt in 3 of 5 chances.");
  await entry(
    jordanAdvocacy.id,
    4,
    80,
    speech.id,
    "Independent requests in 4 of 5 opportunities during book clubs.",
    "Session note 8/24",
  );

  await entry(samHandwriting.id, 40, 40, ot.id, "Practiced start-point dots for S and R with a short pencil.");
  await entry(samHandwriting.id, 26, 50, ot.id, "Used a highlighted writing strip. Name letters improved in size.");
  await entry(samHandwriting.id, 12, 55, ot.id, "Fatigue after 6 minutes. Ended with a preferred fine-motor warm-up.");
  await entry(samHandwriting.id, 19, 48, ot.id, "Inconsistent starting points when the visual model was removed early.");

  await entry(samTransitions.id, 30, 40, educator.id, "Visual schedule introduced at morning arrival.");
  await entry(samTransitions.id, 16, 60, educator.id, "Transitioned to specials within 2 minutes on 3 of 5 days.");
  await entry(samTransitions.id, 5, 80, educator.id, "Met the 2-minute target on 4 of 5 days this week.");

  await entry(averyDiscussion.id, 70, 25, speech.id, "Used a sentence starter card during social studies.");
  await entry(averyDiscussion.id, 50, 40, speech.id, "Contributed one on-topic question after a peer model.");
  await entry(averyDiscussion.id, 28, 50, speech.id, "Two complete sentences in a four-student discussion.");
  await entry(averyDiscussion.id, 9, 75, speech.id, "Met the sample target this week with a comment and a follow-up question.");

  await prisma.message.createMany({
    data: [
      {
        studentId: jordan.id,
        fromUserId: educator.id,
        body: "Jordan used a break request independently during book clubs today. We will keep the cue card nearby next week, then fade it.",
        createdAt: daysAgo(4),
      },
      {
        studentId: jordan.id,
        fromUserId: parentJordan.id,
        body: "Thank you for the update. Jordan practiced the same phrase at home before homework.",
        createdAt: daysAgo(3),
      },
      {
        studentId: sam.id,
        fromUserId: ot.id,
        body: "Sam’s name writing is more consistent with the highlighted strip. We will try a shorter pencil next session.",
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

  return { seeded: true };
}
