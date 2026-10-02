import React from 'react';
import { Text } from 'react-native';

/**
 * Mini-markup shared by lesson cards:
 * **bold** -> amber, *italic* -> italic, !!danger!! -> red,
 * ~~sky~~ -> light blue, __green__ -> emerald.
 */
export const renderMarkup = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*|!![^!]+!!|~~[^~]+~~|__[^_]+__|\*[^*]+\*)/g);
  return (
    <Text>
      {parts.map((part, i) => {
        if (part.length > 4 && part.startsWith('**') && part.endsWith('**'))
          return (
            <Text key={i} style={{ color: '#fde68a', fontWeight: '700' }}>
              {part.slice(2, -2)}
            </Text>
          );
        if (part.length > 4 && part.startsWith('!!') && part.endsWith('!!'))
          return (
            <Text key={i} style={{ color: '#fca5a5', fontWeight: '700' }}>
              {part.slice(2, -2)}
            </Text>
          );
        if (part.length > 4 && part.startsWith('~~') && part.endsWith('~~'))
          return (
            <Text key={i} style={{ color: '#bae6fd', fontWeight: '700' }}>
              {part.slice(2, -2)}
            </Text>
          );
        if (part.length > 4 && part.startsWith('__') && part.endsWith('__'))
          return (
            <Text key={i} style={{ color: '#6ee7b7', fontWeight: '700' }}>
              {part.slice(2, -2)}
            </Text>
          );
        if (part.length > 2 && part.startsWith('*') && part.endsWith('*'))
          return (
            <Text key={i} style={{ fontStyle: 'italic' }}>
              {part.slice(1, -1)}
            </Text>
          );
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
};
