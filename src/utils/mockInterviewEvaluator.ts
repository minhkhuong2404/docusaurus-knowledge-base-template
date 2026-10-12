import { MockInterviewQuestion, CoreKeyPoint } from '../data/mockInterviewQuestionsData';

export interface EvaluatedPointResult {
  point: CoreKeyPoint;
  isMatched: boolean;
  matchedKeywords: string[];
}

export interface EvaluationResult {
  score: number; // 0 - 100
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT';
  gradeLabel: string;
  gradeBadgeColor: string;
  matchedPoints: EvaluatedPointResult[];
  missingPoints: EvaluatedPointResult[];
  feedbackSummary: string;
  wordCount: number;
  detectedConcepts: string[];
}

/**
 * Normalizes Vietnamese text by converting to lowercase, stripping punctuation,
 * and normalizing whitespace while preserving accented characters and technical terms.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>\[\]\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a specific keyword or phrase exists in the normalized text.
 * Handles both exact substring matches and word boundary matching.
 */
function containsKeyword(normalizedText: string, keyword: string): boolean {
  const normKw = normalizeText(keyword);
  if (!normKw) return false;
  return normalizedText.includes(normKw);
}

/**
 * Evaluates candidate's user answer against the CoreKeyPoints of the question.
 */
export function evaluateMockAnswer(
  userAnswer: string,
  question: MockInterviewQuestion
): EvaluationResult {
  const trimmed = (userAnswer || '').trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const normalizedAnswer = normalizeText(trimmed);

  // Check for empty or trivial answers (e.g., "em không biết", "chịu", "...", 3 words)
  const isTooShort = wordCount < 5 || normalizedAnswer.length < 20;
  const trivialPhrases = ['em khong biet', 'em không biết', 'khong biet', 'không biết', 'chua hoc', 'chưa học', 'chịu', 'bo tay', 'bó tay'];
  const isTrivial = trivialPhrases.some((phrase) => normalizedAnswer === phrase || normalizedAnswer.startsWith(phrase));

  if (!trimmed || isTooShort || isTrivial) {
    const allMissing: EvaluatedPointResult[] = question.coreKeyPoints.map((pt) => ({
      point: pt,
      isMatched: false,
      matchedKeywords: []
    }));

    return {
      score: trimmed.length > 0 ? 10 : 0,
      grade: 'NEEDS_IMPROVEMENT',
      gradeLabel: 'Chưa Đạt Yêu Cầu • Quá Ngắn',
      gradeBadgeColor: '#ef4444',
      matchedPoints: [],
      missingPoints: allMissing,
      feedbackSummary: 'Câu trả lời quá ngắn hoặc chưa nêu được các khái niệm kỹ thuật cốt lõi. Trong phỏng vấn thực tế, hãy tự tin trình bày định nghĩa, cơ chế hoạt động và ví dụ thực tế dù chưa nắm chắc 100%.',
      wordCount,
      detectedConcepts: []
    };
  }

  const matchedPoints: EvaluatedPointResult[] = [];
  const missingPoints: EvaluatedPointResult[] = [];
  const allDetectedKeywords = new Set<string>();

  let earnedWeight = 0;
  const totalWeight = question.coreKeyPoints.reduce((acc, pt) => acc + pt.weight, 0);

  // Evaluate each core key point
  question.coreKeyPoints.forEach((point) => {
    const matchedKws: string[] = [];

    point.keywords.forEach((kw) => {
      if (containsKeyword(normalizedAnswer, kw)) {
        matchedKws.push(kw);
        allDetectedKeywords.add(kw);
      }
    });

    if (matchedKws.length > 0) {
      matchedPoints.push({
        point,
        isMatched: true,
        matchedKeywords: matchedKws
      });
      earnedWeight += point.weight;
    } else {
      missingPoints.push({
        point,
        isMatched: false,
        matchedKeywords: []
      });
    }
  });

  // Calculate percentage based on weights
  let calculatedScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Bonus for thorough explanation (good length and structured presentation)
  if (calculatedScore > 0 && wordCount >= 60 && missingPoints.length <= 1) {
    calculatedScore = Math.min(100, calculatedScore + 5);
  }

  // Determine grade and label
  let grade: EvaluationResult['grade'] = 'NEEDS_IMPROVEMENT';
  let gradeLabel = 'Cần Bổ Sung Nhiều Ý Cốt Lõi';
  let gradeBadgeColor = '#ef4444';

  if (calculatedScore >= 85) {
    grade = 'EXCELLENT';
    gradeLabel = 'Xuất Sắc • Nắm Trọn Bản Chất';
    gradeBadgeColor = '#10b981';
  } else if (calculatedScore >= 65) {
    grade = 'GOOD';
    gradeLabel = 'Khá Tốt • Đạt Chuẩn Phỏng Vấn';
    gradeBadgeColor = '#3b82f6';
  } else if (calculatedScore >= 40) {
    grade = 'FAIR';
    gradeLabel = 'Tạm Ổn • Còn Thiếu Ý Quan Trọng';
    gradeBadgeColor = '#f59e0b';
  }

  // Generate personalized feedback
  let feedbackSummary = '';
  if (grade === 'EXCELLENT') {
    feedbackSummary = `Tuyệt vời! Bạn đã bao quát được ${matchedPoints.length}/${question.coreKeyPoints.length} đại ý cốt lõi với vốn thuật ngữ kỹ thuật rất chuẩn xác. Câu trả lời thể hiện tư duy hiểu sâu dưới nắp ca-pô, sẵn sàng gây ấn tượng mạnh với Tech Lead.`;
  } else if (grade === 'GOOD') {
    feedbackSummary = `Rất tốt! Bạn đã trả lời đúng hướng và nắm được ${matchedPoints.length}/${question.coreKeyPoints.length} ý chính. Để nâng tầm câu trả lời lên mức 10 điểm tuyệt đối, hãy bổ sung thêm các chi tiết kỹ thuật chuyên sâu được gợi ý bên dưới.`;
  } else if (grade === 'FAIR') {
    feedbackSummary = `Bạn đã chạm tới được một số từ khóa cơ bản (${matchedPoints.length}/${question.coreKeyPoints.length} ý), nhưng câu trả lời còn mang tính đại khái hoặc thiếu sót các luận điểm then chốt. Hãy đối chiếu với câu trả lời mẫu để củng cố kiến thức.`;
  } else {
    feedbackSummary = `Câu trả lời chưa đạt yêu cầu do bỏ sót hầu hết các ý chính quan trọng (${missingPoints.length}/${question.coreKeyPoints.length} ý chưa được nhắc tới). Hãy xem kỹ phần phân tích và câu trả lời mẫu của Senior Architect để ghi nhớ cho lần phỏng vấn tới.`;
  }

  return {
    score: calculatedScore,
    grade,
    gradeLabel,
    gradeBadgeColor,
    matchedPoints,
    missingPoints,
    feedbackSummary,
    wordCount,
    detectedConcepts: Array.from(allDetectedKeywords)
  };
}
