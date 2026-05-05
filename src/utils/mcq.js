// ─── MCQ Parser ──────────────────────────────────────────────────────────────
// Expected JSON format in repo:
//
// {
//   "title": "Polity - Fundamental Rights",
//   "questions": [
//     {
//       "id": 1,
//       "q": "Which article abolishes untouchability?",
//       "options": ["Art 14", "Art 15", "Art 17", "Art 21"],
//       "answer": 2,          // 0-indexed
//       "explanation": "Optional explanation text"
//     }
//   ]
// }

export function parseMCQ(jsonText) {
  let data
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid JSON in MCQ file.')
  }

  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error('MCQ file must have a "questions" array.')
  }

  return {
    title: data.title || 'Untitled MCQ Set',
    questions: data.questions.map((q, i) => ({
      id: q.id ?? i + 1,
      q: q.q || q.question || '',
      options: q.options || [],
      answer: typeof q.answer === 'number' ? q.answer : parseInt(q.answer),
      explanation: q.explanation || ''
    }))
  }
}

export function scoreSession(questions, userAnswers) {
  let correct = 0
  let attempted = 0
  questions.forEach((q, i) => {
    if (userAnswers[i] !== undefined && userAnswers[i] !== null) {
      attempted++
      if (userAnswers[i] === q.answer) correct++
    }
  })
  return {
    total: questions.length,
    attempted,
    correct,
    wrong: attempted - correct,
    skipped: questions.length - attempted,
    percent: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  }
}
