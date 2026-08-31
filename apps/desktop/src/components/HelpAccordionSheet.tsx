import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, type LucideIcon } from 'lucide-react';
import { InlineMarkdown } from './InlineMarkdown';

/**
 * A "?" help panel: one collapsible accordion item per topic, all behind a single trigger — same
 * shape and purpose as apps/mobile's components/HelpAccordion.tsx, restyled for desktop's modal
 * conventions (see DeckPickerModal.tsx). Supports the same three inline markdown spans
 * (**bold**, *italic*, `code`) via InlineMarkdown.
 */

export interface HelpParagraph {
  text: string;
  /** Renders in a monospace/code block instead of body text. */
  code?: boolean;
  /** Renders the whole paragraph bold. */
  bold?: boolean;
}

export interface HelpSection {
  id: string;
  title: string;
  icon: LucideIcon;
  paragraphs: (string | HelpParagraph)[];
}

export function useHelpAccordion(initialSectionId: string | null = null): {
  visible: boolean;
  sectionId: string | null;
  openSection: (id: string) => void;
  setSectionId: (id: string | null) => void;
  close: () => void;
} {
  const [visible, setVisible] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(initialSectionId);

  const openSection = (id: string): void => {
    setSectionId(id);
    setVisible(true);
  };
  const close = (): void => setVisible(false);

  return { visible, sectionId, openSection, setSectionId, close };
}

export const HelpAccordionSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  title: string;
  sections: HelpSection[];
  activeSectionId: string | null;
  onSectionPress: (id: string) => void;
}> = ({ visible, onClose, title, sections, activeSectionId, onSectionPress }) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
          maxHeight: '80vh',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-active)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-glow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sections.map((section) => {
            const isOpen = activeSectionId === section.id;
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <div
                  onClick={() => onSectionPress(section.id)}
                  className="glass-card"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderColor: isOpen ? 'var(--accent-primary)' : undefined,
                  }}
                >
                  <Icon size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
                    {section.title}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} color="var(--text-muted)" />
                  ) : (
                    <ChevronDown size={16} color="var(--text-muted)" />
                  )}
                </div>

                {isOpen && (
                  <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {section.paragraphs.map((paragraph, index) => {
                      const p = typeof paragraph === 'string' ? { text: paragraph } : paragraph;
                      if (p.code) {
                        return (
                          <div
                            key={index}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12px',
                              color: 'var(--accent-primary)',
                              backgroundColor: 'var(--bg-glass)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              lineHeight: 1.5,
                            }}
                          >
                            {p.text}
                          </div>
                        );
                      }
                      return (
                        <InlineMarkdown
                          key={index}
                          text={p.text}
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            lineHeight: 1.6,
                            color: 'var(--text-secondary)',
                            fontWeight: p.bold ? 700 : 400,
                          }}
                          boldStyle={{ fontWeight: 800, color: 'var(--text-primary)' }}
                          italicStyle={{ fontStyle: 'italic' }}
                          codeStyle={{
                            fontFamily: 'var(--font-mono)',
                            backgroundColor: 'var(--bg-glass)',
                            color: 'var(--accent-primary)',
                            fontSize: '12px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
