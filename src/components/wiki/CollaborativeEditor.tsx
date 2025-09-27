"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import StarterKit from '@tiptap/starter-kit';
// import Collaboration from '@tiptap/extension-collaboration';
// import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { WikiCollaboration } from '@/lib/collaboration';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface CollaborativeEditorProps {
  pageId: string;
  initialContent?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
  className?: string;
}

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
}

export default function CollaborativeEditor({
  pageId,
  initialContent,
  onChange,
  editable = true,
  className = ""
}: CollaborativeEditorProps) {
  const { data: session } = useSession();
  const [collaboration, setCollaboration] = useState<WikiCollaboration | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<AwarenessUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Initialize collaboration
  const collaborationConfig = useMemo(() => {
    if (!session?.user?.email) return null;
    
    return {
      pageId,
      userId: session.user.email,
      userName: session.user.name || session.user.email,
      userColor: WikiCollaboration.generateUserColor(session.user.email)
    };
  }, [pageId, session]);

  useEffect(() => {
    if (!collaborationConfig) return;

    const initializeCollaboration = async () => {
      const collab = new WikiCollaboration(collaborationConfig);
      await collab.initializeProvider();
      setCollaboration(collab);

      // Monitor awareness changes
      const awareness = collab.getAwareness();
      if (awareness) {
        const updateUsers = () => {
          const users: AwarenessUser[] = [];
          awareness.getStates().forEach((state: any, clientId: number) => {
            if (state.user && clientId !== awareness.clientID) {
              users.push({
                id: state.user.id,
                name: state.user.name,
                color: state.user.color
              });
            }
          });
          setConnectedUsers(users);
        };

        awareness.on('change', updateUsers);
        updateUsers();
      }

      // Monitor connection status
      const provider = collab.getProvider();
      if (provider) {
        provider.on('status', (event: { status: string }) => {
          setConnectionStatus(event.status === 'connected' ? 'connected' : 'disconnected');
        });
      }
    };

    initializeCollaboration();

    return () => {
      if (collaboration) {
        collaboration.destroy();
      }
    };
  }, [collaborationConfig, collaboration]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      // TODO: Add collaboration extensions when packages are compatible
      // ...(collaboration ? [
      //   Collaboration.configure({
      //     document: collaboration.getDocument(),
      //   }),
      //   CollaborationCursor.configure({
      //     provider: collaboration.getProvider(),
      //     user: {
      //       name: collaborationConfig?.userName || 'Anonymous',
      //       color: collaborationConfig?.userColor || '#FF6B6B',
      //     },
      //   }),
      // ] : [])
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  if (!session?.user) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">Please sign in to access the collaborative editor.</p>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Collaboration Status Bar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Connected Users */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {connectedUsers.length + 1} user{connectedUsers.length !== 0 ? 's' : ''} editing
          </span>
          
          {/* User Avatars */}
          <div className="flex -space-x-1">
            {/* Current user */}
            <div 
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: collaborationConfig?.userColor }}
              title={`You (${collaborationConfig?.userName})`}
            >
              {collaborationConfig?.userName?.charAt(0).toUpperCase()}
            </div>
            
            {/* Other users */}
            {connectedUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            
            {connectedUsers.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs font-medium text-white">
                +{connectedUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="prose max-w-none p-4">
        <EditorContent 
          editor={editor}
          className="min-h-[400px] focus:outline-none"
        />
      </div>

      {!editable && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          Read-only mode
        </div>
      )}
    </div>
  );
}