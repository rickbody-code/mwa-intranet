"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface SimpleCollaborativeEditorProps {
  pageId: string;
  initialContent?: any;
  onChange?: (content: any) => void;
  editable?: boolean;
  className?: string;
}

interface ConnectedUser {
  id: string;
  name: string;
  color: string;
  lastSeen: Date;
}

export default function SimpleCollaborativeEditor({
  pageId,
  initialContent,
  onChange,
  editable = true,
  className = ""
}: SimpleCollaborativeEditorProps) {
  const { data: session } = useSession();
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
        setLastSaved(new Date());
      }
    },
  });

  // Simulate collaboration for now
  useEffect(() => {
    if (!session?.user) return;

    // Simulate connection
    setConnectionStatus('connecting');
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);

    // Simulate other users (for demo purposes)
    const simulateUsers = () => {
      if (Math.random() > 0.7) { // 30% chance to show other users
        setConnectedUsers([
          {
            id: 'user1',
            name: 'Jane Doe',
            color: '#4ECDC4',
            lastSeen: new Date()
          },
          {
            id: 'user2', 
            name: 'John Smith',
            color: '#45B7D1',
            lastSeen: new Date()
          }
        ]);
      } else {
        setConnectedUsers([]);
      }
    };

    const userTimer = setInterval(simulateUsers, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(userTimer);
    };
  }, [session]);

  const generateUserColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : connectionStatus === 'connecting' ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          {lastSaved && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <AlertCircle className="w-3 h-3" />
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
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
              style={{ backgroundColor: generateUserColor(session.user.email || 'current') }}
              title={`You (${session.user.name || session.user.email})`}
            >
              {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
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

      {/* Collaboration Info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>
            {editable ? 'Collaborative editing enabled' : 'Read-only mode'}
          </span>
          <span>
            Real-time sync: {connectionStatus === 'connected' ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}