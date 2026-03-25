'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/realtime-js';

interface GroupChat {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  coach_id: string;
}

interface GroupMessage {
  id: number;
  group_chat_id: number;
  sender_id: string;
  content: string | null;
  type: 'text' | 'voice' | 'image' | 'gif';
  attachment_url: string | null;
  created_at: string;
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupChatMember {
  id: number;
  group_chat_id: number;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

interface ClientProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function GroupsPage() {
  const supabase = createClientComponentClient();

  // State
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupChatMember[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Get current user and fetch initial data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('group_chats')
          .select('*')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false });

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);

        // Set first group as selected
        if (groupsData && groupsData.length > 0) {
          setSelectedGroupId(groupsData[0].id);
        }

        // Fetch clients for member selection
        const { data: clientsData, error: clientsError } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url')
          .neq('id', user.id)
          .order('display_name');

        if (clientsError) throw clientsError;
        setClients(clientsData || []);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [supabase]);

  // Fetch messages and members when group is selected
  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchGroupData = async () => {
      try {
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('group_messages')
          .select(
            `
            id,
            group_chat_id,
            sender_id,
            content,
            type,
            attachment_url,
            created_at
          `
          )
          .eq('group_chat_id', selectedGroupId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Fetch profiles for messages
        if (messagesData) {
          const messagesWithProfiles = await Promise.all(
            messagesData.map(async (msg) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', msg.sender_id)
                .single();

              return {
                ...msg,
                sender_profile: profile,
              };
            })
          );
          setMessages(messagesWithProfiles);
        }

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('group_chat_members')
          .select('*')
          .eq('group_chat_id', selectedGroupId);

        if (membersError) throw membersError;
        setMembers(membersData || []);
      } catch (error) {
        console.error('Error fetching group data:', error);
      }
    };

    fetchGroupData();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`group_messages_${selectedGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_chat_id=eq.${selectedGroupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as GroupMessage;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              sender_profile: profile,
            },
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_chat_members',
          filter: `group_chat_id=eq.${selectedGroupId}`,
        },
        async (payload) => {
          const newMember = payload.new as GroupChatMember;
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, email')
            .eq('id', newMember.user_id)
            .single();

          setMembers((prev) => [
            ...prev,
            {
              ...newMember,
              user_profile: profile,
            },
          ]);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGroupId, supabase]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedGroupId || !currentUserId) return;

    try {
      const { error } = await supabase.from('group_messages').insert({
        group_chat_id: selectedGroupId,
        sender_id: currentUserId,
        content: messageInput.trim(),
        type: 'text',
      });

      if (error) throw error;
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Create group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentUserId) return;

    try {
      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          coach_id: currentUserId,
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members
      if (selectedMembers.length > 0) {
        const memberInserts = selectedMembers.map((memberId) => ({
          group_chat_id: groupData.id,
          user_id: memberId,
          role: 'member',
        }));

        const { error: memberError } = await supabase
          .from('group_chat_members')
          .insert(memberInserts);

        if (memberError) throw memberError;
      }

      // Reset modal
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedMembers([]);

      // Add to groups list
      setGroups((prev) => [groupData, ...prev]);
      setSelectedGroupId(groupData.id);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Group Chats</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No group chats yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedGroupId === group.id
                      ? 'bg-indigo-50 border-2 border-indigo-300'
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {group.avatar_url ? (
                      <img
                        src={group.avatar_url}
                        alt={group.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-sm">
                          {group.name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col">
          {/* Group Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedGroup.avatar_url ? (
                <img
                  src={selectedGroup.avatar_url}
                  alt={selectedGroup.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">
                    {selectedGroup.name[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900">{selectedGroup.name}</h3>
                {selectedGroup.description && (
                  <p className="text-sm text-gray-600">
                    {selectedGroup.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowMembersList(!showMembersList)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-xs lg:max-w-md ${
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          {message.sender_profile?.avatar_url ? (
                            <img
                              src={message.sender_profile.avatar_url}
                              alt={message.sender_profile.display_name || 'User'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 text-xs font-bold">
                                {message.sender_profile?.display_name?.[0]?.toUpperCase() ||
                                  'U'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className={isCurrentUser ? 'text-right' : ''}>
                        {!isCurrentUser && (
                          <p className="text-xs text-gray-500 mb-1">
                            {message.sender_profile?.display_name || 'Unknown'}
                          </p>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.type === 'text' && (
                            <p className="text-sm">{message.content}</p>
                          )}
                          {message.type === 'voice' && message.attachment_url && (
                            <audio
                              src={message.attachment_url}
                              controls
                              className="w-full max-w-xs"
                            />
                          )}
                          {message.type === 'image' && message.attachment_url && (
                            <img
                              src={message.attachment_url}
                              alt="Message"
                              className="max-w-xs rounded"
                            />
                          )}
                          {message.type === 'gif' && message.attachment_url && (
                            <img
                              src={message.attachment_url}
                              alt="GIF"
                              className="max-w-xs rounded"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="bg-white border-t border-gray-200 p-4"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Send
              </button>
            </div>
          </form>

          {/* Members Panel */}
          {showMembersList && (
            <div className="border-l border-gray-200 w-64 bg-white p-4 max-h-96 overflow-y-auto">
              <h4 className="font-bold text-gray-900 mb-3">
                Members ({members.length})
              </h4>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-2 rounded">
                    {member.user_profile?.avatar_url ? (
                      <img
                        src={member.user_profile.avatar_url}
                        alt={member.user_profile.display_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 text-xs font-bold">
                          {member.user_profile?.display_name?.[0]?.toUpperCase() ||
                            'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user_profile?.display_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Select a group to start chatting</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Create New Group
              </h3>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Morning Bootcamp"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Group description..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Select Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Members
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {clients.length === 0 ? (
                      <p className="text-sm text-gray-500">No clients available</p>
                    ) : (
                      clients.map((client) => (
                        <label key={client.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(client.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers([...selectedMembers, client.id]);
                              } else {
                                setSelectedMembers(
                                  selectedMembers.filter((id) => id !== client.id)
                                );
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            {client.display_name || client.email}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewGroupName('');
                      setNewGroupDescription('');
                      setSelectedMembers([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
