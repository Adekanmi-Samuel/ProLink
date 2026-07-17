import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatTime } from '../../utils/formatters';

interface MessageBubbleProps {
  content: string;
  sentAt: string;
  isMine: boolean;
}

export default function MessageBubble({ content, sentAt, isMine }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.theirsContainer]}>
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        <Text style={[styles.text, isMine ? styles.mineText : styles.theirsText]}>
          {content}
        </Text>
      </View>
      <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
        {formatTime(sentAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  mineContainer: {
    alignItems: 'flex-end',
  },
  theirsContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  mine: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  theirs: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  mineText: {
    color: '#ffffff',
  },
  theirsText: {
    color: '#0f172a',
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 2,
  },
  timeMine: {
    marginRight: 4,
  },
  timeTheirs: {
    marginLeft: 4,
  },
});
