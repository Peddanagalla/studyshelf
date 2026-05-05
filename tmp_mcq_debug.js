const normalizeLine = line => line.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
const countMatches = (text, regex) => (text.match(regex) || []).length

function splitParagraphColumns(paragraph) {
  const lines = paragraph
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(line => line.length > 0)

  const questionColumns = Math.max(...lines.map(line => countMatches(line, /\d+\.\s/g)), 1)
  const optionColumns = Math.max(...lines.map(line => countMatches(line, /\([A-Ea-e]\)\s/g)), 1)
  const columnCount = Math.max(questionColumns, optionColumns)
  if (columnCount <= 1) return paragraph

  const columns = Array.from({ length: columnCount }, () => [])

  for (const line of lines) {
    let segments = [line]

    if (countMatches(line, /\d+\.\s/g) > 1) {
      segments = line.split(/(?=\d+\.\s)/g).map(normalizeLine).filter(Boolean)
    } else if (countMatches(line, /\([A-Ea-e]\)\s/g) > 1) {
      segments = line.split(/(?=\([A-Ea-e]\)\s)/g).map(normalizeLine).filter(Boolean)
    } else if (columnCount > 1) {
      const fallback = line.split(/(?<=[?!.])\s+(?=[A-Za-z]+)/g).map(normalizeLine).filter(Boolean)
      if (fallback.length === columnCount) {
        segments = fallback
      }
    }

    console.log('LINE:', line)
    console.log('SEGMENTS:', segments)

    if (segments.length === columnCount) {
      segments.forEach((segment, index) => columns[index].push(segment))
    } else if (segments.length === 1) {
      columns[0].push(segments[0])
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
  console.log('COLUMNS:', columns)

  return columns.map(col => col.join('\n')).join('\n\n')
}

function normalizeMultiColumnText(text) {
  return text
    .split(/\n\n+/)
    .map(splitParagraphColumns)
    .join('\n\n')
}

const sample = `1. Which Article of the Indian Constitution defines the 'State' 8. Which Article prohibits the conferment of titles except
for the purposes of Fundamental Rights? military or academic distinctions?

(A) Article 11 (A) Article 17
(B) Article 12 (B) Article 18
(C) Article 13 (C) Article 19
(D) Article 14 (D) Article 20

2. Laws inconsistent with or in derogation of the
Fundamental Rights are declared void under which Article? 9. The 'Right to Freedom' under Article 19 currently
guarantees how many freedoms?

(A) Article 13 (A) Five
(B) Article 14 (B) Six
(C) Article 19 (C) Seven
(D) Article 32 (D) Eight
`

console.log('--- normalized ---')
console.log(normalizeMultiColumnText(sample))
