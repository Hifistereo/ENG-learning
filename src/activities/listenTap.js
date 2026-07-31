// "Where is the cat?" — the backbone activity at both ages.
//
// The child hears an English question and taps the thing it asks for. It is a
// receptive task: no reading and no speech, which is why a 2-year-old can do it
// on day one and why it is the only quiz type they get.
//
// What changed in v0.3.0 is the framing, not the task. There is no longer a
// Latvian instruction printed above the answers ("Klausies un pieskaries!") and
// no bare grid on an empty screen. The pet is standing in the scene and asks a
// question about it; the answers are things lying on the ground in front of it.
// Identical evidence, entirely different experience.
//
// Only the first attempt counts toward the word's schedule. After a miss the
// question stays open and the child keeps trying — the round always ends on a
// right answer.

import { el } from '../ui/dom.js';
import { lvHintButton } from '../ui/components.js';
import { buildQuestion } from '../core/selector.js';
import { withArticle } from '../data/words.js';
import { petReact, petSay } from '../pet/pet.js';
import { play } from '../media/sfx.js';
import { t } from '../i18n/lv.js';
import { chatter } from '../data/chatter.js';
import { idleHint, teachAnswer, TEACH_AFTER_MISSES } from './base.js';

export function run(ctx) {
  const { round, profile, pool, scene } = ctx;
  const word = round.word;
  const question = buildQuestion(word, pool, { ageBand: profile.ageBand, progress: ctx.progress });

  // The question is the prompt. Nothing tells the child what to do with it —
  // being asked where something is already implies pointing at it.
  const sentence = `Where is the ${word.en}?`;

  return new Promise((resolve) => {
    let attempts = 0;
    let aided = false;        // once true, this answer proves nothing
    let askedAt = 0;
    let hint = { cancel() {} };
    let done = false;

    scene.say(sentence, t('say.whereIs', { word: word.lv }));
    const props = scene.setProps(question.options, {
      // Five-year-olds see the written word: pairing print with speech is how
      // reading starts. Toddlers get pictures only.
      showText: profile.ageBand === 5,
      onPick: (picked) => onPick(picked),
    });

    const ask = async () => {
      hint.cancel();
      petReact.asking();
      await ctx.sayText(sentence);
      petReact.idle();
      askedAt = performance.now();
      hint = idleHint(profile, () => {
        aided = true;               // a pointed-at answer is not knowledge
        petReact.hint(props.directionOf(word.id));
        props.hint(word.id);
      });
    };

    async function onPick(picked) {
      if (done) return;
      hint.cancel();
      attempts += 1;

      if (picked.id !== word.id) {
        play('wrong');
        petReact.wrong();
        await props.markWrong(picked.id);

        // Two misses means the child does not have this word yet. Asking a
        // third time just repeats the failure — so stop testing and teach:
        // say it, show what it means, then let them succeed.
        if (attempts >= TEACH_AFTER_MISSES) {
          aided = true;
          await teachAnswer(ctx, word, props);
        } else {
          await ask();                     // re-ask; the right answer is still there
        }
        return;
      }

      done = true;
      props.lock();
      play('correct');
      petReact.correct();

      // The pet agrees out loud. This is where "yes" is learned — attached to
      // the moment of being right, not chosen from two pictures.
      //
      // The card animates while the line is spoken, but the line is awaited:
      // the next round's question calls stopSpeaking(), so anything left
      // running here would be cut off mid-word — usually on the noun.
      const yes = chatter('yes', { mood: scene.mood });
      const line = yes ? `${yes.en} ${capitalise(withArticle(word))}.` : word.en;
      if (yes) {
        petSay(yes.en, 1600);
        scene.say(line, yes.lv);
      }
      const shown = props.markCorrect(word.id);
      await (yes ? ctx.sayText(line) : ctx.say(word));
      await shown;

      const clean = attempts === 1 && !aided;
      ctx.result(word.id, clean, Math.round(performance.now() - askedAt), {
        activity: 'listenTap',
        aided,
      });
      resolve();
    }

    scene.setExtra(
      profile.settings.lvHints && profile.ageBand === 5 ? lvHintButton(word) : null,
      el('button.iconbtn.iconbtn--round', {
        type: 'button',
        'aria-label': t('act.listenAgain'),
        on: { click: () => ctx.sayText(sentence) },
      }, '🔊'),
    );

    ask();
  });
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
