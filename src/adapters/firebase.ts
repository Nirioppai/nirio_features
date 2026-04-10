import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';

import type { StorageAdapter } from '../adapter';
import type {
  Suggestion,
  Comment,
  Vote,
  CreateSuggestionInput,
  CreateCommentInput,
  SuggestionStatus,
} from '../types';

export function createFirebaseAdapter(firestore: Firestore): StorageAdapter {
  return new FirebaseAdapter(firestore);
}

class FirebaseAdapter implements StorageAdapter {
  constructor(private db: Firestore) {}

  async getSuggestions(): Promise<Suggestion[]> {
    const snap = await getDocs(collection(this.db, 'suggestions'));
    return snap.docs.map(d => this.toSuggestion(d.id, d.data()));
  }

  async createSuggestion(input: CreateSuggestionInput): Promise<Suggestion> {
    const ref = await addDoc(collection(this.db, 'suggestions'), {
      ...input,
      status: null,
      voteCount: 0,
      commentCount: 0,
      createdAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      ...input,
      voteCount: 0,
      commentCount: 0,
      createdAt: new Date(),
    };
  }

  async setStatus(suggestionId: string, status: SuggestionStatus): Promise<void> {
    await updateDoc(doc(this.db, 'suggestions', suggestionId), { status });
  }

  async getVote(suggestionId: string, userId: string): Promise<Vote | null> {
    const snap = await getDoc(doc(this.db, 'votes', `${suggestionId}_${userId}`));
    if (!snap.exists()) return null;
    return { suggestionId, userId };
  }

  async addVote(suggestionId: string, userId: string): Promise<void> {
    await setDoc(doc(this.db, 'votes', `${suggestionId}_${userId}`), {
      suggestionId,
      userId,
    });
    await updateDoc(doc(this.db, 'suggestions', suggestionId), {
      voteCount: increment(1),
    });
  }

  async removeVote(suggestionId: string, userId: string): Promise<void> {
    await deleteDoc(doc(this.db, 'votes', `${suggestionId}_${userId}`));
    await updateDoc(doc(this.db, 'suggestions', suggestionId), {
      voteCount: increment(-1),
    });
  }

  async getComments(suggestionId: string): Promise<Comment[]> {
    const q = query(
      collection(this.db, 'comments'),
      where('suggestionId', '==', suggestionId),
      orderBy('createdAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => this.toComment(d.id, d.data()));
  }

  async addComment(suggestionId: string, input: CreateCommentInput): Promise<Comment> {
    const ref = await addDoc(collection(this.db, 'comments'), {
      suggestionId,
      ...input,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(this.db, 'suggestions', suggestionId), {
      commentCount: increment(1),
    });
    return {
      id: ref.id,
      suggestionId,
      ...input,
      createdAt: new Date(),
    };
  }

  private toSuggestion(id: string, data: Record<string, unknown>): Suggestion {
    return {
      id,
      title: data.title as string,
      details: data.details as string | undefined,
      type: data.type as Suggestion['type'],
      status: (data.status as Suggestion['status']) ?? undefined,
      authorId: data.authorId as string,
      authorName: data.authorName as string,
      voteCount: (data.voteCount as number) ?? 0,
      commentCount: (data.commentCount as number) ?? 0,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    };
  }

  private toComment(id: string, data: Record<string, unknown>): Comment {
    return {
      id,
      suggestionId: data.suggestionId as string,
      authorId: data.authorId as string,
      authorName: data.authorName as string,
      body: data.body as string,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    };
  }
}
