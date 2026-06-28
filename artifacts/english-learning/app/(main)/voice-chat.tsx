import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Platform, TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  useCreateVoiceChatSession,
  useSendVoiceMessage,
} from "@workspace/api-client-react";

interface ChatMessage {
  role: "student" | "ai";
  transcript: string;
}

export default function VoiceChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { mutate: createSession, isPending: creatingSession } = useCreateVoiceChatSession({
    mutation: {
      onSuccess: (session) => {
        setSessionId(session.id);
        setMessages([{
          role: "ai",
          transcript: "Hello! I'm your English tutor. What would you like to practice today?",
        }]);
      },
    },
  });

  const { mutate: sendMessage } = useSendVoiceMessage({
    mutation: {
      onSuccess: (data) => {
        setMessages(prev => [
          ...prev,
          { role: "student", transcript: data.studentMessage.transcript },
          { role: "ai", transcript: data.aiMessage.transcript },
        ]);
        setIsSending(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      },
      onError: () => {
        setIsSending(false);
      },
    },
  });

  const handleSend = () => {
    if (!sessionId || !inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    // Encode the text as base64 for the audio field
    const audioBase64 = Buffer.from(text).toString("base64");
    sendMessage({
      id: sessionId,
      data: { audioBase64, mimeType: "text/plain" },
    });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingHorizontal: 20, paddingBottom: 16,
    },
    title: { fontSize: 26, fontWeight: "800", color: colors.foreground, marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.mutedForeground },
    startScreen: {
      flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 32,
    },
    startBtn: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: colors.primary,
      justifyContent: "center", alignItems: "center",
      shadowColor: colors.primary, shadowOpacity: 0.35,
      shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
      elevation: 10,
    },
    startTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    startSub: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 },
    messagesList: { flex: 1 },
    messagesContent: { padding: 16, gap: 10, paddingBottom: insets.bottom + 100 },
    bubble: {
      maxWidth: "80%", padding: 12, paddingHorizontal: 16, borderRadius: 18,
    },
    studentBubble: {
      alignSelf: "flex-end", backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    aiBubble: {
      alignSelf: "flex-start", backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      borderBottomLeftRadius: 4,
    },
    senderLabel: { fontSize: 11, fontWeight: "600", marginBottom: 3 },
    bubbleText: { fontSize: 15, lineHeight: 22 },
    inputBar: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      backgroundColor: colors.card,
      borderTopWidth: 0,
      shadowColor: "#7c3aed", shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
      paddingHorizontal: 16, paddingTop: 10,
      paddingBottom: insets.bottom + 10,
      flexDirection: "row", alignItems: "center", gap: 8,
    },
    textInput: {
      flex: 1, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
      fontSize: 15, color: colors.foreground, maxHeight: 100,
    },
    sendBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: "center", alignItems: "center",
    },
  });

  if (!sessionId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Tutor Chat</Text>
          <Text style={styles.subtitle}>Practice English with your AI tutor</Text>
        </View>
        <View style={styles.startScreen}>
          <TouchableOpacity style={styles.startBtn} onPress={() => createSession(undefined)} disabled={creatingSession}>
            {creatingSession
              ? <ActivityIndicator color="#fff" size="large" />
              : <Feather name="message-circle" size={52} color="#fff" />
            }
          </TouchableOpacity>
          <Text style={styles.startTitle}>Start Conversation</Text>
          <Text style={styles.startSub}>
            Chat with your AI English tutor.{"\n"}Earn 5 points per message exchange!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Tutor</Text>
        <Text style={styles.subtitle}>Session #{sessionId} · +5 pts per reply</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "student" ? styles.studentBubble : styles.aiBubble]}>
            <Text style={[
              styles.senderLabel,
              { color: item.role === "student" ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
            ]}>
              {item.role === "student" ? "You" : "AI Tutor"}
            </Text>
            <Text style={[
              styles.bubbleText,
              { color: item.role === "student" ? "#fff" : colors.foreground },
            ]}>
              {item.transcript}
            </Text>
          </View>
        )}
        ListFooterComponent={isSending ? (
          <View style={[styles.bubble, styles.aiBubble, { padding: 16 }]}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : null}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isSending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isSending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          <Feather name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
