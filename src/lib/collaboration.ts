import * as Y from 'yjs';
// import { WebsocketProvider } from 'y-websocket';

export interface CollaborationConfig {
  pageId: string;
  userId: string;
  userName: string;
  userColor: string;
}

export class WikiCollaboration {
  private doc: Y.Doc;
  private provider: any = null; // WebsocketProvider | null = null;
  private config: CollaborationConfig;

  constructor(config: CollaborationConfig) {
    this.config = config;
    this.doc = new Y.Doc();
    // this.setupProvider();
  }

  private async setupProvider() {
    try {
      // Dynamic import to avoid SSR issues
      const { WebsocketProvider } = await import('y-websocket');
      
      // Use development websocket server for now
      const wsUrl = typeof window !== 'undefined' && process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:1234' 
        : typeof window !== 'undefined' ? `wss://${window.location.host}/ws` : 'ws://localhost:1234';

      this.provider = new WebsocketProvider(
        wsUrl,
        `wiki-page-${this.config.pageId}`,
        this.doc,
        {
          // Connection parameters
          connect: true
        }
      );

      // Handle connection events
      this.provider.on('status', (event: { status: string }) => {
        console.log('Collaboration status:', event.status);
      });

      this.provider.on('connection-close', () => {
        console.log('Collaboration connection closed');
      });

      this.provider.on('connection-error', (error: Error) => {
        console.error('Collaboration connection error:', error);
      });
    } catch (error) {
      console.error('Failed to setup collaboration provider:', error);
    }
  }

  public async initializeProvider() {
    await this.setupProvider();
  }

  public getDocument(): Y.Doc {
    return this.doc;
  }

  public getProvider(): any {
    return this.provider;
  }

  public getAwareness() {
    return this.provider?.awareness || null;
  }

  public destroy() {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    this.doc.destroy();
  }

  // Generate a consistent color for a user based on their ID
  public static generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
}