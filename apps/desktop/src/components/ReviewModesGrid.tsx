import React from 'react';
import { ArrowLeftRight, CornerUpLeft, Type, CircleCheckBig, List, type LucideIcon } from 'lucide-react';
import { ALL_QUESTION_TYPES, DEFAULT_ENABLED_QUESTION_TYPES, QUESTION_TYPE_META, toggleQuestionType } from '@lingora/core';
import type { QuestionType } from '@lingora/types';

export { toggleQuestionType };

/** Which review formats an existing deck was created with - the real decks.enabled_question_types
 * column (migration 0022, shared with apps/mobile). Falls back to the app-wide default for a deck
 * with no override (created before this existed, or never explicitly set). */
export function getDeckQuestionTypes(deck: { enabledQuestionTypes?: QuestionType[] | null }): QuestionType[] {
  return deck.enabledQuestionTypes && deck.enabledQuestionTypes.length > 0
    ? deck.enabledQuestionTypes
    : [...DEFAULT_ENABLED_QUESTION_TYPES];
}

// QUESTION_TYPE_META's `icon` is a Lucide icon *name* string (shared, platform-agnostic data -
// mobile resolves it through its own Icon.tsx registry); this is desktop's equivalent fixed
// lookup, since there are only ever five question types to cover, not a dynamic set worth a
// generic name->component resolver.
const QUESTION_TYPE_ICONS: Record<QuestionType, LucideIcon> = {
  vocab: ArrowLeftRight,
  reverse: CornerUpLeft,
  cloze: Type,
  trueFalse: CircleCheckBig,
  mcq: List,
};

/** Which review formats a deck practices with - same five as apps/mobile's Mixed practice
 * (Settings -> Learning), picked once per deck here instead of one global preference. A 3x2
 * icon-card grid, same visual language as this app's existing card-type picker, so it reads as a
 * familiar pattern rather than a new one. Controlled: caller owns the selection state. */
export function ReviewModesGrid(props: { value: QuestionType[]; onToggle: (type: QuestionType) => void }): React.ReactElement {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      {ALL_QUESTION_TYPES.map((type) => {
        const meta = QUESTION_TYPE_META[type];
        const Icon = QUESTION_TYPE_ICONS[type];
        const isOn = props.value.includes(type);
        return (
          <div
            key={type}
            onClick={() => props.onToggle(type)}
            style={{
              padding: '12px 8px',
              borderRadius: '12px',
              backgroundColor: isOn ? 'var(--accent-secondary)' : 'var(--bg-glass)',
              border: isOn ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '9px',
              backgroundColor: isOn ? 'var(--accent-primary)' : 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={15} color={isOn ? 'var(--btn-primary-text)' : 'var(--text-secondary)'} />
            </div>
            <span style={{ fontSize: '10.5px', fontWeight: 700, lineHeight: 1.3, color: isOn ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
              {meta.arrowFrom ? `${meta.arrowFrom} → ${meta.arrowTo}` : meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
