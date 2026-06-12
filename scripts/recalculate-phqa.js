const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const MAIN_ASSESSMENT_AGE_CUTOFF = 18;

function calculateAge(birthday, targetDate = new Date()) {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const target = new Date(targetDate);

  return target.getFullYear() - birthDate.getFullYear();
}

function getPhqaRiskLevel(sum) {
  if (sum >= 0 && sum <= 4) return "Green";
  if (sum >= 5 && sum <= 9) return "Green-Low";
  if (sum >= 10 && sum <= 14) return "Yellow";
  if (sum >= 15 && sum <= 19) return "Orange";
  if (sum >= 20 && sum <= 27) return "Red";

  return "";
}

function getPhqaRiskText(sum) {
  if (sum >= 0 && sum <= 4) return "ไม่พบความเสี่ยง";
  if (sum >= 5 && sum <= 9) return "พบความเสี่ยงเล็กน้อย";
  if (sum >= 10 && sum <= 14) return "พบความเสี่ยงปานกลาง";
  if (sum >= 15 && sum <= 19) return "พบความเสี่ยงมาก";
  if (sum >= 20 && sum <= 27) return "พบความเสี่ยงรุนแรง";

  return "";
}

function getNineQRiskLevel(sum) {
  if (sum < 7) return "Green";
  if (sum <= 12) return "Yellow";
  if (sum <= 18) return "Orange";

  return "Red";
}

function getNineQRiskText(sum) {
  if (sum < 7)
    return "ไม่มีอาการของโรคซึมเศร้าหรือมีอาการของโรคซึมเศร้าระดับน้อยมาก";
  if (sum <= 12) return "มีอาการของโรคซึมเศร้า ระดับน้อย";
  if (sum <= 18) return "มีอาการของโรคซึมเศร้า ระดับปานกลาง";

  return "มีอาการของโรคซึมเศร้า ระดับรุนแรง";
}

function getMainAssessmentScaleFromAge(age) {
  return age < MAIN_ASSESSMENT_AGE_CUTOFF ? "PHQA" : "9Q";
}

function calculateMainAssessmentResult(sum, scale) {
  const result =
    scale === "9Q" ? getNineQRiskLevel(sum) : getPhqaRiskLevel(sum);
  const result_text =
    scale === "9Q" ? getNineQRiskText(sum) : getPhqaRiskText(sum);

  return { result, result_text };
}

function calculateSum(row) {
  return (
    row.q1 +
    row.q2 +
    row.q3 +
    row.q4 +
    row.q5 +
    row.q6 +
    row.q7 +
    row.q8 +
    row.q9
  );
}

function detectAssessmentMismatch(age, hasQ9Row, hasPhqaAddon) {
  if (age === null) return "missing_age";

  const expectedScale = getMainAssessmentScaleFromAge(age);
  const hasWrongScale =
    (expectedScale === "PHQA" && hasQ9Row) ||
    (expectedScale === "9Q" && !hasQ9Row);

  if (hasWrongScale) return "wrong_scale_for_age";
  if (expectedScale === "PHQA" && !hasPhqaAddon) return "missing_addon";

  return "ok";
}

