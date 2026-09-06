import * as signalR from "@microsoft/signalr";
import { config } from "../config";
import { getSession } from "../auth/tokenStore";

export type RoomPeer = {
  connectionId: string;
  participantId: string;
  displayName: string;
  avatarColor?: string;
  avatarUrl?: string | null;
};
export type PeerJoined = RoomPeer & { avatarColor: string; role: string };
export type PeerLeft = { connectionId: string; participantId: string };

/**
 * Thin wrapper around the SignalR meeting hub. Presence + chat drive the roster;
 * the offer/answer/iceCandidate relay drives the WebRTC peer mesh (step 4).
 *
 * `on()` returns an unsubscribe so multiple owners (the room hook and the peer
 * mesh) can each listen to the same server event without clobbering each other.
 */
export class MeetingHub {
  private connection: signalR.HubConnection;

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(config.hubUrl, {
        accessTokenFactory: () => getSession()?.accessToken ?? "",
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }

  get connectionId() {
    return this.connection.connectionId;
  }

  get state() {
    return this.connection.state;
  }

  on(event: string, handler: (...args: never[]) => void): () => void {
    const h = handler as (...args: unknown[]) => void;
    this.connection.on(event, h);
    return () => this.connection.off(event, h);
  }

  onReconnected(handler: () => void) {
    this.connection.onreconnected(handler);
  }

  onClose(handler: (err?: Error) => void) {
    this.connection.onclose(handler);
  }

  async start() {
    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      await this.connection.start();
    }
  }

  async stop() {
    await this.connection.stop();
  }

  joinRoom(code: string, participantId: string) {
    return this.connection.invoke("JoinRoom", code, participantId);
  }

  leaveRoom() {
    return this.connection.invoke("LeaveRoom").catch(() => undefined);
  }

  sendChatMessage(content: string) {
    return this.connection.invoke("SendChatMessage", content);
  }

  setMediaState(audio: boolean, video: boolean, screen: boolean) {
    return this.connection.invoke("SetMediaState", audio, video, screen).catch(() => undefined);
  }

  sendOffer(target: string, sdp: string) {
    return this.connection.invoke("SendOffer", target, sdp).catch(() => undefined);
  }

  sendAnswer(target: string, sdp: string) {
    return this.connection.invoke("SendAnswer", target, sdp).catch(() => undefined);
  }

  sendIceCandidate(target: string, candidate: string) {
    return this.connection.invoke("SendIceCandidate", target, candidate).catch(() => undefined);
  }
}
