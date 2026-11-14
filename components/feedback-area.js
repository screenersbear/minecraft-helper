// Feedback area: "Did that answer it?" at the bottom of an answer.
// Yes! says thanks. Not really saves the question for the grown-ups list and offers other answers.
import { el } from './el.js';
import { blockButton, feedback } from './buttons.js';
import { logQuestion } from '../data/questions-log.js';
import { toHash } from '../logic/routes.js';

// question: what was asked (may be empty when the page was opened another way). answerName: what was shown.
export function feedbackArea(ctx, question, answerName) {
  const box = el('div', { class: 'bottom' });
  const yes = () => {
    box.replaceChildren(
      el('p', { class: 'feedback-q', role: 'status' }, 'Great! Ask me anything else.'),
      blockButton({ label: 'Ask another', tone: 'mango', href: '#/' }),
    );
    ctx.say('Great!');
  };
  const no = () => {
    const q = question || answerName;
    logQuestion(q, 'not-really', answerName);
    ctx.go(toHash({ page: 'none', id: 'not-really', q }));
  };
  box.append(feedback({ onYes: yes, onNo: no }));
  return box;
}
