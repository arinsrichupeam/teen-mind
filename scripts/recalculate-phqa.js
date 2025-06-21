const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ฟังก์ชันคำนวณผลลัพธ์ PHQA
function calculateResult(phqa_sum, phqa_data) {
  let result = "";
  let result_text = "";

  if (phqa_data.q9 > 0) {
    result = "Red";
    result_text = "พบความเสี่ยง";
  } else {
    if (phqa_sum > 14) {
      if (phqa_sum >= 15 && phqa_sum <= 19) {
        result = "Orange";
        result_text = "พบความเสี่ยงมาก";
      } else if (phqa_sum >= 20 && phqa_sum <= 27) {
        result = "Red";
        result_text = "พบความเสี่ยงรุนแรง";
      }
    } else if (phqa_sum > 9) {
      if (phqa_data.q9 > 0) {
        result = "Red";
        result_text = "พบความเสี่ยง";
      } else {
        result = "Yellow";
        result_text = "พบความเสี่ยงปานกลาง";
      }
    } else {
      if (phqa_sum >= 0 && phqa_sum <= 4) {
        result = "Green";
        result_text = "ไม่พบความเสี่ยง";
      } else if (phqa_sum >= 5 && phqa_sum <= 9) {
        result = "Green-Low";
        result_text = "พบความเสี่ยงเล็กน้อย";
      }
    }
  }

  return { result, result_text };
}

// ฟังก์ชันคำนวณ sum ของ PHQA
function calculateSum(phqa_data) {
  return phqa_data.q1 + phqa_data.q2 + phqa_data.q3 + phqa_data.q4 + 
         phqa_data.q5 + phqa_data.q6 + phqa_data.q7 + phqa_data.q8 + phqa_data.q9;
}

async function recalculateAllPHQA() {
  console.log('🚀 เริ่มต้นการ Re-calculate PHQA Results...\n');

  try {
    // ดึงข้อมูลทั้งหมดที่มี PHQA
    const allQuestions = await prisma.questions_Master.findMany({
      include: {
        phqa: true,
      },
      where: {
        phqa: {
          some: {}
        }
      }
    });

    console.log(`📊 พบข้อมูลทั้งหมด: ${allQuestions.length} รายการ\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // แสดงสถิติก่อนการประมวลผล
    const beforeStats = await prisma.questions_Master.groupBy({
      by: ['result'],
      where: {
        phqa: {
          some: {}
        }
      },
      _count: {
        result: true
      }
    });

    console.log('📈 สถิติก่อนการประมวลผล:');
    beforeStats.forEach(stat => {
      console.log(`   ${stat.result}: ${stat._count.result} รายการ`);
    });
    console.log('');

    // ประมวลผลแต่ละรายการ
    for (let i = 0; i < allQuestions.length; i++) {
      const question = allQuestions[i];
      
      try {
        if (question.phqa && question.phqa.length > 0) {
          const phqaData = question.phqa[0];
          
          // คำนวณ sum ใหม่
          const newSum = calculateSum(phqaData);
          
          // คำนวณผลลัพธ์ใหม่
          const { result, result_text } = calculateResult(newSum, phqaData);

          // อัปเดตข้อมูลในฐานข้อมูล
          await prisma.$transaction([
            // อัปเดต sum ใน PHQA
            prisma.questions_PHQA.updateMany({
              where: {
                questions_MasterId: question.id,
              },
              data: {
                sum: newSum,
              },
            }),
            // อัปเดต result และ result_text ใน Questions_Master
            prisma.questions_Master.update({
              where: {
                id: question.id,
              },
              data: {
                result: result,
                result_text: result_text,
              },
            }),
          ]);

          successCount++;
          
          // แสดงความคืบหน้า
          if ((i + 1) % 10 === 0 || i === allQuestions.length - 1) {
            const progress = Math.round(((i + 1) / allQuestions.length) * 100);
            console.log(`⏳ ความคืบหน้า: ${progress}% (${i + 1}/${allQuestions.length})`);
          }
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `Error processing question ${question.id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('\n✅ การประมวลผลเสร็จสิ้น!\n');

    // แสดงสถิติหลังการประมวลผล
    const afterStats = await prisma.questions_Master.groupBy({
      by: ['result'],
      where: {
        phqa: {
          some: {}
        }
      },
      _count: {
        result: true
      }
    });

    console.log('📊 สรุปผลการประมวลผล:');
    console.log(`   ทั้งหมด: ${allQuestions.length} รายการ`);
    console.log(`   สำเร็จ: ${successCount} รายการ`);
    console.log(`   ผิดพลาด: ${errorCount} รายการ\n`);

    console.log('📈 สถิติหลังการประมวลผล:');
    afterStats.forEach(stat => {
      console.log(`   ${stat.result}: ${stat._count.result} รายการ`);
    });

    if (errors.length > 0) {
      console.log('\n❌ รายการข้อผิดพลาด:');
      errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... และอีก ${errors.length - 10} รายการ`);
      }
    }

  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการประมวลผล:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ฟังก์ชันสำหรับดูสถิติเท่านั้น
async function showStats() {
  try {
    const totalQuestions = await prisma.questions_Master.count({
      where: {
        phqa: {
          some: {}
        }
      }
    });

    const resultStats = await prisma.questions_Master.groupBy({
      by: ['result'],
      where: {
        phqa: {
          some: {}
        }
      },
      _count: {
        result: true
      }
    });

    console.log('📊 สถิติ PHQA Results:');
    console.log(`   จำนวนแบบสอบถามทั้งหมด: ${totalQuestions} รายการ\n`);
    
    resultStats.forEach(stat => {
      const percentage = ((stat._count.result / totalQuestions) * 100).toFixed(1);
      console.log(`   ${stat.result}: ${stat._count.result} รายการ (${percentage}%)`);
    });

  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ตรวจสอบ argument จาก command line
const args = process.argv.slice(2);
const command = args[0];

if (command === 'stats') {
  showStats();
} else if (command === 'recalculate' || !command) {
  recalculateAllPHQA();
} else {
  console.log('❓ คำสั่งที่ไม่รู้จัก');
  console.log('   node scripts/recalculate-phqa.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('   recalculate  - Re-calculate PHQA results ทั้งหมด (default)');
  console.log('   stats        - แสดงสถิติเท่านั้น');
  process.exit(1);
} 