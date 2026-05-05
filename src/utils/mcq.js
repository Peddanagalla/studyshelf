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

function normalizeLine(line) {
  return line
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeOptionText(text) {
  return text.replace(/^\s*[\(\[]?(?:[A-Ea-e]|[0-9]+)[\)\].:-]?\s*/u, '').trim()
}

function parseAnswerLine(line) {
  const m = line.match(/(?:Answer|Ans|Solution|Correct)\s*[:\-]?\s*([A-Ea-e]|[0-9]+)/i)
  if (!m) return null
  const choice = m[1].toUpperCase()
  if (/^[A-E]$/.test(choice)) return 'ABCDE'.indexOf(choice)
  const num = Number(choice)
  if (!Number.isNaN(num)) {
    if (num === 0) return 0
    return Math.max(0, num - 1)
  }
  return null
}

function countMatches(text, regex) {
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

function assignSegmentToColumn(columns, line) {
  const incompleteIndex = columns.findIndex(col => {
    if (col.length === 0) return false
    const lastLine = col[col.length - 1].trim()
    return !/[?.!]$/.test(lastLine)
  })
  return incompleteIndex >= 0 ? incompleteIndex : 0
}

function splitParagraphColumns(paragraph) {
  const lines = paragraph
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(line => line.length > 0)

  const questionColumns = Math.max(...lines.map(line => countMatches(line, /\d+\.\s/g)), 1)
  const optionColumns = Math.max(...lines.map(line => countMatches(line, /\([A-Ea-e]\)\s/g)), 1)
  const columnCount = Math.max(questionColumns, optionColumns)
  if (columnCount <= 1) return [paragraph.trim()]

  const columns = Array.from({ length: columnCount }, () => [])

  for (const line of lines) {
    let segments = [line]

    if (countMatches(line, /\d+\.\s/g) > 1) {
      segments = line
        .replace(/(?<!^)(?<!\n)(?=\d+\.\s)/g, '\n')
        .split(/\n/)
        .map(normalizeLine)
        .filter(Boolean)
    } else if (countMatches(line, /\([A-Ea-e]\)\s/g) > 1) {
      segments = line.split(/(?=\([A-Ea-e]\)\s)/g).map(normalizeLine).filter(Boolean)
    } else if (columnCount > 1) {
      const fallback = line.split(/(?<=[?!.])\s+(?=[A-Za-z]+)/g).map(normalizeLine).filter(Boolean)
      if (fallback.length === columnCount) {
        segments = fallback
      }
    }

    if (segments.length === columnCount) {
      segments.forEach((segment, index) => columns[index].push(segment))
    } else if (segments.length === 1) {
      const targetIndex = columnCount > 1 ? assignSegmentToColumn(columns, segments[0]) : 0
      columns[targetIndex].push(segments[0])
    } else {
      segments.forEach((segment, index) => {
        if (index < columns.length) {
          columns[index].push(segment)
        } else {
          columns[columns.length - 1].push(segment)
        }
      })
    }
  }

  return columns.map(col => col.join('\n').trim())
}

function normalizeMultiColumnText(text) {
  const paragraphs = text
    .split(/\n\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)

  const outputBlocks = []
  let currentGroup = null

  for (const paragraph of paragraphs) {
    const columns = splitParagraphColumns(paragraph)

    if (columns.length <= 1) {
      if (currentGroup) {
        outputBlocks.push(...currentGroup.columns)
        currentGroup = null
      }
      outputBlocks.push(columns[0])
      continue
    }

    if (!currentGroup || currentGroup.columnCount !== columns.length) {
      if (currentGroup) {
        outputBlocks.push(...currentGroup.columns)
      }
      currentGroup = {
        columnCount: columns.length,
        columns: columns.slice(),
      }
      continue
    }

    columns.forEach((column, index) => {
      currentGroup.columns[index] += '\n\n' + column
    })
  }

  if (currentGroup) {
    outputBlocks.push(...currentGroup.columns)
  }

  return outputBlocks.join('\n\n')
}

export function extractMCQsFromText(text, title = '') {
  const normalized = normalizeMultiColumnText(text)
  const lines = normalized
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(line => line.length > 0)

  const questions = []
  let current = null
  let mode = 'question'

  function flushCurrent() {
    if (!current) return
    const opts = current.options.filter(Boolean)
    if (current.q && opts.length >= 2) {
      questions.push({
        id: questions.length + 1,
        q: current.q,
        options: opts,
        answer: current.answer !== null ? current.answer : 0,
        explanation: current.explanation.trim(),
      })
    }
    current = null
    mode = 'question'
  }

  for (const rawLine of lines) {
    const subLines = rawLine.split(/(?<!^)(?=(?:\d+\.|\d+\)|Q\d+\.|Q\d+\))\s)/g).filter(Boolean)
    for (const toProcess of subLines) {
      const line = toProcess.trim()
      const questionMatch = line.match(/^\s*(?:\d+\.|\d+\)|Q\d+\.|Q\d+\))\s*(.*)$/i)
      const optionMatch = line.match(/^\s*[\(\[]?(?:[A-Ea-e]|[0-9]+)[\)\].:-]?\s*(.*)$/)
      const answerMatch = parseAnswerLine(line)
      const explanationMatch = line.match(/^(?:Explanation|Exp|Explain|Note|Hint)\s*[:\-]?\s*(.*)$/i)
      const isQuestionLike = !current && /\?$/.test(line) && /(?:what|which|who|when|where|why|how)/i.test(line)

    if (questionMatch || isQuestionLike) {
      if (current) flushCurrent()
      current = {
        q: normalizeLine(questionMatch ? questionMatch[1] : line),
        options: [],
        answer: null,
        explanation: '',
      }
      mode = 'question'
      continue
    }

    if (optionMatch && current) {
      current.options.push(normalizeOptionText(line))
      mode = 'options'
      continue
    }

    if (answerMatch !== null && current) {
      current.answer = answerMatch
      mode = 'answer'
      continue
    }

    if (explanationMatch && current) {
      current.explanation += `${explanationMatch[1].trim()} `
      mode = 'explanation'
      continue
    }

    if (current) {
      if (mode === 'question') {
        current.q += ' ' + line
      } else if (mode === 'options') {
        const lastIndex = current.options.length - 1
        if (lastIndex >= 0) {
          current.options[lastIndex] += ' ' + normalizeOptionText(line)
        }
      } else if (mode === 'answer') {
        const extraAnswer = parseAnswerLine(line)
        if (extraAnswer !== null && current.answer === null) current.answer = extraAnswer
      } else if (mode === 'explanation') {
        current.explanation += `${line} `
      }
    }
  }
}

  flushCurrent()

  if (questions.length === 0) {
    return {
      title: title || 'Extracted MCQs',
      questions: [],
    }
  }

  return {
    title: title || 'Extracted MCQs',
    questions,
  }
}
