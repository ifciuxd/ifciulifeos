import { Automerge } from 'automerge';
import { PatchCallback } from 'automerge';
import { useGlobalStore } from '../../core/state/GlobalStore';
import { IndexedDBAdapter } from '../../core/storage/IndexedDBAdapter';
import { generateHash } from '../../lib/utilities/crypto';

interface SyncState {
  lastSynced: number;
  deviceId: string;
  syncToken: string;
}

class CRDTSync {
  private doc: Automerge.FreezeObject<any>;
  private storage: IndexedDBAdapter;
  private syncState: SyncState;
  private pendingChanges: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.storage = new IndexedDBAdapter('ifciulifeOS_sync');
    this.syncState = {
      lastSynced: 0,
      deviceId: this.generateDeviceId(),
      syncToken: ''
    };
    this.doc = Automerge.init();
  }

  public async initialize() {
    await this.storage.connect();
    const savedDoc = await this.storage.get('automergeDoc');
    const savedState = await this.storage.get('syncState');

    if (savedDoc) {
      this.doc = Automerge.load<typeof this.doc>(savedDoc);
    }

    if (savedState) {
      this.syncState = savedState;
    }

    this.setupAutoSync();
    this.setupStoreListener();
  }

  private setupAutoSync(interval: number = 30000) {
    this.syncInterval = setInterval(async () => {
      if (this.pendingChanges) {
        await this.sync();
      }
    }, interval);
  }

  private setupStoreListener() {
    useGlobalStore.subscribe(
      (state) => {
        const { tasks, events, goals, notes, habits, contacts, finances } = state;
        return { tasks, events, goals, notes, habits, contacts, finances };
      },
      async (state) => {
        this.doc = Automerge.change(this.doc, (doc: any) => {
          doc.tasks = state.tasks;
          doc.events = state.events;
          doc.goals = state.goals;
          doc.notes = state.notes;
          doc.habits = state.habits;
          doc.contacts = state.contacts;
          doc.finances = state.finances;
        });
        this.pendingChanges = true;
      }
    );
  }

  public async sync(): Promise<boolean> {
    try {
      const docData = Automerge.save(this.doc);
      const hash = await generateHash(docData);
      
      if (hash === this.syncState.syncToken) {
        this.pendingChanges = false;
        return false;
      }

      await this.storage.set('automergeDoc', docData);
      
      this.syncState = {
        ...this.syncState,
        lastSynced: Date.now(),
        syncToken: hash
      };

      await this.storage.set('syncState', this.syncState);
      this.pendingChanges = false;
      
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  public async merge(data: Uint8Array): Promise<void> {
    try {
      const newDoc = Automerge.load<typeof this.doc>(data);
      this.doc = Automerge.merge(this.doc, newDoc);
      
      const state = {
        tasks: this.doc.tasks || [],
        events: this.doc.events || [],
        goals: this.doc.goals || [],
        notes: this.doc.notes || [],
        habits: this.doc.habits || [],
        contacts: this.doc.contacts || [],
        finances: this.doc.finances || { income: [], expenses: [], budgets: [] }
      };

      useGlobalStore.setState(state);
      await this.sync();
    } catch (error) {
      console.error('Merge error:', error);
    }
  }

  public getCurrentDoc(): Uint8Array {
    return Automerge.save(this.doc);
  }

  public getSyncState(): SyncState {
    return this.syncState;
  }

  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const crdtSync = new CRDTSync();