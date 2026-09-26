import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  xApiKey?: string;
  xaiApiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id?: string;
  content: string;
  imageUrl?: string;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Reply {
  id?: string;
  originalTweet: string;
  replyContent: string;
  style: string;
  createdAt: Date;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as UserProfile;
  }
  return null;
}

export async function createUserProfile(user: User): Promise<void> {
  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function createPost(userId: string, post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const postsRef = collection(db, 'users', userId, 'posts');
  const docRef = await addDoc(postsRef, {
    ...post,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
}

export function subscribeToPosts(userId: string, callback: (posts: Post[]) => void) {
  const postsRef = collection(db, 'users', userId, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Post[];
    callback(posts);
  });
}

export async function createReply(userId: string, reply: Omit<Reply, 'id' | 'createdAt'>): Promise<string> {
  const repliesRef = collection(db, 'users', userId, 'replies');
  const docRef = await addDoc(repliesRef, {
    ...reply,
    createdAt: new Date(),
  });
  return docRef.id;
}

export function subscribeToReplies(userId: string, callback: (replies: Reply[]) => void) {
  const repliesRef = collection(db, 'users', userId, 'replies');
  const q = query(repliesRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const replies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as Reply[];
    callback(replies);
  });
}
