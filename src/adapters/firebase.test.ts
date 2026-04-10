import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFirebaseAdapter } from './firebase';
import type { StorageAdapter } from '../adapter';

const mockDb = {} as never;
const mockDocRef = { id: 'mock-doc-ref' };
const mockCollectionRef = {};
const mockQueryRef = {};

vi.mock('firebase/firestore', () => {
  class Timestamp {
    toDate() {
      return new Date('2024-01-01');
    }
  }
  return {
    collection: vi.fn(() => mockCollectionRef),
    doc: vi.fn(() => mockDocRef),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(() => mockQueryRef),
    orderBy: vi.fn(),
    where: vi.fn(),
    increment: vi.fn((n: number) => ({ _increment: n })),
    serverTimestamp: vi.fn(() => new Date()),
    Timestamp,
  };
});

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
} from 'firebase/firestore';

describe('FirebaseAdapter', () => {
  let adapter: StorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createFirebaseAdapter(mockDb);
  });

  describe('getSuggestions', () => {
    it('returns mapped suggestions from firestore', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'sug-1',
            data: () => ({
              title: 'Dark mode',
              type: 'New Feature',
              authorId: 'u1',
              authorName: 'Alice',
              voteCount: 3,
              commentCount: 1,
              createdAt: null,
            }),
          },
        ],
      } as never);

      const results = await adapter.getSuggestions();

      expect(collection).toHaveBeenCalledWith(mockDb, 'suggestions');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ id: 'sug-1', title: 'Dark mode', voteCount: 3 });
    });
  });

  describe('createSuggestion', () => {
    it('writes to firestore and returns a Suggestion', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-sug' } as never);

      const result = await adapter.createSuggestion({
        title: 'Export to CSV',
        type: 'New Feature',
        authorId: 'u1',
        authorName: 'Alice',
      });

      expect(addDoc).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({ title: 'Export to CSV', voteCount: 0 }),
      );
      expect(result.id).toBe('new-sug');
      expect(result.voteCount).toBe(0);
      expect(result.commentCount).toBe(0);
    });
  });

  describe('setStatus', () => {
    it('updates the suggestion status', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await adapter.setStatus('sug-1', 'Planned');

      expect(doc).toHaveBeenCalledWith(mockDb, 'suggestions', 'sug-1');
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { status: 'Planned' });
    });
  });

  describe('getVote', () => {
    it('returns null when vote does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

      const result = await adapter.getVote('sug-1', 'u1');

      expect(doc).toHaveBeenCalledWith(mockDb, 'votes', 'sug-1_u1');
      expect(result).toBeNull();
    });

    it('returns Vote when it exists', async () => {
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as never);

      const result = await adapter.getVote('sug-1', 'u1');

      expect(result).toEqual({ suggestionId: 'sug-1', userId: 'u1' });
    });
  });

  describe('addVote', () => {
    it('sets the vote doc and increments voteCount', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await adapter.addVote('sug-1', 'u1');

      expect(setDoc).toHaveBeenCalledWith(mockDocRef, { suggestionId: 'sug-1', userId: 'u1' });
      expect(increment).toHaveBeenCalledWith(1);
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { voteCount: { _increment: 1 } });
    });
  });

  describe('removeVote', () => {
    it('deletes the vote doc and decrements voteCount', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await adapter.removeVote('sug-1', 'u1');

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef);
      expect(increment).toHaveBeenCalledWith(-1);
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { voteCount: { _increment: -1 } });
    });
  });

  describe('getComments', () => {
    it('returns mapped comments for a suggestion', async () => {
      vi.mocked(getDocs).mockResolvedValue({
        docs: [
          {
            id: 'c1',
            data: () => ({
              suggestionId: 'sug-1',
              authorId: 'u1',
              authorName: 'Alice',
              body: 'Great idea!',
              createdAt: null,
            }),
          },
        ],
      } as never);

      const comments = await adapter.getComments('sug-1');

      expect(comments).toHaveLength(1);
      expect(comments[0]).toMatchObject({ id: 'c1', body: 'Great idea!', suggestionId: 'sug-1' });
    });
  });

  describe('addComment', () => {
    it('writes comment and increments commentCount', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'c-new' } as never);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await adapter.addComment('sug-1', {
        authorId: 'u1',
        authorName: 'Alice',
        body: 'Love this!',
      });

      expect(addDoc).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.objectContaining({ suggestionId: 'sug-1', body: 'Love this!' }),
      );
      expect(increment).toHaveBeenCalledWith(1);
      expect(result.id).toBe('c-new');
      expect(result.body).toBe('Love this!');
    });
  });
});
