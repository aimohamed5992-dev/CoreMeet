export type MeetingStatus = 0 | 1 | 2; // Scheduled | Active | Ended
export type ParticipantRole = 0 | 1 | 2; // Guest | CoHost | Host

export type Participant = {
  id: string;
  userId: string | null;
  displayName: string;
  role: ParticipantRole;
  avatarColor: string;
  avatarUrl: string | null;
  isConnected: boolean;
  joinedAt: string;
};

export type MeetingSummary = {
  id: string;
  code: string;
  title: string;
  status: MeetingStatus;
  hostId: string;
  hostName: string;
  createdAt: string;
  participantCount: number;
};

export type MeetingDetail = {
  id: string;
  code: string;
  title: string;
  status: MeetingStatus;
  hostId: string;
  hostName: string;
  createdAt: string;
  participants: Participant[];
};

export type JoinMeetingResponse = {
  meeting: MeetingDetail;
  me: Participant;
};

export type ChatMessage = {
  id: string;
  senderParticipantId: string;
  senderName: string;
  content: string;
  sentAt: string;
};
