import React from 'react';

interface CardRendererProps {
  html: string;
  style?: React.CSSProperties;
}

export const CardRenderer: React.FC<CardRendererProps> = ({ html, style }) => {
  return (
    <div style={{ width: '100%', height: '300px', ...style }}>
      <iframe
        srcDoc={html}
        title="Flashcard Render"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
        }}
        sandbox="allow-scripts"
      />
    </div>
  );
};