async function recalculateAllPHQA() {
  console.log("🚀 เริ่มต้นการ Re-calculate PHQ-A / 9Q ตามอายุ...\n");

  try {
    const allQuestions = await prisma.questions_Master.findMany({
      include: {
        phqa: true,
        q9: true,
        addon: true,
        profile: {
          include: {
            school: { select: { screeningDate: true } },
          },
        },
      },
      where: {
        phqa: {
          some: {},
        },
      },
    });

    console.log(`📊 พบข้อมูลทั้งหมด: ${allQuestions.length} รายการ\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const mismatches = [];
    const mismatchSummary = {
      wrongScale: 0,
      missingAddon: 0,
      missingAge: 0,
    };

    const beforeStats = await prisma.questions_Master.groupBy({
      by: ["result"],
      where: {
        phqa: {
          some: {},
        },
      },
      _count: {
        result: true,
      },
    });

    console.log("📈 สถิติก่อนการประมวลผล:");
    beforeStats.forEach((stat) => {
      console.log(`   ${stat.result}: ${stat._count.result} รายการ`);
    });
    console.log("");

    for (let i = 0; i < allQuestions.length; i++) {
      const question = allQuestions[i];

      try {
        if (!question.phqa || question.phqa.length === 0) continue;

        const hasQ9Row =
          Array.isArray(question.q9) && question.q9.length > 0;
        const hasPhqaAddon =
          Array.isArray(question.addon) && question.addon.length > 0;
        const sourceData = hasQ9Row ? question.q9[0] : question.phqa[0];

        const age = calculateAge(
          question.profile?.birthday,
          question.profile?.school?.screeningDate ?? question.createdAt
        );

        const issue = detectAssessmentMismatch(
          age,
          hasQ9Row,
          hasPhqaAddon
        );

        if (issue === "wrong_scale_for_age") mismatchSummary.wrongScale += 1;
        if (issue === "missing_addon") mismatchSummary.missingAddon += 1;
        if (issue === "missing_age") mismatchSummary.missingAge += 1;

        const newSum = calculateSum(sourceData);
        const scale =
          age !== null
            ? getMainAssessmentScaleFromAge(age)
            : hasQ9Row
              ? "9Q"
              : "PHQA";
        const { result, result_text } = calculateMainAssessmentResult(
          newSum,
          scale
        );

        if (issue !== "ok") {
          mismatches.push({
            questionId: question.id,
            profileId: question.profileId,
            age,
            issue,
            previousResult: question.result,
            newResult: result,
          });
        }

        await prisma.$transaction([
          prisma.questions_PHQA.updateMany({
            where: {
              questions_MasterId: question.id,
            },
            data: {
              sum: newSum,
            },
          }),
          ...(hasQ9Row
            ? [
                prisma.questions_9Q.updateMany({
                  where: {
                    questions_MasterId: question.id,
                  },
                  data: {
                    sum: newSum,
                  },
                }),
              ]
            : []),
          prisma.questions_Master.update({
            where: {
              id: question.id,
            },
            data: {
              result,
              result_text,
            },
          }),
        ]);

        successCount++;

        if ((i + 1) % 10 === 0 || i === allQuestions.length - 1) {
          const progress = Math.round(((i + 1) / allQuestions.length) * 100);

          console.log(
            `⏳ ความคืบหน้า: ${progress}% (${i + 1}/${allQuestions.length})`
          );
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `Error processing question ${question.id}: ${error.message}`;

        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\n✅ การประมวลผลเสร็จสิ้น!\n");
    console.log("📊 สรุปผลการประมวลผล:");
    console.log(`   ทั้งหมด: ${allQuestions.length} รายการ`);
    console.log(`   สำเร็จ: ${successCount} รายการ`);
    console.log(`   ผิดพลาด: ${errorCount} รายการ`);
    console.log(
      `   ชุดแบบไม่ตรงอายุ: ${mismatchSummary.wrongScale} | ขาด Addon: ${mismatchSummary.missingAddon} | ไม่มีวันเกิด: ${mismatchSummary.missingAge}\n`
    );

    const afterStats = await prisma.questions_Master.groupBy({
      by: ["result"],
      where: {
        phqa: {
          some: {},
        },
      },
      _count: {
        result: true,
      },
    });

    console.log("📈 สถิติหลังการประมวลผล:");
    afterStats.forEach((stat) => {
      console.log(`   ${stat.result}: ${stat._count.result} รายการ`);
    });

    if (mismatches.length > 0) {
      console.log("\n⚠️  รายการโครงสร้างไม่ตรงอายุ (ตัวอย่าง 10 รายการแรก):");
      mismatches.slice(0, 10).forEach((m, index) => {
        console.log(
          `   ${index + 1}. ${m.questionId} | อายุ ${m.age ?? "—"} | ${m.issue} | ${m.previousResult} → ${m.newResult}`
        );
      });
      if (mismatches.length > 10) {
        console.log(`   ... และอีก ${mismatches.length - 10} รายการ`);
      }
    }

    if (errors.length > 0) {
      console.log("\n❌ รายการข้อผิดพลาด:");
      errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... และอีก ${errors.length - 10} รายการ`);
      }
    }
  } catch (error) {
    console.error("💥 เกิดข้อผิดพลาดในการประมวลผล:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showStats() {
  try {
    const totalQuestions = await prisma.questions_Master.count({
      where: {
        phqa: {
          some: {},
        },
      },
    });

    const resultStats = await prisma.questions_Master.groupBy({
      by: ["result"],
      where: {
        phqa: {
          some: {},
        },
      },
      _count: {
        result: true,
      },
    });

    console.log("📊 สถิติผลการประเมิน PHQ-A / 9Q:");
    console.log(`   จำนวนแบบประเมินทั้งหมด: ${totalQuestions} รายการ\n`);

    resultStats.forEach((stat) => {
      const percentage = ((stat._count.result / totalQuestions) * 100).toFixed(
        1
      );

      console.log(
        `   ${stat.result}: ${stat._count.result} รายการ (${percentage}%)`
      );
    });
  } catch (error) {
    console.error("💥 เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ:", error);
  } finally {
    await prisma.$disconnect();
  }
}

const args = process.argv.slice(2);
const command = args[0];

if (command === "stats") {
  showStats();
} else if (command === "recalculate" || !command) {
  recalculateAllPHQA();
} else {
  console.log("❓ คำสั่งที่ไม่รู้จัก");
  console.log("   node scripts/recalculate-phqa.js [command]");
  console.log("");
  console.log("Commands:");
  console.log(
    "   recalculate  - Re-calculate PHQ-A / 9Q results ตามอายุ (default)"
  );
  console.log("   stats        - แสดงสถิติเท่านั้น");
  process.exit(1);
}
