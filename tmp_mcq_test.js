import { extractMCQsFromText } from './src/utils/mcq.js'

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

const result = extractMCQsFromText(sample, 'test')
console.log(JSON.stringify({count: result.questions.length, questions: result.questions.slice(0,3)}, null, 2))
